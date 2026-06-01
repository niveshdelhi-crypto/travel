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
  const domain = config.domain?.trim();
  // Avoid misconfigured localhost scoping in production (cookies would never be sent to the real domain).
  const normalizedDomain =
    domain && domain.toLowerCase() !== "localhost" && domain !== "127.0.0.1" && domain !== "::1" ? domain : undefined;
  return {
    httpOnly: true,
    secure: sameSite === "none" ? true : production,
    sameSite,
    domain: normalizedDomain,
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
