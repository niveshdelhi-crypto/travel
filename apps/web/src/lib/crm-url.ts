/** Legacy Book my Carz CRM (Vite + TanStack Router). Marketing site links here for all staff workflows. */
export const DEFAULT_CRM_URL = "http://localhost:8080";

const LOCALHOST_URL_RE = /(localhost|127\.0\.0\.1)(:\d+)?/i;

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function resolveCrmBaseUrlFromEnvOrOrigin(originFromServer?: string): string {
  const raw = process.env.NEXT_PUBLIC_CRM_URL;

  if (raw) {
    const normalized = normalizeBaseUrl(raw);

    // If env is accidentally pointed at localhost in production, prefer same-origin / relative URLs.
    if (LOCALHOST_URL_RE.test(normalized)) {
      if (typeof window !== "undefined") return window.location.origin;
      if (originFromServer) return originFromServer;
      if (process.env.NODE_ENV === "production") return "";
      return normalized;
    }

    return normalized;
  }

  // No env var set: use same-origin when possible.
  if (typeof window !== "undefined") return window.location.origin;
  if (originFromServer) return originFromServer;
  if (process.env.NODE_ENV === "production") return "";

  return normalizeBaseUrl(DEFAULT_CRM_URL);
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
  "/team": "/app/team",
  "/admin-ops": "/app/admin",
};

export function resolveCrmBaseUrl(originFromServer?: string): string {
  return resolveCrmBaseUrlFromEnvOrOrigin(originFromServer);
}

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
