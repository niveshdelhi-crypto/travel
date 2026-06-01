const CLARITY_ID = import.meta.env.VITE_CLARITY_ID ?? "wzyjmfmsgt";

let initialized = false;

/** Microsoft Clarity session replay & heatmaps for the CRM SPA. */
export function initMicrosoftClarity(): void {
  if (initialized || typeof window === "undefined" || !CLARITY_ID) {
    return;
  }

  initialized = true;

  (function (c: Window, l: Document, a: string, r: string, i: string) {
    type ClarityFn = { (...args: unknown[]): void; q?: unknown[] };
    const w = c as Window & Record<string, ClarityFn | undefined>;
    w[a] =
      w[a] ||
      function (...args: unknown[]) {
        (w[a]!.q = w[a]!.q || []).push(args);
      };
    const t = l.createElement(r) as HTMLScriptElement;
    t.async = true;
    t.src = `https://www.clarity.ms/tag/${i}`;
    const y = l.getElementsByTagName(r)[0];
    y.parentNode?.insertBefore(t, y);
  })(window, document, "clarity", "script", CLARITY_ID);
}
