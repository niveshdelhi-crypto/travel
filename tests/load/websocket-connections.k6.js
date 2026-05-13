import ws from "k6/ws";
import http from "k6/http";
import { check } from "k6";
import { Rate } from "k6/metrics";

const apiURL = __ENV.API_URL || "http://127.0.0.1:4000/api";
const socketURL = __ENV.SOCKET_URL || "ws://127.0.0.1:4000/socket.io/?EIO=4&transport=websocket";
const email = __ENV.AUTH_EMAIL || "admin@fleetnexus.com";
const password = __ENV.AUTH_PASSWORD || "Admin@123";
const socketFailures = new Rate("socket_failures");

export const options = {
  scenarios: {
    websocket_fanout: {
      executor: "constant-vus",
      vus: Number(__ENV.WS_VUS || 100),
      duration: __ENV.WS_DURATION || "30s",
    },
  },
  thresholds: {
    socket_failures: ["rate<0.02"],
  },
};

export default function () {
  const login = http.post(`${apiURL}/auth/login`, JSON.stringify({ email, password }), {
    headers: { "Content-Type": "application/json" },
  });

  const cookie = login.headers["Set-Cookie"];
  const response = ws.connect(socketURL, {
    headers: {
      Cookie: cookie,
    },
  }, (socket) => {
    socket.on("open", () => {
      socket.send("40/leads,");
      socket.setTimeout(() => socket.close(), 5000);
    });

    socket.on("message", () => undefined);
    socket.on("error", () => {
      socketFailures.add(true);
    });
  });

  const ok = check(response, {
    "websocket connected": (res) => res && res.status === 101,
  });
  socketFailures.add(!ok);
}
