import Tokens from "csrf";
import { refreshSession } from "../apiProxy.js";

const tokens = new Tokens();

/**
 * requireAuth — redirect to login if no access_token cookie
 * Attempts auto-refresh if access token is missing but refresh token exists
 */
export async function requireAuth(req, res, next) {
  if (req.cookies?.access_token) return next();

  // Try to refresh
  if (req.cookies?.refresh_token) {
    const refreshed = await refreshSession(req, res);
    if (refreshed) return next();
  }

  return res.redirect("/login");
}

/**
 * CSRF middleware — sets a csrf_secret cookie (not HTTP-only) and
 * generates a token for forms. Validates on state-changing requests.
 */
export function csrf(req, res, next) {
  // Initialize secret per-session
  let secret = req.cookies?.csrf_secret;
  if (!secret) {
    secret = tokens.secretSync();
    res.cookie("csrf_secret", secret, { sameSite: "strict", secure: process.env.NODE_ENV === "production" });
  }

  // Attach token generator to res.locals for use in templates
  res.locals.csrfToken = () => tokens.create(secret);

  // Validate on POST/PUT/DELETE
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    const submitted = req.body?._csrf || req.headers["x-csrf-token"];
    if (!submitted || !tokens.verify(secret, submitted)) {
      return res.status(403).render("error", { message: "Invalid CSRF token", user: null });
    }
  }

  next();
}
