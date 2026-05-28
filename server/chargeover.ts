/**
 * ChargeOver API Client
 * ─────────────────────────────────────────────────────────────────────────────
 * Thin wrapper around the ChargeOver REST API v3.
 *
 * Required environment variables (set by dev team):
 *   CHARGEOVER_BASE_URL  — e.g. https://yourcompany.chargeover.com
 *   CHARGEOVER_USERNAME  — API key (from ChargeOver Settings → API)
 *   CHARGEOVER_PASSWORD  — API secret
 *
 * Authentication: HTTP Basic Auth (username:password base64-encoded)
 * Base path:      /api/v3/
 * Content-Type:   application/json
 *
 * Docs: https://developer.chargeover.com/docs/api/
 */

import { getDb } from "./db";
import {
  chargeoverCustomers,
  chargeoverInvoices,
  chargeoverInvoiceLines,
  chargeoverWebhookEvents,
  members,
} from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// ── Config ────────────────────────────────────────────────────────────────────

function getConfig() {
  const baseUrl = process.env.CHARGEOVER_BASE_URL?.replace(/\/+$/, "");
  const username = process.env.CHARGEOVER_USERNAME;
  const password = process.env.CHARGEOVER_PASSWORD;
  return { baseUrl, username, password };
}

export function isChargeOverConfigured(): boolean {
  const { baseUrl, username, password } = getConfig();
  return !!(baseUrl && username && password);
}

function authHeader(): string {
  const { username, password } = getConfig();
  return "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
}

// ── API request helper ────────────────────────────────────────────────────────

async function coRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { baseUrl } = getConfig();
  const url = `${baseUrl}/api/v3/${path.replace(/^\//, "")}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`ChargeOver API error ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ── API types ─────────────────────────────────────────────────────────────────

interface CoCustomer {
  id: number;
  external_key?: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  company?: string;
}

interface CoLineItem {
  id: number;
  descrip: string;
  quantity?: number;
  unit_price: number;
  line_item_total: number;
  timedesc?: string;
}

export interface CoInvoice {
  id: number;
  invoice_number?: string;
  customer_id: number;
  status?: string;
  terms_dateon?: string;
  dateon?: string;
  subtotal: number;
  tax_total?: number;
  total: number;
  balance: number;
  pdf_url?: string;
  notes?: string;
  lineitem_arr?: CoLineItem[];
}

// ── API methods ───────────────────────────────────────────────────────────────

