// ============================================================================
// PATCH /api/v1/admin/accounts/[accountId]/status — Freeze / Unfreeze / Status Update
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { extractRequestMetadata } from "@/server/auth/cookies";
import { requireAdmin } from "@/server/auth/guards";
import { updateBankAccountStatusForAdmin } from "@/server/services/admin-accounts.service";
import { adminUpdateAccountStatusSchema } from "@/server/validators/admin.schema";
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
      adminUpdateAccountStatusSchema
    );
    const { ipAddress } = extractRequestMetadata(request);

    const data = await updateBankAccountStatusForAdmin({
      adminId: admin.id,
      ipAddress,
      accountId,
      input,
    });

    return apiSuccess(
      data,
      `Bank account status updated to ${input.status} successfully.`,
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
