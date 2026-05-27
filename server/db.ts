import { and, count, desc, eq, gte, inArray, like, lt, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Agreement,
  AgreementEvent,
  Document,
  InsertAgreement,
  InsertAgreementEvent,
  InsertDocument,
  InsertEmailVerificationCode,
  InsertMember,
  Member,
  agreementEvents,
  agreements,
  documents,
  emailVerificationCodes,
  members,
  users,
  InsertUser,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Auth Users ───────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Members ─────────────────────────────────────────────────────────────────

export async function createMember(data: InsertMember): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(members).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function getMemberById(id: number): Promise<Member | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(members).where(eq(members.id, id)).limit(1);
  return result[0];
}

export async function listMembers(opts: {
  search?: string;
  matchStatus?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { rows: [], total: 0 };

  const conditions = [];
  if (opts.search) {
    const s = `%${opts.search}%`;
    conditions.push(
      or(
        like(members.name, s),
        like(members.email, s),
        like(members.phone, s),
        like(members.customerId, s),
        like(members.reservationId, s),
        like(members.vin, s),
        like(members.driverLicense, s),
      )
    );
  }
  if (opts.matchStatus) {
    conditions.push(eq(members.matchStatus, opts.matchStatus as Member["matchStatus"]));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  const [rows, totalResult] = await Promise.all([
    db.select().from(members).where(where).limit(limit).offset(offset).orderBy(desc(members.createdAt)),
    db.select({ count: count() }).from(members).where(where),
  ]);

  return { rows, total: totalResult[0]?.count ?? 0 };
}

export async function updateMember(id: number, data: Partial<InsertMember>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(members).set(data).where(eq(members.id, id));
}

// ─── Agreements ───────────────────────────────────────────────────────────────

export async function createAgreement(data: InsertAgreement): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(agreements).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function getAgreementByToken(token: string): Promise<Agreement | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(agreements).where(eq(agreements.token, token)).limit(1);
  return result[0];
}

export async function getAgreementById(id: number): Promise<Agreement | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(agreements).where(eq(agreements.id, id)).limit(1);
  return result[0];
}

export async function updateAgreement(id: number, data: Partial<InsertAgreement>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(agreements).set(data).where(eq(agreements.id, id));
}

export async function listAgreements(opts: {
  status?: string | string[];
  agreementState?: string;
  search?: string;
  hasException?: boolean;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { rows: [], total: 0 };

  const conditions = [];
  if (opts.status) {
    if (Array.isArray(opts.status)) {
      conditions.push(inArray(agreements.status, opts.status as Agreement["status"][]));
    } else {
      conditions.push(eq(agreements.status, opts.status as Agreement["status"]));
    }
  }
  if (opts.agreementState) conditions.push(eq(agreements.agreementState, opts.agreementState));
  if (opts.hasException !== undefined) conditions.push(eq(agreements.hasException, opts.hasException));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  // Join with members for display
  const [rows, totalResult] = await Promise.all([
    db
      .select({
        agreement: agreements,
        member: {
          id: members.id,
          name: members.name,
          email: members.email,
          phone: members.phone,
          customerId: members.customerId,
          reservationId: members.reservationId,
          vehicle: members.vehicle,
          vin: members.vin,
          agreementState: members.agreementState,
        },
      })
      .from(agreements)
      .leftJoin(members, eq(agreements.memberId, members.id))
      .where(where)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(agreements.updatedAt)),
    db.select({ count: count() }).from(agreements).where(where),
  ]);

  return { rows, total: totalResult[0]?.count ?? 0 };
}

