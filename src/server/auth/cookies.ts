// ============================================================================
// VaultEdge — Secure HttpOnly Authentication Cookie Utilities
// Supports both Cookie-based browsers and Bearer-header clients (Thunder Client).
// ============================================================================

import type { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/config/env";
import type { AuthTokenPair } from "@/types/auth.types";

export const ACCESS_TOKEN_COOKIE = "ve_access_token";
export const REFRESH_TOKEN_COOKIE = "ve_refresh_token";

export function attachAuthCookies<T>(
  response: NextResponse<T>,
  tokens: AuthTokenPair
): NextResponse<T> {
  const isProd = getServerEnv().NODE_ENV === "production";

  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: tokens.accessMaxAgeSeconds,
  });

  response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: tokens.refreshMaxAgeSeconds,
  });

  return response;
}

export function clearAuthCookies<T>(response: NextResponse<T>): NextResponse<T> {
  const isProd = getServerEnv().NODE_ENV === "production";

  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export function extractAccessToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const bearerToken = authHeader.slice(7).trim();
    if (bearerToken.length > 0) {
      return bearerToken;
    }
  }

  const cookieToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  return cookieToken && cookieToken.trim().length > 0
    ? cookieToken.trim()
    : null;
}

export function extractRefreshToken(
  request: NextRequest,
  bodyRefreshToken?: string
): string | null {
  if (bodyRefreshToken && bodyRefreshToken.trim().length > 0) {
    return bodyRefreshToken.trim();
  }

  const cookieToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (cookieToken && cookieToken.trim().length > 0) {
    return cookieToken.trim();
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const bearerToken = authHeader.slice(7).trim();
    if (bearerToken.length > 0) {
      return bearerToken;
    }
  }

  return null;
}

export function extractRequestMetadata(request: NextRequest): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ipAddress = forwardedFor
    ? forwardedFor.split(",")[0]?.trim() || null
    : realIp || null;
  const userAgent = request.headers.get("user-agent") || null;

  return { ipAddress, userAgent };
}
