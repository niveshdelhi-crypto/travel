export const apiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
  timeoutMs: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 30_000),
  retryAttempts: Number(process.env.NEXT_PUBLIC_API_RETRY_ATTEMPTS ?? 2),
  retryDelayMs: Number(process.env.NEXT_PUBLIC_API_RETRY_DELAY_MS ?? 450),
  csrfCookieName: process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME ?? "csrf_token",
  csrfHeaderName: process.env.NEXT_PUBLIC_CSRF_HEADER_NAME ?? "X-CSRF-Token",
  accessTokenStorageKey: process.env.NEXT_PUBLIC_ACCESS_TOKEN_KEY ?? "fleetnexus_access_token",
} as const;
