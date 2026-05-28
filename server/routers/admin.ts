import { TRPCError } from "@trpc/server";
import { randomBytes, randomUUID } from "crypto";
import { z } from "zod";
import { sendEmail, buildAgreementEmail, buildReminderEmail, buildVerificationCodeEmail } from "../email";
import { sendSms, buildAgreementSms, buildReminderSms, buildFinalReminderSms } from "../sms";
import { shortenUrl } from "../shortLink";
import { buildReservationId } from "../../shared/reservationId";
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
  getMembersByIds,
  getAllMembersForBulk,
  getAgreementsByMemberIds,
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
import { createHeartbeatJob, deleteHeartbeatJob } from "../_core/heartbeat";
import { parse as parseCookie } from "cookie";
import { COOKIE_NAME } from "@shared/const";

// ─── Short-link helper ────────────────────────────────────────────────────────
// Returns a short URL for SMS; falls back to the full URL if shortening fails.
async function getShortLink(fullUrl: string, agreementId: number, origin: string): Promise<string> {
  return shortenUrl({ targetUrl: fullUrl, agreementId, baseUrl: origin });
}

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
  market: z.string().optional(),
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
      .input(memberInputSchema.extend({ origin: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        requireManagerOrAbove(ctx.user.role);
        const { origin, ...memberFields } = input;
        const id = await createMember({ ...memberFields, importedBy: ctx.user.id });

        // Auto-generate agreement link immediately
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
        const agreementId = await createAgreement({
          memberId: id,
          token,
          expiresAt,
          agreementState: input.agreementState,
          status: "not_sent",
        });
        await logEvent({ agreementId, memberId: id, eventType: "created", performedBy: ctx.user.id });

        const resolvedOrigin = origin ?? "https://whipagree-3narmaq7.manus.space";
        const link = `${resolvedOrigin}/agreement/${token}`;
        return { id, agreementId, token, link, expiresAt };
      }),

    bulkImport: protectedProcedure
      .input(z.object({ rows: z.array(memberInputSchema), origin: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        requireManagerOrAbove(ctx.user.role);
        const origin = input.origin ?? "https://whipagree-3narmaq7.manus.space";
        const results: { index: number; id?: number; agreementId?: number; link?: string; error?: string }[] = [];
        for (let i = 0; i < input.rows.length; i++) {
          try {
            const row = input.rows[i];
            // Auto-compute reservationId if not provided in CSV
            if (!row.reservationId || row.reservationId.trim() === "") {
              const computed = buildReservationId(row.customerId, row.vin, row.startDate);
              if (computed) (row as Record<string, string>).reservationId = computed;
            }
            const id = await createMember({ ...row, importedBy: ctx.user.id, importSource: "csv" });
            // Auto-generate agreement link for each imported member
            const token = generateToken();
            const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
            const agreementId = await createAgreement({
              memberId: id,
              token,
              expiresAt,
              agreementState: input.rows[i].agreementState,
              status: "not_sent",
            });
            await logEvent({ agreementId, memberId: id, eventType: "created", performedBy: ctx.user.id });
            const link = `${origin}/agreement/${token}`;
            results.push({ index: i, id, agreementId, link });
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

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        dob: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        driverLicense: z.string().optional(),
        licenseState: z.string().optional(),
        address: z.string().optional(),
        cityStateZip: z.string().optional(),
        customerId: z.string().optional(),
        reservationId: z.string().optional(),
        vehicle: z.string().optional(),
        vin: z.string().optional(),
        weeklyRate: z.string().optional(),
        deposit: z.string().optional(),
        agreementState: z.string().optional(),
        market: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        requireManagerOrAbove(ctx.user.role);
        const { id, ...fields } = input;
        const member = await getMemberById(id);
        if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
        await updateMember(id, fields);
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
        origin: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        requireManagerOrAbove(ctx.user.role);
        const member = await getMemberById(input.memberId);
        if (!member) throw new TRPCError({ code: "NOT_FOUND", message: `Member #${input.memberId} not found. Please check the Member ID in the Members tab.` });

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

        const origin = input.origin ?? "https://whipagree-3narmaq7.manus.space";
        const link = `${origin}/agreement/${token}`;
        return { id, token, link, expiresAt, memberName: member.name };
      }),

    bulkSend: protectedProcedure
      .input(z.object({
        memberIds: z.array(z.number()).optional(), // if omitted → all members without active agreement
        via: z.enum(["email", "sms", "both"]),
        expiresInHours: z.number().default(72),
        origin: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        requireManagerOrAbove(ctx.user.role);
        const origin = input.origin ?? "https://whipagree-3narmaq7.manus.space";

        // Resolve target members
        let targetMembers;
        if (input.memberIds && input.memberIds.length > 0) {
          targetMembers = await getMembersByIds(input.memberIds);
        } else {
          targetMembers = await getAllMembersForBulk();
        }

        // Find members who already have a non-expired active agreement
        const existingAgreements = await getAgreementsByMemberIds(targetMembers.map(m => m.id));
        const activeStatuses = new Set(["not_sent", "sent", "delivered", "opened", "verified", "in_progress", "completed"]);
        const membersWithActive = new Set(
          existingAgreements
            .filter(a => activeStatuses.has(a.status) && !a.revokedAt)
            .map(a => a.memberId)
        );

        // Only send to members without an active agreement
        const toSend = targetMembers.filter(m => !membersWithActive.has(m.id));

        const results: { memberId: number; agreementId?: number; emailSent?: boolean; smsSent?: boolean; error?: string }[] = [];
        const expiresInMs = input.expiresInHours * 60 * 60 * 1000;

        for (const member of toSend) {
          try {
            const token = generateToken();
            const expiresAt = new Date(Date.now() + expiresInMs);
            const agreementId = await createAgreement({
              memberId: member.id,
              token,
              expiresAt,
              agreementState: member.agreementState,
              status: "not_sent",
            });

            const link = `${origin}/agreement/${token}`;
            const shortLink = await getShortLink(link, agreementId, origin);
            let emailSent = false;
            let smsSent = false;

            if (input.via === "email" || input.via === "both") {
              const { subject, html } = buildAgreementEmail({
                firstName: member.name.split(" ")[0],
                vehicle: member.vehicle,
                reservationId: member.reservationId,
                agreementState: member.agreementState,
                link: shortLink,
              });
              emailSent = await sendEmail({ to: member.email, subject, html });
            }

            if (input.via === "sms" || input.via === "both") {
              smsSent = await sendSms({
                to: member.phone,
                message: buildAgreementSms({ link: shortLink }),
              });
            }

            await updateAgreement(agreementId, {
              status: "sent",
              sentAt: new Date(),
              sentBy: ctx.user.id,
              sentVia: input.via,
            });

            await logEvent({ agreementId, memberId: member.id, eventType: "sent", performedBy: ctx.user.id, metadata: { via: input.via, emailSent, smsSent, bulk: true } });

            results.push({ memberId: member.id, agreementId, emailSent, smsSent });
          } catch (e) {
            results.push({ memberId: member.id, error: String(e) });
          }

          // Stagger sends: 200ms delay per member to avoid SMTP/TextLine throttling
          await new Promise(r => setTimeout(r, 200));
        }

        const sent = results.filter(r => !r.error).length;
        const failed = results.filter(r => r.error).length;
        const skipped = targetMembers.length - toSend.length;
        return { total: targetMembers.length, sent, failed, skipped, results };
      }),

    bulkResend: protectedProcedure
      .input(z.object({
        statuses: z.array(z.string()).default(["sent", "expired"]), // which statuses to resend to
        via: z.enum(["email", "sms", "both"]).optional(), // override channel; if omitted uses original
        origin: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        requireManagerOrAbove(ctx.user.role);
        const origin = input.origin ?? "https://whipagree-3narmaq7.manus.space";

        // Fetch all agreements in the target statuses
        const { rows } = await listAgreements({ status: input.statuses, limit: 2000, offset: 0 });

        const results: { agreementId: number; memberId: number; emailSent?: boolean; smsSent?: boolean; error?: string }[] = [];

        for (const row of rows) {
          const agreement = row.agreement;
          try {
            const member = await getMemberById(agreement.memberId);
            if (!member) { results.push({ agreementId: agreement.id, memberId: agreement.memberId, error: "Member not found" }); continue; }

            // Extend expiry if expired
            if (agreement.status === "expired" || (agreement.expiresAt && agreement.expiresAt < new Date())) {
              await updateAgreement(agreement.id, {
                status: "sent",
                expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
              });
            }

            await updateAgreement(agreement.id, {
              reminderCount: (agreement.reminderCount ?? 0) + 1,
              lastReminderAt: new Date(),
            });

            const link = `${origin}/agreement/${agreement.token}`;
            const shortLink = await getShortLink(link, agreement.id, origin);
            const via = input.via ?? agreement.sentVia ?? "email";
            const reminderNum = (agreement.reminderCount ?? 0) + 1;
            let emailSent = false;
            let smsSent = false;

            if (via === "email" || via === "both") {
              const { subject, html } = buildReminderEmail({
                firstName: member.name.split(" ")[0],
                vehicle: member.vehicle,
                link: shortLink,
                reminderCount: reminderNum,
              });
              emailSent = await sendEmail({ to: member.email, subject, html });
            }

            if (via === "sms" || via === "both") {
              const smsBody = reminderNum >= 3
                ? buildFinalReminderSms({ link: shortLink })
                : buildReminderSms({ link: shortLink });
              smsSent = await sendSms({ to: member.phone, message: smsBody });
            }

            await logEvent({ agreementId: agreement.id, memberId: agreement.memberId, eventType: "resent", performedBy: ctx.user.id, metadata: { via, emailSent, smsSent, bulk: true } });

            results.push({ agreementId: agreement.id, memberId: agreement.memberId, emailSent, smsSent });
          } catch (e) {
            results.push({ agreementId: agreement.id, memberId: agreement.memberId, error: String(e) });
          }

          // Stagger sends
          await new Promise(r => setTimeout(r, 200));
        }

        const sent = results.filter(r => !r.error).length;
        const failed = results.filter(r => r.error).length;
        return { total: rows.length, sent, failed, results };
      }),

    send: protectedProcedure
      .input(z.object({
        agreementId: z.number(),
        via: z.enum(["email", "sms", "both"]),
        origin: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        requireManagerOrAbove(ctx.user.role);
        console.log(`[Send] START agreementId=${input.agreementId} via=${input.via} by=${ctx.user.email}`);
        const agreement = await getAgreementById(input.agreementId);
        if (!agreement) throw new TRPCError({ code: "NOT_FOUND" });
        const member = await getMemberById(agreement.memberId);
        if (!member) throw new TRPCError({ code: "NOT_FOUND" });

        const origin = input.origin ?? "https://whipagree-3narmaq7.manus.space";
        const link = `${origin}/agreement/${agreement.token}`;
        const shortLink = await getShortLink(link, input.agreementId, origin);
        let emailSent = false;
        let smsSent = false;

        if (input.via === "email" || input.via === "both") {
          console.log(`[Send] Sending email to ${member.email}`);
          const { subject, html } = buildAgreementEmail({
            firstName: member.name.split(" ")[0],
            vehicle: member.vehicle,
            reservationId: member.reservationId,
            agreementState: member.agreementState,
            link: shortLink,
          });
          emailSent = await sendEmail({ to: member.email, subject, html });
          console.log(`[Send] Email result: ${emailSent}`);
        }

        if (input.via === "sms" || input.via === "both") {
          console.log(`[Send] Sending SMS to ${member.phone}`);
          smsSent = await sendSms({
            to: member.phone,
            message: buildAgreementSms({ link: shortLink }),
          });
          console.log(`[Send] SMS result: ${smsSent}`);
        }

        await updateAgreement(input.agreementId, {
          status: "sent",
          sentAt: new Date(),
          sentBy: ctx.user.id,
          sentVia: input.via,
        });

        console.log(`[Send] DONE agreementId=${input.agreementId} emailSent=${emailSent} smsSent=${smsSent}`);
        await logEvent({ agreementId: input.agreementId, memberId: agreement.memberId, eventType: "sent", performedBy: ctx.user.id, metadata: { via: input.via, emailSent, smsSent } });

        // Schedule automatic reminders at 24h, 48h, and 72h
        // Each reminder is a separate heartbeat cron that fires once
        try {
          const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
          if (sessionToken) {
            // Delete any existing reminder cron for this agreement first
            const existingAgreement = await getAgreementById(input.agreementId);
            if (existingAgreement?.scheduleCronTaskUid) {
              try { await deleteHeartbeatJob(existingAgreement.scheduleCronTaskUid, sessionToken); } catch {}
            }

            // Schedule a daily cron at the same UTC minute/hour as sentAt.
            // The handler fires at 24h, 48h, and 72h by checking reminderCount * 24h.
            const now = new Date();
            const cronMin = now.getUTCMinutes();
            const cronHour = now.getUTCHours();

            const job = await createHeartbeatJob({
              name: `reminder-agr-${input.agreementId}-${Date.now()}`,
              // 6-field cron: sec min hour dom mon dow (UTC)
              // Fires daily at the same time the agreement was sent
              cron: `0 ${cronMin} ${cronHour} * * *`,
              path: "/api/scheduled/sendReminder",
              payload: { agreementId: input.agreementId },
              description: `Auto-reminder for agreement ${input.agreementId} (${member.name})`,
            }, sessionToken);

            // Persist the task UID on the agreement so we can cancel it on completion
            await updateAgreement(input.agreementId, { scheduleCronTaskUid: job.taskUid });
          }
        } catch (cronErr) {
          // Non-fatal — log but don't fail the send
          console.warn("[Reminder] Failed to schedule auto-reminder:", cronErr);
        }

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
        const shortLink = await getShortLink(link, input.agreementId, origin);
        const reminderNum = (agreement.reminderCount ?? 0) + 1;
        const { subject: remSubject, html: remHtml } = buildReminderEmail({
          firstName: member.name.split(" ")[0],
          vehicle: member.vehicle,
          link: shortLink,
          reminderCount: reminderNum,
        });
        await sendEmail({ to: member.email, subject: remSubject, html: remHtml });
        // Also send SMS reminder if original was sent via SMS or both
        if (agreement.sentVia === "sms" || agreement.sentVia === "both") {
          const smsBody = reminderNum >= 3
            ? buildFinalReminderSms({ link: shortLink })
            : buildReminderSms({ link: shortLink });
          await sendSms({ to: member.phone, message: smsBody });
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

    // Send to specific members by member ID — auto-generates link if needed, then sends
    sendToMembers: protectedProcedure
      .input(z.object({
        memberIds: z.array(z.number()).min(1),
        via: z.enum(["email", "sms", "both"]),
        expiresInHours: z.number().default(72),
        origin: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        requireManagerOrAbove(ctx.user.role);
        console.log(`[SendToMembers] START memberIds=${JSON.stringify(input.memberIds)} via=${input.via} by=${ctx.user.email}`);
        const origin = input.origin ?? "https://whipagree-3narmaq7.manus.space";
        const members = await getMembersByIds(input.memberIds);

        // Find existing active agreements for these members
        const existingAgreements = await getAgreementsByMemberIds(input.memberIds);
        const activeStatuses = new Set(["not_sent", "sent", "delivered", "opened", "verified", "in_progress"]);
        const memberAgreementMap = new Map<number, { id: number; token: string; status: string }>();
        for (const a of existingAgreements) {
          if (activeStatuses.has(a.status) && !a.revokedAt) {
            memberAgreementMap.set(a.memberId, { id: a.id, token: a.token, status: a.status });
          }
        }

        const results: { memberId: number; agreementId?: number; emailSent?: boolean; smsSent?: boolean; action?: string; error?: string }[] = [];
        const expiresInMs = input.expiresInHours * 60 * 60 * 1000;

        for (const member of members) {
          try {
            let agreementId: number;
            let token: string;
            let action: string;

            const existing = memberAgreementMap.get(member.id);
            if (existing) {
              // Reuse existing agreement — just resend
              agreementId = existing.id;
              token = existing.token;
              action = "resent";
              // Extend expiry if expired
              await updateAgreement(agreementId, { expiresAt: new Date(Date.now() + expiresInMs) });
            } else {
              // Generate new agreement link
              token = generateToken();
              const expiresAt = new Date(Date.now() + expiresInMs);
              agreementId = await createAgreement({
                memberId: member.id,
                token,
                expiresAt,
                agreementState: member.agreementState,
                status: "not_sent",
              });
              await logEvent({ agreementId, memberId: member.id, eventType: "created", performedBy: ctx.user.id });
              action = "generated_and_sent";
            }

            const link = `${origin}/agreement/${token}`;
            const shortLink = await getShortLink(link, agreementId, origin);
            let emailSent = false;
            let smsSent = false;

            if (input.via === "email" || input.via === "both") {
              console.log(`[SendToMembers] Sending email to ${member.email} (memberId=${member.id})`);
              const { subject, html } = buildAgreementEmail({
                firstName: member.name.split(" ")[0],
                vehicle: member.vehicle,
                reservationId: member.reservationId,
                agreementState: member.agreementState,
                link: shortLink,
              });
              emailSent = await sendEmail({ to: member.email, subject, html });
              console.log(`[SendToMembers] Email result: ${emailSent} for memberId=${member.id}`);
            }

            if (input.via === "sms" || input.via === "both") {
              console.log(`[SendToMembers] Sending SMS to ${member.phone} (memberId=${member.id})`);
              smsSent = await sendSms({
                to: member.phone,
                message: buildAgreementSms({ link: shortLink }),
              });
              console.log(`[SendToMembers] SMS result: ${smsSent} for memberId=${member.id}`);
            }

            await updateAgreement(agreementId, {
              status: "sent",
              sentAt: new Date(),
              sentBy: ctx.user.id,
              sentVia: input.via,
            });

            await logEvent({ agreementId, memberId: member.id, eventType: "sent", performedBy: ctx.user.id, metadata: { via: input.via, emailSent, smsSent, action } });
            results.push({ memberId: member.id, agreementId, emailSent, smsSent, action });
          } catch (e) {
            console.error(`[SendToMembers] Error for memberId=${member.id}:`, e);
            results.push({ memberId: member.id, error: String(e) });
          }

          await new Promise(r => setTimeout(r, 150));
        }

        const sent = results.filter(r => !r.error).length;
        const failed = results.filter(r => r.error).length;
        return { total: members.length, sent, failed, results };
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

        // Update member contact fields if provided (use correct column names)
        if (input.memberPhone || input.memberEmail || input.memberAddress || input.memberCityStateZip) {
          const contactUpdate: Partial<{ phone: string; email: string; address: string; cityStateZip: string }> = {};
          if (input.memberPhone) contactUpdate.phone = input.memberPhone;
          if (input.memberEmail) contactUpdate.email = input.memberEmail;
          if (input.memberAddress) contactUpdate.address = input.memberAddress;
          if (input.memberCityStateZip) contactUpdate.cityStateZip = input.memberCityStateZip;
          await updateMember(agreement.memberId, contactUpdate);
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

  // ── Delivery Tests ────────────────────────────────────────────────────────

  testEmail: protectedProcedure
    .input(z.object({ to: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      requireManagerOrAbove(ctx.user.role);
      console.log(`[TestEmail] Sending test email to ${input.to} by ${ctx.user.email}`);
      const sent = await sendEmail({
        to: input.to,
        subject: `Whip Platform — Email Delivery Test (${new Date().toISOString()})`,
        html: `<div style="font-family:Arial,sans-serif;padding:32px;max-width:600px;margin:0 auto">
          <h2 style="color:#0b1228">Email Delivery Test</h2>
          <p>This is a test email from the Whip Agreement Platform.</p>
          <p>Sent by: <strong>${ctx.user.email}</strong></p>
          <p>Time: <strong>${new Date().toISOString()}</strong></p>
          <p>SMTP Host: <strong>${process.env.SMTP_HOST ?? "not set"}</strong></p>
          <p style="color:#888;font-size:12px">If you received this, email delivery is working correctly.</p>
        </div>`,
      });
      console.log(`[TestEmail] Result: ${sent}`);
      return { sent, smtpHost: process.env.SMTP_HOST ?? null, smtpUser: process.env.SMTP_USER ?? null };
    }),

  testSms: protectedProcedure
    .input(z.object({ to: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireManagerOrAbove(ctx.user.role);
      console.log(`[TestSms] Sending test SMS to ${input.to} by ${ctx.user.email}`);
      const sent = await sendSms({
        to: input.to,
        message: `Whip Platform SMS test — sent at ${new Date().toISOString()} by ${ctx.user.email}`,
      });
      console.log(`[TestSms] Result: ${sent}`);
      const hasKey = !!process.env.TEXTLINE_API_KEY;
      return { sent, hasKey };
    }),
});
