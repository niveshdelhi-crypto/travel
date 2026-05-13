import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Unauthorized</h1>
      <p>Your account does not have permission to access this area.</p>
      <Link href="/dashboard">Back to dashboard</Link>
    </main>
  );
}
