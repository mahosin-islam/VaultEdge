// ============================================================================
// POST /api/v1/auth/refresh — Refresh Token Rotation Route Handler
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import {
  attachAuthCookies,
  extractRefreshToken,
  extractRequestMetadata,
} from "@/server/auth/cookies";
import { refreshUserSession } from "@/server/services/auth.service";
import { enforceRateLimit } from "@/server/utils/rate-limit";
import { refreshTokenSchema } from "@/server/validators/auth.schema";
import { validateData } from "@/server/validators/validate";

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(request, {
      bucket: "auth:refresh",
      maxRequests: 30,
      windowMs: 60_000,
    });

    let bodyRefreshToken: string | undefined;
    const contentLength = request.headers.get("content-length");
    if (contentLength && Number(contentLength) > 0) {
      let rawBody: unknown = {};
      try {
        rawBody = await request.json();
      } catch {
        rawBody = {};
      }
      const parsedBody = validateData(rawBody, refreshTokenSchema);
      bodyRefreshToken = parsedBody.refreshToken;
    }

    const rawRefreshToken = extractRefreshToken(request, bodyRefreshToken);
    const clientMeta = extractRequestMetadata(request);

    const { session, tokenPair } = await refreshUserSession(
      rawRefreshToken,
      clientMeta
    );

    const response = apiSuccess(
      session,
      "Session tokens refreshed successfully.",
      200
    );

    return attachAuthCookies(response, tokenPair);
  } catch (error) {
    return handleApiError(error);
  }
}
