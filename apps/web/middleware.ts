import { NextRequest, NextResponse } from "next/server";
import { getLegacyCrmLoginUrl, getLegacyCrmUrl, mapNextPathToLegacy } from "./src/lib/crm-url";

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

  if (pathname === "/login" || pathname.startsWith("/login/")) {
    const next = request.nextUrl.searchParams.get("next");
    return NextResponse.redirect(getLegacyCrmLoginUrl(next));
  }

  const legacyPath = mapNextPathToLegacy(pathname);
  return NextResponse.redirect(getLegacyCrmUrl(legacyPath));
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
