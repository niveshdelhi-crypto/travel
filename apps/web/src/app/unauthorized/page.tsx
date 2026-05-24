import { getLegacyCrmUrl } from "@/lib/crm-url";

export default function UnauthorizedPage() {
  const crmHome = getLegacyCrmUrl("/app");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Unauthorized</h1>
      <p>Your account does not have permission to access this area.</p>
      <a href={crmHome} className="text-sm font-medium text-sky-700 hover:underline">
        Open Book my Carz CRM
      </a>
    </main>
  );
}
