/**
 * Billing router — member invoice access + admin ChargeOver sync
 *
 * Member procedures (protectedProcedure):
 *   billing.getMyInvoices   — list invoices for the logged-in member
 *   billing.getInvoiceDetail — single invoice with line items
 *
 * Admin procedures:
 *   billing.syncMember      — sync one member's invoices from ChargeOver
 *   billing.syncAll         — sync all members (admin-triggered, rate-limited)
 *   billing.getAdminSummary — overdue/unpaid counts for admin billing tab
 *   billing.linkMember      — manually link a member to a ChargeOver customer id
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  chargeoverInvoices,
  chargeoverInvoiceLines,
  chargeoverCustomers,
  members,
} from "../../drizzle/schema";
import { eq, desc, and, inArray, sql } from "drizzle-orm";
import {
  isChargeOverConfigured,
  syncMemberBilling,
} from "../chargeover";

// ── Helpers ───────────────────────────────────────────────────────────────────

function adminGuard(role: string | undefined) {
  if (role !== "admin" && role !== "manager") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
}

/** Resolve the memberId for the currently logged-in user.
 *  Members are matched by email against the members table.
 *  Returns null if the user is not a member (e.g. admin-only account).
 */
async function getMemberIdForUser(userEmail: string | null | undefined): Promise<number | null> {
  if (!userEmail) return null;
  const _db = await getDb();
  if (!_db) return null;
  const [m] = await _db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.email, userEmail))
    .limit(1);
  return m?.id ?? null;
}

// ── Router ────────────────────────────────────────────────────────────────────

