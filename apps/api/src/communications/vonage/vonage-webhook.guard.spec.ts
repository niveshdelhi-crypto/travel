import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash } from "crypto";
import { sign } from "jsonwebtoken";
import type { VonageWebhookRequest } from "./types/vonage-webhook-request.types";
import { VonageReplayCacheService } from "./vonage-replay-cache.service";
import { VonageSignatureService } from "./vonage-signature.service";
import { VonageWebhookGuard } from "./vonage-webhook.guard";
import { WebhookRequestLogService } from "./webhook-request-log.service";

describe("VonageWebhookGuard", () => {
  const secret = "guard-test-secret";
  let guard: VonageWebhookGuard;
  let replay: jest.Mocked<Pick<VonageReplayCacheService, "buildReplayKey" | "claim">>;
  let webhookLog: jest.Mocked<Pick<WebhookRequestLogService, "log">>;

  beforeEach(() => {
    const config = {
      get: (key: string) => {
        if (key === "VONAGE_SIGNATURE_SECRET") return secret;
        if (key === "NODE_ENV") return "production";
        return undefined;
      },
    } as ConfigService;

    replay = {
      buildReplayKey: jest.fn().mockReturnValue("replay-key"),
      claim: jest.fn().mockResolvedValue(true),
    };
    webhookLog = { log: jest.fn().mockResolvedValue(undefined) };

    guard = new VonageWebhookGuard(
      new VonageSignatureService(config),
      replay as unknown as VonageReplayCacheService,
      webhookLog as unknown as WebhookRequestLogService,
    );
  });

  function createContext(request: Partial<VonageWebhookRequest>): ExecutionContext {
    const req = {
      headers: {},
      originalUrl: "/api/calls/webhooks/events",
      body: {},
      ...request,
    } as VonageWebhookRequest;

    return {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({ statusCode: 200 }),
      }),
    } as ExecutionContext;
  }

  it("allows verified signed requests", async () => {
    const body = { status: "ringing" };
    const rawBody = Buffer.from(JSON.stringify(body));
    const payloadHash = createHash("sha256").update(rawBody).digest("hex");
    const token = sign({ payload_hash: payloadHash, jti: "evt-99", iat: Math.floor(Date.now() / 1000) }, secret, {
      algorithm: "HS256",
    });

    const context = createContext({
      rawBody,
      body,
      headers: { authorization: `Bearer ${token}` },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(replay.claim).toHaveBeenCalled();
  });

  it("rejects unsigned requests", async () => {
    const context = createContext({ rawBody: Buffer.from("{}"), headers: {} });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(webhookLog.log).toHaveBeenCalledWith(
      expect.objectContaining({ signatureValid: false, responseCode: 401 }),
    );
  });

  it("rejects replayed requests", async () => {
    replay.claim.mockResolvedValueOnce(false);
    const body = { status: "answered" };
    const rawBody = Buffer.from(JSON.stringify(body));
    const payloadHash = createHash("sha256").update(rawBody).digest("hex");
    const token = sign({ payload_hash: payloadHash, jti: "evt-replay", iat: Math.floor(Date.now() / 1000) }, secret, {
      algorithm: "HS256",
    });

    const context = createContext({
      rawBody,
      body,
      headers: { authorization: `Bearer ${token}` },
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
