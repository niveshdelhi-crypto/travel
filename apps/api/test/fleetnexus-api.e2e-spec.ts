import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import cookieParser = require("cookie-parser");
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaExceptionFilter } from "../src/common/filters/prisma-exception.filter";

type TestUser = {
  email: string;
  password: string;
  role: UserRole;
  name: string;
};

const admin: TestUser = {
  email: "test-admin@fleetnexus.test",
  password: "Admin@123",
  role: UserRole.admin,
  name: "Test Admin",
};

const agent: TestUser = {
  email: "test-agent@fleetnexus.test",
  password: "Agent@123",
  role: UserRole.sales_agent,
  name: "Test Agent",
};

const secondAgent: TestUser = {
  email: "test-agent-2@fleetnexus.test",
  password: "Agent@123",
  role: UserRole.sales_agent,
  name: "Test Agent 2",
};

const shouldRunDatabaseE2E =
  Boolean(process.env.TEST_DATABASE_URL) || process.env.FLEETNEXUS_ALLOW_DATABASE_E2E === "true";

(shouldRunDatabaseE2E ? describe : describe.skip)("FleetNexus API E2E", () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL && process.env.FLEETNEXUS_ALLOW_DATABASE_E2E !== "true") {
      throw new Error(
        "TEST_DATABASE_URL is required for API E2E tests. Set FLEETNEXUS_ALLOW_DATABASE_E2E=true only for a disposable database.",
      );
    }

    prisma = new PrismaClient();
    await prisma.$connect();
    await resetTestData(prisma);
    await seedUsers(prisma, [admin, agent, secondAgent]);

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix("api");
    app.useGlobalFilters(new PrismaExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (prisma) {
      await resetTestData(prisma);
      await prisma.$disconnect();
    }
    if (app) await app.close();
  });

  it("authenticates users and exposes /auth/me", async () => {
    const session = await login(app, admin);

    await request(app.getHttpServer())
      .get("/api/auth/me")
      .set("Cookie", session.cookies)
      .expect(200)
      .expect(({ body }) => {
        expect(body.email).toBe(admin.email);
        expect(body.role).toBe(UserRole.admin);
      });
  });

  it("enforces RBAC for admin-only lead operations", async () => {
    const session = await login(app, agent);

    await request(app.getHttpServer())
      .get("/api/leads/admin")
      .set("Cookie", session.cookies)
      .expect(403);

    await request(app.getHttpServer())
      .get("/api/leads/metrics")
      .set("Cookie", session.cookies)
      .expect(403);
  });

  it("creates public leads, auto-assigns them, and returns sanitized responses", async () => {
    const idempotencyKey = `lead-e2e-${Date.now()}`;
    const payload = leadPayload("sanitized");

    const response = await request(app.getHttpServer())
      .post("/api/leads/public")
      .set("Idempotency-Key", idempotencyKey)
      .send(payload)
      .expect(201);

    expect(response.body).toEqual({
      success: true,
      message: "Lead created and assigned successfully",
      leadId: expect.any(String),
      status: "NEW",
    });
    expect(response.body.assigned_agent).toBeUndefined();
    expect(response.body.activities).toBeUndefined();
    expect(response.body.notes).toBeUndefined();

    const lead = await prisma.lead.findUniqueOrThrow({ where: { id: response.body.leadId } });
    expect(lead.assigned_to).toBeTruthy();
  });

  it("returns the same result for duplicate Idempotency-Key submissions", async () => {
    const idempotencyKey = `lead-idempotent-${Date.now()}`;
    const payload = leadPayload("idempotent");

    const first = await request(app.getHttpServer())
      .post("/api/leads/public")
      .set("Idempotency-Key", idempotencyKey)
      .send(payload)
      .expect(201);

    const second = await request(app.getHttpServer())
      .post("/api/leads/public")
      .set("Idempotency-Key", idempotencyKey)
      .send(payload)
      .expect(201);

    expect(second.body).toEqual(first.body);

    const count = await prisma.lead.count({
      where: { customer_email: payload.customer_email },
    });
    expect(count).toBe(1);
  });

  it("rejects reused Idempotency-Key values with different request bodies", async () => {
    const idempotencyKey = `lead-conflict-${Date.now()}`;

    await request(app.getHttpServer())
      .post("/api/leads/public")
      .set("Idempotency-Key", idempotencyKey)
      .send(leadPayload("conflict-a"))
      .expect(201);

    await request(app.getHttpServer())
      .post("/api/leads/public")
      .set("Idempotency-Key", idempotencyKey)
      .send(leadPayload("conflict-b"))
      .expect(409);
  });

  it("handles concurrent lead creation without losing requests", async () => {
    const total = 20;
    const responses = await Promise.all(
      Array.from({ length: total }, (_, index) =>
        request(app.getHttpServer())
          .post("/api/leads/public")
          .set("Idempotency-Key", `lead-concurrent-${Date.now()}-${index}`)
          .send(leadPayload(`concurrent-${index}`)),
      ),
    );

    expect(responses.every((response) => response.status === 201)).toBe(true);
    expect(new Set(responses.map((response) => response.body.leadId)).size).toBe(total);

    const assignedCount = await prisma.lead.count({
      where: {
        customer_email: { startsWith: "lead-concurrent-" },
        assigned_to: { not: null },
      },
    });
    expect(assignedCount).toBe(total);
  });

  it("exposes public marketplace trust snapshots without authentication", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/marketplace/trust-snapshot")
      .expect(200);

    expect(response.body).toMatchObject({
      assistedRequestsLifetime: expect.any(Number),
      assistedRequests24h: expect.any(Number),
      advisoryCapacityAgents: expect.any(Number),
      avgAdvisorResponseMinutes: expect.anything(),
      leadStatusBreakdown: {
        NEW: expect.any(Number),
        CONTACTED: expect.any(Number),
        NEGOTIATING: expect.any(Number),
        CONFIRMED: expect.any(Number),
        COMPLETED: expect.any(Number),
      },
      recentAssistanceSignals: expect.any(Array),
      generatedAt: expect.any(String),
    });

    await request(app.getHttpServer()).get("/api/marketplace/suppliers").expect(200);
    await request(app.getHttpServer()).get("/api/marketplace/countries").expect(200);
  });
});

