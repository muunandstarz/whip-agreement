export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Admin login uses Google OAuth restricted to @drivewhip.com accounts.
// The server handles the full OAuth flow at /api/auth/google.
export const getLoginUrl = () => "/api/auth/google";
