import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";

type ErrorBody = {
  success: false;
  error: string;
  message: string | string[];
  statusCode: number;
  requestId?: string;
};

@Catch()
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();
    const mapped = this.mapException(exception);

    this.logger.error(
      JSON.stringify({
        message: "http.request.failed",
        requestId: request.requestId,
        method: request.method,
        path: request.originalUrl,
        statusCode: mapped.statusCode,
        error: mapped.error,
        exception: this.errorSummary(exception),
      }),
    );

    response.status(mapped.statusCode).json({
      success: false,
      ...mapped,
      requestId: request.requestId,
    } satisfies ErrorBody);
  }

  private mapException(exception: unknown): Omit<ErrorBody, "success" | "requestId"> {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === "object" && body && "message" in body) {
        const message = (body as { message: string | string[] }).message;
        return {
          statusCode,
          error: this.errorName(statusCode),
          message,
        };
      }

      return {
        statusCode,
        error: this.errorName(statusCode),
        message: exception.message,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === "P1001" || exception.code === "P1002") {
        return {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          error: "database_unavailable",
          message: "Database is temporarily unavailable. Please check the Postgres connection.",
        };
      }

      if (exception.code === "P2002") {
        return {
          statusCode: HttpStatus.CONFLICT,
          error: "conflict",
          message: "A record already exists for the provided unique value",
        };
      }

      if (exception.code === "P2025") {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          error: "not_found",
          message: "Requested record was not found",
        };
      }

      if (exception.code === "P2021") {
        return {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          error: "schema_unavailable",
          message: "Database schema is not ready. Please run the latest Prisma migrations.",
        };
      }

      if (exception.code === "P2003") {
        return {
          statusCode: HttpStatus.CONFLICT,
          error: "foreign_key_conflict",
          message: "Operation conflicts with related records",
        };
      }

      if (exception.code === "P2034") {
        return {
          statusCode: HttpStatus.CONFLICT,
          error: "transaction_conflict",
          message: "Request conflicted with another write. Please retry with the same Idempotency-Key.",
        };
      }
    }

    if (
      exception instanceof Prisma.PrismaClientInitializationError ||
      exception instanceof Prisma.PrismaClientRustPanicError
    ) {
      return {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        error: "database_unavailable",
        message: "Database is temporarily unavailable",
      };
    }

    return {
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      error: "service_unavailable",
      message: "Service is temporarily unavailable",
    };
  }

  private errorName(statusCode: number) {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return "validation_error";
      case HttpStatus.UNAUTHORIZED:
        return "unauthorized";
      case HttpStatus.FORBIDDEN:
        return "forbidden";
      case HttpStatus.NOT_FOUND:
        return "not_found";
      case HttpStatus.CONFLICT:
        return "conflict";
      case HttpStatus.SERVICE_UNAVAILABLE:
        return "service_unavailable";
      default:
        return "request_error";
    }
  }

  private errorSummary(exception: unknown) {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return { type: exception.constructor.name, code: exception.code, message: exception.message };
    }

    if (exception instanceof Error) {
      return { type: exception.constructor.name, message: exception.message };
    }

    return { type: typeof exception, message: String(exception) };
  }
}
