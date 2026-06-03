import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  CallDirection,
  CallDispositionType,
  CallProvider,
  CallStatus,
  PrismaClient,
} from "@prisma/client";
import cookieParser = require("cookie-parser");
import request = require("supertest");
import { AppModule } from "../src/app.module";
import { PrismaExceptionFilter } from "../src/common/filters/prisma-exception.filter";

const shouldRun =
  Boolean(process.env.TEST_DATABASE_URL) || process.env.FLEETNEXUS_ALLOW_DATABASE_E2E === "true";

/** Uses seeded agent1 (direct_line +14155550199) — see prisma/seed.ts */
const agent = {
  email: "agent1@markletravelbooking.com",
  password: "Agent@123",
  direct_line: "+14155550199",
};

(shouldRun ? describe : describe.skip)("Call center / Telnyx E2E", () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    process.env.TELNYX_WEBHOOK_SIGNATURE_REQUIRED = "false";
    process.env.VONAGE_WEBHOOK_SIGNATURE_REQUIRED = "false";
    delete process.env.COOKIE_DOMAIN;

    prisma = new PrismaClient();
    await prisma.$connect();
    await resetCallTestData(prisma);

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ rawBody: true });
    app.use(cookieParser());
    app.setGlobalPrefix("api");
    app.useGlobalFilters(new PrismaExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await resetCallTestData(prisma);
    await prisma.$disconnect();
    await app.close();
  });

  it("POST /calls/webhooks/telnyx creates inbound call and assigns agent", async () => {
    const callControlId = `test-cc-${Date.now()}`;
    const fromNumber = "+14155550200";
    const toNumber = agent.direct_line;

    await request(app.getHttpServer())
      .post("/api/calls/webhooks/telnyx")
      .send(telnyxPayload("call.initiated", callControlId, fromNumber, toNumber))
      .expect(201);

    const call = await prisma.call.findFirst({
      where: { provider_call_id: callControlId },
    });

    expect(call).toMatchObject({
      provider: CallProvider.TELNYX,
      direction: CallDirection.INBOUND,
      status: CallStatus.RINGING,
      from_number: fromNumber,
      to_number: toNumber,
    });

    const user = await prisma.user.findFirst({
      where: { direct_line: agent.direct_line, is_active: true },
    });
    expect(call?.agent_id).toBe(user?.id);

    const session = await prisma.activeCallSession.findUnique({
      where: { call_id: call!.id },
    });
    expect(session).toBeTruthy();
  });

  // Authenticated routes are covered by `npm run verify:call-center` against a running API
  // (Jest + Supertest cookie domain differs from browser/localhost).
  it.skip("GET /calls/center/metrics returns dashboard aggregates", async () => {
    const http = await login(app, prisma, agent);

    const response = await http.get("/api/calls/center/metrics").expect(200);

    expect(response.body).toMatchObject({
      todays_calls: expect.any(Number),
      connected_calls: expect.any(Number),
      missed_calls: expect.any(Number),
      average_duration_seconds: expect.any(Number),
      bookings_created: expect.any(Number),
      revenue_generated: expect.any(Number),
      as_of: expect.any(String),
    });
  });

  it.skip("GET /calls/:id/context resolves caller profile", async () => {
    const http = await login(app, prisma, agent);
    const callControlId = `test-ctx-${Date.now()}`;

    await request(app.getHttpServer())
      .post("/api/calls/webhooks/telnyx")
      .send(
        telnyxPayload("call.initiated", callControlId, "+14155550333", agent.direct_line),
      )
      .expect(201);

    const call = await prisma.call.findFirstOrThrow({
      where: { provider_call_id: callControlId },
    });

    const response = await http.get(`/api/calls/${call.id}/context`).expect(200);

    expect(response.body.caller).toMatchObject({
      is_existing_customer: expect.any(Boolean),
      phone_number: expect.stringContaining("+"),
    });
    expect(response.body.call.id).toBe(call.id);
  });

  it.skip("POST /calls/:id/disposition records outcome", async () => {
    const http = await login(app, prisma, agent);
    const callControlId = `test-disp-${Date.now()}`;

    await request(app.getHttpServer())
      .post("/api/calls/webhooks/telnyx")
      .send(
        telnyxPayload("call.initiated", callControlId, "+14155550444", agent.direct_line),
      )
      .expect(201);

    const call = await prisma.call.findFirstOrThrow({
      where: { provider_call_id: callControlId },
    });

    await http
      .post(`/api/calls/${call.id}/disposition`)
      .set("X-CSRF-Token", http.csrfToken)
      .send({ disposition: CallDispositionType.ANSWERED, notes: "E2E answered" })
      .expect(201);

    const disposition = await prisma.callDisposition.findUnique({
      where: { call_id: call.id },
    });
    expect(disposition?.disposition).toBe(CallDispositionType.ANSWERED);

    const updated = await prisma.call.findUniqueOrThrow({ where: { id: call.id } });
    expect(updated.status).toBe(CallStatus.COMPLETED);
  });

  it.skip("POST /calls/:id/leads/quick-create links new lead to call", async () => {
    const http = await login(app, prisma, agent);
    const callControlId = `test-lead-${Date.now()}`;

    await request(app.getHttpServer())
      .post("/api/calls/webhooks/telnyx")
      .send(
        telnyxPayload("call.initiated", callControlId, "+14155550555", agent.direct_line),
      )
      .expect(201);

    const call = await prisma.call.findFirstOrThrow({
      where: { provider_call_id: callControlId },
    });

    const created = await http
      .post(`/api/calls/${call.id}/leads/quick-create`)
      .set("X-CSRF-Token", http.csrfToken)
      .send({ customer_name: "Inbound Test Caller" })
      .expect(201);

    expect(created.body.lead.id).toBeTruthy();

    const linked = await prisma.call.findUniqueOrThrow({ where: { id: call.id } });
    expect(linked.lead_id).toBe(created.body.lead.id);
  });

  it("call.recording.saved persists recording on call and traveler link", async () => {
    const callControlId = `test-rec-${Date.now()}`;

    await request(app.getHttpServer())
      .post("/api/calls/webhooks/telnyx")
      .send(
        telnyxPayload("call.initiated", callControlId, "+14155550666", agent.direct_line),
      )
      .expect(201);

    const recordingUrl = "https://storage.telnyx.com/recordings/e2e-test.mp3";

    await request(app.getHttpServer())
      .post("/api/calls/webhooks/telnyx")
      .send({
        data: {
          event_type: "call.recording.saved",
          id: `evt-rec-${Date.now()}`,
          occurred_at: new Date().toISOString(),
          payload: {
            call_control_id: callControlId,
            recording_id: `rec-${Date.now()}`,
            recording_url: recordingUrl,
            public_recording_urls: { mp3: recordingUrl },
          },
        },
      })
      .expect(201);

    const call = await prisma.call.findFirstOrThrow({
      where: { provider_call_id: callControlId },
    });
    expect(call.recording_url).toBe(recordingUrl);

    const recording = await prisma.callRecording.findFirst({
      where: { call_id: call.id },
    });
    expect(recording?.url).toBe(recordingUrl);
  });
});

