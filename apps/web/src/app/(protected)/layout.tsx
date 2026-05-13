import { requireAuth } from "@/lib/auth/server";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  return children;
}
