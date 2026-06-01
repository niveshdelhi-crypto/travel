import { NextRequest, NextResponse } from "next/server";
import { isExternalCrmDeployment, mapNextPathToLegacy, resolveCrmBaseUrl } from "./src/lib/crm-url";

/** Staff CRM lives on the Vite app (`NEXT_PUBLIC_CRM_URL`). Marketing must not host these routes. */
const staffRoutePrefixes = [
  "/login",
  "/app",
  "/dashboard",
  "/leads",
  "/sales",
  "/admin",
  "/calls",
  "/bookings",
  "/payments",
  "/finance",
  "/team",
  "/admin-ops",
  "/checkout-console",
  "/workspace",
];

function matchesStaffRoute(pathname: string): boolean {
  return staffRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!matchesStaffRoute(pathname)) return NextResponse.next();

  const marketingOrigin = request.nextUrl.origin;
  if (!isExternalCrmDeployment(marketingOrigin)) {
    return NextResponse.next();
  }

  const crmBaseUrl = resolveCrmBaseUrl(marketingOrigin);

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
    "/app",
    "/app/:path*",
    "/dashboard/:path*",
    "/leads/:path*",
    "/sales/:path*",
    "/admin/:path*",
    "/calls/:path*",
    "/bookings/:path*",
    "/payments/:path*",
    "/finance/:path*",
    "/team/:path*",
    "/admin-ops/:path*",
    "/checkout-console/:path*",
    "/workspace/:path*",
  ],
};
