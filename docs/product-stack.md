# FleetNexus product stack

## Architecture (current)

| Layer | App | Port | Purpose |
|-------|-----|------|---------|
| API | `apps/api` (NestJS) | 4000 | Auth, leads, bookings, payments, calls, marketplace |
| **CRM** | Root `src/` (Vite + TanStack Router) | **8080** | **All staff workflows** — dashboard, pipeline, bookings, payments, calls |
| **Marketing** | `apps/web` (Next.js) | **3000** | Public landing, FAQ, lead capture form |

Staff must **not** use Next.js routes such as `/dashboard` or `/sales` on port 3000. Those URLs redirect to the legacy CRM.

## Local development

```bash
npm run dev
```

Starts API + CRM (:8080) + marketing site (:3000).

- **Customers / marketing:** http://localhost:3000  
- **Staff CRM:** http://localhost:8080/app (sign in at http://localhost:8080/login)

## Environment

- `apps/web`: `NEXT_PUBLIC_CRM_URL=http://localhost:8080` (marketing links to CRM)
- `apps/api`: standard `.env` with `JWT_ACCESS_SECRET`, database, etc.
- Legacy CRM proxies `/api` → `http://127.0.0.1:4000` via Vite

## Production

Deploy marketing (`apps/web`) and CRM (Vite `npm run build` → static host or CDN) separately. Set `NEXT_PUBLIC_CRM_URL` to the public CRM origin (e.g. `https://crm.fleetnexus.com`).
