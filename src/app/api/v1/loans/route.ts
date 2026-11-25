// ============================================================================
// GET  /api/v1/loans — List Customer's Loan Applications & Active Loans
// POST /api/v1/loans — Submit a New Loan Application
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { extractRequestMetadata } from "@/server/auth/cookies";
import { requireCustomer } from "@/server/auth/guards";
import {
  applyForLoanByCustomer,
  listCustomerLoans,
} from "@/server/services/customer-portal.service";
import {
  customerApplyLoanSchema,
  customerLoanListQuerySchema,
} from "@/server/validators/customer.schema";
import {
  parseAndValidateBody,
  parseAndValidateQuery,
} from "@/server/validators/validate";

export async function GET(request: NextRequest) {
  try {
    const customer = await requireCustomer(request);
    const query = parseAndValidateQuery(request, customerLoanListQuerySchema);
    const { loans, meta } = await listCustomerLoans(customer.id, query);

    return apiSuccess(
      { loans },
      "Customer loans retrieved successfully.",
      200,
      meta as unknown as Record<string, unknown>
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const customer = await requireCustomer(request);
    const input = await parseAndValidateBody(request, customerApplyLoanSchema);
    const { ipAddress } = extractRequestMetadata(request);

    const data = await applyForLoanByCustomer({
      customerId: customer.id,
      ipAddress,
      input,
    });

    return apiSuccess(
      data,
      "Loan application submitted successfully.",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
