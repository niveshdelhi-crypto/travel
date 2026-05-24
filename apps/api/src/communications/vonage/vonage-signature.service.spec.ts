import { ConfigService } from "@nestjs/config";
import { createHash } from "crypto";
import { sign } from "jsonwebtoken";
import { VonageSignatureService } from "./vonage-signature.service";

describe("VonageSignatureService", () => {
  const secret = "test-signature-secret";
  let service: VonageSignatureService;

  beforeEach(() => {
    service = new VonageSignatureService(
      {
        get: (key: string) => {
          if (key === "VONAGE_SIGNATURE_SECRET") return secret;
          if (key === "NODE_ENV") return "production";
          return undefined;
        },
      } as ConfigService,
    );
  });

  function buildToken(payload: Record<string, unknown>, issuedAt = Math.floor(Date.now() / 1000)) {
    return sign({ ...payload, iat: issuedAt }, secret, { algorithm: "HS256" });
  }

  it("verifies a valid signed webhook", () => {
    const body = { uuid: "550e8400-e29b-41d4-a716-446655440000", status: "ringing" };
    const rawBody = Buffer.from(JSON.stringify(body));
    const payloadHash = createHash("sha256").update(rawBody).digest("hex");
    const token = buildToken({ payload_hash: payloadHash, jti: "evt-1" });

    const result = service.verify({
      token,
      rawBody,
      parsedBody: body,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.payloadHash).toBe(payloadHash);
      expect(result.replayKey).toBe("evt-1");
    }
  });

  it("rejects missing signature token", () => {
    const result = service.verify({
      token: "",
      rawBody: Buffer.from("{}"),
      headers: {},
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toContain("Missing");
    }
  });

  it("rejects payload hash mismatch", () => {
    const body = { uuid: "550e8400-e29b-41d4-a716-446655440000" };
    const token = buildToken({ payload_hash: "deadbeef".repeat(8) });

    const result = service.verify({
      token,
      rawBody: Buffer.from(JSON.stringify(body)),
      parsedBody: body,
      headers: {},
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toContain("Payload hash mismatch");
    }
  });

  it("rejects expired timestamps beyond tolerance", () => {
    const body = { status: "completed" };
    const rawBody = Buffer.from(JSON.stringify(body));
    const payloadHash = createHash("sha256").update(rawBody).digest("hex");
    const staleIat = Math.floor(Date.now() / 1000) - 400;
    const token = buildToken({ payload_hash: payloadHash }, staleIat);

    const result = service.verify({ token, rawBody, parsedBody: body, headers: {} });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toContain("timestamp");
    }
  });

  it("extracts bearer and vonage-signature headers", () => {
    expect(
      service.extractSignatureToken({ authorization: "Bearer abc.def.ghi" }),
    ).toBe("abc.def.ghi");
    expect(service.extractSignatureToken({ "vonage-signature": "token-value" })).toBe(
      "token-value",
    );
  });
});
