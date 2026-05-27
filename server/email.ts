/**
 * Email delivery via cPanel/SGVps SMTP
 * Credentials: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 */

import nodemailer from "nodemailer";

const LOGO_URL = "https://whipagree-3narmaq7.manus.space/manus-storage/whip-logo_215524ca.png";
const FROM_NAME = "Whip Agreements";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("[Email] SMTP not configured — missing SMTP_HOST, SMTP_USER, or SMTP_PASS");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }, // cPanel certs are often self-signed
  });
}

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) return false;

  const user = process.env.SMTP_USER!;
  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${user}>`,
      to: Array.isArray(opts.to) ? opts.to.join(", ") : opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text ?? opts.subject,
    });
    console.log(`[Email] Sent "${opts.subject}" to ${Array.isArray(opts.to) ? opts.to.join(", ") : opts.to}`);
    return true;
  } catch (err) {
    console.error("[Email] Send failed:", err);
    return false;
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#ffffff">
    <!-- Header -->
    <div style="background:#0b1228;padding:24px 32px;text-align:center">
      <img src="${LOGO_URL}" alt="Whip" style="height:48px;width:auto" />
    </div>
    <!-- Body -->
    <div style="padding:32px 32px 24px">
      ${content}
    </div>
    <!-- Footer -->
    <div style="background:#f9f9f9;border-top:1px solid #e5e5e5;padding:20px 32px;text-align:center">
      <p style="color:#999;font-size:12px;margin:0">
        Whip Member Agreements &bull; <a href="https://drivewhip.com" style="color:#FF6A00;text-decoration:none">drivewhip.com</a>
      </p>
      <p style="color:#bbb;font-size:11px;margin:8px 0 0">
        If you did not request this email, please ignore it or contact your local Whip office.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function buildAgreementEmail(opts: {
  firstName: string;
  vehicle: string;
  reservationId: string;
  agreementState: string;
  link: string;
  expiresInHours?: number;
}): { subject: string; html: string } {
  const expiry = opts.expiresInHours ?? 72;
  return {
    subject: "Your Whip Member Agreement is Ready to Sign",
    html: emailWrapper(`
      <h2 style="color:#0b1228;margin-top:0">Hi ${opts.firstName},</h2>
      <p style="color:#444;line-height:1.6">Your Whip Member Agreement is ready for your review and signature. Please complete it at your earliest convenience.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#f9f9f9;border-radius:8px">
        <tr><td style="padding:10px 16px;color:#666;font-size:13px;width:40%">Vehicle</td><td style="padding:10px 16px;color:#0b1228;font-weight:bold;font-size:13px">${opts.vehicle}</td></tr>
        <tr style="background:#f0f0f0"><td style="padding:10px 16px;color:#666;font-size:13px">Reservation ID</td><td style="padding:10px 16px;color:#0b1228;font-weight:bold;font-size:13px">${opts.reservationId}</td></tr>
        <tr><td style="padding:10px 16px;color:#666;font-size:13px">Agreement State</td><td style="padding:10px 16px;color:#0b1228;font-weight:bold;font-size:13px">${opts.agreementState}</td></tr>
      </table>
      <div style="text-align:center;margin:32px 0">
        <a href="${opts.link}" style="background:#FF6A00;color:#ffffff;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block">Review &amp; Sign Agreement →</a>
      </div>
      <p style="color:#888;font-size:13px;text-align:center">This link expires in ${expiry} hours. If you have questions, contact your local Whip office.</p>
    `),
  };
}

export function buildReminderEmail(opts: {
  firstName: string;
  vehicle: string;
  link: string;
  reminderCount: number;
}): { subject: string; html: string } {
  const urgency = opts.reminderCount >= 2 ? "⚠️ Final Reminder: " : "Reminder: ";
  return {
    subject: `${urgency}Complete Your Whip Member Agreement`,
    html: emailWrapper(`
      <h2 style="color:#0b1228;margin-top:0">${opts.reminderCount >= 2 ? "Final Reminder" : "Friendly Reminder"}</h2>
      <p style="color:#444;line-height:1.6">Hi ${opts.firstName}, we noticed you haven't completed your Whip Member Agreement yet. Your vehicle <strong>${opts.vehicle}</strong> is ready — please sign your agreement to continue.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="${opts.link}" style="background:#FF6A00;color:#ffffff;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block">Complete Your Agreement →</a>
      </div>
      ${opts.reminderCount >= 2 ? '<p style="color:#e55f00;font-size:13px;text-align:center;font-weight:bold">This is your final reminder. Please complete your agreement as soon as possible.</p>' : ""}
    `),
  };
}

export function buildVerificationCodeEmail(opts: {
  code: string;
  email: string;
}): { subject: string; html: string } {
  return {
    subject: `Your Whip verification code: ${opts.code}`,
    html: emailWrapper(`
      <h2 style="color:#0b1228;margin-top:0">Identity Verification</h2>
      <p style="color:#444;line-height:1.6">Use the code below to verify your identity and access your Whip Member Agreement.</p>
      <div style="text-align:center;margin:32px 0;background:#f9f9f9;border-radius:12px;padding:32px">
        <p style="font-size:42px;font-weight:bold;letter-spacing:12px;color:#FF6A00;margin:0">${opts.code}</p>
        <p style="color:#888;font-size:13px;margin:12px 0 0">Expires in 10 minutes</p>
      </div>
      <p style="color:#888;font-size:13px;text-align:center">If you did not request this code, please disregard this email.</p>
    `),
  };
}
