import express from "express";
import { createApiClient } from "../apiProxy.js";
import { requireAuth, csrf } from "../middleware/auth.js";
import { API_URL } from "../config.js";
import axios from "axios";

const router = express.Router();
router.use(csrf);

// Attach current user to all views
router.use(async (req, res, next) => {
  res.locals.user = null;
  if (req.cookies?.access_token) {
    try {
      const api = createApiClient(req);
      const { data } = await api.get("/auth/me");
      if (data.status === "success") res.locals.user = data.data;
    } catch { /* not logged in */ }
  }
  next();
});

// ── Public ────────────────────────────────────────────────────────────────────

router.get("/", (req, res) => {
  if (req.cookies?.access_token) return res.redirect("/dashboard");
  res.redirect("/login");
});

router.get("/login", (req, res) => {
  if (req.cookies?.access_token) return res.redirect("/dashboard");
  res.render("login", { csrfToken: res.locals.csrfToken() });
});

// Trigger GitHub OAuth — redirect to backend
router.get("/auth/github", (req, res) => {
  res.redirect(`${API_URL}/auth/github`);
});

router.get("/logout", async (req, res) => {
  const refresh = req.cookies?.refresh_token;
  if (refresh) {
    try { await axios.post(`${API_URL}/auth/logout`, { refresh_token: refresh }); } catch { /* ok */ }
  }
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  res.redirect("/login");
});

// ── Authenticated ─────────────────────────────────────────────────────────────

router.get("/dashboard", requireAuth, async (req, res) => {
  const api = createApiClient(req);
  try {
    const [allRes, maleRes, femaleRes] = await Promise.all([
      api.get("/api/profiles", { params: { limit: 1 } }),
      api.get("/api/profiles", { params: { limit: 1, gender: "male" } }),
      api.get("/api/profiles", { params: { limit: 1, gender: "female" } }),
    ]);
    res.render("dashboard", {
      total:   allRes.data.total   || 0,
      males:   maleRes.data.total  || 0,
      females: femaleRes.data.total|| 0,
    });
  } catch (err) {
    res.render("error", { message: "Failed to load dashboard data" });
  }
});

router.get("/profiles", requireAuth, async (req, res) => {
  const api    = createApiClient(req);
  const params = {
    page:     req.query.page      || 1,
    limit:    req.query.limit     || 20,
    gender:   req.query.gender    || undefined,
    country_id: req.query.country || undefined,
    age_group:  req.query.age_group || undefined,
    sort_by:  req.query.sort_by   || "created_at",
    order:    req.query.order     || "asc",
  };
  // Remove undefined values
  Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);

  try {
    const { data } = await api.get("/api/profiles", { params });
    res.render("profiles", {
      profiles:    data.data || [],
      page:        data.page,
      total_pages: data.total_pages,
      total:       data.total,
      limit:       data.limit,
      query:       req.query,
    });
  } catch (err) {
    res.render("error", { message: "Failed to load profiles" });
  }
});

router.get("/profiles/:id", requireAuth, async (req, res) => {
  const api = createApiClient(req);
  try {
    const { data } = await api.get(`/api/profiles/${req.params.id}`);
    if (data.status !== "success") return res.render("error", { message: "Profile not found" });
    res.render("profile-detail", { profile: data.data });
  } catch {
    res.render("error", { message: "Profile not found" });
  }
});

router.get("/search", requireAuth, async (req, res) => {
  const api = createApiClient(req);
  const q   = req.query.q || "";
  let results = [], error = null, pagination = {};

  if (q) {
    try {
      const { data } = await api.get("/api/profiles/search", {
        params: { q, page: req.query.page || 1, limit: 20 },
      });
      results    = data.data || [];
      pagination = { page: data.page, total_pages: data.total_pages, total: data.total };
    } catch (err) {
      error = err.response?.data?.message || "Search failed";
    }
  }

  res.render("search", { q, results, error, pagination });
});

router.get("/account", requireAuth, (req, res) => {
  res.render("account");
});

router.get("/export", requireAuth, async (req, res) => {
  const api = createApiClient(req);
  try {
    const { data, headers } = await api.get("/api/profiles/export", {
      params: { ...req.query, format: "csv" },
      responseType: "arraybuffer",  // handle binary/text response
    });

    const disposition = headers["content-disposition"] || `attachment; filename="profiles.csv"`;
    const timestamp   = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", disposition || `attachment; filename="profiles_${timestamp}.csv"`);
    return res.send(data);
  } catch (err) {
    const status = err.response?.status || 500;
    if (status === 403) {
      return res.status(403).render("error", { message: "You do not have permission to export profiles.", user: res.locals.user });
    }
    return res.render("error", { message: "Export failed. Please try again.", user: res.locals.user });
  }
});

export default router;
