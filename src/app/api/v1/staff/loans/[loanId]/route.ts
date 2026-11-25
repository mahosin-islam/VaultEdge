// ============================================================================
// GET   /api/v1/staff/loans/[loanId] — View Loan Application & Customer Info
// PATCH /api/v1/staff/loans/[loanId] — Add Internal Note or Forward for Admin Approval
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { extractRequestMetadata } from "@/server/auth/cookies";
import { requireStaff } from "@/server/auth/guards";
import { getLoanDetailsForAdmin } from "@/server/services/admin-loans.service";
import { reviewLoanApplicationByStaff } from "@/server/services/staff.service";
import { staffLoanReviewSchema } from "@/server/validators/staff.schema";
import { parseAndValidateBody } from "@/server/validators/validate";

interface RouteContext {
  params: Promise<{ loanId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireStaff(request);
    const { loanId } = await context.params;
    const data = await getLoanDetailsForAdmin(loanId);

    return apiSuccess(
      data,
      "Loan application details retrieved successfully.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const staff = await requireStaff(request);
    const { loanId } = await context.params;
    const input = await parseAndValidateBody(request, staffLoanReviewSchema);
    const { ipAddress } = extractRequestMetadata(request);

    const data = await reviewLoanApplicationByStaff({
      staffId: staff.id,
      ipAddress,
      loanId,
      input,
    });

    return apiSuccess(
      data,
      input.action === "FORWARD_FOR_APPROVAL"
        ? "Loan application forwarded for administrative approval."
        : "Internal loan review note added successfully.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
