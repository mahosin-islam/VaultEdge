// ============================================================================
// GET /api/v1/admin/deposits/[depositId] — Deposit Request Details
// PATCH /api/v1/admin/deposits/[depositId] — Approve or Reject Deposit Request
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { extractRequestMetadata } from "@/server/auth/cookies";
import { requireAdmin } from "@/server/auth/guards";
import {
  getDepositRequestDetailsForAdmin,
  reviewDepositRequestForAdmin,
} from "@/server/services/admin-deposits.service";
import { adminReviewRequestSchema } from "@/server/validators/admin.schema";
import { parseAndValidateBody } from "@/server/validators/validate";

interface RouteContext {
  params: Promise<{ depositId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request);
    const { depositId } = await context.params;
    const data = await getDepositRequestDetailsForAdmin(depositId);

    return apiSuccess(
      data,
      "Deposit request details retrieved successfully.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin(request);
    const { depositId } = await context.params;
    const input = await parseAndValidateBody(
      request,
      adminReviewRequestSchema
    );
    const { ipAddress } = extractRequestMetadata(request);

    const data = await reviewDepositRequestForAdmin({
      adminId: admin.id,
      ipAddress,
      depositId,
      input,
    });

    return apiSuccess(
      data,
      input.decision === "APPROVE"
        ? "Deposit request approved and credited successfully."
        : "Deposit request rejected.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