export const billingRouter = router({
  // ── Member: list invoices ──────────────────────────────────────────────────
  getMyInvoices: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(["all", "open", "past_due", "paid", "draft", "void", "written_off"])
          .optional()
          .default("all"),
        lineType: z
          .enum(["all", "weekly_fee", "ticket", "toll", "late_fee", "deposit", "credit", "other"])
          .optional()
          .default("all"),
        sortBy: z.enum(["date_desc", "date_asc", "amount_desc", "amount_asc", "status"]).optional().default("date_desc"),
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const memberId = await getMemberIdForUser(ctx.user.email);
      if (!memberId) {
        // Admin/staff accounts without a member record see empty list
        return { invoices: [], total: 0, memberId: null };
      }

      // Build where conditions
      const conditions = [eq(chargeoverInvoices.memberId, memberId)];
      if (input.status !== "all") {
        conditions.push(eq(chargeoverInvoices.status, input.status));
      }

      // If filtering by line type, only return invoices that have at least one line of that type
      let invoiceIdsWithLineType: number[] | null = null;
      if (input.lineType !== "all") {
        const _dbLt = await getDb();
        if (!_dbLt) return { invoices: [], total: 0, memberId };
        const rows = await _dbLt
          .selectDistinct({ invoiceId: chargeoverInvoiceLines.invoiceId })
          .from(chargeoverInvoiceLines)
          .where(
            and(
              eq(chargeoverInvoiceLines.memberId, memberId),
              eq(chargeoverInvoiceLines.lineType, input.lineType)
            )
          );
        invoiceIdsWithLineType = rows.map((r) => r.invoiceId);
        if (invoiceIdsWithLineType.length === 0) {
          return { invoices: [], total: 0, memberId };
        }
        conditions.push(inArray(chargeoverInvoices.id, invoiceIdsWithLineType));
      }

      // Sort
      const orderMap = {
        date_desc: desc(chargeoverInvoices.invoiceDate),
        date_asc: chargeoverInvoices.invoiceDate,
        amount_desc: desc(chargeoverInvoices.total),
        amount_asc: chargeoverInvoices.total,
        status: chargeoverInvoices.status,
      } as const;

      const _db = await getDb();
      if (!_db) return { invoices: [], total: 0, memberId, configured: isChargeOverConfigured() };
      const [invoices, countResult] = await Promise.all([
        _db
          .select()
          .from(chargeoverInvoices)
          .where(and(...conditions))
          .orderBy(orderMap[input.sortBy])
          .limit(input.limit)
          .offset(input.offset),
        _db
          .select({ count: sql<number>`count(*)` })
          .from(chargeoverInvoices)
          .where(and(...conditions)),
      ]);

      return {
        invoices,
        total: Number(countResult[0]?.count ?? 0),
        memberId,
        configured: isChargeOverConfigured(),
      };
    }),

  // ── Member: invoice detail with line items ─────────────────────────────────
  getInvoiceDetail: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .query(async ({ ctx, input }) => {
      const memberId = await getMemberIdForUser(ctx.user.email);
      const _dbD = await getDb();
      if (!_dbD) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [invoice] = await _dbD
        .select()
        .from(chargeoverInvoices)
        .where(
          and(
            eq(chargeoverInvoices.id, input.invoiceId),
            // Non-admin users can only see their own invoices
            ...(ctx.user.role === "admin" || ctx.user.role === "manager"
              ? []
              : memberId
              ? [eq(chargeoverInvoices.memberId, memberId)]
              : [sql`1=0`])
          )
        )
        .limit(1);

      if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });

      const lines = await _dbD
        .select()
        .from(chargeoverInvoiceLines)
        .where(eq(chargeoverInvoiceLines.invoiceId, invoice.id))
        .orderBy(chargeoverInvoiceLines.lineDate, chargeoverInvoiceLines.id);

      return { invoice, lines };
    }),

  // ── Admin: sync one member ─────────────────────────────────────────────────
  syncMember: protectedProcedure
    .input(z.object({ memberId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      adminGuard(ctx.user.role);
      if (!isChargeOverConfigured()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "ChargeOver credentials not configured. Set CHARGEOVER_BASE_URL, CHARGEOVER_USERNAME, CHARGEOVER_PASSWORD.",
        });
      }
      const count = await syncMemberBilling(input.memberId);
      return { synced: count };
    }),

  // ── Admin: sync all members ────────────────────────────────────────────────
  syncAll: protectedProcedure.mutation(async ({ ctx }) => {
    adminGuard(ctx.user.role);
    if (!isChargeOverConfigured()) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "ChargeOver credentials not configured.",
      });
    }
    const _dbA = await getDb();
    if (!_dbA) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const allMembers = await _dbA.select({ id: members.id }).from(members);
    let totalSynced = 0;
    let errors = 0;
    for (const m of allMembers) {
      try {
        const n = await syncMemberBilling(m.id);
        totalSynced += n;
      } catch {
        errors++;
      }
      // Polite rate limiting — ChargeOver allows ~60 req/min
      await new Promise((r) => setTimeout(r, 1100));
    }
    return { totalSynced, errors, members: allMembers.length };
  }),

  // ── Admin: billing summary ─────────────────────────────────────────────────
  getAdminSummary: protectedProcedure.query(async ({ ctx }) => {
    adminGuard(ctx.user.role);
    const _db = await getDb();
    if (!_db) return { open: { count: 0, balance: 0 }, pastDue: { count: 0, balance: 0 }, paid: { count: 0, total: 0 }, total: 0, configured: isChargeOverConfigured() };
    const [open, pastDue, paid, total] = await Promise.all([
      _db
        .select({ count: sql<number>`count(*)`, sum: sql<number>`sum(balance)` })
        .from(chargeoverInvoices)
        .where(eq(chargeoverInvoices.status, "open")),
      _db
        .select({ count: sql<number>`count(*)`, sum: sql<number>`sum(balance)` })
        .from(chargeoverInvoices)
        .where(eq(chargeoverInvoices.status, "past_due")),
      _db
        .select({ count: sql<number>`count(*)`, sum: sql<number>`sum(total)` })
        .from(chargeoverInvoices)
        .where(eq(chargeoverInvoices.status, "paid")),
      _db.select({ count: sql<number>`count(*)` }).from(chargeoverInvoices),
    ]);
    return {
      open: { count: Number(open[0]?.count ?? 0), balance: Number(open[0]?.sum ?? 0) },
      pastDue: { count: Number(pastDue[0]?.count ?? 0), balance: Number(pastDue[0]?.sum ?? 0) },
      paid: { count: Number(paid[0]?.count ?? 0), total: Number(paid[0]?.sum ?? 0) },
      total: Number(total[0]?.count ?? 0),
      configured: isChargeOverConfigured(),
    };
  }),

  // ── Admin: manually link member to ChargeOver customer ────────────────────
  linkMember: protectedProcedure
    .input(
      z.object({
        memberId: z.number(),
        coCustomerId: z.number(),
        externalKey: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      adminGuard(ctx.user.role);
      const _dbL = await getDb();
      if (!_dbL) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [member] = await _dbL
        .select({ email: members.email, name: members.name, customerId: members.customerId })
        .from(members)
        .where(eq(members.id, input.memberId))
        .limit(1);
      if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });

      const linkValues = {
        memberId: input.memberId,
        coCustomerId: input.coCustomerId,
        externalKey: input.externalKey ?? member.customerId ?? null,
        email: member.email ?? null,
        name: member.name ?? null,
        syncedAt: new Date(),
      };
      const _db2 = await getDb();
      if (!_db2) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await _db2
        .insert(chargeoverCustomers)
        .values(linkValues)
        .onDuplicateKeyUpdate({ set: linkValues });

      return { linked: true };
    }),
});
