/**
 * SMS delivery via TextLine API
 * Credentials: TEXTLINE_API_KEY
 *
 * TextLine API docs: https://textline.com/api
 * Endpoint: POST https://application.textline.com/api/conversations.json
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

export function buildAgreementSms(opts: { firstName: string; link: string }): string {
  return `Hi ${opts.firstName}, your Whip Member Agreement is ready to sign. Please complete it here: ${opts.link}  — Whip`;
}

export function buildReminderSms(opts: { firstName: string; link: string }): string {
  return `Reminder: Hi ${opts.firstName}, your Whip Member Agreement still needs your signature. Complete it here: ${opts.link}  — Whip`;
}
