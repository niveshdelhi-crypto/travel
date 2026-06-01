/** Full staff CRM (Vite + TanStack Router). Marketing site must link here for all staff workflows. */
export const DEFAULT_CRM_URL = "http://localhost:8080";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function crmOriginFromBase(crmBaseUrl: string): string | null {
  try {
    return new URL(crmBaseUrl).origin;
  } catch {
    return null;
  }
}

/**
 * CRM base URL for staff redirects.
 * When `NEXT_PUBLIC_CRM_URL` is set (e.g. http://localhost:8080), always use it — even on localhost.
 */
export function resolveCrmBaseUrl(originFromServer?: string): string {
  const configured = process.env.NEXT_PUBLIC_CRM_URL?.trim();
  if (configured) {
    return normalizeBaseUrl(configured);
  }

  if (originFromServer) return originFromServer;
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.NODE_ENV === "production") return "";

  return normalizeBaseUrl(DEFAULT_CRM_URL);
}

/** True when marketing and CRM run on different origins (e.g. :3000 vs :8080). */
export function isExternalCrmDeployment(marketingOrigin: string): boolean {
  const crmBase = resolveCrmBaseUrl(marketingOrigin);
  if (!crmBase) return false;
  const crmOrigin = crmOriginFromBase(crmBase);
  return Boolean(crmOrigin && crmOrigin !== marketingOrigin);
}

/** Maps old Next.js CRM paths to legacy `/app/*` routes. */
const NEXT_TO_LEGACY: Record<string, string> = {
  "/dashboard": "/app",
  "/leads": "/app/leads",
  "/sales": "/app/leads",
  "/admin": "/app/leads",
  "/calls": "/app/calls",
  "/bookings": "/app/bookings",
  "/payments": "/app/payments",
  "/finance": "/app/finance",
  "/team": "/app/team",
  "/admin-ops": "/app/admin",
};

export function getCrmBaseUrl(): string {
  return resolveCrmBaseUrl();
}

export function mapNextPathToLegacy(nextPath: string): string {
  const path = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  if (path.startsWith("/app")) return path;
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
