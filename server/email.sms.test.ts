/**
 * Email & SMS helper unit tests
 *
 * Tests template builders and verifies graceful fallback when credentials are absent.
 * No real network calls are made — nodemailer and fetch are mocked.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Mock nodemailer (must use vi.hoisted so mocks are available before imports) ─

const { mockSendMail, mockCreateTransport } = vi.hoisted(() => {
  const mockSendMail = vi.fn().mockResolvedValue({ messageId: "test-id" });
  const mockCreateTransport = vi.fn().mockReturnValue({ sendMail: mockSendMail });
  return { mockSendMail, mockCreateTransport };
});

vi.mock("nodemailer", () => ({
  default: { createTransport: mockCreateTransport },
}));

// ─── Mock fetch for TextLine ──────────────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import {
  sendEmail,
  buildAgreementEmail,
  buildReminderEmail,
  buildVerificationCodeEmail,
} from "./email";
import { sendSms, buildAgreementSms, buildReminderSms } from "./sms";

// ─── Email tests ──────────────────────────────────────────────────────────────

describe("sendEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SMTP_HOST = "c60263.sgvps.net";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "insurance@drivewhip.com";
    process.env.SMTP_PASS = "test-pass";
  });

  afterEach(() => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
  });

  it("returns false and warns when SMTP not configured", async () => {
    delete process.env.SMTP_HOST;
    const result = await sendEmail({ to: "test@example.com", subject: "Test", html: "<p>test</p>" });
    expect(result).toBe(false);
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it("calls sendMail with correct from address when configured", async () => {
    const result = await sendEmail({ to: "member@example.com", subject: "Test Subject", html: "<p>Hello</p>" });
    expect(result).toBe(true);
    expect(mockSendMail).toHaveBeenCalledOnce();
    const call = mockSendMail.mock.calls[0][0];
    expect(call.from).toContain("insurance@drivewhip.com");
    expect(call.to).toBe("member@example.com");
    expect(call.subject).toBe("Test Subject");
  });

  it("joins array recipients into comma-separated string", async () => {
    await sendEmail({ to: ["a@example.com", "b@example.com"], subject: "Multi", html: "<p>x</p>" });
    const call = mockSendMail.mock.calls[0][0];
    expect(call.to).toBe("a@example.com, b@example.com");
  });

  it("returns false when sendMail throws", async () => {
    mockSendMail.mockRejectedValueOnce(new Error("SMTP connection refused"));
    const result = await sendEmail({ to: "fail@example.com", subject: "Fail", html: "<p>x</p>" });
    expect(result).toBe(false);
  });
});

describe("Email template builders", () => {
  it("buildAgreementEmail returns correct subject and contains member info", () => {
    const { subject, html } = buildAgreementEmail({
      firstName: "Jordan",
      vehicle: "2024 Tesla Model Y",
      reservationId: "1042-N09186-05012026",
      agreementState: "MD",
      link: "https://whipagree-3narmaq7.manus.space/agreement/abc123",
    });
    expect(subject).toContain("Ready to Sign");
    expect(html).toContain("Jordan");
    expect(html).toContain("2024 Tesla Model Y");
    expect(html).toContain("1042-N09186-05012026");
    expect(html).toContain("MD");
    expect(html).toContain("abc123");
  });

  it("buildReminderEmail marks final reminder when reminderCount >= 2", () => {
    const { subject: s1 } = buildReminderEmail({ firstName: "Jordan", vehicle: "Tesla", link: "http://x", reminderCount: 1 });
    const { subject: s2, html: h2 } = buildReminderEmail({ firstName: "Jordan", vehicle: "Tesla", link: "http://x", reminderCount: 2 });
    expect(s1).not.toContain("Final");
    expect(s2).toContain("Final");
    expect(h2).toContain("final reminder");
  });

  it("buildVerificationCodeEmail contains the code prominently", () => {
    const { subject, html } = buildVerificationCodeEmail({ code: "847291", email: "test@example.com" });
    expect(subject).toContain("847291");
    expect(html).toContain("847291");
  });
});

// ─── SMS tests ────────────────────────────────────────────────────────────────

describe("sendSms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TEXTLINE_API_KEY = "xo79ytdfv7thm5s6i07l";
  });

  afterEach(() => {
    delete process.env.TEXTLINE_API_KEY;
  });

  it("returns false when TEXTLINE_API_KEY not set", async () => {
    delete process.env.TEXTLINE_API_KEY;
    const result = await sendSms({ to: "3015550192", message: "Test" });
    expect(result).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns false for invalid phone number", async () => {
    const result = await sendSms({ to: "123", message: "Test" });
    expect(result).toBe(false);
  });

  it("sends POST to TextLine with correct headers and body", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: "conv-1" }) });
    const result = await sendSms({ to: "301-555-0192", message: "Sign your agreement: https://example.com/abc" });
    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("textline.com");
    expect(opts.method).toBe("POST");
    expect(opts.headers["X-TGP-ACCESS-TOKEN"]).toBe("xo79ytdfv7thm5s6i07l");
    const body = JSON.parse(opts.body);
    expect(body.phone_number).toBe("+13015550192");
    expect(body.comment.body).toContain("Sign your agreement");
  });

  it("returns false when TextLine returns non-ok status", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401, text: async () => "Unauthorized" });
    const result = await sendSms({ to: "3015550192", message: "Test" });
    expect(result).toBe(false);
  });
});

describe("SMS template builders", () => {
  it("buildAgreementSms includes name and link", () => {
    const msg = buildAgreementSms({ firstName: "Jordan", link: "https://example.com/abc" });
    expect(msg).toContain("Jordan");
    expect(msg).toContain("https://example.com/abc");
    expect(msg).toContain("Whip");
  });

  it("buildReminderSms includes name and link", () => {
    const msg = buildReminderSms({ firstName: "Jordan", link: "https://example.com/abc" });
    expect(msg).toContain("Jordan");
    expect(msg).toContain("https://example.com/abc");
  });
});
