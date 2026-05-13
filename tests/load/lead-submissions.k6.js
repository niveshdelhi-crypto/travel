import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

const apiURL = __ENV.API_URL || "http://127.0.0.1:4000/api";
const leadLatency = new Trend("lead_submission_latency");
const leadFailures = new Rate("lead_submission_failures");

export const options = {
  scenarios: {
    public_lead_burst: {
      executor: "constant-vus",
      vus: Number(__ENV.VUS || 100),
      duration: __ENV.DURATION || "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1500"],
    lead_submission_failures: ["rate<0.01"],
    lead_submission_latency: ["p(95)<1500"],
  },
};

export default function () {
  const payload = leadPayload(`${__VU}-${__ITER}-${Date.now()}`);
  const startedAt = Date.now();
  const response = http.post(`${apiURL}/leads/public`, JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": `k6-lead-${__VU}-${__ITER}-${Date.now()}`,
      "X-Request-Id": `k6-lead-${__VU}-${__ITER}`,
    },
  });

  leadLatency.add(Date.now() - startedAt);
  const ok = check(response, {
    "lead created": (res) => res.status === 201,
    "sanitized lead response": (res) => {
      const body = parseJson(res.body);
      return body && body.success === true && body.leadId && !body.assigned_agent && !body.activities;
    },
  });
  leadFailures.add(!ok);
  sleep(0.2);
}

function leadPayload(suffix) {
  const pickup = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const drop = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  return {
    pickup_location: "JFK Airport",
    drop_location: "Manhattan",
    pickup_datetime: pickup,
    return_datetime: drop,
    customer_name: `k6 lead ${suffix}`,
    customer_email: `k6-${suffix}@fleetnexus.test`,
    customer_phone: `92000${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`,
  };
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
