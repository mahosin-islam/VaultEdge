// ============================================================================
// GET /api/v1/loans/[loanId] — Customer Loan Details, Schedule & Repayments
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireCustomer } from "@/server/auth/guards";
import { getCustomerLoanDetails } from "@/server/services/customer-portal.service";

interface RouteContext {
  params: Promise<{ loanId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const customer = await requireCustomer(request);
    const { loanId } = await context.params;
    const data = await getCustomerLoanDetails(customer.id, loanId);

    return apiSuccess(data, "Loan details retrieved successfully.", 200);
  } catch (error) {
    return handleApiError(error);
  }
}
