"use client";

import { apiConfig } from "./config";

export type AccessTokenProvider = () => string | null | Promise<string | null>;

let accessTokenProvider: AccessTokenProvider | null = null;

export function setAccessTokenProvider(provider: AccessTokenProvider | null) {
  accessTokenProvider = provider;
}

export async function getAccessToken() {
  if (accessTokenProvider) return accessTokenProvider();

  try {
    return window.localStorage.getItem(apiConfig.accessTokenStorageKey);
  } catch {
    return null;
  }
}

export function setStoredAccessToken(token: string | null) {
  try {
    if (token) {
      window.localStorage.setItem(apiConfig.accessTokenStorageKey, token);
    } else {
      window.localStorage.removeItem(apiConfig.accessTokenStorageKey);
    }
  } catch {
    // Browser storage can be unavailable in private contexts. Cookie auth still works.
  }
}
