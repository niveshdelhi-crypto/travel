import { requireAuth } from "@/lib/auth/server";

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <main className="p-6 md:p-10">
      <div className="mx-auto max-w-lg rounded-2xl border border-[#d7dde8] bg-white p-10 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#637083]">Operations</p>
        <h1 className="mt-2 text-2xl font-semibold text-[#172033]">Dashboard</h1>
        <p className="mt-4 text-[#637083]">Module under development</p>
        <p className="mt-2 text-sm text-[#637083]">
          Signed in as <span className="font-medium text-[#172033]">{user.name}</span>
        </p>
        <p className="mt-6 text-xs text-[#637083]">
          Sales and admin lead desks are available from the navigation menu.
        </p>
      </div>
    </main>
  );
}
