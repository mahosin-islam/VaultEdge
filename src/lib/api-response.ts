// ============================================================================
// VaultEdge — Standardized Next.js API Response & Error Handler Utilities
// ============================================================================

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "@/server/errors/app-error";
import type {
  ApiErrorCode,
  ApiErrorEnvelope,
  ApiSuccessEnvelope,
  ValidationFieldError,
} from "@/types/api.types";

export function apiSuccess<T>(
  data: T,
  message = "Operation completed successfully.",
  status = 200,
  meta?: Record<string, unknown>
): NextResponse<ApiSuccessEnvelope<T>> {
  const payload: ApiSuccessEnvelope<T> = {
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  };
  return NextResponse.json(payload, { status });
}

export function apiError(
  message: string,
  code: ApiErrorCode = "INTERNAL_SERVER_ERROR",
  status = 500,
  details?: ValidationFieldError[] | Record<string, unknown>
): NextResponse<ApiErrorEnvelope> {
  const payload: ApiErrorEnvelope = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
  return NextResponse.json(payload, { status });
}

export function handleApiError(error: unknown): NextResponse<ApiErrorEnvelope> {
  // 1. Custom Application Errors
  if (error instanceof AppError) {
    return apiError(error.message, error.code, error.statusCode, error.details);
  }

  // 2. Direct Zod Validation Errors
  if (error instanceof ZodError) {
    const fieldErrors: ValidationFieldError[] = error.issues.map((issue) => ({
      field: issue.path.join(".") || "body",
      message: issue.message,
    }));
    return apiError(
      "Request validation failed.",
      "VALIDATION_ERROR",
      400,
      fieldErrors
    );
  }

  // 3. Prisma Known Request Errors (never leak internal SQL or database paths)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const rawTarget = error.meta?.target;
      const targetFields = Array.isArray(rawTarget)
        ? rawTarget.join(", ")
        : typeof rawTarget === "string"
          ? rawTarget
          : "unique field";
      return apiError(
        `A record with this ${targetFields} already exists.`,
        "CONFLICT_ERROR",
        409
      );
    }

    if (error.code === "P2025") {
      return apiError(
        "The requested record was not found.",
        "NOT_FOUND",
        404
      );
    }

    if (error.code === "P2003") {
      return apiError(
        "Operation cannot be completed due to a relational constraint.",
        "CONFLICT_ERROR",
        409
      );
    }
  }

  // 4. Environment Configuration Errors
  if (
    error instanceof Error &&
    error.message.startsWith("Invalid or missing server environment")
  ) {
    return apiError(
      "Server configuration error. Please verify required environment variables.",
      "CONFIGURATION_ERROR",
      500
    );
  }

  // 5. Fallback Internal Server Error (never leak stack trace in response)
  if (process.env.NODE_ENV === "development") {
    console.error("[VaultEdge API Error]:", error);
  }

  return apiError(
    "An unexpected server error occurred. Please try again later.",
    "INTERNAL_SERVER_ERROR",
    500
  );
}