async function login(app: INestApplication, user: TestUser) {
  const response = await request(app.getHttpServer())
    .post("/api/auth/login")
    .send({ email: user.email, password: user.password })
    .expect(201);

  const cookies = response.headers["set-cookie"] as unknown as string[];
  const csrfCookie = cookies.find((cookie) => cookie.startsWith("csrf_token="));
  const csrfToken = csrfCookie?.split(";")[0]?.split("=")[1];
  if (!csrfToken) throw new Error("Login did not issue csrf_token cookie");
  return { cookies, csrfToken };
}

function leadPayload(suffix: string) {
  const pickupDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const returnDate = new Date(Date.now() + 48 * 60 * 60 * 1000);

  return {
    pickup_location: "JFK Airport",
    drop_location: "Manhattan",
    pickup_datetime: pickupDate.toISOString(),
    return_datetime: returnDate.toISOString(),
    customer_name: `Lead ${suffix}`,
    customer_email: `lead-${suffix}@fleetnexus.test`,
    customer_phone: `90000${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`,
  };
}

async function seedUsers(prisma: PrismaClient, users: TestUser[]) {
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        is_active: true,
        current_lead_count: 0,
        password_hash: await bcrypt.hash(user.password, 4),
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: true,
        current_lead_count: 0,
        password_hash: await bcrypt.hash(user.password, 4),
      },
    });
  }
}

async function resetTestData(prisma: PrismaClient) {
  await prisma.leadSubmission.deleteMany({
    where: { key: { startsWith: "lead-" } },
  });
  await prisma.lead.deleteMany({
    where: { customer_email: { endsWith: "@fleetnexus.test" } },
  });
  await prisma.refreshSession.deleteMany({
    where: { user: { email: { endsWith: "@fleetnexus.test" } } },
  });
  await prisma.user.deleteMany({
    where: { email: { endsWith: "@fleetnexus.test" } },
  });
}
