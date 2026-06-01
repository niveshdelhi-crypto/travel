function normalizeClientBaseUrl(envBaseUrl: string | undefined): string {
  const fallback = "/api";
  const raw = (envBaseUrl ?? fallback).trim();

  // We have a Next.js rewrite for `/api/*` in `next.config.mjs`.
  // If someone sets `NEXT_PUBLIC_API_URL` to an absolute API URL (e.g. Render domain),
  // browser requests become cross-origin and can trigger CORS issues.
  // Force the browser to call same-origin `/api/*` instead.
  if (raw === "/api" || raw.startsWith("/api/")) return raw;

  try {
    const u = new URL(raw);
    if (u.pathname === "/api" || u.pathname.startsWith("/api/")) return "/api";
  } catch {
    // If it's not a valid URL, assume it's a relative path and keep it.
  }

  return raw || fallback;
}

export const apiConfig = {
  baseURL: normalizeClientBaseUrl(process.env.NEXT_PUBLIC_API_URL),
  timeoutMs: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 30_000),
  retryAttempts: Number(process.env.NEXT_PUBLIC_API_RETRY_ATTEMPTS ?? 2),
  retryDelayMs: Number(process.env.NEXT_PUBLIC_API_RETRY_DELAY_MS ?? 450),
  csrfCookieName: process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME ?? "csrf_token",
  csrfHeaderName: process.env.NEXT_PUBLIC_CSRF_HEADER_NAME ?? "X-CSRF-Token",
  accessTokenStorageKey: process.env.NEXT_PUBLIC_ACCESS_TOKEN_KEY ?? "bookmycarz_access_token",
  refreshTokenStorageKey: process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY ?? "bookmycarz_refresh_token",
} as const;
