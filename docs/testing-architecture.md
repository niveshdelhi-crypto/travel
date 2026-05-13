# FleetNexus Testing Architecture

FleetNexus uses layered testing for SaaS CRM operations:

- API E2E: Jest + Supertest against a disposable Postgres database.
- Browser E2E: Playwright against the Next.js app and live Nest API.
- Load: k6 scripts for public lead bursts, websocket connection pressure, and auth bursts.
- CI: GitHub Actions with Postgres, Redis, migration status, build, lint, API tests, Playwright tests, and k6 script validation.

## API Tests

```bash
cd apps/api
TEST_DATABASE_URL='postgresql://user:pass@localhost:5432/fleetnexus_test?schema=public' npm run test:api
```

The API tests create disposable users and verify auth, RBAC, public lead creation,
assignment, idempotency conflicts, and concurrent lead creation. They intentionally
skip unless `TEST_DATABASE_URL` is set, or `FLEETNEXUS_ALLOW_DATABASE_E2E=true`
is used for a known disposable database.

## Browser Tests

```bash
cd apps/web
E2E_API_URL=http://localhost:4000/api npm run test:e2e
```

The Playwright suite covers login, public lead submission via API, auto assignment
visibility, sales/admin dashboards, and realtime dashboard invalidation.

## Load Tests

```bash
k6 run -e API_URL=http://localhost:4000/api tests/load/lead-submissions.k6.js
k6 run -e API_URL=http://localhost:4000/api tests/load/auth-bursts.k6.js
k6 run -e API_URL=http://localhost:4000/api tests/load/websocket-connections.k6.js
```

The lead load test defaults to 100 concurrent VUs and asserts sanitized successful
responses. Use it as the release gate for public lead traffic.
