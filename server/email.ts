/**
 * Email delivery via cPanel/SGVps SMTP
 * Credentials: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 */

import nodemailer from "nodemailer";

const LOGO_URL = "https://whipagree-3narmaq7.manus.space/manus-storage/whip-logo_215524ca.png";
const FROM_NAME = "Whip Support";

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

// ─── Email Wrapper ────────────────────────────────────────────────────────────

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Whip Member Agreement</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#ffffff">
    <!-- Header -->
    <div style="background:#171b31;padding:28px 32px;text-align:center">
      <img src="${LOGO_URL}" alt="Whip" style="height:52px;width:auto" />
    </div>
    <!-- Body -->
    <div style="padding:36px 36px 28px;color:#333333">
      ${content}
    </div>
    <!-- Footer -->
    <div style="background:#f7f7f7;border-top:1px solid #e0e0e0;padding:20px 32px;text-align:center">
      <p style="color:#888;font-size:12px;margin:0 0 6px">
        &copy; Whip &bull; <a href="https://drivewhip.com" style="color:#ff6221;text-decoration:none">drivewhip.com</a>
      </p>
      <p style="color:#aaa;font-size:11px;margin:0">
        If you did not request this email, please ignore it or contact your local Whip office.
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Agreement Email (Initial Send) ──────────────────────────────────────────

export function buildAgreementEmail(opts: {
  firstName: string;
  vehicle: string;
  reservationId: string;
  agreementState: string;
  link: string;
  expiresInHours?: number;
}): { subject: string; html: string } {
  return {
    subject: "Action Required: Updated Whip Member Agreement",
    html: emailWrapper(`
      <p style="font-size:16px;line-height:1.7;margin:0 0 20px">Hi ${opts.firstName},</p>
      <p style="font-size:15px;line-height:1.7;margin:0 0 16px">
        We've updated portions of the Whip Member Agreement, including important coverage and election information.
      </p>
      <p style="font-size:15px;line-height:1.7;margin:0 0 24px">
        To continue renting through Whip, please review and complete the updated agreement using the secure link below:
      </p>
      <div style="text-align:center;margin:32px 0">
        <a href="${opts.link}"
           style="background:#ff6221;color:#ffffff;padding:16px 44px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;letter-spacing:0.3px">
          Review &amp; Sign Agreement &rarr;
        </a>
      </div>
      <p style="font-size:15px;line-height:1.7;margin:0 0 16px">This process only takes a few minutes.</p>
      <p style="font-size:15px;line-height:1.7;margin:0 0 32px">
        If you have questions, please contact Support.
      </p>
      <p style="font-size:15px;line-height:1.7;margin:0;color:#555">&mdash; Whip Support</p>
    `),
  };
}

// ─── Reminder Email ───────────────────────────────────────────────────────────

export function buildReminderEmail(opts: {
  firstName: string;
  vehicle: string;
  link: string;
  reminderCount: number;
}): { subject: string; html: string } {
  const isFinal = opts.reminderCount >= 3;

  if (isFinal) {
    return {
      subject: "Final Notice: Updated Whip Agreement Still Pending",
      html: emailWrapper(`
        <p style="font-size:16px;line-height:1.7;margin:0 0 20px">Hi ${opts.firstName},</p>
        <p style="font-size:15px;line-height:1.7;margin:0 0 16px">
          Our records show your updated Whip Member Agreement has not yet been completed.
        </p>
        <p style="font-size:15px;line-height:1.7;margin:0 0 24px">
          Please review and sign the agreement here:
        </p>
        <div style="text-align:center;margin:32px 0">
          <a href="${opts.link}"
             style="background:#ff6221;color:#ffffff;padding:16px 44px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;letter-spacing:0.3px">
            Review &amp; Sign Now &rarr;
          </a>
        </div>
        <p style="font-size:15px;line-height:1.7;margin:0 0 32px">
          Completion is required to maintain eligibility for future rentals.
        </p>
        <p style="font-size:15px;line-height:1.7;margin:0;color:#555">&mdash; Whip Support</p>
      `),
    };
  }

  return {
    subject: "Reminder: Updated Whip Agreement Still Pending",
    html: emailWrapper(`
      <p style="font-size:16px;line-height:1.7;margin:0 0 20px">Hi ${opts.firstName},</p>
      <p style="font-size:15px;line-height:1.7;margin:0 0 16px">
        Our records show your updated Whip Member Agreement has not yet been completed.
      </p>
      <p style="font-size:15px;line-height:1.7;margin:0 0 24px">
        Please review and sign the agreement here:
      </p>
      <div style="text-align:center;margin:32px 0">
        <a href="${opts.link}"
           style="background:#ff6221;color:#ffffff;padding:16px 44px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;letter-spacing:0.3px">
          Review &amp; Sign Agreement &rarr;
        </a>
      </div>
      <p style="font-size:15px;line-height:1.7;margin:0 0 32px">
        Completion is required to maintain eligibility for future rentals.
      </p>
      <p style="font-size:15px;line-height:1.7;margin:0;color:#555">&mdash; Whip Support</p>
    `),
  };
}

// ─── Verification Code Email ──────────────────────────────────────────────────

export function buildVerificationCodeEmail(opts: {
  code: string;
  email: string;
}): { subject: string; html: string } {
  return {
    subject: `Your Whip verification code: ${opts.code}`,
    html: emailWrapper(`
      <p style="font-size:16px;line-height:1.7;margin:0 0 16px">Use the code below to verify your identity and access your Whip Member Agreement.</p>
      <div style="text-align:center;margin:32px 0;background:#f7f7f7;border-radius:12px;padding:36px;border:1px solid #e8e8e8">
        <p style="font-size:48px;font-weight:bold;letter-spacing:14px;color:#ff6221;margin:0;font-family:monospace">${opts.code}</p>
        <p style="color:#888;font-size:13px;margin:14px 0 0">Expires in 10 minutes</p>
      </div>
      <p style="color:#888;font-size:13px;text-align:center;margin:0">If you did not request this code, please disregard this email.</p>
    `),
  };
}
