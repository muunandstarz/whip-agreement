/**
 * Scheduled Reminder Handler
 * Called by the Manus Heartbeat cron at 24h, 48h, and 72h after an agreement is sent.
 * Route: POST /api/scheduled/sendReminder
 *
 * The handler looks up the agreement by scheduleCronTaskUid (set by the cron system),
 * checks whether a reminder is still appropriate, and sends it via email/SMS.
 */

import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { sdk } from "./_core/sdk";
import { getDb } from "./db";
import { agreements, members } from "../drizzle/schema";
import { sendEmail, buildReminderEmail } from "./email";
import { sendSms, buildReminderSms } from "./sms";

// Statuses where a reminder is still meaningful
const REMINDER_ELIGIBLE_STATUSES = ["sent", "delivered", "opened", "verified", "in_progress"];

export async function sendReminderHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "db-unavailable" });
    }

    // Look up the agreement by the cron task UID — never trust req.body for this
    const [agreement] = await db
      .select()
      .from(agreements)
      .where(eq(agreements.scheduleCronTaskUid, user.taskUid))
      .limit(1);

    if (!agreement) {
      // Orphaned cron — return 200 so the platform stops retrying
      return res.json({ ok: true, skipped: "orphan" });
    }

    // Skip if already completed, expired, revoked, or not eligible
    if (!REMINDER_ELIGIBLE_STATUSES.includes(agreement.status)) {
      return res.json({ ok: true, skipped: `status:${agreement.status}` });
    }

    // Skip if already signed/completed (double-check)
    if (agreement.signedAt || agreement.revokedAt) {
      return res.json({ ok: true, skipped: "already-signed-or-revoked" });
    }

    // Check elapsed time since sent — only send at 24h, 48h, 72h intervals
    // After 3 reminders (72h), stop sending
    const reminderCount = agreement.reminderCount ?? 0;
    if (reminderCount >= 3) {
      return res.json({ ok: true, skipped: "max-reminders-reached" });
    }

    const sentAt = agreement.sentAt;
    if (!sentAt) {
      return res.json({ ok: true, skipped: "no-sentAt" });
    }

    const hoursSinceSent = (Date.now() - sentAt.getTime()) / (1000 * 60 * 60);
    const expectedHours = (reminderCount + 1) * 24; // 24h, 48h, 72h
    // The cron fires daily at the same UTC time as sentAt, so each fire is ~24h apart.
    // Allow a 2h window (22h-26h) to account for cron timing drift.
    if (hoursSinceSent < expectedHours - 2) {
      return res.json({ ok: true, skipped: `too-early:${hoursSinceSent.toFixed(1)}h-of-${expectedHours}h` });
    }

    // Fetch the member
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, agreement.memberId))
      .limit(1);

    if (!member) {
      return res.json({ ok: true, skipped: "member-not-found" });
    }

    // Build the agreement link
    const baseUrl = process.env.SITE_URL || "https://whipagree-3narmaq7.manus.space";
    const link = `${baseUrl}/agreement/${agreement.token}`;
    const firstName = member.name.split(" ")[0];
    const reminderNum = reminderCount + 1;

    const sentVia = agreement.sentVia ?? "email";
    let emailOk = false;
    let smsOk = false;

    // Send email reminder
    if (sentVia === "email" || sentVia === "both") {
      const { subject, html } = buildReminderEmail({
        firstName,
        vehicle: member.vehicle,
        link,
        reminderCount: reminderNum,
      });
      emailOk = await sendEmail({ to: member.email, subject, html });
    }

    // Send SMS reminder
    if (sentVia === "sms" || sentVia === "both") {
      const message = buildReminderSms({ firstName, link });
      smsOk = await sendSms({ to: member.phone, message });
    }

    // Update reminder count and timestamp
    await db
      .update(agreements)
      .set({
        reminderCount: reminderNum,
        lastReminderAt: new Date(),
      })
      .where(eq(agreements.id, agreement.id));

    console.log(
      `[Reminder] Agreement ${agreement.id} — reminder #${reminderNum} sent. email=${emailOk} sms=${smsOk}`
    );

    return res.json({ ok: true, agreementId: agreement.id, reminderCount: reminderNum, emailOk, smsOk });
  } catch (err) {
    console.error("[Reminder Handler] Error:", err);
    return res.status(500).json({
      error: String(err),
      stack: err instanceof Error ? err.stack : undefined,
      context: { url: req.url, taskUid: "unknown" },
      timestamp: new Date().toISOString(),
    });
  }
}
