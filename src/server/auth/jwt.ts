// ============================================================================
// VaultEdge — Custom JWT Signing & Verification Utilities (Access & Refresh)
// Uses distinct secrets for Access and Refresh tokens via `jose`.
// ============================================================================

import { SignJWT, jwtVerify } from "jose";
import type { UserRole, UserStatus } from "@prisma/client";
import { getServerEnv } from "@/config/env";
import { AuthenticationError } from "@/server/errors/app-error";
import type { JwtAccessPayload, JwtRefreshPayload } from "@/types/auth.types";

const ISSUER = "vaultedge-banking";
const AUDIENCE = "vaultedge-api";

export function parseDurationToSeconds(
  durationStr: string,
  fallbackSeconds: number
): number {
  const match = /^(\d+)\s*([smhd])$/i.exec(durationStr.trim());
  if (!match) {
    return fallbackSeconds;
  }
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 3600;
    case "d":
      return value * 86400;
    default:
      return fallbackSeconds;
  }
}

function getAccessSecretBytes(): Uint8Array {
  return new TextEncoder().encode(getServerEnv().JWT_ACCESS_SECRET);
}

function getRefreshSecretBytes(): Uint8Array {
  return new TextEncoder().encode(getServerEnv().JWT_REFRESH_SECRET);
}

export async function signAccessToken(params: {
  userId: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}): Promise<{ token: string; expiresIn: string; maxAgeSeconds: number }> {
  const env = getServerEnv();
  const maxAgeSeconds = parseDurationToSeconds(env.JWT_ACCESS_EXPIRES_IN, 900);

  const token = await new SignJWT({
    email: params.email,
    role: params.role,
    status: params.status,
    tokenType: "access",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(params.userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(getAccessSecretBytes());

  return {
    token,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    maxAgeSeconds,
  };
}

export async function signRefreshToken(params: {
  userId: string;
  role: UserRole;
  jti: string;
}): Promise<{
  token: string;
  expiresIn: string;
  maxAgeSeconds: number;
  expiresAt: Date;
}> {
  const env = getServerEnv();
  const maxAgeSeconds = parseDurationToSeconds(
    env.JWT_REFRESH_EXPIRES_IN,
    604800
  );
  const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000);

  const token = await new SignJWT({
    role: params.role,
    tokenType: "refresh",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(params.userId)
    .setJti(params.jti)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(getRefreshSecretBytes());

  return {
    token,
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    maxAgeSeconds,
    expiresAt,
  };
}

export async function verifyAccessToken(
  token: string
): Promise<JwtAccessPayload> {
  try {
    const { payload } = await jwtVerify(token, getAccessSecretBytes(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    if (
      payload.tokenType !== "access" ||
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.status !== "string"
    ) {
      throw new AuthenticationError("Invalid access token payload.");
    }

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role as UserRole,
      status: payload.status as UserStatus,
      tokenType: "access",
    };
  } catch (err) {
    if (err instanceof AuthenticationError) {
      throw err;
    }
    throw new AuthenticationError("Invalid or expired access token.");
  }
}

export async function verifyRefreshToken(
  token: string
): Promise<JwtRefreshPayload> {
  try {
    const { payload } = await jwtVerify(token, getRefreshSecretBytes(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    if (
      payload.tokenType !== "refresh" ||
      typeof payload.sub !== "string" ||
      typeof payload.jti !== "string" ||
      typeof payload.role !== "string"
    ) {
      throw new AuthenticationError("Invalid refresh token payload.");
    }

    return {
      sub: payload.sub,
      jti: payload.jti,
      role: payload.role as UserRole,
      tokenType: "refresh",
    };
  } catch (err) {
    if (err instanceof AuthenticationError) {
      throw err;
    }
    throw new AuthenticationError("Invalid or expired refresh token.");
  }
}
