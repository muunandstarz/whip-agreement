/**
 * Short-link helper
 * Creates a short slug → full URL mapping in the short_links table.
 * Redirect is served by GET /s/:slug in server/index.ts → 302 to targetUrl.
 *
 * Typical use: shorten the /agreement/:token URL before embedding in SMS.
 * Short URL format: https://<origin>/s/<8-char-slug>
 */

import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { shortLinks } from "../drizzle/schema";

const SLUG_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
const SLUG_LEN = 8;

function randomSlug(): string {
  let s = "";
  for (let i = 0; i < SLUG_LEN; i++) {
    s += SLUG_CHARS[Math.floor(Math.random() * SLUG_CHARS.length)];
  }
  return s;
}

/**
 * Shorten a URL. Returns the full short URL (e.g. https://whipagree-3narmaq7.manus.space/s/aB3xQ7mZ).
 * If a short link already exists for the same targetUrl + agreementId, reuses it.
 * Falls back to the original URL if the DB is unavailable.
 */
export async function shortenUrl(opts: {
  targetUrl: string;
  agreementId?: number;
  baseUrl: string;           // e.g. "https://whipagree-3narmaq7.manus.space"
  expiresAt?: Date;
}): Promise<string> {
  try {
    const db = await getDb();
    if (!db) return opts.targetUrl;

    // Reuse existing short link for the same agreement if possible
    if (opts.agreementId) {
      const [existing] = await db
        .select()
        .from(shortLinks)
        .where(eq(shortLinks.agreementId, opts.agreementId))
        .limit(1);
      if (existing) {
        return `${opts.baseUrl.replace(/\/$/, "")}/s/${existing.slug}`;
      }
    }

    // Generate a unique slug (retry up to 5 times on collision)
    let slug = randomSlug();
    for (let attempt = 0; attempt < 5; attempt++) {
      const [collision] = await db
        .select({ id: shortLinks.id })
        .from(shortLinks)
        .where(eq(shortLinks.slug, slug))
        .limit(1);
      if (!collision) break;
      slug = randomSlug();
    }

    await db.insert(shortLinks).values({
      slug,
      targetUrl: opts.targetUrl,
      agreementId: opts.agreementId ?? null,
      expiresAt: opts.expiresAt ?? null,
    });

    return `${opts.baseUrl.replace(/\/$/, "")}/s/${slug}`;
  } catch (err) {
    console.error("[ShortLink] Failed to shorten URL, using original:", err);
    return opts.targetUrl;
  }
}
