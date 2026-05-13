import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "./src/lib/auth/types";

const protectedRoutes = ["/dashboard", "/sales", "/admin"];
const roleRoutes: Array<{ prefix: string; roles: UserRole[] }> = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/sales", roles: ["admin", "sales_agent"] },
];

type AccessTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
  sid: string;
};

async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload as AccessTokenPayload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requiresAuth = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!requiresAuth) return NextResponse.next();

  const token = request.cookies.get("access_token")?.value;
  const payload = token ? await verifyAccessToken(token) : null;

  if (!payload) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const restrictedRoute = roleRoutes.find((route) => pathname.startsWith(route.prefix));
  if (restrictedRoute && !restrictedRoute.roles.includes(payload.role)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/sales/:path*", "/admin/:path*"],
};
