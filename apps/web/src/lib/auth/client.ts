"use client";

import { authService } from "@/services/auth.service";
import type { LoginInput } from "./types";

export async function ensureCsrfToken() {
  return authService.ensureCsrfToken();
}

export async function login(input: LoginInput) {
  return authService.login(input);
}

export async function logout() {
  return authService.logout();
}

export async function refreshSession() {
  return authService.refreshSession();
}

export async function getCurrentUser() {
  return authService.getCurrentUser();
}
