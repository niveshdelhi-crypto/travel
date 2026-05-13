import type { CookieOptions } from "express";

type CookieConfig = {
  nodeEnv: string;
  domain?: string;
  accessTtlSeconds: number;
  refreshTtlDays: number;
};

function baseCookie(config: CookieConfig): CookieOptions {
  return {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax",
    domain: config.domain || undefined,
  };
}

export function accessCookieOptions(config: CookieConfig): CookieOptions {
  return {
    ...baseCookie(config),
    path: "/",
    maxAge: config.accessTtlSeconds * 1000,
  };
}

export function refreshCookieOptions(config: CookieConfig): CookieOptions {
  return {
    ...baseCookie(config),
    path: "/api/auth",
    maxAge: config.refreshTtlDays * 24 * 60 * 60 * 1000,
  };
}

export function csrfCookieOptions(config: Pick<CookieConfig, "nodeEnv" | "domain">): CookieOptions {
  return {
    httpOnly: false,
    secure: config.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
    domain: config.domain || undefined,
  };
}
