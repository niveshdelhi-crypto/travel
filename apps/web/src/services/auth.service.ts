"use client";

import { apiRequest, ensureCsrfToken } from "@/lib/api";
import type { AuthResponse, AuthUser, LoginInput } from "@/lib/auth/types";

export const authService = {
  ensureCsrfToken,

  async login(input: LoginInput) {
    await ensureCsrfToken();
    return apiRequest<AuthResponse>({
      url: "/auth/login",
      method: "POST",
      data: input,
      skipAuthRefresh: true,
    });
  },

  logout() {
    return apiRequest<{ success: true }>({
      url: "/auth/logout",
      method: "POST",
      skipAuthRefresh: true,
    });
  },

  async refreshSession() {
    await ensureCsrfToken();
    return apiRequest<AuthResponse>({
      url: "/auth/refresh",
      method: "POST",
      skipAuthRefresh: true,
    });
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
