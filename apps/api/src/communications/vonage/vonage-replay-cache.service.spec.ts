import { ConfigService } from "@nestjs/config";
import { VonageReplayCacheService } from "./vonage-replay-cache.service";

describe("VonageReplayCacheService", () => {
  it("claims replay keys in memory when redis is unavailable", async () => {
    const service = new VonageReplayCacheService({
      get: () => undefined,
    } as unknown as ConfigService);

    await service.onModuleInit();
    const key = service.buildReplayKey("token", "hash", "/api/calls/webhooks/events");

    await expect(service.claim(key, 1_000)).resolves.toBe(true);
    await expect(service.claim(key, 1_000)).resolves.toBe(false);
  });
});
