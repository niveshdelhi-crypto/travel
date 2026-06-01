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
    window.location.replace(getLegacyCrmLoginUrl(next));
  }, [searchParams]);

  return <RedirectFallback />;
}

function RedirectFallback() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm items-center justify-center px-6">
      <p className="text-sm text-muted-foreground">
        Opening Book my Carz staff panel…
      </p>
    </main>
  );
}
