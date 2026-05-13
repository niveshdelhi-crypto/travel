import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const apiURL = __ENV.API_URL || "http://127.0.0.1:4000/api";
const email = __ENV.AUTH_EMAIL || "admin@fleetnexus.com";
const password = __ENV.AUTH_PASSWORD || "Admin@123";
const authFailures = new Rate("auth_failures");

export const options = {
  scenarios: {
    auth_burst: {
      executor: "ramping-arrival-rate",
      startRate: 5,
      timeUnit: "1s",
      preAllocatedVUs: 50,
      maxVUs: 100,
      stages: [
        { target: Number(__ENV.AUTH_RATE || 50), duration: "20s" },
        { target: 5, duration: "10s" },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<1000"],
    auth_failures: ["rate<0.05"],
  },
};

export default function () {
  const response = http.post(
    `${apiURL}/auth/login`,
    JSON.stringify({ email, password }),
    {
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": `k6-auth-${__VU}-${__ITER}`,
      },
    },
  );

  const ok = check(response, {
    "login success or throttled": (res) => res.status === 201 || res.status === 429,
    "auth cookie issued": (res) => res.status === 429 || String(res.headers["Set-Cookie"] || "").includes("access_token"),
  });
  authFailures.add(!ok);
  sleep(0.1);
}