function telnyxPayload(
  eventType: string,
  callControlId: string,
  from: string,
  to: string,
) {
  return {
    data: {
      event_type: eventType,
      id: `evt-${callControlId}`,
      occurred_at: new Date().toISOString(),
      payload: {
        call_control_id: callControlId,
        from,
        to,
        direction: "incoming",
      },
    },
  };
}

type AuthedClient = {
  get: (url: string) => request.Test;
  post: (url: string) => request.Test;
  csrfToken: string;
  accessToken: string;
};

async function login(
  app: INestApplication,
  prisma: PrismaClient,
  user: { email: string; password: string },
): Promise<AuthedClient> {
  const response = await request(app.getHttpServer())
    .post("/api/auth/login")
    .send({ email: user.email, password: user.password })
    .expect(201);

  const accessToken = response.body?.accessToken as string | undefined;
  if (!accessToken) throw new Error("Login did not return accessToken");

  const setCookie = response.headers["set-cookie"] as unknown as string[] | undefined;
  const csrfCookie = (setCookie ?? []).find((c) => c.startsWith("csrf_token="));
  const csrfToken = csrfCookie?.split(";")[0]?.split("=")[1] ?? "";

  const auth = {
    Authorization: `Bearer ${accessToken}`,
    Cookie: `access_token=${accessToken}`,
  };

  const payload = JSON.parse(
    Buffer.from(accessToken.split(".")[1] ?? "", "base64url").toString("utf8"),
  ) as { sid?: string };
  const session = await prisma.refreshSession.findFirst({
    where: { id: payload.sid, revoked_at: null },
  });
  if (!session) {
    throw new Error(`Login session not persisted (sid=${payload.sid ?? "missing"})`);
  }

  return {
    csrfToken,
    accessToken,
    get: (url: string) => request(app.getHttpServer()).get(url).set(auth),
    post: (url: string) => request(app.getHttpServer()).post(url).set(auth),
  };
}

async function resetCallTestData(prisma: PrismaClient) {
  await prisma.callDisposition.deleteMany({
    where: { call: { from_number: { startsWith: "+1415555" } } },
  });
  await prisma.callEvent.deleteMany({
    where: { call: { from_number: { startsWith: "+1415555" } } },
  });
  await prisma.callRecording.deleteMany({
    where: { call: { from_number: { startsWith: "+1415555" } } },
  });
  await prisma.activeCallSession.deleteMany({
    where: { call: { from_number: { startsWith: "+1415555" } } },
  });
  await prisma.call.deleteMany({
    where: { from_number: { startsWith: "+1415555" } },
  });
  await prisma.lead.deleteMany({
    where: { customer_email: { contains: "@calls.local" } },
  });
}
