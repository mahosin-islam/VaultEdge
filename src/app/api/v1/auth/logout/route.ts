// ============================================================================
// POST /api/v1/auth/logout — Session Logout & Refresh Token Revocation
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { clearAuthCookies, extractRefreshToken } from "@/server/auth/cookies";
import { logoutUserSession } from "@/server/services/auth.service";
import { refreshTokenSchema } from "@/server/validators/auth.schema";
import { validateData } from "@/server/validators/validate";

export async function POST(request: NextRequest) {
  try {
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
    const result = await logoutUserSession(rawRefreshToken);

    const response = apiSuccess(
      { loggedOut: true, tokenRevoked: result.revoked },
      "Signed out successfully.",
      200
    );

    return clearAuthCookies(response);
  } catch (error) {
    return handleApiError(error);
  }
}
