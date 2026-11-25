import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { extractRequestMetadata } from "@/server/auth/cookies";
import { requireStaff } from "@/server/auth/guards";
import {
  getWithdrawalRequestDetailsForAdmin,
  reviewWithdrawalRequestForAdmin,
} from "@/server/services/admin-withdrawals.service";
import { adminReviewRequestSchema } from "@/server/validators/admin.schema";
import { parseAndValidateBody } from "@/server/validators/validate";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ withdrawalId: string }> }
) {
  try {
    await requireStaff(request);
    const { withdrawalId } = await context.params;
    const result = await getWithdrawalRequestDetailsForAdmin(withdrawalId);
    return apiSuccess(result, "Withdrawal request retrieved successfully.");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ withdrawalId: string }> }
) {
  try {
    const staff = await requireStaff(request);
    const { withdrawalId } = await context.params;
    const input = await parseAndValidateBody(request, adminReviewRequestSchema);
    const { ipAddress } = extractRequestMetadata(request);

    const result = await reviewWithdrawalRequestForAdmin({
      adminId: staff.id,
      actorRole: "STAFF",
      ipAddress,
      withdrawalId,
      input,
    });

    return apiSuccess(
      result,
      input.decision === "APPROVE"
        ? "Withdrawal request approved and debited successfully."
        : "Withdrawal request rejected."
    );
  } catch (error) {
    return handleApiError(error);
  }
}
