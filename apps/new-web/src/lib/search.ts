// Search payload + submission helper.
// On success we redirect to /results with the query in the URL.

export type SearchPayload = {
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  driverAge: string;
  residency: string;
};

export function buildResultsHref(p: SearchPayload) {
  const params = new URLSearchParams(p as unknown as Record<string, string>);
  return `/results?${params.toString()}`;
}

export async function submitLead(p: SearchPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/leads/public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "web_search", ...p }),
    });
    if (!res.ok && res.status !== 404) {
      // 404 is acceptable in dev when backend not wired — let user continue.
      return { ok: false, error: `Request failed (${res.status})` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
