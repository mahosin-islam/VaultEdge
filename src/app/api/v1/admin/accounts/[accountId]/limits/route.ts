// ============================================================================
// PATCH /api/v1/admin/accounts/[accountId]/limits — Configure Account Transaction Limits
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { extractRequestMetadata } from "@/server/auth/cookies";
import { requireAdmin } from "@/server/auth/guards";
import { updateBankAccountLimitsForAdmin } from "@/server/services/admin-accounts.service";
import { adminUpdateAccountLimitsSchema } from "@/server/validators/admin.schema";
import { parseAndValidateBody } from "@/server/validators/validate";

interface RouteContext {
  params: Promise<{ accountId: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin(request);
    const { accountId } = await context.params;
    const input = await parseAndValidateBody(
      request,
      adminUpdateAccountLimitsSchema
    );
    const { ipAddress } = extractRequestMetadata(request);

    const data = await updateBankAccountLimitsForAdmin({
      adminId: admin.id,
      ipAddress,
      accountId,
      input,
    });

    return apiSuccess(
      data,
      "Bank account transaction limits updated successfully.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
