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
  const envCrmUrl = process.env.NEXT_PUBLIC_CRM_URL?.trim();
  const shouldUseLegacyRedirect = Boolean(
    envCrmUrl &&
      !/localhost|127\.0\.0\.1|::1/i.test(envCrmUrl) &&
      resolveCrmBaseUrl(request.nextUrl.origin) !== request.nextUrl.origin,
  );

  if (!shouldUseLegacyRedirect) return NextResponse.next();

  const shouldRedirect = legacyRedirectPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!shouldRedirect) return NextResponse.next();

  const crmBaseUrl = resolveCrmBaseUrl(request.nextUrl.origin);

  if (pathname === "/login" || pathname.startsWith("/login/")) {
    const next = request.nextUrl.searchParams.get("next");
    const redirectPath = mapNextPathToLegacy(next ?? "/app");

    const sameOriginBase = !crmBaseUrl || crmBaseUrl === request.nextUrl.origin;
    if (sameOriginBase) {
      if (redirectPath === pathname) return NextResponse.next();
      return NextResponse.redirect(`${request.nextUrl.origin}${redirectPath}`);
    }

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
