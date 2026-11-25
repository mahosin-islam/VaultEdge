// ============================================================================
// GET /api/v1/accounts — List Authenticated Customer's Owned Bank Accounts
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireCustomer } from "@/server/auth/guards";
import { listCustomerAccounts } from "@/server/services/customer-banking.service";

export async function GET(request: NextRequest) {
  try {
    const customer = await requireCustomer(request);
    const data = await listCustomerAccounts(customer.id);

    return apiSuccess(data, "Customer accounts retrieved successfully.", 200);
  } catch (error) {
    return handleApiError(error);
  }
}
