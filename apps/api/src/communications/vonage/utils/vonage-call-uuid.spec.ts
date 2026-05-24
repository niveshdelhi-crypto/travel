import { isValidVonageCallUuid } from "./vonage-call-uuid";

describe("isValidVonageCallUuid", () => {
  it("accepts RFC4122 UUIDs", () => {
    expect(isValidVonageCallUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("rejects malformed values", () => {
    expect(isValidVonageCallUuid("not-a-uuid")).toBe(false);
    expect(isValidVonageCallUuid("")).toBe(false);
    expect(isValidVonageCallUuid(undefined)).toBe(false);
  });
});
