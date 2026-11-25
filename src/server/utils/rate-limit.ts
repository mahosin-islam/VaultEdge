// ============================================================================
// VaultEdge — Sliding-Window Rate Limiter for Sensitive Authentication Endpoints
// Protects login, register, and refresh endpoints against brute-force abuse.
// ============================================================================

import type { NextRequest } from "next/server";
import { RateLimitError } from "@/server/errors/app-error";
import { extractRequestMetadata } from "@/server/auth/cookies";

interface RateLimitEntry {
  timestamps: number[];
}

const globalRateStore = globalThis as unknown as {
  veRateLimitMap?: Map<string, RateLimitEntry>;
};

const rateLimitMap: Map<string, RateLimitEntry> =
  globalRateStore.veRateLimitMap ?? new Map<string, RateLimitEntry>();

if (!globalRateStore.veRateLimitMap) {
  globalRateStore.veRateLimitMap = rateLimitMap;
}

export interface RateLimitConfig {
  bucket: string;
  maxRequests: number;
  windowMs: number;
  identifier?: string;
}

export function enforceRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): void {
  const { ipAddress } = extractRequestMetadata(request);
  const clientKey = config.identifier ?? ipAddress ?? "local-client";
  const compositeKey = `${config.bucket}:${clientKey}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const entry = rateLimitMap.get(compositeKey) ?? { timestamps: [] };
  const activeTimestamps = entry.timestamps.filter((ts) => ts > windowStart);

  if (activeTimestamps.length >= config.maxRequests) {
    const oldestInWindow = activeTimestamps[0] ?? now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldestInWindow + config.windowMs - now) / 1000)
    );
    throw new RateLimitError(
      `Too many requests to ${config.bucket}. Please retry in ${retryAfterSeconds} seconds.`,
      { retryAfterSeconds }
    );
  }

  activeTimestamps.push(now);
  rateLimitMap.set(compositeKey, { timestamps: activeTimestamps });
}
