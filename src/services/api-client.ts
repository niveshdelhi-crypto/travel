// ============================================================
// Book my Carz — API Client
// Scalable API abstraction with interceptors, retry logic,
// token refresh, and error normalisation
// ============================================================

import type { ApiError } from "@/types";
import { API_BASE_URL, API_TIMEOUT_MS, API_RETRY_ATTEMPTS, API_RETRY_DELAY_MS, STORAGE_KEYS } from "@/constants";

// ─── Request Config ───────────────────────────────────────────

export interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
  retries?: number;
  timeout?: number;
  debugLabel?: string;
}

// ─── Error normalisation ─────────────────────────────────────

export function normaliseApiError(res: Response, body: unknown): ApiError {
  const data = body as Record<string, unknown>;
  return {
    status: res.status,
    message:
      typeof data?.message === "string"
        ? data.message
        : Array.isArray(data?.message)
        ? data.message.join(", ")
        : res.statusText || "An unexpected error occurred",
    code:
      typeof data?.code === "string"
        ? data.code
        : typeof data?.error === "string"
          ? data.error
          : undefined,
    details: typeof data?.details === "object" && data.details != null
      ? (data.details as Record<string, string>)
      : undefined,
  };
}

// ─── Token helpers ────────────────────────────────────────────

function getAccessToken(): string | null {
  try { return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN); }
  catch { return null; }
}

function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch {
    return null;
  }
}

function setTokens(access: string, refresh: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, access);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
  } catch { /* noop */ }
}

function clearTokens(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  } catch { /* noop */ }
}

/** Persist tokens returned in JSON (HttpOnly cookies may not stick when the SPA is on a different host than the API). */
export function extractAndStoreAuthTokens(body: unknown): void {
  if (!body || typeof body !== "object") return;
  const o = body as Record<string, unknown>;
  const a = o.accessToken;
  const r = o.refreshToken;
  if (typeof a === "string" && typeof r === "string" && a.length > 0 && r.length > 0) {
    setTokens(a, r);
  }
}

