"use client";

import { apiRequest, ensureCsrfToken } from "@/lib/api";
import {
  persistTokensFromAuthResponse,
  clearStoredAuthTokens,
  getStoredRefreshToken,
} from "@/lib/api/token-store";
import type { AuthResponse, AuthUser, LoginInput } from "@/lib/auth/types";

export const authService = {
  ensureCsrfToken,

  async login(input: LoginInput) {
    await ensureCsrfToken();
    const data = await apiRequest<AuthResponse>({
      url: "/auth/login",
      method: "POST",
      data: input,
      skipAuthRefresh: true,
    });
    persistTokensFromAuthResponse(data);
    return data;
  },

  async logout() {
    try {
      await apiRequest<{ success: true }>({
        url: "/auth/logout",
        method: "POST",
        skipAuthRefresh: true,
      });
    } finally {
      clearStoredAuthTokens();
    }
  },

  async refreshSession() {
    await ensureCsrfToken();
    const refresh = typeof window !== "undefined" ? getStoredRefreshToken() : null;
    const data = await apiRequest<AuthResponse>({
      url: "/auth/refresh",
      method: "POST",
      ...(refresh ? { data: { refresh_token: refresh } } : {}),
      skipAuthRefresh: true,
    });
    persistTokensFromAuthResponse(data);
    return data;
  },

  async getCurrentUser() {
    try {
      return await apiRequest<AuthUser>({
        url: "/auth/me",
        method: "GET",
        skipAuthRefresh: true,
      });
    } catch (error) {
      if (error instanceof Error && "status" in error && error.status === 401) return null;
      throw error;
    }
  },
};
