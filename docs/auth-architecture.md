# FleetNexus Auth Architecture

This scaffold adds a production-oriented NestJS API and Next.js web auth layer without replacing the existing Vite app.

## Layout

```text
apps/
  api/
    prisma/schema.prisma
    src/auth
    src/users
    src/common
    src/prisma
  web/
    middleware.ts
    src/lib/auth
    src/components/auth
    src/app
```

## Backend

The NestJS API implements:

- JWT access tokens in an `access_token` HTTP-only cookie.
- Refresh token rotation in a path-scoped `refresh_token` HTTP-only cookie.
- Bcrypt password hashing and refresh token hashing.
- Prisma + PostgreSQL models for `User` and `RefreshSession`.
- Global JWT guard, role guard, CSRF guard, validation pipe, Helmet, and rate limiting.
- Role-based access for `admin` and `sales_agent`.

Important routes:

```text
GET  /api/auth/csrf
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
GET  /api/users       admin only
POST /api/users       admin only
```

Refresh tokens use `sessionId.secret`. The database stores the session ID as the lookup selector and only stores a bcrypt hash of the secret. On refresh, the old session is revoked and a new session is created.

## Frontend

The Next.js app implements:

- `AuthProvider` for client auth state.
- Server `requireAuth()` and `requireAuth(["admin"])` helpers.
- Middleware protection for `/dashboard`, `/sales`, and `/admin`.
- Role-based redirects to `/unauthorized`.
- Same-origin `/api/*` rewrites to the NestJS API so cookies are visible to Next middleware.

Recommended production deployment:

```text
https://app.example.com          Next.js
https://app.example.com/api/*    reverse proxy to NestJS
```

If the API is on a subdomain, set a shared `COOKIE_DOMAIN`, for example `.example.com`, and keep `sameSite` compatible with your deployment.

## Environment

Backend:

```bash
cp apps/api/.env.example apps/api/.env
```

Frontend:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Use long, unrelated secrets for:

```text
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
```

The frontend middleware verifies the access token, so `apps/web` must receive the same `JWT_ACCESS_SECRET` as the API or middleware should be changed to call `/api/auth/me` instead of local verification.

## Database

From `apps/api`:

```bash
npm install
npm run prisma:generate
npm run prisma:dev
```

Create the first admin through a one-off script, SQL migration, or a protected internal provisioning path. Do not expose public registration for staff accounts.

## Security Notes

- Access token TTL defaults to 15 minutes.
- Refresh token TTL defaults to 30 days.
- Logout revokes the active refresh session.
- Reuse of an invalid refresh secret revokes the matching session selector.
- CSRF uses a double-submit token: non-HTTP-only `csrf_token` cookie plus `X-CSRF-Token` header.
- `users` routes are admin-only and return safe user fields only.
- Cookies are `secure` in production and HTTP-only for auth tokens.
