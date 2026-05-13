process.env.NODE_ENV ??= "test";
process.env.PORT ??= "0";
process.env.FRONTEND_URL ??= "http://localhost:3000";
process.env.WEB_ORIGIN ??= "http://localhost:3000";
process.env.JWT_ACCESS_SECRET ??= "test-access-secret-at-least-32-characters";
process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret-at-least-32-characters";
process.env.BCRYPT_ROUNDS ??= "4";
process.env.ACCESS_TOKEN_TTL_SECONDS ??= "900";
process.env.REFRESH_TOKEN_TTL_DAYS ??= "30";

if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
