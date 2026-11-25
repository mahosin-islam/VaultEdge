// ============================================================================
// POST /api/v1/auth/register — Public Customer Registration Route Handler
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import {
  attachAuthCookies,
  extractRequestMetadata,
} from "@/server/auth/cookies";
import { registerCustomerUser } from "@/server/services/auth.service";
import { enforceRateLimit } from "@/server/utils/rate-limit";
import { registerSchema } from "@/server/validators/auth.schema";
import { parseAndValidateBody } from "@/server/validators/validate";

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(request, {
      bucket: "auth:register",
      maxRequests: 15,
      windowMs: 60_000,
    });

    const input = await parseAndValidateBody(request, registerSchema);
    const clientMeta = extractRequestMetadata(request);

    const { session, tokenPair } = await registerCustomerUser(
      input,
      clientMeta
    );

    const response = apiSuccess(
      session,
      "Customer account registered successfully.",
      201
    );

    return attachAuthCookies(response, tokenPair);
  } catch (error) {
    return handleApiError(error);
  }
}
