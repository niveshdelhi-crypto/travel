const base = process.env.API_BASE_URL ?? "http://localhost:4000/api";

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

  get(name) {
    return this.cookies.get(name);
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
  let data = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {}
  return { status: response.status, data, text };
}

async function csrf(jar) {
  return (await req("GET", "/auth/csrf", { jar })).data.csrfToken;
}

async function login(email, password) {
  const jar = new Jar();
  const token = await csrf(jar);
  const res = await req("POST", "/auth/login", {
    jar,
    headers: { "X-CSRF-Token": token },
    body: { email, password },
  });
  return { jar, res };
}

(async () => {
  const results = {};
  results.unauthMy = (await req("GET", "/leads/my")).status;

  const noCsrfJar = new Jar();
  results.loginWithoutCsrf = (
    await req("POST", "/auth/login", {
      jar: noCsrfJar,
      body: { email: "admin@fleetnexus.com", password: "bad" },
    })
  ).status;

  const invalidJar = new Jar();
  const invalidCsrf = await csrf(invalidJar);
  results.invalidLogin = (
    await req("POST", "/auth/login", {
      jar: invalidJar,
      headers: { "X-CSRF-Token": invalidCsrf },
      body: { email: "admin@fleetnexus.com", password: "bad" },
    })
  ).status;

  const admin = await login("admin@fleetnexus.com", "Admin@123");
  results.adminLogin = admin.res.status;
  results.adminMe = (await req("GET", "/auth/me", { jar: admin.jar })).status;
  results.adminList = (await req("GET", "/leads/admin", { jar: admin.jar })).status;

  const agent1 = await login("agent1@fleetnexus.com", "Agent@123");
  results.agentLogin = agent1.res.status;
  results.agentAdminForbidden = (await req("GET", "/leads/admin", { jar: agent1.jar })).status;

  const leadBody = {
    pickup_location: "QA Pickup LAX",
    drop_location: "QA Drop SFO",
    pickup_datetime: new Date(Date.now() + 3 * 86400000).toISOString(),
    return_datetime: new Date(Date.now() + 5 * 86400000).toISOString(),
    customer_name: "QA Audit Customer",
    customer_email: `qa.audit+${crypto.randomUUID().replaceAll("-", "")}@example.com`,
    customer_phone: "+15555550123",
  };

  const publicLead = await req("POST", "/leads/public", { body: leadBody });
  results.publicLeadCreate = publicLead.status;
  results.publicLeadError = publicLead.status >= 400 ? publicLead.data : undefined;

  const leadId = publicLead.data?.data?.id;
  const assignedEmail = publicLead.data?.data?.assigned_agent?.email;
  results.createdLeadId = leadId;
  results.assignedEmail = assignedEmail;
  results.publicSuccessShape = Boolean(publicLead.data?.success && leadId);

  const adminLeads = await req("GET", "/leads/admin", { jar: admin.jar });
  results.adminSeesCreatedLead = Array.isArray(adminLeads.data) && adminLeads.data.some((lead) => lead.id === leadId);

  if (assignedEmail) {
    const assigned = await login(assignedEmail, "Agent@123");
    results.assignedAgentLogin = assigned.res.status;

    const myLeads = await req("GET", "/leads/my", { jar: assigned.jar });
    results.assignedAgentSeesLead = Array.isArray(myLeads.data) && myLeads.data.some((lead) => lead.id === leadId);

    const token = assigned.jar.get("csrf_token");
    const statusPatch = await req("PATCH", `/leads/${leadId}/status`, {
      jar: assigned.jar,
      headers: { "X-CSRF-Token": token },
      body: { status: "CONTACTED" },
    });
    results.statusPatch = statusPatch.status;
    results.statusPersistedResponse = statusPatch.data?.status;

    const notePost = await req("POST", `/leads/${leadId}/notes`, {
      jar: assigned.jar,
      headers: { "X-CSRF-Token": token },
      body: { body: "QA audit note" },
    });
    results.notePost = notePost.status;

    const beforeRefresh = assigned.jar.get("refresh_token");
    const refresh = await req("POST", "/auth/refresh", {
      jar: assigned.jar,
      headers: { "X-CSRF-Token": token },
    });
    results.refresh = refresh.status;
    results.refreshRotatedCookie = beforeRefresh !== assigned.jar.get("refresh_token");

    const logout = await req("POST", "/auth/logout", {
      jar: assigned.jar,
      headers: { "X-CSRF-Token": assigned.jar.get("csrf_token") },
    });
    results.logout = logout.status;
    results.meAfterLogout = (await req("GET", "/auth/me", { jar: assigned.jar })).status;
  }

  console.log(JSON.stringify(results, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
