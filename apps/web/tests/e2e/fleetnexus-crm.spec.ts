import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const apiURL = process.env.E2E_API_URL ?? "http://127.0.0.1:4000/api";
const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@fleetnexus.com";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "Admin@123";
const agentEmail = process.env.E2E_AGENT_EMAIL ?? "agent1@fleetnexus.com";
const agentPassword = process.env.E2E_AGENT_PASSWORD ?? "Agent@123";

test.describe("FleetNexus operational CRM", () => {
  test("login redirects to the CRM dashboard", async ({ page }) => {
    await login(page, adminEmail, adminPassword);
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
    await expect(page.getByText(/signed in as/i)).toBeVisible();
  });

  test("public lead submission is assigned and visible in admin dashboard", async ({ page, request }) => {
    await login(page, adminEmail, adminPassword);
    const lead = await submitLead(request, "playwright-admin");

    await page.goto("/admin");
    await expect(page.getByText(lead.customer_name)).toBeVisible();
    await expect(page.getByText(/assignment load/i)).toBeVisible();
  });

  test("assigned leads are visible in sales dashboard", async ({ page, request }) => {
    await submitLead(request, "playwright-sales");
    await login(page, agentEmail, agentPassword, "/sales");

    await expect(page.getByRole("heading", { name: /my leads/i })).toBeVisible();
    await expect(page.getByText(/records/i)).toBeVisible();
  });

  test("admin dashboard receives realtime lead updates through query invalidation", async ({
    page,
    request,
  }) => {
    await login(page, adminEmail, adminPassword, "/admin");
    await expect(page.getByRole("heading", { name: "Leads" })).toBeVisible();

    const lead = await submitLead(request, "playwright-realtime");
    await expect(page.getByText(lead.customer_name)).toBeVisible({ timeout: 20_000 });
  });
});

async function login(page: Page, email: string, password: string, next = "/dashboard") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(new RegExp(`${escapeRegExp(next)}$`));
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
  return payload;
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
