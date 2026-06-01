import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { google } from "googleapis";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

/** Build a Google OAuth2 client using the configured credentials. */
function getGoogleOAuth2Client(redirectUri: string) {
  return new google.auth.OAuth2(
    ENV.googleClientId,
    ENV.googleClientSecret,
    redirectUri,
  );
}

export function registerOAuthRoutes(app: Express) {
  // ── Manus OAuth callback (existing flow) ──────────────────────────────────
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  // ── Google OAuth — initiate ───────────────────────────────────────────────
  // GET /api/auth/google → redirects the browser to Google's consent screen.
  app.get("/api/auth/google", (req: Request, res: Response) => {
    if (!ENV.googleClientId || !ENV.googleClientSecret) {
      console.error("[Google OAuth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured");
      res.status(503).send(
        "Google OAuth is not configured. Please contact your administrator."
      );
      return;
    }
    const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/google/callback`;
    const oauth2Client = getGoogleOAuth2Client(redirectUri);
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["openid", "email", "profile"],
      prompt: "select_account",
      // Restrict to drivewhip.com Google Workspace domain
      hd: "drivewhip.com",
    });
    res.redirect(302, authUrl);
  });

  // ── Google OAuth — callback ───────────────────────────────────────────────
  // GET /api/auth/google/callback → exchanges code for tokens, verifies domain,
  // creates a session cookie, and redirects to /admin.
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const error = getQueryParam(req, "error");

    if (error) {
      console.warn("[Google OAuth] User denied access or error:", error);
      res.redirect(302, "/admin-login?error=access_denied");
      return;
    }
    if (!code) {
      res.status(400).send("Missing authorization code.");
      return;
    }

    try {
      const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/google/callback`;
      const oauth2Client = getGoogleOAuth2Client(redirectUri);

      // Exchange authorization code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Fetch the user's profile from Google
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const { data: googleUser } = await oauth2.userinfo.get();

      const email = googleUser.email ?? "";
      const name = googleUser.name ?? "";
      const googleId = googleUser.id ?? "";

      // Enforce @drivewhip.com domain restriction
      if (!email.endsWith("@drivewhip.com")) {
        console.warn(`[Google OAuth] Rejected non-drivewhip.com email: ${email}`);
        res.redirect(302, "/admin-login?error=unauthorized_domain");
        return;
      }

      // Use Google's sub (unique user ID) as the openId
      const openId = `google_${googleId}`;

      await db.upsertUser({
        openId,
        name: name || null,
        email: email || null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      // Create a session JWT signed with the app's cookie secret
      const sessionToken = await sdk.createSessionToken(openId, {
        name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      console.log(`[Google OAuth] Signed in: ${email}`);
      res.redirect(302, "/admin");
    } catch (err) {
      console.error("[Google OAuth] Callback error:", err);
      res.redirect(302, "/admin-login?error=oauth_failed");
    }
  });
}
