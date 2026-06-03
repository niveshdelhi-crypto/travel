/**
 * Smoke test: inbound Telnyx webhook → DB call → metrics → disposition.
 * Usage: node scripts/verify-call-center.mjs [--base http://127.0.0.1:4000]
 */
const base = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "http://127.0.0.1:4000";

const api = `${base.replace(/\/$/, "")}/api`;
const callControlId = `smoke-${Date.now()}`;
const agentLine = "+14155550199";
const callerLine = "+14155550999";

let passed = 0;
let failed = 0;

function ok(label) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

function fail(label, detail) {
  failed += 1;
  console.error(`  ✗ ${label}`, detail ?? "");
}

async function post(path, body, headers = {}) {
  const res = await fetch(`${api}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, json, headers: res.headers };
}

async function get(path, headers = {}) {
  const res = await fetch(`${api}${path}`, { headers });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, json };
}

function telnyxInitiated(id, from, to) {
  return {
    data: {
      event_type: "call.initiated",
      id: `evt-${id}`,
      occurred_at: new Date().toISOString(),
      payload: {
        call_control_id: id,
        from,
        to,
        direction: "incoming",
      },
    },
  };
}

async function main() {
  console.log(`\nFleetNexus call-center smoke test → ${api}\n`);

  const health = await get("/health");
  if (health.status === 200) ok("GET /health");
  else fail("GET /health", health.status);

  const webhook = await post(
    "/calls/webhooks/telnyx",
    telnyxInitiated(callControlId, callerLine, agentLine),
  );
  if (webhook.status >= 200 && webhook.status < 300) ok("POST /calls/webhooks/telnyx (inbound)");
  else fail("POST /calls/webhooks/telnyx", `${webhook.status} ${JSON.stringify(webhook.json)}`);

  const login = await post("/auth/login", {
    email: process.env.SMOKE_AGENT_EMAIL ?? "agent1@markletravelbooking.com",
    password: process.env.SMOKE_AGENT_PASSWORD ?? "Agent@123",
  });

  if (login.status < 200 || login.status >= 300) {
    fail("POST /auth/login (set SMOKE_AGENT_EMAIL/PASSWORD)", login.status);
    console.log(`\n${passed} passed, ${failed} failed (login required for remaining checks)\n`);
    process.exit(failed > 0 ? 1 : 0);
  }

  const setCookie = login.headers.getSetCookie?.() ?? [];
  const cookieHeader = setCookie.map((c) => c.split(";")[0]).join("; ");
  const csrfMatch = setCookie.find((c) => c.startsWith("csrf_token="));
  const csrf = csrfMatch?.split(";")[0]?.split("=")[1] ?? "";

  ok("POST /auth/login");

  const metrics = await get("/calls/center/metrics", {
    Cookie: cookieHeader,
  });
  if (metrics.status === 200 && metrics.json?.todays_calls != null) {
    ok("GET /calls/center/metrics");
  } else {
    fail("GET /calls/center/metrics", metrics.status);
  }

  const list = await get("/calls?page=1&pageSize=100", { Cookie: cookieHeader });
  const call = list.json?.data?.find((c) => c.provider_call_id === callControlId);
  if (call?.id) {
    ok("GET /calls lists inbound call");

    const ctx = await get(`/calls/${call.id}/context`, { Cookie: cookieHeader });
    if (ctx.status === 200 && ctx.json?.caller) ok("GET /calls/:id/context");
    else fail("GET /calls/:id/context", ctx.status);

    const dispCallId = `smoke-disp-${Date.now()}`;
    await post("/calls/webhooks/telnyx", telnyxInitiated(dispCallId, "+14155550777", agentLine));
    const dispList = await get("/calls?page=1&pageSize=20", { Cookie: cookieHeader });
    const dispCall = dispList.json?.data?.find((c) => c.provider_call_id === dispCallId);
    if (dispCall?.id) {
      const disp = await post(
        `/calls/${dispCall.id}/disposition`,
        { disposition: "ANSWERED", notes: "smoke test" },
        { Cookie: cookieHeader, "X-CSRF-Token": csrf },
      );
      if (disp.status >= 200 && disp.status < 300) ok("POST /calls/:id/disposition");
      else fail("POST /calls/:id/disposition", `${disp.status} ${JSON.stringify(disp.json)}`);
    } else {
      fail("POST /calls/:id/disposition setup", "disposition call not found");
    }

    const recId = `smoke-rec-${Date.now()}`;
    const recUrl = "https://storage.telnyx.com/recordings/smoke-verify.mp3";
    const recWebhook = await post("/calls/webhooks/telnyx", {
      data: {
        event_type: "call.recording.saved",
        id: `evt-${recId}`,
        occurred_at: new Date().toISOString(),
        payload: {
          call_control_id: callControlId,
          recording_id: recId,
          recording_url: recUrl,
        },
      },
    });
    if (recWebhook.status >= 200 && recWebhook.status < 300) {
      ok("POST /calls/webhooks/telnyx (recording.saved)");
    } else {
      fail("POST /calls/webhooks/telnyx recording", recWebhook.status);
    }

    const recCallId = `smoke-lead-${Date.now()}`;
    await post("/calls/webhooks/telnyx", telnyxInitiated(recCallId, "+14155550888", agentLine));
    const leadList = await get("/calls?page=1&pageSize=20", { Cookie: cookieHeader });
    const leadCall = leadList.json?.data?.find((c) => c.provider_call_id === recCallId);
    if (leadCall?.id) {
      const leadRes = await post(
        `/calls/${leadCall.id}/leads/quick-create`,
        { customer_name: "Smoke Verify Caller" },
        { Cookie: cookieHeader, "X-CSRF-Token": csrf },
      );
      if (leadRes.status >= 200 && leadRes.status < 300) ok("POST /calls/:id/leads/quick-create");
      else fail("POST /calls/:id/leads/quick-create", leadRes.status);
    } else {
      fail("Could not find call for quick-create lead test");
    }
  } else {
    fail("Inbound call visible in GET /calls (assign agent direct_line: npm run prisma:seed)");
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
