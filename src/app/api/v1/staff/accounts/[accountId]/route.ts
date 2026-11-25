// ============================================================================
// GET /api/v1/staff/accounts/[accountId] — View Customer Bank Account Details
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireStaff } from "@/server/auth/guards";
import { getBankAccountDetailsForAdmin } from "@/server/services/admin-accounts.service";

interface RouteContext {
  params: Promise<{ accountId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireStaff(request);
    const { accountId } = await context.params;
    const data = await getBankAccountDetailsForAdmin(accountId);

    return apiSuccess(
      data,
      "Bank account details retrieved successfully.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
