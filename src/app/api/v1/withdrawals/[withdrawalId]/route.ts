// ============================================================================
// GET /api/v1/withdrawals/[withdrawalId] — Customer Withdrawal Request Details
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireCustomer } from "@/server/auth/guards";
import { getCustomerWithdrawalRequestDetails } from "@/server/services/customer-banking.service";

interface RouteContext {
  params: Promise<{ withdrawalId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const customer = await requireCustomer(request);
    const { withdrawalId } = await context.params;
    const data = await getCustomerWithdrawalRequestDetails(
      customer.id,
      withdrawalId
    );

    return apiSuccess(
      data,
      "Withdrawal request details retrieved successfully.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
