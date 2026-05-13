import type { CookieOptions } from "express";

type SameSiteMode = "lax" | "strict" | "none";

export type CookieConfig = {
  nodeEnv: string;
  domain?: string;
  accessTtlSeconds: number;
  refreshTtlDays: number;
  /** Cross-origin SPA (different site than API): use `"none"` with HTTPS. */
  sameSite?: SameSiteMode;
};

function resolveSameSite(config: Pick<CookieConfig, "sameSite">): SameSiteMode {
  return config.sameSite ?? "lax";
}

function baseCookie(config: CookieConfig): CookieOptions {
  const sameSite = resolveSameSite(config);
  const production = config.nodeEnv === "production";
  return {
    httpOnly: true,
    secure: sameSite === "none" ? true : production,
    sameSite,
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

export function csrfCookieOptions(config: Pick<CookieConfig, "nodeEnv" | "domain" | "sameSite">): CookieOptions {
  const sameSite = resolveSameSite(config);
  const production = config.nodeEnv === "production";
  return {
    httpOnly: false,
    secure: sameSite === "none" ? true : production,
    sameSite,
    path: "/",
    domain: config.domain || undefined,
  };
}
