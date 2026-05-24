/** Legacy Book my Carz CRM (Vite + TanStack Router). Marketing site links here for all staff workflows. */
export const DEFAULT_CRM_URL = "http://localhost:8080";

/** Maps old Next.js CRM paths to legacy `/app/*` routes. */
const NEXT_TO_LEGACY: Record<string, string> = {
  "/dashboard": "/app",
  "/leads": "/app/leads",
  "/sales": "/app/leads",
  "/admin": "/app/leads",
  "/calls": "/app/calls",
  "/bookings": "/app/bookings",
  "/payments": "/app/payments",
  "/team": "/app/team",
  "/admin-ops": "/app/admin",
};

export function getCrmBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_CRM_URL ?? DEFAULT_CRM_URL;
  return raw.replace(/\/$/, "");
}

export function mapNextPathToLegacy(nextPath: string): string {
  const path = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  for (const [prefix, legacy] of Object.entries(NEXT_TO_LEGACY)) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return legacy + path.slice(prefix.length);
    }
  }
  return "/app";
}

export function getLegacyCrmUrl(legacyPath = "/app"): string {
  const path = legacyPath.startsWith("/") ? legacyPath : `/${legacyPath}`;
  return `${getCrmBaseUrl()}${path}`;
}

export function getLegacyCrmLoginUrl(nextPath?: string | null): string {
  const redirect = mapNextPathToLegacy(nextPath ?? "/app");
  return `${getCrmBaseUrl()}/login?redirect=${encodeURIComponent(redirect)}`;
}
