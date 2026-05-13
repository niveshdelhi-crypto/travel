import type { AxiosRequestConfig } from "axios";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "UNKNOWN";

export type ApiErrorPayload = {
  status: number;
  code: ApiErrorCode;
  message: string;
  details?: unknown;
  requestId?: string;
};

export type ApiRequestOptions = AxiosRequestConfig & {
  skipAuthRefresh?: boolean;
  skipCsrf?: boolean;
  retry?: number;
  retryDelayMs?: number;
  __isRetryRequest?: boolean;
};

export type PaginatedResponse<T> = {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
};
