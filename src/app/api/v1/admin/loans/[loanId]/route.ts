// ============================================================================
// GET /api/v1/admin/loans/[loanId] — Complete Loan Application, Notes, Schedule & Repayments
// PATCH /api/v1/admin/loans/[loanId] — Approve (with Schedule & Disbursement) or Reject Loan
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { extractRequestMetadata } from "@/server/auth/cookies";
import { requireAdmin } from "@/server/auth/guards";
import {
  decideLoanApplicationForAdmin,
  getLoanDetailsForAdmin,
} from "@/server/services/admin-loans.service";
import { adminLoanDecisionSchema } from "@/server/validators/admin.schema";
import { parseAndValidateBody } from "@/server/validators/validate";

interface RouteContext {
  params: Promise<{ loanId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request);
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
    const admin = await requireAdmin(request);
    const { loanId } = await context.params;
    const input = await parseAndValidateBody(
      request,
      adminLoanDecisionSchema
    );
    const { ipAddress } = extractRequestMetadata(request);

    const data = await decideLoanApplicationForAdmin({
      adminId: admin.id,
      ipAddress,
      loanId,
      input,
    });

    return apiSuccess(
      data,
      input.decision === "APPROVE"
        ? "Loan application approved, repayment schedule generated, and funds disbursed successfully."
        : "Loan application rejected.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
