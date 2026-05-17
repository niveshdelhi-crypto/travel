import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { randomUUID } from "crypto";
import type { Application, NextFunction, Request, Response } from "express";
import cookieParser = require("cookie-parser");
import helmet from "helmet";
import { AppModule } from "./app.module";
import { PrismaExceptionFilter } from "./common/filters/prisma-exception.filter";
import { isWebOriginAllowed } from "./common/http/web-origin-policy";
import { RedisIoAdapter } from "./realtime/redis-io.adapter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
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
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      callback(null, isWebOriginAllowed(origin));
    },
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

  // Root path is outside Nest's `/api` prefix; Render/host probes often use HEAD/GET `/`.
  const expressApp = app.getHttpAdapter().getInstance() as Application;
  expressApp.head("/", (_req, res) => {
    res.status(200).end();
  });
  expressApp.get("/", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  await app.listen(port, "0.0.0.0");
}

void bootstrap();
