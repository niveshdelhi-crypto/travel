const { io } = require("socket.io-client");

const base = process.env.API_BASE_URL ?? "http://localhost:4100/api";
const socketUrl = process.env.SOCKET_URL ?? "http://localhost:4100/leads";

function splitSetCookie(header) {
  return header ? header.split(/,(?=\s*[^;=]+=[^;]+)/g).map((value) => value.trim()) : [];
}

class Jar {
  constructor() {
    this.cookies = new Map();
  }

  update(response) {
    const raw =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : splitSetCookie(response.headers.get("set-cookie"));
    for (const cookie of raw) {
      const pair = cookie.split(";")[0];
      const index = pair.indexOf("=");
      if (index > -1) this.cookies.set(pair.slice(0, index), pair.slice(index + 1));
    }
  }

  header() {
    return [...this.cookies].map(([key, value]) => `${key}=${value}`).join("; ");
  }
}

async function req(method, path, { body, jar, headers = {} } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(jar?.header() ? { Cookie: jar.header() } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (jar) jar.update(response);
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null };
}

async function login(email, password) {
  const jar = new Jar();
  const csrf = (await req("GET", "/auth/csrf", { jar })).data.csrfToken;
  await req("POST", "/auth/login", {
    jar,
    headers: { "X-CSRF-Token": csrf },
    body: { email, password },
  });
  return jar;
}

(async () => {
  const adminJar = await login("admin@fleetnexus.com", "Admin@123");
  const events = [];
  const socket = io(socketUrl, {
    extraHeaders: { Cookie: adminJar.header() },
    transports: ["websocket", "polling"],
  });

  await new Promise((resolve, reject) => {
    socket.on("connect", resolve);
    socket.on("connect_error", reject);
    setTimeout(() => reject(new Error("socket connect timeout")), 8000);
  });

  for (const eventName of ["lead.created", "lead.assigned", "lead.updated", "notification.created"]) {
    socket.on(eventName, (payload) => events.push({ eventName, leadId: payload?.id ?? payload?.leadId }));
  }

  const lead = await req("POST", "/leads/public", {
    body: {
      pickup_location: "Realtime Pickup",
      drop_location: "Realtime Drop",
      pickup_datetime: new Date(Date.now() + 6 * 86400000).toISOString(),
      return_datetime: new Date(Date.now() + 7 * 86400000).toISOString(),
      customer_name: "Realtime Audit",
      customer_email: `realtime.${Date.now()}@example.com`,
      customer_phone: "+15555550123",
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 1500));
  socket.close();
  console.log(JSON.stringify({ leadStatus: lead.status, leadId: lead.data?.data?.id, events }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
