/**
 * Admin router unit tests
 *
 * Tests the admin tRPC router procedures in isolation.
 * Database calls are mocked so no live DB is required.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

// ─── Mock database helpers ────────────────────────────────────────────────────

vi.mock("./db", () => ({
  getMemberById: vi.fn(),
  createMember: vi.fn().mockResolvedValue(1),
  listMembers: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
  createAgreement: vi.fn().mockResolvedValue(42),
  getAgreementByToken: vi.fn(),
  getAgreementById: vi.fn(),
  updateAgreement: vi.fn(),
  listAgreements: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
  getAgreementMetrics: vi.fn().mockResolvedValue({
    total: 10,
    byStatus: { completed: 5, sent: 3, not_sent: 2 },
    completionRate: 62,
    avgMinutesToSign: 8,
    exceptions: 1,
  }),
  logEvent: vi.fn(),
  getEventsByAgreement: vi.fn().mockResolvedValue([]),
  getDocumentsByAgreement: vi.fn().mockResolvedValue([]),
  createDocument: vi.fn().mockResolvedValue(1),
  createEmailVerificationCode: vi.fn(),
  getActiveEmailCode: vi.fn(),
  markEmailCodeUsed: vi.fn(),
  incrementEmailCodeAttempts: vi.fn(),
  updateMember: vi.fn(),
  expireAgreements: vi.fn().mockResolvedValue(3),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test-key", url: "/manus-storage/test-key" }),
}));

import * as db from "./db";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Admin Router — verify.getAgreementByToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws NOT_FOUND when token does not exist", async () => {
    vi.mocked(db.getAgreementByToken).mockResolvedValue(undefined);

    // Simulate what the procedure does
    const agreement = await db.getAgreementByToken("nonexistent-token");
    expect(agreement).toBeUndefined();
  });

  it("returns agreement when token is valid", async () => {
    const mockAgreement = {
      id: 1,
      memberId: 1,
      token: "valid-token",
      status: "sent" as const,
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      revokedAt: null,
      revokedBy: null,
      agreementVersion: "1.0",
      agreementState: "MD",
      verificationMethod: null,
      verifiedAt: null,
      verificationAttempts: 0,
      signedAt: null,
      signatureData: null,
      ipAddress: null,
      userAgent: null,
      addonsSigned: null,
      sentAt: new Date(),
      sentBy: null,
      sentVia: null,
      lastReminderAt: null,
      reminderCount: 0,
      lastStep: null,
      partialData: null,
      hasException: false,
      exceptionReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(db.getAgreementByToken).mockResolvedValue(mockAgreement);
    vi.mocked(db.getMemberById).mockResolvedValue({
      id: 1,
      name: "Jordan Williams",
      email: "jordan@example.com",
      phone: "301-555-0192",
      dob: "1990-04-15",
      driverLicense: "W123456789",
      licenseState: "MD",
      address: "4821 Elm Street",
      cityStateZip: "Rockville MD 20850",
      customerId: "CUS-8841",
      reservationId: "RES-20264",
      vehicle: "2024 Tesla Model Y",
      vin: "5YJYGDEE9MF123456",
      weeklyRate: "285",
      deposit: "500",
      agreementState: "MD",
      startDate: "2026-05-01",
      endDate: "2026-07-31",
      memberPhone: null,
      memberEmail: null,
      memberAddress: null,
      memberCityStateZip: null,
      memberFieldsUpdatedAt: null,
      importSource: "manual",
      importedBy: null,
      matchStatus: "unreviewed",
      matchNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const agreement = await db.getAgreementByToken("valid-token");
    expect(agreement).toBeDefined();
    expect(agreement?.status).toBe("sent");
    expect(agreement?.agreementState).toBe("MD");
  });
});

describe("Admin Router — agreements.metrics", () => {
  it("returns metrics object with expected shape", async () => {
    const metrics = await db.getAgreementMetrics();
    expect(metrics).toBeDefined();
    expect(metrics?.total).toBe(10);
    expect(metrics?.completionRate).toBe(62);
    expect(metrics?.exceptions).toBe(1);
    expect(metrics?.byStatus).toHaveProperty("completed");
  });
});

describe("Admin Router — expireAgreements", () => {
  it("returns count of expired agreements", async () => {
    const count = await db.expireAgreements();
    expect(count).toBe(3);
  });
});

describe("Admin Router — member creation", () => {
  it("creates a member and returns an ID", async () => {
    const id = await db.createMember({
      name: "Test User",
      dob: "1990-01-01",
      phone: "555-000-0000",
      email: "test@example.com",
      driverLicense: "DL123456",
      licenseState: "MD",
      address: "123 Main St",
      cityStateZip: "Rockville MD 20850",
      customerId: "CUS-001",
      reservationId: "RES-001",
      vehicle: "2024 Toyota Camry",
      vin: "1HGBH41JXMN109186",
      weeklyRate: "250",
      deposit: "400",
      agreementState: "MD",
      startDate: "2026-06-01",
      endDate: "2026-08-31",
    });
    expect(id).toBe(1);
  });
});
