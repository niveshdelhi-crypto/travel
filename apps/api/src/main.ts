import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";
import cookieParser = require("cookie-parser");
import helmet from "helmet";
import { AppModule } from "./app.module";
import { PrismaExceptionFilter } from "./common/filters/prisma-exception.filter";
import { RedisIoAdapter } from "./realtime/redis-io.adapter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const configuredWebOrigins =
    config.get<string>("WEB_ORIGIN")?.trim() ||
    config.get<string>("FRONTEND_URL")?.trim() ||
    "http://localhost:8080,http://localhost:3000";
  const webOrigins = configuredWebOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis(config);
  app.useWebSocketAdapter(redisIoAdapter);

  app.use(helmet());
  app.use(cookieParser());
  app.use((request: Request & { requestId?: string }, response: Response, next: NextFunction) => {
    const incomingRequestId = request.header("x-request-id")?.trim();
    const requestId =
      incomingRequestId && incomingRequestId.length <= 100 ? incomingRequestId : randomUUID();
    request.requestId = requestId;
    response.setHeader("X-Request-Id", requestId);
    next();
  });
  app.enableCors({
    origin: webOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "Idempotency-Key", "X-Request-Id"],
  });
  app.setGlobalPrefix("api");
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const portRaw = config.get<string | number>("PORT");
  const port =
    typeof portRaw === "number" && Number.isFinite(portRaw)
      ? portRaw
      : Number.parseInt(String(portRaw ?? "").trim(), 10) || 4000;

  await app.listen(port, "0.0.0.0");
}

void bootstrap();
