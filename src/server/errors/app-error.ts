// ============================================================================
// VaultEdge — Centralized Application Error Classes
// ============================================================================

import type { ApiErrorCode, ValidationFieldError } from "@/types/api.types";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ApiErrorCode;
  public readonly details?: ValidationFieldError[] | Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    code: ApiErrorCode,
    details?: ValidationFieldError[] | Record<string, unknown>
  ) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Request validation failed.",
    details?: ValidationFieldError[] | Record<string, unknown>
  ) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication failed or session expired.") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

export class AuthorizationError extends AppError {
  constructor(
    message = "You do not have permission to perform this operation."
  ) {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
}

export class AccountStatusError extends AppError {
  constructor(
    message = "Your account is not active and cannot access this resource."
  ) {
    super(message, 403, "ACCOUNT_STATUS_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "The requested resource was not found.") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(
    message = "A record with the provided unique identifier already exists.",
    details?: Record<string, unknown>
  ) {
    super(message, 409, "CONFLICT_ERROR", details);
  }
}

export class BusinessRuleError extends AppError {
  constructor(
    message = "The requested operation violates banking business rules.",
    details?: Record<string, unknown>
  ) {
    super(message, 422, "BUSINESS_RULE_ERROR", details);
  }
}

export class InsufficientBalanceError extends AppError {
  constructor(
    message = "Insufficient available account balance to complete this operation.",
    details?: Record<string, unknown>
  ) {
    super(message, 422, "INSUFFICIENT_BALANCE", details);
  }
}

export class InvalidStatusTransitionError extends AppError {
  constructor(
    message = "Invalid status transition for the requested resource.",
    details?: Record<string, unknown>
  ) {
    super(message, 409, "INVALID_STATUS_TRANSITION", details);
  }
}

export class RateLimitError extends AppError {
  constructor(
    message = "Too many requests. Please wait before trying again.",
    details?: Record<string, unknown>
  ) {
    super(message, 429, "RATE_LIMIT_EXCEEDED", details);
  }
}
