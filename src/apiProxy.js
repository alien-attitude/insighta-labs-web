import axios from "axios";
import { API_URL } from "./config.js";

/**
 * Create an axios instance that injects the user's access token
 * from the HTTP-only cookie into the Authorization header.
 * The browser never sees the token — it stays on the server side.
 */
export function createApiClient(req) {
  const token = req.cookies?.access_token;

  return axios.create({
    baseURL: API_URL,
    headers: {
      "X-API-Version":  "1",
      "Content-Type":   "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    validateStatus: () => true, // Handle errors ourselves
  });
}

/**
 * Attempt to refresh tokens using the refresh_token cookie.
 * If successful, sets new cookies on the response.
 */
export async function refreshSession(req, res) {
  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) return false;

  try {
    const { data } = await axios.post(`${API_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });

    if (data.status === "success") {
      const cookieOpts = {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      };
      res.cookie("access_token",  data.access_token,  { ...cookieOpts, maxAge: 3 * 60 * 1000 });
      res.cookie("refresh_token", data.refresh_token, { ...cookieOpts, maxAge: 5 * 60 * 1000 });
      return true;
    }
  } catch { /* fall through */ }

  return false;
}
