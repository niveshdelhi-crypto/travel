import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const apiURL = process.env.E2E_API_URL ?? "http://127.0.0.1:4000/api";
/** Legacy CRM (Vite). Run `npm run dev` so API + CRM + web are up. */
const crmBaseURL = process.env.E2E_CRM_URL ?? "http://127.0.0.1:8080";
const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@bookmycarz.com";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "Admin@123";
const agentEmail = process.env.E2E_AGENT_EMAIL ?? "agent1@bookmycarz.com";
const agentPassword = process.env.E2E_AGENT_PASSWORD ?? "Agent@123";

const describeLegacy =
  process.env.E2E_SKIP_LEGACY_CRM === "1" ? test.describe.skip : test.describe;

// #region agent log
function debugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>,
) {
  fetch("http://127.0.0.1:7893/ingest/df2d7af2-37a7-4fc7-9a57-815531534d78", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c60769" },
    body: JSON.stringify({
      sessionId: "c60769",
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}
// #endregion

describeLegacy("Book my Carz legacy CRM", () => {
  test.describe.configure({ mode: "serial" });
  test.use({ baseURL: crmBaseURL });

  test("login lands on CRM dashboard", async ({ page }) => {
    await login(page, adminEmail, adminPassword, /\/app\/?$/);
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
  });

  test("public lead submission is visible in admin leads pipeline", async ({ page, request }) => {
    const lead = await submitLead(request, "playwright-admin");
    // #region agent log
    debugLog("C", "fleetnexus-crm.spec.ts:admin-lead", "lead created before admin login", {
      customerName: lead.customer_name,
      leadId: lead.leadId,
    });
    // #endregion

    await login(page, adminEmail, adminPassword, /\/app\/leads\/?$/);
    await expect(page.getByRole("heading", { name: /^leads$/i })).toBeVisible();
    await expect(page.getByText(lead.customer_name)).toBeVisible({ timeout: 20_000 });
  });

  test("assigned leads appear in sales agent workspace", async ({ page, request }) => {
    const lead = await submitLead(request, "playwright-sales");
    const assignedEmail = await resolveAssignedAgentEmail(request, lead.leadId);
    // #region agent log
    debugLog("A", "fleetnexus-crm.spec.ts:agent-lead", "lead assignment resolved", {
      customerName: lead.customer_name,
      leadId: lead.leadId,
      assignedEmail,
    });
    // #endregion

    await login(page, assignedEmail, agentPassword, /\/app\/workspace\/?$/);
    await expect(page.getByRole("heading", { name: /my workspace/i })).toBeVisible();
    await expect(page.getByText(lead.customer_name)).toBeVisible({ timeout: 20_000 });
  });
});

async function resolveAssignedAgentEmail(request: APIRequestContext, leadId: string) {
  await apiLogin(request, adminEmail, adminPassword);
  const response = await request.get(`${apiURL}/leads/admin?page=1&pageSize=100`);
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as {
    data?: Array<{ id: string; assigned_agent?: { email?: string } | null }>;
  };
  const row = body.data?.find((item) => item.id === leadId);
  const email = row?.assigned_agent?.email;
  if (!email) throw new Error(`Lead ${leadId} has no assigned_agent in admin list`);
  return email;
}

async function apiLogin(request: APIRequestContext, email: string, password: string) {
  const response = await request.post(`${apiURL}/auth/login`, {
    data: { email, password },
  });
  expect(response.ok()).toBeTruthy();
}

async function login(page: Page, email: string, password: string, expectedPath: RegExp) {
  const redirect = expectedPath.source.includes("workspace")
    ? "/app/workspace"
    : expectedPath.source.includes("leads")
      ? "/app/leads"
      : "/app";

  await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(expectedPath, { timeout: 20_000 });
  // #region agent log
  debugLog("A", "fleetnexus-crm.spec.ts:login", "post-login url", {
    emailDomain: email.split("@")[1],
    finalUrl: page.url(),
    expectedPattern: expectedPath.source,
  });
  // #endregion
}

async function submitLead(request: APIRequestContext, suffix: string) {
  const payload = leadPayload(suffix);
  const response = await request.post(`${apiURL}/leads/public`, {
    headers: {
      "Idempotency-Key": `pw-${suffix}-${Date.now()}`,
      "X-Request-Id": `pw-${suffix}-${Date.now()}`,
    },
    data: payload,
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body).toMatchObject({
    success: true,
    leadId: expect.any(String),
    status: "NEW",
  });

  // #region agent log
  debugLog("B", "fleetnexus-crm.spec.ts:submitLead", "public lead response", {
    status: response.status(),
    leadId: body.leadId,
    suffix,
  });
  // #endregion

  return { ...payload, leadId: body.leadId as string };
}

function leadPayload(suffix: string) {
  const nonce = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const pickupDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const returnDate = new Date(Date.now() + 48 * 60 * 60 * 1000);

  return {
    pickup_location: "JFK Airport",
    drop_location: "Manhattan",
    pickup_datetime: pickupDate.toISOString(),
    return_datetime: returnDate.toISOString(),
    customer_name: `PW ${suffix} ${nonce}`,
    customer_email: `pw-${suffix}-${nonce}@fleetnexus.test`,
    customer_phone: `91000${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`,
  };
}
