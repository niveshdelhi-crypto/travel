import type { AxiosError, AxiosRequestConfig } from "axios";
import { apiConfig } from "./config";

export type RetriableConfig = AxiosRequestConfig & {
  retry?: number;
  retryDelayMs?: number;
  __retryCount?: number;
};

const IDEMPOTENT_METHODS = new Set(["get", "head", "options"]);

export function shouldRetryRequest(error: AxiosError) {
  const config = error.config as RetriableConfig | undefined;
  if (!config) return false;

  const maxRetries = config.retry ?? apiConfig.retryAttempts;
  const currentRetries = config.__retryCount ?? 0;
  if (currentRetries >= maxRetries) return false;

  const method = (config.method ?? "get").toLowerCase();
  const status = error.response?.status ?? 0;
  const networkFailure = !error.response;
  const serverFailure = status >= 500 && status < 600;
  const rateLimited = status === 429;

  return IDEMPOTENT_METHODS.has(method) && (networkFailure || serverFailure || rateLimited);
}

export async function waitForRetry(config: RetriableConfig) {
  const retryCount = config.__retryCount ?? 0;
  const baseDelay = config.retryDelayMs ?? apiConfig.retryDelayMs;
  const jitter = Math.floor(Math.random() * 100);
  const delay = baseDelay * 2 ** retryCount + jitter;

  await new Promise((resolve) => setTimeout(resolve, delay));
}
