// ============================================================================
// GET /api/v1/transactions — Customer Transaction History & Search/Filter
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireCustomer } from "@/server/auth/guards";
import { listCustomerTransactions } from "@/server/services/customer-banking.service";
import { customerTransactionListQuerySchema } from "@/server/validators/customer.schema";
import { parseAndValidateQuery } from "@/server/validators/validate";

export async function GET(request: NextRequest) {
  try {
    const customer = await requireCustomer(request);
    const query = parseAndValidateQuery(
      request,
      customerTransactionListQuerySchema
    );
    const { transactions, meta } = await listCustomerTransactions(
      customer.id,
      query
    );

    return apiSuccess(
      { transactions },
      "Transactions retrieved successfully.",
      200,
      meta as unknown as Record<string, unknown>
    );
  } catch (error) {
    return handleApiError(error);
  }
}
