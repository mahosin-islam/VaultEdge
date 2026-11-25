// ============================================================================
// GET /api/v1/transactions/[transactionId] — Customer Transaction Details
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireCustomer } from "@/server/auth/guards";
import { getCustomerTransactionDetails } from "@/server/services/customer-banking.service";

interface RouteContext {
  params: Promise<{ transactionId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const customer = await requireCustomer(request);
    const { transactionId } = await context.params;
    const data = await getCustomerTransactionDetails(
      customer.id,
      transactionId
    );

    return apiSuccess(
      data,
      "Transaction details retrieved successfully.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
