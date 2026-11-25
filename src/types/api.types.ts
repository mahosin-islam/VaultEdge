// ============================================================================
// VaultEdge — Standardized API Response Contracts
// ============================================================================

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "ACCOUNT_STATUS_ERROR"
  | "NOT_FOUND"
  | "CONFLICT_ERROR"
  | "BUSINESS_RULE_ERROR"
  | "INSUFFICIENT_BALANCE"
  | "INVALID_STATUS_TRANSITION"
  | "RATE_LIMIT_EXCEEDED"
  | "CONFIGURATION_ERROR"
  | "INTERNAL_SERVER_ERROR";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ValidationFieldError {
  field: string;
  message: string;
}

export interface ApiErrorDetail {
  code: ApiErrorCode;
  message: string;
  details?: ValidationFieldError[] | Record<string, unknown>;
}

export interface ApiSuccessEnvelope<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorEnvelope {
  success: false;
  error: ApiErrorDetail;
}

export type ApiResponseEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;
