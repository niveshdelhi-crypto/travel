import { requireAuth } from "@/lib/auth/server";

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Signed in as {user.name}</p>
    </main>
  );
}
