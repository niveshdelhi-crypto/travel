import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthUser, UserRole } from "./types";

const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://localhost:4000/api";
const SESSION_FETCH_TIMEOUT_MS = Number.parseInt(
  process.env.AUTH_SESSION_TIMEOUT_MS ?? "2000",
  10,
);

export async function getServerSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  if (!cookieHeader.includes("access_token=")) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SESSION_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_INTERNAL_URL}/auth/me`, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (response.status === 401) return null;
    if (!response.ok) throw new Error(await response.text());
    return response.json() as Promise<AuthUser>;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function requireAuth(roles?: UserRole[]) {
  const user = await getServerSession();

  if (!user) redirect("/login");
  if (roles?.length && !roles.includes(user.role)) redirect("/unauthorized");

  return user;
}
