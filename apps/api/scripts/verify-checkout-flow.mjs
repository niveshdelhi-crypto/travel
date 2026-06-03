/**
 * End-to-end checkout flow verification (finance admin).
 * Usage: node scripts/verify-checkout-flow.mjs [--session <uuid>]
 */
const base = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "http://127.0.0.1:4000";

const api = `${base.replace(/\/$/, "")}/api`;
const sessionArg = process.argv.includes("--session")
  ? process.argv[process.argv.indexOf("--session") + 1]
  : null;

async function login() {
  const res = await fetch(`${api}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.SMOKE_ADMIN_EMAIL ?? "admin@markletravelbooking.com",
      password: process.env.SMOKE_ADMIN_PASSWORD ?? "Admin@123",
    }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookieHeader = setCookie.map((c) => c.split(";")[0]).join("; ");
  const csrf =
    setCookie.find((c) => c.startsWith("csrf_token="))?.split(";")[0]?.split("=")[1] ??
    (await res.json().catch(() => ({})))?.csrfToken ??
    "";
  if (!res.ok) throw new Error(`Login failed ${res.status}`);
  if (!csrf) throw new Error("Missing CSRF token from login");
  return { cookieHeader, csrf };
}

async function apiCall(cookie, csrf, path, options = {}) {
  const res = await fetch(`${api}${path}`, {
    ...options,
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
      "X-CSRF-Token": csrf,
      ...(options.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}

async function main() {
  const { cookieHeader, csrf } = await login();

  let sessionId = sessionArg;
  if (!sessionId) {
    const queue = await apiCall(cookieHeader, csrf, "/payment-sessions/queue");
    if (!queue.ok) throw new Error(`Queue failed ${queue.status}: ${JSON.stringify(queue.body)}`);
    const pending = queue.body.find((s) => s.status === "PENDING") ?? queue.body[0];
    if (!pending) throw new Error("No payment sessions in queue — run npm run seed:payment-queue");
    sessionId = pending.id;
  }

  const steps = [];

  const sessionRes = await apiCall(cookieHeader, csrf, `/payment-sessions/${sessionId}`);
  steps.push({ step: "get_session", ok: sessionRes.ok, status: sessionRes.body?.status });

  let status = sessionRes.body?.status;

  if (status === "PENDING") {
    const start = await apiCall(cookieHeader, csrf, `/payment-sessions/${sessionId}/start`, {
      method: "POST",
      body: "{}",
    });
    steps.push({ step: "start", ok: start.ok, status: start.body?.status, error: start.body?.message });
    status = start.body?.status;
  }

  const config = await apiCall(cookieHeader, csrf, `/payment-sessions/${sessionId}/checkout-config`);
  steps.push({
    step: "checkout_config",
    ok: config.ok,
    supported: config.body?.checkout?.supported,
    checkoutMode: config.body?.checkout?.checkoutMode,
    hasClientId: Boolean(config.body?.checkout?.clientId),
    message: config.body?.checkout?.message,
  });

  if (status === "PROCESSING" && config.body?.checkout?.supported) {
    const order = await apiCall(cookieHeader, csrf, `/payment-sessions/${sessionId}/checkout/create-order`, {
      method: "POST",
      body: "{}",
    });
    steps.push({
      step: "create_order",
      ok: order.ok,
      order_id: order.body?.order_id,
      error: order.body?.message,
    });
  }

  const passed = steps.every((s) => s.ok !== false);
  console.log(JSON.stringify({ ok: passed, sessionId, steps }, null, 2));
  if (!passed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
