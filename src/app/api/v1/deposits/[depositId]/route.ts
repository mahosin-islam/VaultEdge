// ============================================================================
// GET /api/v1/deposits/[depositId] — Customer Deposit Request Details
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireCustomer } from "@/server/auth/guards";
import { getCustomerDepositRequestDetails } from "@/server/services/customer-banking.service";

interface RouteContext {
  params: Promise<{ depositId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const customer = await requireCustomer(request);
    const { depositId } = await context.params;
    const data = await getCustomerDepositRequestDetails(customer.id, depositId);

    return apiSuccess(
      data,
      "Deposit request details retrieved successfully.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
