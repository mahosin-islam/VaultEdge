// ============================================================================
// POST /api/v1/loans/[loanId]/repay — Execute Atomic Loan Repayment
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { extractRequestMetadata } from "@/server/auth/cookies";
import { requireCustomer } from "@/server/auth/guards";
import { repayCustomerLoan } from "@/server/services/customer-portal.service";
import { customerRepayLoanSchema } from "@/server/validators/customer.schema";
import { parseAndValidateBody } from "@/server/validators/validate";

interface RouteContext {
  params: Promise<{ loanId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const customer = await requireCustomer(request);
    const { loanId } = await context.params;
    const input = await parseAndValidateBody(request, customerRepayLoanSchema);
    const { ipAddress } = extractRequestMetadata(request);

    const data = await repayCustomerLoan({
      customerId: customer.id,
      ipAddress,
      loanId,
      input,
    });

    return apiSuccess(data, "Loan repayment processed successfully.", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
