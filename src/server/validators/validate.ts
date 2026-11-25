// ============================================================================
// VaultEdge — Server-Side Request Validation Utilities (Zod)
// ============================================================================

import type { NextRequest } from "next/server";
import type { ZodType } from "zod";
import { ValidationError } from "@/server/errors/app-error";
import type { ValidationFieldError } from "@/types/api.types";

export async function parseAndValidateBody<T>(
  request: NextRequest,
  schema: ZodType<T>
): Promise<T> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON.");
  }

  const parsed = schema.safeParse(rawBody);
  if (!parsed.success) {
    const details: ValidationFieldError[] = parsed.error.issues.map((issue) => ({
      field: issue.path.join(".") || "body",
      message: issue.message,
    }));
    throw new ValidationError("Request validation failed.", details);
  }

  return parsed.data;
}

export function validateData<T>(data: unknown, schema: ZodType<T>): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const details: ValidationFieldError[] = parsed.error.issues.map((issue) => ({
      field: issue.path.join(".") || "input",
      message: issue.message,
    }));
    throw new ValidationError("Validation failed.", details);
  }

  return parsed.data;
}

export function parseAndValidateQuery<T>(
  request: NextRequest,
  schema: ZodType<T>
): T {
  const entries: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    entries[key] = value;
  });

  const parsed = schema.safeParse(entries);
  if (!parsed.success) {
    const details: ValidationFieldError[] = parsed.error.issues.map((issue) => ({
      field: issue.path.join(".") || "query",
      message: issue.message,
    }));
    throw new ValidationError("Query parameter validation failed.", details);
  }

  return parsed.data;
}
