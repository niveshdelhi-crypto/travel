import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

/** Canonical public site lives in apps/web (Next.js). This legacy Vite route forwards there. */
const CANONICAL_WEB_URL =
  import.meta.env.VITE_CANONICAL_WEB_URL ??
  (import.meta.env.DEV ? "http://localhost:3000" : "");

function RedirectToCanonicalWeb() {
  useEffect(() => {
    if (CANONICAL_WEB_URL) {
      window.location.replace(CANONICAL_WEB_URL);
    }
  }, []);

  if (!CANONICAL_WEB_URL) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-center text-slate-200">
        <div className="max-w-md space-y-3">
          <h1 className="text-xl font-semibold">MarkleTravelBooking has moved</h1>
          <p className="text-sm text-slate-400">
            The public marketing site is served from <code className="text-amber-300">apps/web</code>.
            Run <code className="text-amber-300">npm run dev</code> from the repo root or{" "}
            <code className="text-amber-300">apps/web</code>.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 text-slate-300">
      <p className="text-sm">Opening MarkleTravelBooking…</p>
    </main>
  );
}

export const Route = createFileRoute("/")({
  component: RedirectToCanonicalWeb,
});
