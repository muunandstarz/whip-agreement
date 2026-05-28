import {
  bigint,
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Auth Users (Manus OAuth) ────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  /** admin = full access | manager = resend/view/download | readonly = status only */
  role: mysqlEnum("role", ["user", "admin", "manager", "readonly"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Members ─────────────────────────────────────────────────────────────────
// Imported from CSV / manual entry. Represents a driver/member record.

export const members = mysqlTable("members", {
  id: int("id").autoincrement().primaryKey(),

  // Identity
  name: varchar("name", { length: 255 }).notNull(),
  dob: varchar("dob", { length: 20 }).notNull(),          // YYYY-MM-DD
  phone: varchar("phone", { length: 30 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  driverLicense: varchar("driverLicense", { length: 64 }).notNull(),
  licenseState: varchar("licenseState", { length: 10 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  cityStateZip: varchar("cityStateZip", { length: 255 }).notNull(),

  // Reservation / vehicle
  customerId: varchar("customerId", { length: 64 }).notNull(),
  reservationId: varchar("reservationId", { length: 64 }).notNull(),
  vehicle: varchar("vehicle", { length: 255 }).notNull(),
  vin: varchar("vin", { length: 17 }).notNull(),
  weeklyRate: varchar("weeklyRate", { length: 20 }).notNull(),
  deposit: varchar("deposit", { length: 20 }).notNull(),
  agreementState: varchar("agreementState", { length: 10 }).notNull(),
  market: varchar("market", { length: 64 }),
  startDate: varchar("startDate", { length: 20 }).notNull(),
  endDate: varchar("endDate", { length: 20 }).notNull(),

  // Member-editable fields — captured at import, updated by member during signing
  memberPhone: varchar("memberPhone", { length: 30 }),
  memberEmail: varchar("memberEmail", { length: 320 }),
  memberAddress: varchar("memberAddress", { length: 255 }),
  memberCityStateZip: varchar("memberCityStateZip", { length: 255 }),
  memberFieldsUpdatedAt: timestamp("memberFieldsUpdatedAt"),

  // Import metadata
  importSource: mysqlEnum("importSource", ["csv", "manual", "api"]).default("manual").notNull(),
  importedBy: int("importedBy"),                           // FK → users.id
  matchStatus: mysqlEnum("matchStatus", ["matched", "flagged", "unreviewed"]).default("unreviewed").notNull(),
  matchNotes: text("matchNotes"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Member = typeof members.$inferSelect;
export type InsertMember = typeof members.$inferInsert;

// ─── Agreements ───────────────────────────────────────────────────────────────
// One agreement per member per reservation. Tracks the full lifecycle.

export const agreements = mysqlTable("agreements", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(),                     // FK → members.id

  // Secure token for the agreement link
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  revokedAt: timestamp("revokedAt"),
  revokedBy: int("revokedBy"),                             // FK → users.id

  // Agreement version + state
  agreementVersion: varchar("agreementVersion", { length: 20 }).default("1.0").notNull(),
  agreementState: varchar("agreementState", { length: 10 }).notNull(),

  // Lifecycle status
  status: mysqlEnum("status", [
    "not_sent",
    "sent",
    "delivered",
    "opened",
    "verified",
    "in_progress",
    "completed",
    "expired",
    "failed",
    "needs_review",
  ]).default("not_sent").notNull(),

  // Verification
  verificationMethod: mysqlEnum("verificationMethod", ["dob", "dl_last4", "email_code"]),
  verifiedAt: timestamp("verifiedAt"),
  verificationAttempts: int("verificationAttempts").default(0).notNull(),

  // Signing
  signedAt: timestamp("signedAt"),
  signatureData: text("signatureData"),                    // base64 canvas image
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),

  // Addons signed (JSON array of addon keys e.g. ["md_pip"])
  addonsSigned: json("addonsSigned"),

  // Distribution tracking
  sentAt: timestamp("sentAt"),
  sentBy: int("sentBy"),                                   // FK → users.id
  sentVia: mysqlEnum("sentVia", ["email", "sms", "both"]),
  lastReminderAt: timestamp("lastReminderAt"),
  reminderCount: int("reminderCount").default(0).notNull(),

  // Partial completion resume
  lastStep: varchar("lastStep", { length: 64 }),
  partialData: json("partialData"),

  // Exception / review flags
  hasException: boolean("hasException").default(false).notNull(),
  exceptionReason: text("exceptionReason"),

  // Scheduled reminder cron job (heartbeat)
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Agreement = typeof agreements.$inferSelect;
export type InsertAgreement = typeof agreements.$inferInsert;

// ─── Agreement Events (Audit Log) ────────────────────────────────────────────
// Immutable event log — every action on an agreement is recorded here.

export const agreementEvents = mysqlTable("agreement_events", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  agreementId: int("agreementId").notNull(),               // FK → agreements.id
  memberId: int("memberId").notNull(),                     // FK → members.id

  eventType: mysqlEnum("eventType", [
    "created",
    "sent",
    "delivered",
    "opened",
    "verification_attempted",
    "verification_failed",
    "verified",
    "step_completed",
    "signed",
    "addon_signed",
    "completed",
    "abandoned",
    "expired",
    "revoked",
    "resent",
    "pdf_generated",
    "pdf_downloaded",
    "link_accessed",
  ]).notNull(),

  // Context
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  performedBy: int("performedBy"),                         // FK → users.id (if admin action)
  metadata: json("metadata"),                              // flexible extra data

  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgreementEvent = typeof agreementEvents.$inferSelect;
export type InsertAgreementEvent = typeof agreementEvents.$inferInsert;

// ─── Documents ────────────────────────────────────────────────────────────────
// Executed PDFs, state forms, audit certificates stored in S3.

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  agreementId: int("agreementId").notNull(),               // FK → agreements.id
  memberId: int("memberId").notNull(),                     // FK → members.id

  documentType: mysqlEnum("documentType", [
    "member_agreement",
    "md_pip_waiver",
    "ga_um_rejection",
    "fl_um_rejection",
    "pa_coverage_election",
    "audit_certificate",
    "combined_pdf",
  ]).notNull(),

  // S3 storage
  s3Key: varchar("s3Key", { length: 512 }).notNull(),
  s3Url: varchar("s3Url", { length: 1024 }).notNull(),
  fileSizeBytes: int("fileSizeBytes"),
  mimeType: varchar("mimeType", { length: 128 }).default("application/pdf").notNull(),

  // Index fields for fast retrieval
  vin: varchar("vin", { length: 17 }),
  reservationId: varchar("reservationId", { length: 64 }),
  customerId: varchar("customerId", { length: 64 }),
  agreementState: varchar("agreementState", { length: 10 }),
  agreementVersion: varchar("agreementVersion", { length: 20 }),

  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  generatedBy: int("generatedBy"),                         // FK → users.id (null = auto)
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// ─── Email Verification Codes ─────────────────────────────────────────────────
// Short-lived codes sent to member email for identity verification.

export const emailVerificationCodes = mysqlTable("email_verification_codes", {
  id: int("id").autoincrement().primaryKey(),
  agreementId: int("agreementId").notNull(),               // FK → agreements.id
  email: varchar("email", { length: 320 }).notNull(),
  code: varchar("code", { length: 8 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  attempts: int("attempts").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailVerificationCode = typeof emailVerificationCodes.$inferSelect;
export type InsertEmailVerificationCode = typeof emailVerificationCodes.$inferInsert;

// ─── ChargeOver Integration ───────────────────────────────────────────────────
// Mirrors data synced from ChargeOver billing system.
// The dev team sets CHARGEOVER_BASE_URL, CHARGEOVER_USERNAME, CHARGEOVER_PASSWORD.
// Sync happens via webhook (POST /api/webhooks/chargeover) or manual admin trigger.

/** Links a Whip member to their ChargeOver customer record */
export const chargeoverCustomers = mysqlTable("chargeover_customers", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull().unique(),             // FK → members.id
  coCustomerId: int("coCustomerId").notNull().unique(),     // ChargeOver customer.id
  externalKey: varchar("externalKey", { length: 128 }),    // ChargeOver external_key (e.g. customer_id)
  email: varchar("email", { length: 320 }),
  name: varchar("name", { length: 255 }),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChargeoverCustomer = typeof chargeoverCustomers.$inferSelect;
export type InsertChargeoverCustomer = typeof chargeoverCustomers.$inferInsert;

/**
 * Invoice header — one row per ChargeOver invoice.
 * status mirrors ChargeOver: draft | open | past_due | paid | void | written_off
 */
export const chargeoverInvoices = mysqlTable("chargeover_invoices", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(),                      // FK → members.id
  coCustomerId: int("coCustomerId").notNull(),              // ChargeOver customer.id
  coInvoiceId: int("coInvoiceId").notNull().unique(),       // ChargeOver invoice.id
  invoiceNumber: varchar("invoiceNumber", { length: 64 }), // human-readable e.g. "INV-0042"
  status: mysqlEnum("status", [
    "draft", "open", "past_due", "paid", "void", "written_off",
  ]).default("open").notNull(),
  dueDate: varchar("dueDate", { length: 20 }),              // YYYY-MM-DD
  invoiceDate: varchar("invoiceDate", { length: 20 }),      // YYYY-MM-DD
  subtotal: int("subtotal").default(0).notNull(),           // cents
  taxTotal: int("taxTotal").default(0).notNull(),           // cents
  total: int("total").default(0).notNull(),                 // cents
  balance: int("balance").default(0).notNull(),             // cents remaining
  pdfUrl: varchar("pdfUrl", { length: 1024 }),              // ChargeOver hosted PDF
  notes: text("notes"),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChargeoverInvoice = typeof chargeoverInvoices.$inferSelect;
export type InsertChargeoverInvoice = typeof chargeoverInvoices.$inferInsert;

/**
 * Invoice line items — one row per line on a ChargeOver invoice.
 * type classifies the charge so the member portal can filter by category.
 */
export const chargeoverInvoiceLines = mysqlTable("chargeover_invoice_lines", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),                    // FK → chargeover_invoices.id
  memberId: int("memberId").notNull(),                      // FK → members.id (denormalized for fast queries)
  coLineId: int("coLineId"),                               // ChargeOver line item id
  description: varchar("description", { length: 512 }).notNull(),
  /** Classifies the charge for member portal filtering */
  lineType: mysqlEnum("lineType", [
    "weekly_fee",
    "ticket",
    "toll",
    "late_fee",
    "deposit",
    "credit",
    "other",
  ]).default("other").notNull(),
  quantity: int("quantity").default(1).notNull(),
  unitPrice: int("unitPrice").default(0).notNull(),         // cents
  lineTotal: int("lineTotal").default(0).notNull(),         // cents
  lineDate: varchar("lineDate", { length: 20 }),            // YYYY-MM-DD (incident date for tickets/tolls)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChargeoverInvoiceLine = typeof chargeoverInvoiceLines.$inferSelect;
export type InsertChargeoverInvoiceLine = typeof chargeoverInvoiceLines.$inferInsert;

/**
 * Webhook event log — every inbound ChargeOver webhook is recorded here.
 * Allows replay, deduplication, and debugging without data loss.
 */
export const chargeoverWebhookEvents = mysqlTable("chargeover_webhook_events", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  eventType: varchar("eventType", { length: 128 }).notNull(), // e.g. "invoice.paid"
  coObjectId: int("coObjectId"),                              // ChargeOver object id
  coObjectType: varchar("coObjectType", { length: 64 }),      // "invoice" | "customer" etc.
  payload: json("payload").notNull(),                         // full raw webhook body
  processed: boolean("processed").default(false).notNull(),
  processedAt: timestamp("processedAt"),
  error: text("error"),
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
});

export type ChargeoverWebhookEvent = typeof chargeoverWebhookEvents.$inferSelect;
export type InsertChargeoverWebhookEvent = typeof chargeoverWebhookEvents.$inferInsert;

// ─── Short Links ──────────────────────────────────────────────────────────────
// Maps a short 8-char slug to a full URL. Used to keep SMS messages under 160 chars.
// Redirect handled by GET /s/:slug → 302 to targetUrl.

export const shortLinks = mysqlTable("short_links", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 16 }).notNull().unique(),   // e.g. "aB3xQ7mZ"
  targetUrl: varchar("targetUrl", { length: 2048 }).notNull(),
  agreementId: int("agreementId"),                             // optional FK → agreements.id
  clicks: int("clicks").default(0).notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShortLink = typeof shortLinks.$inferSelect;
export type InsertShortLink = typeof shortLinks.$inferInsert;