export function clearStoredAuthCredentials(): void {
  clearTokens();
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function ensureCsrfToken(): Promise<string | null> {
  const existing = getCookie("csrf_token");
  if (existing) return existing;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/csrf`, {
      method: "GET",
      credentials: "include",
      headers: { "Accept": "application/json", "X-Client": "bookmycarz-web/1.0" },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { csrfToken?: string };
    return body.csrfToken ?? getCookie("csrf_token");
  } catch {
    return null;
  }
}

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

async function refreshSession(): Promise<boolean> {
  try {
    const refreshLs = getRefreshToken();
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Client": "bookmycarz-web/1.0",
      },
      credentials: "include",
      ...(refreshLs ? { body: JSON.stringify({ refresh_token: refreshLs }) } : {}),
    });

    if (!res.ok) {
      clearTokens();
      return false;
    }

    const contentType = res.headers.get("content-type") ?? "";
    let body: unknown;
    if (contentType.includes("application/json")) {
      body = await res.json();
    } else {
      body = undefined;
    }
    extractAndStoreAuthTokens(body);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

// ─── Retry logic ─────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** SPA hosts often `/api`-catch-all rewrite to index.html — body is HTML and breaks `.map` on JSON types. */
function looksLikeHtmlResponseBody(body: unknown): boolean {
  if (typeof body !== "string") return false;
  const start = body.trimStart().slice(0, 80).toLowerCase();
  return start.startsWith("<!doctype ") || start.startsWith("<html");
}

// ─── Core fetch wrapper ───────────────────────────────────────

async function request<T>(
  endpoint: string,
  config: RequestConfig = {},
  attempt = 1,
): Promise<T> {
  const {
    params,
    skipAuth = false,
    retries = API_RETRY_ATTEMPTS,
    timeout = API_TIMEOUT_MS,
    headers: configHeaders = {},
    debugLabel,
    ...rest
  } = config;

  // Build URL with query params
  const baseURL =
    typeof window !== "undefined" && API_BASE_URL.startsWith("/")
      ? window.location.origin
      : undefined;
  const url = new URL(`${API_BASE_URL}${endpoint}`, baseURL);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Client": "bookmycarz-web/1.0",
    ...(configHeaders as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const method = (rest.method ?? "GET").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
  }

  // Abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    console.debug("[Book my Carz API] request", {
      method: rest.method ?? "GET",
      endpoint,
      url: url.toString(),
      attempt,
      debugLabel,
    });

    const res = await fetch(url.toString(), {
      ...rest,
      headers,
      signal: controller.signal,
      credentials: rest.credentials ?? "include",
    });

    clearTimeout(timeoutId);
    console.debug("[Book my Carz API] response", {
      method: rest.method ?? "GET",
      endpoint,
      status: res.status,
      ok: res.ok,
      requestId: res.headers.get("x-request-id"),
      debugLabel,
    });

    // Handle 401 — attempt token refresh once
    if (res.status === 401 && !skipAuth && endpoint !== "/auth/refresh" && attempt === 1) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshSession().then((ok) => {
          refreshQueue.forEach((cb) => cb(ok ? "cookie-session" : null));
          refreshQueue = [];
          isRefreshing = false;
        });
      }

      return new Promise<T>((resolve, reject) => {
        refreshQueue.push(async (newToken) => {
          if (!newToken) {
            reject({ status: 401, message: "Session expired. Please sign in again." } as ApiError);
            return;
          }
          try {
            resolve(await request<T>(endpoint, config, 2));
          } catch (e) {
            reject(e);
          }
        });
      });
    }

    // Parse response
    let body: unknown;
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      body = await res.json();
    } else {
      body = await res.text();
    }

    if (!res.ok) {
      const apiError = normaliseApiError(res, body);

      // Retry on 5xx or network errors
      const shouldRetry = res.status >= 500 && attempt < retries;
      if (shouldRetry) {
        await sleep(API_RETRY_DELAY_MS * attempt);
        return request<T>(endpoint, config, attempt + 1);
      }

      throw apiError;
    }

    if (looksLikeHtmlResponseBody(body)) {
      console.error("[Book my Carz API] Unexpected HTML payload (misrouted SPA or wrong base URL)", {
        endpoint,
        debugLabel,
        preview: typeof body === "string" ? body.slice(0, 120).replace(/\s+/g, " ") : "",
      });
      throw {
        status: 502,
        message:
          `API returned HTML instead of JSON for "${endpoint}". On Vercel, add an /api rewrite to your Nest server or set VITE_API_BASE_URL to the full API origin.`,
      } as ApiError;
    }

    return body as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    console.error("[Book my Carz API] failure", {
      method: rest.method ?? "GET",
      endpoint,
      attempt,
      debugLabel,
      error: err,
    });

    // Network error retry
    if ((err as { name?: string })?.name === "AbortError") {
      throw { status: 408, message: "Request timed out. Please try again." } as ApiError;
    }

    if (attempt < retries && !(err as ApiError)?.status) {
      await sleep(API_RETRY_DELAY_MS * attempt);
      return request<T>(endpoint, config, attempt + 1);
    }

    throw err;
  }
}

// ─── Typed HTTP methods ───────────────────────────────────────

export const apiClient = {
  get<T>(endpoint: string, config?: RequestConfig) {
    return request<T>(endpoint, { ...config, method: "GET" });
  },

  post<T>(endpoint: string, body?: unknown, config?: RequestConfig) {
    return request<T>(endpoint, {
      ...config,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(endpoint: string, body?: unknown, config?: RequestConfig) {
    return request<T>(endpoint, {
      ...config,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(endpoint: string, body?: unknown, config?: RequestConfig) {
    return request<T>(endpoint, {
      ...config,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string, config?: RequestConfig) {
    return request<T>(endpoint, { ...config, method: "DELETE" });
  },
};

export type ApiClient = typeof apiClient;
