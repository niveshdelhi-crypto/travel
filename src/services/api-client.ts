// ============================================================
// FleetNexus — API Client
// Scalable API abstraction with interceptors, retry logic,
// token refresh, and error normalisation
// ============================================================

import type { ApiResponse, ApiError } from "@/types";
import { API_BASE_URL, API_TIMEOUT_MS, API_RETRY_ATTEMPTS, API_RETRY_DELAY_MS, STORAGE_KEYS } from "@/constants";

// ─── Request Config ───────────────────────────────────────────

export interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
  retries?: number;
  timeout?: number;
}

// ─── Error normalisation ─────────────────────────────────────

export function normaliseApiError(res: Response, body: unknown): ApiError {
  const data = body as Record<string, unknown>;
  return {
    status: res.status,
    message:
      typeof data?.message === "string"
        ? data.message
        : res.statusText || "An unexpected error occurred",
    code: typeof data?.code === "string" ? data.code : undefined,
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

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const { data } = (await res.json()) as { data: { accessToken: string; refreshToken: string } };
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

// ─── Retry logic ─────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Core fetch wrapper ───────────────────────────────────────

async function request<T>(
  endpoint: string,
  config: RequestConfig = {},
  attempt = 1,
): Promise<ApiResponse<T>> {
  const {
    params,
    skipAuth = false,
    retries = API_RETRY_ATTEMPTS,
    timeout = API_TIMEOUT_MS,
    headers: configHeaders = {},
    ...rest
  } = config;

  // Build URL with query params
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Client": "fleetnexus-web/1.0",
    ...(configHeaders as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  // Abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url.toString(), {
      ...rest,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle 401 — attempt token refresh once
    if (res.status === 401 && !skipAuth && attempt === 1) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshAccessToken().then((token) => {
          refreshQueue.forEach((cb) => cb(token));
          refreshQueue = [];
          isRefreshing = false;
        });
      }

      return new Promise<ApiResponse<T>>((resolve, reject) => {
        refreshQueue.push(async (newToken) => {
          if (!newToken) {
            reject({ status: 401, message: "Session expired. Please sign in again." } as ApiError);
            return;
          }
          try {
            resolve(await request<T>(endpoint, { ...config, headers: { ...configHeaders, Authorization: `Bearer ${newToken}` } }, 2));
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

    return body as ApiResponse<T>;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

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
