/** Shared CORS + Socket.IO browser-origin logic (WEB_ORIGIN, FRONTEND_URL, preview helper). */

function commaSplitOrigins(raw: string | undefined): Set<string> {
  return new Set(
    String(raw ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function listedOrigins(env: NodeJS.ProcessEnv): Set<string> {
  const configured =
    env.WEB_ORIGIN?.trim() ||
    env.FRONTEND_URL?.trim() ||
    "http://localhost:8080,http://localhost:3000";
  return commaSplitOrigins(configured);
}

/**
 * Allowed when there is no `Origin` (same-origin tooling, curl) or origin is in WEB_ORIGIN/FRONTEND_URL.
 *
 * **`WEB_ORIGIN_ALLOW_VERCEL_PREVIEW='true'`** — also allow any **`https://*.vercel.app`** host (Preview + Production deployments on *.vercel.app). Do **not** turn this on unless you accept that trade-off.
 */
export function isWebOriginAllowed(origin: string | undefined, env: NodeJS.ProcessEnv = process.env): boolean {
  if (origin === undefined || origin === "") return true;
  if (listedOrigins(env).has(origin)) return true;

  const allowVercel = env.WEB_ORIGIN_ALLOW_VERCEL_PREVIEW?.trim().toLowerCase();
  if (allowVercel !== "true" && allowVercel !== "1") return false;

  try {
    const u = new URL(origin);
    if (u.protocol !== "https:") return false;
    return u.hostname.endsWith(".vercel.app") || u.hostname === "vercel.app";
  } catch {
    return false;
  }
}
