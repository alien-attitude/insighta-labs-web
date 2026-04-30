# Insighta Labs+ Web Portal

Browser interface for the Insighta Labs+ platform. Login with GitHub, browse profiles, search with natural language, and view demographic data.

---

## Setup

```bash
npm install
cp .env.example .env.development.local
npm run dev
```

### Environment Variables

```
PORT=4000
API_URL=http://localhost:3000      # Backend URL
SESSION_SECRET=long-random-string
```

---

## Pages

| Route          | Auth Required | Description            |
|----------------|---------------|------------------------|
| /login         | No            | GitHub OAuth login     |
| /dashboard     | Yes           | Metrics overview       |
| /profiles      | Yes           | Filtered profile list  |
| /profiles/:id  | Yes           | Profile detail         |
| /search        | Yes           | Natural language search|
| /account       | Yes           | User profile & role    |

---

## Security

- **HTTP-only cookies**: Access and refresh tokens are stored in `httpOnly` cookies — JavaScript cannot read them (XSS protection)
- **CSRF protection**: All state-changing requests require a valid CSRF token
- **Secure flag**: Cookies use `secure: true` in production
- **Token refresh**: Middleware attempts silent refresh before rejecting requests
- **Role enforcement**: Admin-only features (export, create) are hidden from analysts at the UI level and blocked at the API level
