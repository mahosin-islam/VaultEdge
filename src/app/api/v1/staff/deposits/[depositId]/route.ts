import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { extractRequestMetadata } from "@/server/auth/cookies";
import { requireStaff } from "@/server/auth/guards";
import {
  getDepositRequestDetailsForAdmin,
  reviewDepositRequestForAdmin,
} from "@/server/services/admin-deposits.service";
import { adminReviewRequestSchema } from "@/server/validators/admin.schema";
import { parseAndValidateBody } from "@/server/validators/validate";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ depositId: string }> }
) {
  try {
    await requireStaff(request);
    const { depositId } = await context.params;
    const result = await getDepositRequestDetailsForAdmin(depositId);
    return apiSuccess(result, "Deposit request retrieved successfully.");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ depositId: string }> }
) {
  try {
    const staff = await requireStaff(request);
    const { depositId } = await context.params;
    const input = await parseAndValidateBody(request, adminReviewRequestSchema);
    const { ipAddress } = extractRequestMetadata(request);

    const result = await reviewDepositRequestForAdmin({
      adminId: staff.id,
      actorRole: "STAFF",
      ipAddress,
      depositId,
      input,
    });

    return apiSuccess(
      result,
      input.decision === "APPROVE"
        ? "Deposit request approved and credited successfully."
        : "Deposit request rejected."
    );
  } catch (error) {
    return handleApiError(error);
  }
}
