import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthUser, UserRole } from "./types";

const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://localhost:4000/api";

export async function getServerSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();

  try {
    const response = await fetch(`${API_INTERNAL_URL}/auth/me`, {
      cache: "no-store",
      headers: {
        Cookie: cookieStore.toString(),
      },
    });

    if (response.status === 401) return null;
    if (!response.ok) throw new Error(await response.text());
    return response.json() as Promise<AuthUser>;
  } catch {
    return null;
  }
}

export async function requireAuth(roles?: UserRole[]) {
  const user = await getServerSession();

  if (!user) redirect("/login");
  if (roles?.length && !roles.includes(user.role)) redirect("/unauthorized");

  return user;
}
