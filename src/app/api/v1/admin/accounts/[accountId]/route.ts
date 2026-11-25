// ============================================================================
// GET /api/v1/admin/accounts/[accountId] — Complete Account Details & Recent Ledger
// PATCH /api/v1/admin/accounts/[accountId] — Update Account Information
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { extractRequestMetadata } from "@/server/auth/cookies";
import { requireAdmin } from "@/server/auth/guards";
import {
  getBankAccountDetailsForAdmin,
  updateBankAccountForAdmin,
} from "@/server/services/admin-accounts.service";
import { adminUpdateAccountSchema } from "@/server/validators/admin.schema";
import { parseAndValidateBody } from "@/server/validators/validate";

interface RouteContext {
  params: Promise<{ accountId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request);
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

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin(request);
    const { accountId } = await context.params;
    const input = await parseAndValidateBody(request, adminUpdateAccountSchema);
    const { ipAddress } = extractRequestMetadata(request);

    const data = await updateBankAccountForAdmin({
      adminId: admin.id,
      ipAddress,
      accountId,
      input,
    });

    return apiSuccess(
      data,
      "Bank account information updated successfully.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
