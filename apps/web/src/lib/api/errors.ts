import axios, { AxiosError } from "axios";
import type { ApiErrorCode, ApiErrorPayload } from "./types";

export class ApiError extends Error {
  status: number;
  code: ApiErrorCode;
  details?: unknown;
  requestId?: string;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.status = payload.status;
    this.code = payload.code;
    this.details = payload.details;
    this.requestId = payload.requestId;
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (!axios.isAxiosError(error)) {
    return new ApiError({
      status: 0,
      code: "UNKNOWN",
      message: error instanceof Error ? error.message : "An unexpected error occurred.",
    });
  }

  if (error.code === AxiosError.ETIMEDOUT || error.code === "ECONNABORTED") {
    return new ApiError({
      status: 408,
      code: "TIMEOUT",
      message: "The request timed out. Please try again.",
    });
  }

  if (!error.response) {
    return new ApiError({
      status: 0,
      code: "NETWORK_ERROR",
      message: "Unable to reach MarkleTravelBooking services. Check your connection and try again.",
    });
  }

  const status = error.response.status;
  const data = error.response.data as Record<string, unknown> | string | undefined;
  const message = extractMessage(data) ?? fallbackMessage(status);

  return new ApiError({
    status,
    code: codeFromStatus(status),
    message,
    details: typeof data === "object" ? data : undefined,
    requestId: error.response.headers["x-request-id"] as string | undefined,
  });
}

function extractMessage(data: Record<string, unknown> | string | undefined) {
  if (typeof data === "string") return data;
  if (typeof data?.message === "string") return data.message;
  if (Array.isArray(data?.message)) return data.message.join(", ");
  return null;
}

function codeFromStatus(status: number): ApiErrorCode {
  if (status === 400) return "BAD_REQUEST";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 422) return "VALIDATION_ERROR";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "SERVER_ERROR";
  return "UNKNOWN";
}

function fallbackMessage(status: number) {
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 404) return "The requested resource was not found.";
  if (status === 429) return "Too many requests. Please wait and try again.";
  if (status >= 500) return "MarkleTravelBooking services are temporarily unavailable.";
  return "An unexpected API error occurred.";
}
