import { NextRequest, NextResponse } from "next/server";
import { mapNextPathToLegacy, resolveCrmBaseUrl } from "./src/lib/crm-url";

/** Next.js CRM routes are retired — staff always use the legacy CRM app. */
const legacyRedirectPrefixes = [
  "/login",
  "/dashboard",
  "/leads",
  "/sales",
  "/admin",
  "/calls",
  "/bookings",
  "/payments",
  "/team",
  "/admin-ops",
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const shouldRedirect = legacyRedirectPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!shouldRedirect) return NextResponse.next();

  // Prefer same-origin in production (avoid accidental `localhost:8080` env values).
  const crmBaseUrl = resolveCrmBaseUrl(request.nextUrl.origin);

  if (pathname === "/login" || pathname.startsWith("/login/")) {
    const next = request.nextUrl.searchParams.get("next");
    const redirectPath = mapNextPathToLegacy(next ?? "/app");
    const loginUrl = `${crmBaseUrl}/login?redirect=${encodeURIComponent(redirectPath)}`;
    return NextResponse.redirect(loginUrl);
  }

  const legacyPath = mapNextPathToLegacy(pathname);
  return NextResponse.redirect(`${crmBaseUrl}${legacyPath}`);
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/leads/:path*",
    "/sales/:path*",
    "/admin/:path*",
    "/calls/:path*",
    "/bookings/:path*",
    "/payments/:path*",
    "/team/:path*",
    "/admin-ops/:path*",
  ],
};