export async function getAgreementMetrics() {
  const db = await getDb();
  if (!db) return null;

  const statuses = ["not_sent", "sent", "delivered", "opened", "verified", "in_progress", "completed", "expired", "failed", "needs_review"] as const;

  const [statusCounts, avgTimeResult, exceptionCount] = await Promise.all([
    db
      .select({ status: agreements.status, count: count() })
      .from(agreements)
      .groupBy(agreements.status),
    db
      .select({
        avgMs: sql<number>`AVG(TIMESTAMPDIFF(SECOND, ${agreements.sentAt}, ${agreements.signedAt}))`,
      })
      .from(agreements)
      .where(and(sql`${agreements.sentAt} IS NOT NULL`, sql`${agreements.signedAt} IS NOT NULL`)),
    db.select({ count: count() }).from(agreements).where(eq(agreements.hasException, true)),
  ]);

  const byStatus: Record<string, number> = {};
  for (const s of statuses) byStatus[s] = 0;
  for (const row of statusCounts) byStatus[row.status] = row.count;

  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
  const completed = byStatus["completed"] ?? 0;
  const sent = Object.values(byStatus).reduce((a, b) => a + b, 0) - (byStatus["not_sent"] ?? 0);
  const completionRate = sent > 0 ? Math.round((completed / sent) * 100) : 0;
  const avgSeconds = avgTimeResult[0]?.avgMs ?? 0;
  const avgMinutes = Math.round(avgSeconds / 60);

  return {
    total,
    byStatus,
    completionRate,
    avgMinutesToSign: avgMinutes,
    exceptions: exceptionCount[0]?.count ?? 0,
  };
}

// ─── Agreement Events ─────────────────────────────────────────────────────────

export async function logEvent(data: InsertAgreementEvent): Promise<void> {
  const db = await getDb();
  if (!db) { console.warn("[DB] Cannot log event: database not available"); return; }
  await db.insert(agreementEvents).values(data);
}

export async function getEventsByAgreement(agreementId: number): Promise<AgreementEvent[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(agreementEvents)
    .where(eq(agreementEvents.agreementId, agreementId))
    .orderBy(agreementEvents.createdAt);
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function createDocument(data: InsertDocument): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documents).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function getDocumentsByAgreement(agreementId: number): Promise<Document[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents).where(eq(documents.agreementId, agreementId)).orderBy(documents.generatedAt);
}

export async function searchDocuments(opts: {
  vin?: string;
  reservationId?: string;
  customerId?: string;
  memberId?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.vin) conditions.push(eq(documents.vin, opts.vin));
  if (opts.reservationId) conditions.push(eq(documents.reservationId, opts.reservationId));
  if (opts.customerId) conditions.push(eq(documents.customerId, opts.customerId));
  if (opts.memberId) conditions.push(eq(documents.memberId, opts.memberId));
  if (conditions.length === 0) return [];
  return db.select().from(documents).where(or(...conditions)).orderBy(desc(documents.generatedAt));
}

// ─── Email Verification Codes ─────────────────────────────────────────────────

export async function createEmailVerificationCode(data: InsertEmailVerificationCode): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(emailVerificationCodes).values(data);
}

export async function getActiveEmailCode(agreementId: number, email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const now = new Date();
  const result = await db
    .select()
    .from(emailVerificationCodes)
    .where(
      and(
        eq(emailVerificationCodes.agreementId, agreementId),
        eq(emailVerificationCodes.email, email),
        sql`${emailVerificationCodes.usedAt} IS NULL`,
        gte(emailVerificationCodes.expiresAt, now),
      )
    )
    .orderBy(desc(emailVerificationCodes.createdAt))
    .limit(1);
  return result[0];
}

export async function markEmailCodeUsed(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(emailVerificationCodes).set({ usedAt: new Date() }).where(eq(emailVerificationCodes.id, id));
}

export async function incrementEmailCodeAttempts(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(emailVerificationCodes)
    .set({ attempts: sql`${emailVerificationCodes.attempts} + 1` })
    .where(eq(emailVerificationCodes.id, id));
}

// ─── Expiry sweep ─────────────────────────────────────────────────────────────

export async function expireAgreements(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const now = new Date();
  const result = await db
    .update(agreements)
    .set({ status: "expired" })
    .where(
      and(
        lt(agreements.expiresAt, now),
        inArray(agreements.status, ["not_sent", "sent", "delivered", "opened", "verified", "in_progress"]),
        sql`${agreements.revokedAt} IS NULL`,
      )
    );
  return (result[0] as { affectedRows: number }).affectedRows ?? 0;
}
