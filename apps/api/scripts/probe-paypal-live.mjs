/**
 * Live PayPal credential probe (no charge — capture probe expects ORDER_NOT_APPROVED).
 *
 * Usage:
 *   PAYPAL_LIVE_CLIENT_ID=... PAYPAL_LIVE_CLIENT_SECRET=... node scripts/probe-paypal-live.mjs
 */
const clientId = process.env.PAYPAL_LIVE_CLIENT_ID?.trim();
const clientSecret = process.env.PAYPAL_LIVE_CLIENT_SECRET?.trim();

const CARD_SCOPES = [
  "https://uri.paypal.com/services/payments/payment",
  "https://uri.paypal.com/services/payments",
  "https://uri.paypal.com/services/payments/realtimepayment",
];

if (!clientId || !clientSecret) {
  console.error("Set PAYPAL_LIVE_CLIENT_ID and PAYPAL_LIVE_CLIENT_SECRET");
  process.exit(1);
}

const baseUrl = "https://api-m.paypal.com";

async function oauth() {
  const started = Date.now();
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const body = await res.json();
  return { res, body, latencyMs: Date.now() - started };
}

async function createOrder(accessToken) {
  const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: `probe-${Date.now()}`,
          description: "FleetNexus live credential probe",
          amount: { currency_code: "USD", value: "1.00" },
        },
      ],
    }),
  });
  const body = await res.json();
  return { res, body };
}

async function probeCapture(accessToken, orderId) {
  const res = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  const body = await res.json();
  return { res, body };
}

function cardScopesEligible(scope) {
  const normalized = (scope ?? "").toLowerCase();
  return CARD_SCOPES.some((s) => normalized.includes(s.toLowerCase()));
}

async function main() {
  const report = {
    environment: "live",
    oauth_valid: false,
    oauth_latency_ms: 0,
    orders_api: false,
    capture_api: false,
    card_processing_eligible: false,
    client_id_prefix: `${clientId.slice(0, 8)}…`,
  };

  const { res: oauthRes, body: oauthBody, latencyMs } = await oauth();
  report.oauth_latency_ms = latencyMs;

  if (!oauthRes.ok || !oauthBody.access_token) {
    report.oauth_message =
      oauthBody.error_description ?? oauthBody.error ?? `HTTP ${oauthRes.status}`;
    console.log(JSON.stringify({ ok: false, report }, null, 2));
    process.exit(1);
  }

  report.oauth_valid = true;
  report.oauth_scopes = oauthBody.scope ?? "";
  report.card_processing_eligible = cardScopesEligible(report.oauth_scopes);
  if (!report.card_processing_eligible) {
    report.card_processing_message =
      "OAuth token missing PayPal payments scope for Advanced Card Fields";
  }

  const token = oauthBody.access_token;
  const { res: orderRes, body: orderBody } = await createOrder(token);
  if (orderRes.ok && orderBody.id) {
    report.orders_api = true;
    report.orders_api_message = `Order created (${orderBody.status ?? "CREATED"})`;
    report.order_id = orderBody.id;

    const { res: capRes, body: capBody } = await probeCapture(token, orderBody.id);
    const issue = capBody.details?.[0]?.issue;
    if (capRes.ok) {
      report.capture_api = true;
      report.capture_api_message = "Capture API responded successfully";
    } else if (
      capRes.status === 422 &&
      (issue === "ORDER_NOT_APPROVED" ||
        issue === "PAYER_ACTION_REQUIRED" ||
        capBody.name === "UNPROCESSABLE_ENTITY")
    ) {
      report.capture_api = true;
      report.capture_api_message =
        "Capture API reachable (order not approved — expected, no charge)";
    } else {
      report.capture_api_message =
        capBody.details?.[0]?.description ?? capBody.message ?? `HTTP ${capRes.status}`;
    }
  } else {
    const detail = orderBody.details?.[0];
    report.orders_api_message =
      detail?.description ?? orderBody.message ?? `HTTP ${orderRes.status}`;
  }

  const go =
    report.oauth_valid &&
    report.orders_api &&
    report.capture_api &&
    report.card_processing_eligible;

  console.log(JSON.stringify({ ok: go, go_ahead: go, report }, null, 2));
  process.exit(go ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
