// ============================================================================
// GET /api/v1/auth/me — Current Authenticated User Safe Profile
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireAuthenticatedUser } from "@/server/auth/guards";

export async function GET(request: NextRequest) {
  try {
    const safeUser = await requireAuthenticatedUser(request);

    return apiSuccess(
      { user: safeUser },
      "Current user profile retrieved successfully.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
