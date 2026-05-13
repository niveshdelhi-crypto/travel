"use client";

import Cookies from "js-cookie";
import { apiConfig } from "./config";

let csrfPromise: Promise<string> | null = null;

export function getCsrfToken() {
  return Cookies.get(apiConfig.csrfCookieName) ?? "";
}

export async function ensureCsrfToken() {
  const existingToken = getCsrfToken();
  if (existingToken) return existingToken;

  csrfPromise ??= fetch(`${apiConfig.baseURL}/auth/csrf`, {
    credentials: "include",
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(await response.text());
      const body = (await response.json()) as { csrfToken: string };
      return body.csrfToken;
    })
    .finally(() => {
      csrfPromise = null;
    });

  return csrfPromise;
}

export function isMutatingMethod(method?: string) {
  return ["post", "put", "patch", "delete"].includes((method ?? "get").toLowerCase());
}
