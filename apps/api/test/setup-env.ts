process.env.NODE_ENV = "test";
process.env.COOKIE_DOMAIN = "";
process.env.COOKIE_SAME_SITE = "lax";
process.env.PORT ??= "0";
process.env.FRONTEND_URL ??= "http://localhost:3000";
process.env.WEB_ORIGIN ??= "http://localhost:3000";
process.env.JWT_ACCESS_SECRET ??= "test-access-secret-at-least-32-characters";
process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret-at-least-32-characters";
process.env.BCRYPT_ROUNDS ??= "12";
process.env.TELNYX_WEBHOOK_SIGNATURE_REQUIRED ??= "false";
process.env.VONAGE_WEBHOOK_SIGNATURE_REQUIRED ??= "false";
process.env.TELNYX_API_KEY ??= "";
// Supertest uses 127.0.0.1; localhost cookie domain breaks auth in E2E.
process.env.COOKIE_DOMAIN = "";
process.env.ACCESS_TOKEN_TTL_SECONDS ??= "900";
process.env.REFRESH_TOKEN_TTL_DAYS ??= "30";

if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
