"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getLegacyCrmLoginUrl } from "@/lib/crm-url";

export default function LoginPage() {
  return (
    <Suspense fallback={<RedirectFallback />}>
      <LoginRedirect />
    </Suspense>
  );
}

function LoginRedirect() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = searchParams.get("next");
    const target = getLegacyCrmLoginUrl(next);
    const targetUrl = new URL(target, window.location.origin);
    const sameAsCurrent =
      targetUrl.origin === window.location.origin &&
      targetUrl.pathname === window.location.pathname &&
      targetUrl.search === window.location.search;

    if (sameAsCurrent) {
      // Safety guard against accidental self-redirect loops.
      const fallback = next?.startsWith("/app") ? next : "/app";
      window.location.replace(fallback);
      return;
    }

    window.location.replace(targetUrl.toString());
  }, [searchParams]);

  return <RedirectFallback />;
}

function RedirectFallback() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm items-center justify-center px-6">
      <p className="text-sm text-gray-500">Opening Book my Carz CRM…</p>
    </main>
  );
}
