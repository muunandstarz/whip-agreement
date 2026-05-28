/**
 * SMS delivery via TextLine API
 * Credentials: TEXTLINE_API_KEY (use Access Token from TextLine Settings → API)
 *
 * TextLine API docs: https://textline.com/api
 * Endpoint: POST https://application.textline.com/api/conversations.json
 *
 * All SMS templates are kept under 160 characters (GSM-7 single segment).
 * Agreement links are pre-shortened via shortenUrl() before being passed here.
 */

export async function sendSms(opts: {
  to: string;       // E.164 or 10-digit US number
  message: string;
}): Promise<boolean> {
  const apiKey = process.env.TEXTLINE_API_KEY;
  if (!apiKey) {
    console.warn("[SMS] TEXTLINE_API_KEY not configured");
    return false;
  }

  // Normalise phone to digits only
  const phone = opts.to.replace(/\D/g, "");
  if (phone.length < 10) {
    console.warn("[SMS] Invalid phone number:", opts.to);
    return false;
  }

  try {
    const resp = await fetch("https://application.textline.com/api/conversations.json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-TGP-ACCESS-TOKEN": apiKey,
      },
      body: JSON.stringify({
        phone_number: phone.length === 10 ? `+1${phone}` : `+${phone}`,
        comment: { body: opts.message },
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      console.error(`[SMS] TextLine error ${resp.status}:`, body);
      return false;
    }

    console.log(`[SMS] Sent to ${opts.to}`);
    return true;
  } catch (err) {
    console.error("[SMS] Request failed:", err);
    return false;
  }
}

// ─── SMS Templates ────────────────────────────────────────────────────────────
// All templates verified under 160 chars (GSM-7).
// The `link` parameter must already be a shortened URL (e.g. https://…/s/aB3xQ7mZ).

/**
 * Initial send — 156 chars max with a 30-char short link.
 * "Whip: Action required. Review & sign your updated Member Agreement to continue rental: [LINK]"
 */
export function buildAgreementSms(opts: { link: string }): string {
  const msg = `Whip: Action required. Review & sign your updated Member Agreement to continue rental: ${opts.link}`;
  if (msg.length > 160) console.warn(`[SMS] Template exceeds 160 chars (${msg.length}): buildAgreementSms`);
  return msg;
}

/**
 * Reminder (1st and 2nd) — 153 chars max with a 30-char short link.
 * "Whip reminder: Your updated Member Agreement is still pending. Please review & sign here: [LINK]"
 */
export function buildReminderSms(opts: { link: string }): string {
  const msg = `Whip reminder: Your updated Member Agreement is still pending. Please review & sign here: ${opts.link}`;
  if (msg.length > 160) console.warn(`[SMS] Template exceeds 160 chars (${msg.length}): buildReminderSms`);
  return msg;
}

/**
 * Final reminder (3rd / last notice).
 * "Whip: Your account may be impacted if your updated agreement is not signed soon: [LINK]"
 */
export function buildFinalReminderSms(opts: { link: string }): string {
  const msg = `Whip: Your account may be impacted if your updated agreement is not signed soon: ${opts.link}`;
  if (msg.length > 160) console.warn(`[SMS] Template exceeds 160 chars (${msg.length}): buildFinalReminderSms`);
  return msg;
}
