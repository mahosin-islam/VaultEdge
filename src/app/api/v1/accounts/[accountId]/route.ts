// ============================================================================
// GET /api/v1/accounts/[accountId] — View Owned Bank Account Details
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireCustomer } from "@/server/auth/guards";
import { getCustomerAccountDetails } from "@/server/services/customer-banking.service";

interface RouteContext {
  params: Promise<{ accountId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const customer = await requireCustomer(request);
    const { accountId } = await context.params;
    const data = await getCustomerAccountDetails(customer.id, accountId);

    return apiSuccess(data, "Account details retrieved successfully.", 200);
  } catch (error) {
    return handleApiError(error);
  }
}