export async function findCoCustomerByExternalKey(
  externalKey: string | null | undefined
): Promise<CoCustomer | null> {
  if (!externalKey) return null;
  try {
    const res = await coRequest<{ response: CoCustomer[] }>(
      `customer?where[external_key]=${encodeURIComponent(externalKey)}&limit=1`
    );
    return res.response?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function getCoInvoicesForCustomer(coCustomerId: number): Promise<CoInvoice[]> {
  const res = await coRequest<{ response: CoInvoice[] }>(
    `invoice?where[customer_id]=${coCustomerId}&include[]=lineitem_arr&limit=100`
  );
  return res.response ?? [];
}

export async function getCoInvoice(coInvoiceId: number): Promise<CoInvoice> {
  const res = await coRequest<{ response: CoInvoice }>(
    `invoice/${coInvoiceId}?include[]=lineitem_arr`
  );
  return res.response;
}

// ── Line type classifier ──────────────────────────────────────────────────────

function classifyLine(
  descrip: string
): "weekly_fee" | "ticket" | "toll" | "late_fee" | "deposit" | "credit" | "other" {
  const d = (descrip ?? "").toLowerCase();
  if (d.includes("weekly") || d.includes("rental fee") || d.includes("subscription")) return "weekly_fee";
  if (d.includes("ticket") || d.includes("citation") || d.includes("violation")) return "ticket";
  if (d.includes("toll") || d.includes("e-zpass") || d.includes("ezpass") || d.includes("sunpass")) return "toll";
  if (d.includes("late") || d.includes("penalty")) return "late_fee";
  if (d.includes("deposit") || d.includes("security")) return "deposit";
  if (d.includes("credit") || d.includes("refund") || d.includes("discount")) return "credit";
  return "other";
}

function toCents(n: number | string | undefined | null): number {
  if (n == null) return 0;
  return Math.round(Number(n) * 100);
}

function normalizeStatus(
  s: string
): "draft" | "open" | "past_due" | "paid" | "void" | "written_off" {
  const map: Record<string, "draft" | "open" | "past_due" | "paid" | "void" | "written_off"> = {
    draft: "draft",
    open: "open",
    past_due: "past_due",
    pastdue: "past_due",
    paid: "paid",
    void: "void",
    voided: "void",
    written_off: "written_off",
    writtenoff: "written_off",
  };
  return map[s?.toLowerCase()] ?? "open";
}

// ── Upsert helpers ────────────────────────────────────────────────────────────

async function upsertInvoice(coInvoice: CoInvoice, memberId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const invoiceValues = {
    memberId,
    coCustomerId: coInvoice.customer_id,
    coInvoiceId: coInvoice.id,
    invoiceNumber: coInvoice.invoice_number ?? null,
    status: normalizeStatus(coInvoice.status ?? "open"),
    dueDate: coInvoice.terms_dateon ?? null,
    invoiceDate: coInvoice.dateon ?? null,
    subtotal: toCents(coInvoice.subtotal),
    taxTotal: toCents(coInvoice.tax_total ?? 0),
    total: toCents(coInvoice.total),
    balance: toCents(coInvoice.balance),
    pdfUrl: coInvoice.pdf_url ?? null,
    notes: coInvoice.notes ?? null,
    syncedAt: new Date(),
  };

  // Upsert invoice header
  await db
    .insert(chargeoverInvoices)
    .values(invoiceValues)
    .onDuplicateKeyUpdate({ set: invoiceValues });

  // Get the local invoice id
  const [localInvoice] = await db
    .select({ id: chargeoverInvoices.id })
    .from(chargeoverInvoices)
    .where(eq(chargeoverInvoices.coInvoiceId, coInvoice.id))
    .limit(1);

  if (!localInvoice) return;

  // Upsert line items
  if (coInvoice.lineitem_arr?.length) {
    for (const line of coInvoice.lineitem_arr) {
      const lineValues = {
        invoiceId: localInvoice.id,
        memberId,
        coLineId: line.id,
        description: line.descrip,
        lineType: classifyLine(line.descrip),
        quantity: Math.round(line.quantity ?? 1),
        unitPrice: toCents(line.unit_price),
        lineTotal: toCents(line.line_item_total),
        lineDate: line.timedesc ?? null,
      };
      await db
        .insert(chargeoverInvoiceLines)
        .values(lineValues)
        .onDuplicateKeyUpdate({ set: lineValues });
    }
  }
}

/**
 * Full sync for a single member: find their ChargeOver customer record,
 * then pull and upsert all invoices.
 * Returns the number of invoices synced.
 */
export async function syncMemberBilling(memberId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  // Look up the member's customerId (our external key in ChargeOver)
  const [member] = await db
    .select({ customerId: members.customerId, email: members.email })
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1);

  if (!member) throw new Error(`Member ${memberId} not found`);

  // Find or create the ChargeOver customer link
  let [coLink] = await db
    .select()
    .from(chargeoverCustomers)
    .where(eq(chargeoverCustomers.memberId, memberId))
    .limit(1);

  if (!coLink) {
    // Try to find by external_key
    const coCustomer = await findCoCustomerByExternalKey(member.customerId);
    if (!coCustomer) return 0; // not in ChargeOver yet

    const linkValues = {
      memberId,
      coCustomerId: coCustomer.id,
      externalKey: member.customerId ?? null,
      email: coCustomer.email ?? member.email ?? null,
      name:
        [coCustomer.firstname, coCustomer.lastname].filter(Boolean).join(" ") ||
        coCustomer.company ||
        null,
      syncedAt: new Date(),
    };
    await db.insert(chargeoverCustomers).values(linkValues);
    coLink = {
      ...linkValues,
      id: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  const invoices = await getCoInvoicesForCustomer(coLink.coCustomerId);
  for (const inv of invoices) {
    await upsertInvoice(inv, memberId);
  }
  return invoices.length;
}

// ── Webhook processor ─────────────────────────────────────────────────────────

/**
 * Process an inbound ChargeOver webhook payload.
 * Records the raw event, then syncs the affected invoice.
 */
export async function processWebhook(payload: unknown): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const p = payload as {
    event?: string;
    object?: string;
    id?: number;
    data?: CoInvoice;
  };

  // Log the raw event first
  await db.insert(chargeoverWebhookEvents).values({
    eventType: p.event ?? "unknown",
    coObjectId: p.id ?? null,
    coObjectType: p.object ?? null,
    payload: payload as Record<string, unknown>,
    processed: false,
  });

  // Only handle invoice events for now
  if (p.object !== "invoice" || !p.data || !p.id) return;

  // Find the member linked to this ChargeOver customer
  const [coLink] = await db
    .select({ memberId: chargeoverCustomers.memberId })
    .from(chargeoverCustomers)
    .where(eq(chargeoverCustomers.coCustomerId, p.data.customer_id))
    .limit(1);

  if (!coLink) return; // customer not yet linked — will sync on next manual trigger

  // Fetch the full invoice with line items (webhook payload may be partial)
  const fullInvoice = await getCoInvoice(p.id);
  await upsertInvoice(fullInvoice, coLink.memberId);

  // Mark the webhook event as processed
  await db
    .update(chargeoverWebhookEvents)
    .set({ processed: true, processedAt: new Date() })
    .where(
      and(
        eq(chargeoverWebhookEvents.coObjectId, p.id),
        eq(chargeoverWebhookEvents.processed, false)
      )
    );
}
