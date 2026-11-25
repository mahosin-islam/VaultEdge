// ============================================================================
// VaultEdge — Server-Side Environment Configuration & Validation
// Validates required environment variables on the server without exposing values.
// ============================================================================

export interface ServerEnvConfig {
  readonly NODE_ENV: "development" | "test" | "production";
  readonly APP_URL: string;
  readonly DATABASE_URL: string;
  readonly JWT_ACCESS_SECRET: string;
  readonly JWT_REFRESH_SECRET: string;
  readonly JWT_ACCESS_EXPIRES_IN: string;
  readonly JWT_REFRESH_EXPIRES_IN: string;
}

const PlaceholderPatterns = [
  "<YOUR_LOCAL_PASSWORD>",
  "<GENERATE_LOCAL_64_BYTE_HEX_SECRET>",
] as const;

function containsPlaceholder(value: string): boolean {
  return PlaceholderPatterns.some((pattern) => value.includes(pattern));
}

let cachedEnv: ServerEnvConfig | null = null;

export function getServerEnv(): ServerEnvConfig {
  if (typeof window !== "undefined") {
    throw new Error(
      "SECURITY_VIOLATION: getServerEnv() must only be called on the server."
    );
  }

  if (cachedEnv) {
    return cachedEnv;
  }

  const missingOrInvalid: string[] = [];

  const rawNodeEnv = process.env.NODE_ENV ?? "development";
  const nodeEnv: ServerEnvConfig["NODE_ENV"] =
    rawNodeEnv === "production" || rawNodeEnv === "test"
      ? rawNodeEnv
      : "development";

  const appUrl = (process.env.APP_URL ?? "http://localhost:3000").trim();
  const databaseUrl = (process.env.DATABASE_URL ?? "").trim();
  const jwtAccessSecret = (process.env.JWT_ACCESS_SECRET ?? "").trim();
  const jwtRefreshSecret = (process.env.JWT_REFRESH_SECRET ?? "").trim();
  const jwtAccessExpiresIn = (process.env.JWT_ACCESS_EXPIRES_IN ?? "15m").trim();
  const jwtRefreshExpiresIn = (process.env.JWT_REFRESH_EXPIRES_IN ?? "7d").trim();

  if (
    !databaseUrl ||
    containsPlaceholder(databaseUrl) ||
    (!databaseUrl.startsWith("postgresql://") &&
      !databaseUrl.startsWith("postgres://"))
  ) {
    missingOrInvalid.push(
      "DATABASE_URL (must be a valid PostgreSQL connection string)"
    );
  }

  if (
    !jwtAccessSecret ||
    containsPlaceholder(jwtAccessSecret) ||
    jwtAccessSecret.length < 32
  ) {
    missingOrInvalid.push(
      "JWT_ACCESS_SECRET (must be configured with at least 32 characters)"
    );
  }

  if (
    !jwtRefreshSecret ||
    containsPlaceholder(jwtRefreshSecret) ||
    jwtRefreshSecret.length < 32
  ) {
    missingOrInvalid.push(
      "JWT_REFRESH_SECRET (must be configured with at least 32 characters)"
    );
  }

  if (
    jwtAccessSecret &&
    jwtRefreshSecret &&
    jwtAccessSecret === jwtRefreshSecret
  ) {
    missingOrInvalid.push(
      "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be distinct secrets"
    );
  }

  if (!appUrl) {
    missingOrInvalid.push("APP_URL");
  }

  if (missingOrInvalid.length > 0) {
    throw new Error(
      `Invalid or missing server environment configuration: ${missingOrInvalid.join(
        "; "
      )}`
    );
  }

  cachedEnv = Object.freeze({
    NODE_ENV: nodeEnv,
    APP_URL: appUrl,
    DATABASE_URL: databaseUrl,
    JWT_ACCESS_SECRET: jwtAccessSecret,
    JWT_REFRESH_SECRET: jwtRefreshSecret,
    JWT_ACCESS_EXPIRES_IN: jwtAccessExpiresIn,
    JWT_REFRESH_EXPIRES_IN: jwtRefreshExpiresIn,
  });

  return cachedEnv;
}
