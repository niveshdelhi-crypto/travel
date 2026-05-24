"use client";

import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { apiConfig } from "./config";
import { ensureCsrfToken, getCsrfToken, isMutatingMethod } from "./csrf";
import { normalizeApiError } from "./errors";
import { shouldRetryRequest, waitForRetry, type RetriableConfig } from "./retry";
import {
  getAccessToken,
  getStoredRefreshToken,
  persistTokensFromAuthResponse,
} from "./token-store";
import type { ApiRequestOptions } from "./types";
import type { AuthResponse } from "@/lib/auth/types";

type BookMyCarzRequestConfig = InternalAxiosRequestConfig & ApiRequestOptions & RetriableConfig;

let refreshPromise: Promise<void> | null = null;

export const apiClient: AxiosInstance = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeoutMs,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Client": "bookmycarz-next/1.0",
  },
});

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const requestConfig = config as BookMyCarzRequestConfig;
  const token = await getAccessToken();

  if (token) requestConfig.headers.Authorization = `Bearer ${token}`;

  if (!requestConfig.skipCsrf && isMutatingMethod(requestConfig.method)) {
    const csrfToken = getCsrfToken() || (await ensureCsrfToken());
    if (csrfToken) requestConfig.headers[apiConfig.csrfHeaderName] = csrfToken;
  }

  return requestConfig;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as BookMyCarzRequestConfig | undefined;

    if (
      error.response?.status === 401 &&
      config &&
      !config.skipAuthRefresh &&
      !config.__isRetryRequest
    ) {
      config.__isRetryRequest = true;

      try {
        refreshPromise ??= refreshSessionRequest().finally(() => {
          refreshPromise = null;
        });
        await refreshPromise;
        return apiClient(config);
      } catch (refreshError) {
        throw normalizeApiError(refreshError);
      }
    }

    if (shouldRetryRequest(error)) {
      const retryConfig = config as BookMyCarzRequestConfig;
      retryConfig.__retryCount = (retryConfig.__retryCount ?? 0) + 1;
      await waitForRetry(retryConfig);
      return apiClient(retryConfig);
    }

    throw normalizeApiError(error);
  },
);

export async function apiRequest<T>(config: ApiRequestOptions): Promise<T> {
  const response = await apiClient.request<T>(config);
  return response.data;
}

async function refreshSessionRequest() {
  await ensureCsrfToken();
  const refresh = typeof window !== "undefined" ? getStoredRefreshToken() : null;
  const { data } = await apiClient.post<AuthResponse>(
    "/auth/refresh",
    refresh ? { refresh_token: refresh } : {},
    {
      skipAuthRefresh: true,
    } satisfies ApiRequestOptions,
  );
  persistTokensFromAuthResponse(data);
}
