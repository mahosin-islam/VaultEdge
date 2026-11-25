// ============================================================================
// POST /api/v1/auth/login — User Authentication Route Handler
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import {
  attachAuthCookies,
  extractRequestMetadata,
} from "@/server/auth/cookies";
import { loginUser } from "@/server/services/auth.service";
import { enforceRateLimit } from "@/server/utils/rate-limit";
import { loginSchema } from "@/server/validators/auth.schema";
import { parseAndValidateBody } from "@/server/validators/validate";

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(request, {
      bucket: "auth:login",
      maxRequests: 20,
      windowMs: 60_000,
    });

    const input = await parseAndValidateBody(request, loginSchema);
    const clientMeta = extractRequestMetadata(request);

    const { session, tokenPair } = await loginUser(input, clientMeta);

    const response = apiSuccess(session, "Authenticated successfully.", 200);

    return attachAuthCookies(response, tokenPair);
  } catch (error) {
    return handleApiError(error);
  }
}
