/**
 * Verifies GET /api/payments/gateway-health returns real PayPal probe fields.
 * Usage: node scripts/verify-paypal-gateway-health.mjs [--base http://127.0.0.1:4000]
 */
const base = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "http://127.0.0.1:4000";

const api = `${base.replace(/\/$/, "")}/api`;

async function login() {
  const res = await fetch(`${api}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      email: process.env.SMOKE_ADMIN_EMAIL ?? "admin@bookmycarz.com",
      password: process.env.SMOKE_ADMIN_PASSWORD ?? "Admin@123",
    }),
  });
  const cookies = res.headers.getSetCookie?.() ?? [];
  const cookieHeader = cookies.map((c) => c.split(";")[0]).join("; ");
  if (!res.ok) throw new Error(`Login failed ${res.status}`);
  return cookieHeader;
}

async function main() {
  const cookie = await login();
  const res = await fetch(`${api}/payments/gateway-health`, {
    headers: { Cookie: cookie },
  });
  const body = await res.json();
  if (!res.ok) {
    console.error("gateway-health failed", res.status, body);
    process.exit(1);
  }

  const paypal = body.data?.find((g) => g.gateway_type === "paypal");
  if (!paypal) {
    console.error("No PayPal gateway in response");
    process.exit(1);
  }

  const required = [
    "gateway_name",
    "status",
    "environment",
    "oauth_valid",
    "orders_api",
    "capture_api",
    "last_successful_charge",
    "last_failed_charge",
  ];
  for (const key of required) {
    if (!(key in paypal)) {
      console.error(`Missing field: ${key}`);
      process.exit(1);
    }
  }

  if (!paypal.oauth_valid) {
    console.error("PayPal OAuth probe failed:", paypal.detail ?? paypal);
    process.exit(1);
  }

  console.log(JSON.stringify({ ok: true, paypal }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
