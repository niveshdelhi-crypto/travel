"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authService } from "@/services/auth.service";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const next = searchParams.get("next");
  const requestedPath = next?.startsWith("/") ? next : "/app";

  function isBlockedForSalesAgent(path: string): boolean {
    return (
      path.startsWith("/leads") ||
      path.startsWith("/bookings") ||
      path.startsWith("/payments") ||
      path.startsWith("/finance") ||
      path.startsWith("/checkout-console") ||
      path.startsWith("/analytics") ||
      path.startsWith("/admin")
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await authService.login({ email: email.trim(), password });
      const roleDefault = result.user.role === "admin" ? "/dashboard" : "/sales";
      const rawTarget = requestedPath === "/app" ? roleDefault : requestedPath;
      const targetAfterLogin =
        result.user.role === "sales_agent" && isBlockedForSalesAgent(rawTarget)
          ? roleDefault
          : rawTarget;
      window.location.replace(targetAfterLogin);
    } catch {
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold text-foreground">Staff login</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sign in to access the operations panel.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm text-foreground">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            className="mt-1.5 block h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none ring-0 focus:border-primary/60"
          />
        </label>
        <label className="block">
          <span className="text-sm text-foreground">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
            className="mt-1.5 block h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none ring-0 focus:border-primary/60"
          />
        </label>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
