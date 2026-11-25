// ============================================================================
// GET /api/v1/admin/withdrawals/[withdrawalId] — Withdrawal Request Details
// PATCH /api/v1/admin/withdrawals/[withdrawalId] — Approve or Reject Withdrawal Request
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { extractRequestMetadata } from "@/server/auth/cookies";
import { requireAdmin } from "@/server/auth/guards";
import {
  getWithdrawalRequestDetailsForAdmin,
  reviewWithdrawalRequestForAdmin,
} from "@/server/services/admin-withdrawals.service";
import { adminReviewRequestSchema } from "@/server/validators/admin.schema";
import { parseAndValidateBody } from "@/server/validators/validate";

interface RouteContext {
  params: Promise<{ withdrawalId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request);
    const { withdrawalId } = await context.params;
    const data = await getWithdrawalRequestDetailsForAdmin(withdrawalId);

    return apiSuccess(
      data,
      "Withdrawal request details retrieved successfully.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin(request);
    const { withdrawalId } = await context.params;
    const input = await parseAndValidateBody(
      request,
      adminReviewRequestSchema
    );
    const { ipAddress } = extractRequestMetadata(request);

    const data = await reviewWithdrawalRequestForAdmin({
      adminId: admin.id,
      ipAddress,
      withdrawalId,
      input,
    });

    return apiSuccess(
      data,
      input.decision === "APPROVE"
        ? "Withdrawal request approved and debited successfully."
        : "Withdrawal request rejected.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
