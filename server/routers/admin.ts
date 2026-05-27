import { TRPCError } from "@trpc/server";
import { randomBytes, randomUUID } from "crypto";
import { z } from "zod";
import { sendEmail, buildAgreementEmail, buildReminderEmail, buildVerificationCodeEmail } from "../email";
import { sendSms, buildAgreementSms, buildReminderSms } from "../sms";
import {
  createAgreement,
  createDocument,
  createEmailVerificationCode,
  createMember,
  expireAgreements,
  getActiveEmailCode,
  getAgreementById,
  getAgreementByToken,
  getAgreementMetrics,
  getDocumentsByAgreement,
  getEventsByAgreement,
  getMemberById,
  incrementEmailCodeAttempts,
  listAgreements,
  listMembers,
  logEvent,
  markEmailCodeUsed,
  updateAgreement,
  updateMember,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function requireAdmin(role: string) {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
}

function requireManagerOrAbove(role: string) {
  if (!["admin", "manager"].includes(role)) throw new TRPCError({ code: "FORBIDDEN", message: "Manager access required" });
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Email and SMS helpers imported from server/email.ts and server/sms.ts

// ─── Member Import ────────────────────────────────────────────────────────────

const memberInputSchema = z.object({
  name: z.string().min(1),
  dob: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  driverLicense: z.string().min(1),
  licenseState: z.string().min(1),
  address: z.string().min(1),
  cityStateZip: z.string().min(1),
  customerId: z.string().min(1),
  reservationId: z.string().min(1),
  vehicle: z.string().min(1),
  vin: z.string().min(1),
  weeklyRate: z.string().min(1),
  deposit: z.string().min(1),
  agreementState: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  importSource: z.enum(["csv", "manual", "api"]).default("manual"),
});

export const adminRouter = router({
  // ── Members ──────────────────────────────────────────────────────────────

  members: router({
    list: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        matchStatus: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ ctx, input }) => {
        requireManagerOrAbove(ctx.user.role);
        return listMembers(input);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        requireManagerOrAbove(ctx.user.role);
        const member = await getMemberById(input.id);
        if (!member) throw new TRPCError({ code: "NOT_FOUND" });
        return member;
      }),

    create: protectedProcedure
      .input(memberInputSchema)
      .mutation(async ({ ctx, input }) => {
        requireManagerOrAbove(ctx.user.role);
        const id = await createMember({ ...input, importedBy: ctx.user.id });
        return { id };
      }),

    bulkImport: protectedProcedure
      .input(z.object({ rows: z.array(memberInputSchema) }))
      .mutation(async ({ ctx, input }) => {
        requireManagerOrAbove(ctx.user.role);
        const results: { index: number; id?: number; error?: string }[] = [];
        for (let i = 0; i < input.rows.length; i++) {
          try {
            const id = await createMember({ ...input.rows[i], importedBy: ctx.user.id, importSource: "csv" });
            results.push({ index: i, id });
          } catch (e) {
            results.push({ index: i, error: String(e) });
          }
        }
        return { results, total: input.rows.length, imported: results.filter(r => r.id).length };
      }),

    updateMatchStatus: protectedProcedure
      .input(z.object({ id: z.number(), matchStatus: z.enum(["matched", "flagged", "unreviewed"]), matchNotes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        requireManagerOrAbove(ctx.user.role);
        await updateMember(input.id, { matchStatus: input.matchStatus, matchNotes: input.matchNotes });
        return { ok: true };
      }),
  }),

  // ── Agreements ────────────────────────────────────────────────────────────

  agreements: router({
    list: protectedProcedure
      .input(z.object({
        status: z.union([z.string(), z.array(z.string())]).optional(),
        agreementState: z.string().optional(),
        hasException: z.boolean().optional(),
        search: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ ctx, input }) => {
        requireManagerOrAbove(ctx.user.role);
        return listAgreements(input);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        requireManagerOrAbove(ctx.user.role);
        const agreement = await getAgreementById(input.id);
        if (!agreement) throw new TRPCError({ code: "NOT_FOUND" });
        const [member, events, docs] = await Promise.all([
          getMemberById(agreement.memberId),
          getEventsByAgreement(agreement.id),
          getDocumentsByAgreement(agreement.id),
        ]);
        return { agreement, member, events, documents: docs };
      }),

    metrics: protectedProcedure.query(async ({ ctx }) => {
      requireManagerOrAbove(ctx.user.role);
      return getAgreementMetrics();
    }),

    generate: protectedProcedure
      .input(z.object({
        memberId: z.number(),
        expiresInHours: z.number().default(72),
      }))
      .mutation(async ({ ctx, input }) => {
        requireManagerOrAbove(ctx.user.role);
        const member = await getMemberById(input.memberId);
        if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });

        const token = generateToken();
        const expiresAt = new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000);

        const id = await createAgreement({
          memberId: input.memberId,
          token,
          expiresAt,
          agreementState: member.agreementState,
          status: "not_sent",
        });

        await logEvent({ agreementId: id, memberId: input.memberId, eventType: "created", performedBy: ctx.user.id });

        const link = `${process.env.VITE_FRONTEND_FORGE_API_URL ? "" : ""}/agreement/${token}`;
        return { id, token, link, expiresAt };
      }),

    send: protectedProcedure
      .input(z.object({
        agreementId: z.number(),
        via: z.enum(["email", "sms", "both"]),
        origin: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        requireManagerOrAbove(ctx.user.role);
        const agreement = await getAgreementById(input.agreementId);
        if (!agreement) throw new TRPCError({ code: "NOT_FOUND" });
        const member = await getMemberById(agreement.memberId);
        if (!member) throw new TRPCError({ code: "NOT_FOUND" });

        const origin = input.origin ?? "https://whipagree-3narmaq7.manus.space";
        const link = `${origin}/agreement/${agreement.token}`;
        let emailSent = false;
        let smsSent = false;

        if (input.via === "email" || input.via === "both") {
          const { subject, html } = buildAgreementEmail({
            firstName: member.name.split(" ")[0],
            vehicle: member.vehicle,
            reservationId: member.reservationId,
            agreementState: member.agreementState,
            link,
          });
          emailSent = await sendEmail({ to: member.email, subject, html });
        }

        if (input.via === "sms" || input.via === "both") {
          smsSent = await sendSms({
            to: member.phone,
            message: buildAgreementSms({ firstName: member.name.split(" ")[0], link }),
          });
        }

        await updateAgreement(input.agreementId, {
          status: "sent",
          sentAt: new Date(),
          sentBy: ctx.user.id,
          sentVia: input.via,
        });

        await logEvent({ agreementId: input.agreementId, memberId: agreement.memberId, eventType: "sent", performedBy: ctx.user.id, metadata: { via: input.via, emailSent, smsSent } });

        return { ok: true, emailSent, smsSent };
      }),

    resend: protectedProcedure
      .input(z.object({ agreementId: z.number(), origin: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        requireManagerOrAbove(ctx.user.role);
        const agreement = await getAgreementById(input.agreementId);
        if (!agreement) throw new TRPCError({ code: "NOT_FOUND" });

        // Extend expiry by 72h if expired
        if (agreement.status === "expired" || (agreement.expiresAt && agreement.expiresAt < new Date())) {
          await updateAgreement(input.agreementId, {
            status: "sent",
            expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
            revokedAt: undefined,
          });
        }

        await updateAgreement(input.agreementId, {
          reminderCount: (agreement.reminderCount ?? 0) + 1,
          lastReminderAt: new Date(),
        });

        await logEvent({ agreementId: input.agreementId, memberId: agreement.memberId, eventType: "resent", performedBy: ctx.user.id });

        // Re-send via same channel
        const member = await getMemberById(agreement.memberId);
        if (!member) throw new TRPCError({ code: "NOT_FOUND" });
        const origin = input.origin ?? "https://whipagree-3narmaq7.manus.space";
        const link = `${origin}/agreement/${agreement.token}`;
        const { subject: remSubject, html: remHtml } = buildReminderEmail({
          firstName: member.name.split(" ")[0],
          vehicle: member.vehicle,
          link,
          reminderCount: (agreement.reminderCount ?? 0) + 1,
        });
        await sendEmail({ to: member.email, subject: remSubject, html: remHtml });
        // Also send SMS reminder if original was sent via SMS or both
        if (agreement.sentVia === "sms" || agreement.sentVia === "both") {
          await sendSms({ to: member.phone, message: buildReminderSms({ firstName: member.name.split(" ")[0], link }) });
        }

        return { ok: true };
      }),

    revoke: protectedProcedure
      .input(z.object({ agreementId: z.number(), reason: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        requireAdmin(ctx.user.role);
        await updateAgreement(input.agreementId, { revokedAt: new Date(), revokedBy: ctx.user.id, status: "failed" });
        const agreement = await getAgreementById(input.agreementId);
        if (agreement) await logEvent({ agreementId: input.agreementId, memberId: agreement.memberId, eventType: "revoked", performedBy: ctx.user.id, metadata: { reason: input.reason } });
        return { ok: true };
      }),

    resolveException: protectedProcedure
      .input(z.object({ agreementId: z.number(), notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        requireManagerOrAbove(ctx.user.role);
        await updateAgreement(input.agreementId, { hasException: false, exceptionReason: input.notes ?? null });
        return { ok: true };
      }),

    runExpiry: protectedProcedure.mutation(async ({ ctx }) => {
      requireAdmin(ctx.user.role);
      const expired = await expireAgreements();
      return { expired };
    }),
  }),

  // ── Verification (public — called from agreement page) ────────────────────

  verify: router({
    sendEmailCode: publicProcedure
      .input(z.object({ token: z.string(), email: z.string().email() }))
      .mutation(async ({ input }) => {
        const agreement = await getAgreementByToken(input.token);
        if (!agreement) throw new TRPCError({ code: "NOT_FOUND", message: "Agreement not found" });
        if (agreement.revokedAt || agreement.status === "expired") throw new TRPCError({ code: "FORBIDDEN", message: "Agreement is no longer valid" });

        const member = await getMemberById(agreement.memberId);
        if (!member) throw new TRPCError({ code: "NOT_FOUND" });
        if (member.email.toLowerCase() !== input.email.toLowerCase()) throw new TRPCError({ code: "FORBIDDEN", message: "Email does not match" });

        const code = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

        await createEmailVerificationCode({ agreementId: agreement.id, email: input.email, code, expiresAt });

        const { subject: codeSubject, html: codeHtml } = buildVerificationCodeEmail({ code, email: input.email });
        await sendEmail({ to: input.email, subject: codeSubject, html: codeHtml });

        return { sent: true };
      }),

    verifyToken: publicProcedure
      .input(z.object({
        token: z.string(),
        method: z.enum(["dob", "dl_last4", "email_code"]),
        value: z.string(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const agreement = await getAgreementByToken(input.token);
        if (!agreement) throw new TRPCError({ code: "NOT_FOUND", message: "Agreement not found" });
        if (agreement.revokedAt) throw new TRPCError({ code: "FORBIDDEN", message: "This agreement has been revoked" });
        if (agreement.expiresAt < new Date()) {
          await updateAgreement(agreement.id, { status: "expired" });
          throw new TRPCError({ code: "FORBIDDEN", message: "This agreement link has expired" });
        }
        if (agreement.status === "completed") throw new TRPCError({ code: "FORBIDDEN", message: "This agreement has already been completed" });

        const member = await getMemberById(agreement.memberId);
        if (!member) throw new TRPCError({ code: "NOT_FOUND" });

        let verified = false;

        if (input.method === "dob") {
          verified = member.dob === input.value;
        } else if (input.method === "dl_last4") {
          verified = member.driverLicense.slice(-4) === input.value;
        } else if (input.method === "email_code") {
          const codeRecord = await getActiveEmailCode(agreement.id, member.email);
          if (!codeRecord) throw new TRPCError({ code: "BAD_REQUEST", message: "No active code found. Please request a new code." });
          if (codeRecord.attempts >= 5) throw new TRPCError({ code: "FORBIDDEN", message: "Too many attempts. Please request a new code." });
          if (codeRecord.code === input.value) {
            await markEmailCodeUsed(codeRecord.id);
            verified = true;
          } else {
            await incrementEmailCodeAttempts(codeRecord.id);
          }
        }

        if (!verified) {
          await updateAgreement(agreement.id, { verificationAttempts: (agreement.verificationAttempts ?? 0) + 1 });
          await logEvent({ agreementId: agreement.id, memberId: member.id, eventType: "verification_failed", ipAddress: input.ipAddress, userAgent: input.userAgent, metadata: { method: input.method } });
          throw new TRPCError({ code: "FORBIDDEN", message: "Verification failed. Please check your information and try again." });
        }

        await updateAgreement(agreement.id, { verifiedAt: new Date(), verificationMethod: input.method, status: "verified" });
        await logEvent({ agreementId: agreement.id, memberId: member.id, eventType: "verified", ipAddress: input.ipAddress, userAgent: input.userAgent, metadata: { method: input.method } });

        return {
          verified: true,
          member: {
            name: member.name,
            dob: member.dob,
            phone: member.phone,
            email: member.email,
            driverLicense: member.driverLicense,
            licenseState: member.licenseState,
            address: member.address,
            cityStateZip: member.cityStateZip,
            customerId: member.customerId,
            reservationId: member.reservationId,
            vehicle: member.vehicle,
            vin: member.vin,
            weeklyRate: member.weeklyRate,
            deposit: member.deposit,
            agreementState: member.agreementState,
            startDate: member.startDate,
            endDate: member.endDate,
          },
          agreementId: agreement.id,
        };
      }),

    getAgreementByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const agreement = await getAgreementByToken(input.token);
        if (!agreement) throw new TRPCError({ code: "NOT_FOUND" });
        if (agreement.revokedAt) throw new TRPCError({ code: "FORBIDDEN", message: "This agreement has been revoked" });
        if (agreement.expiresAt < new Date() && !["completed"].includes(agreement.status)) {
          await updateAgreement(agreement.id, { status: "expired" });
          throw new TRPCError({ code: "FORBIDDEN", message: "This agreement link has expired" });
        }
        const member = await getMemberById(agreement.memberId);
        return { agreement, memberName: member?.name, memberEmail: member?.email };
      }),

    trackOpen: publicProcedure
      .input(z.object({ token: z.string(), ipAddress: z.string().optional(), userAgent: z.string().optional() }))
      .mutation(async ({ input }) => {
        const agreement = await getAgreementByToken(input.token);
        if (!agreement) return { ok: false };
        if (agreement.status === "sent" || agreement.status === "delivered") {
          await updateAgreement(agreement.id, { status: "opened" });
        }
        await logEvent({ agreementId: agreement.id, memberId: agreement.memberId, eventType: "opened", ipAddress: input.ipAddress, userAgent: input.userAgent });
        return { ok: true };
      }),

    complete: publicProcedure
      .input(z.object({
        token: z.string(),
        signatureData: z.string(),
        addonsSigned: z.array(z.string()).optional(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
        memberPhone: z.string().optional(),
        memberEmail: z.string().optional(),
        memberAddress: z.string().optional(),
        memberCityStateZip: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const agreement = await getAgreementByToken(input.token);
        if (!agreement) throw new TRPCError({ code: "NOT_FOUND" });
        if (agreement.status === "completed") return { ok: true, alreadyCompleted: true };

        await updateAgreement(agreement.id, {
          status: "completed",
          signedAt: new Date(),
          signatureData: input.signatureData,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          addonsSigned: input.addonsSigned ?? [],
        });

        // Update member contact fields if provided
        if (input.memberPhone || input.memberEmail || input.memberAddress || input.memberCityStateZip) {
          await updateMember(agreement.memberId, {
            memberPhone: input.memberPhone,
            memberEmail: input.memberEmail,
            memberAddress: input.memberAddress,
            memberCityStateZip: input.memberCityStateZip,
            memberFieldsUpdatedAt: new Date(),
          });
        }

        await logEvent({ agreementId: agreement.id, memberId: agreement.memberId, eventType: "signed", ipAddress: input.ipAddress, userAgent: input.userAgent });
        await logEvent({ agreementId: agreement.id, memberId: agreement.memberId, eventType: "completed", ipAddress: input.ipAddress, userAgent: input.userAgent });

        return { ok: true, alreadyCompleted: false };
      }),
  }),

  // ── Documents ─────────────────────────────────────────────────────────────

  documents: router({
    list: protectedProcedure
      .input(z.object({ agreementId: z.number() }))
      .query(async ({ ctx, input }) => {
        requireManagerOrAbove(ctx.user.role);
        return getDocumentsByAgreement(input.agreementId);
      }),

    store: protectedProcedure
      .input(z.object({
        agreementId: z.number(),
        documentType: z.enum(["member_agreement", "md_pip_waiver", "ga_um_rejection", "fl_um_rejection", "pa_coverage_election", "audit_certificate", "combined_pdf"]),
        htmlContent: z.string(),
        filename: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        requireManagerOrAbove(ctx.user.role);
        const agreement = await getAgreementById(input.agreementId);
        if (!agreement) throw new TRPCError({ code: "NOT_FOUND" });
        const member = await getMemberById(agreement.memberId);
        if (!member) throw new TRPCError({ code: "NOT_FOUND" });

        const key = `agreements/${member.customerId}/${member.reservationId}/${input.filename}`;
        const { url } = await storagePut(key, Buffer.from(input.htmlContent, "utf-8"), "text/html");

        const docId = await createDocument({
          agreementId: input.agreementId,
          memberId: agreement.memberId,
          documentType: input.documentType,
          s3Key: key,
          s3Url: url,
          vin: member.vin,
          reservationId: member.reservationId,
          customerId: member.customerId,
          agreementState: member.agreementState,
          agreementVersion: agreement.agreementVersion,
        });

        await logEvent({ agreementId: input.agreementId, memberId: agreement.memberId, eventType: "pdf_generated", performedBy: ctx.user.id });

        return { id: docId, url };
      }),
  }),
});
