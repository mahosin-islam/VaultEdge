// ============================================================================
// GET /api/v1/accounts/[accountId]/transactions — Account-Specific Transactions
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireCustomer } from "@/server/auth/guards";
import { listCustomerAccountTransactions } from "@/server/services/customer-banking.service";
import { customerAccountTransactionsQuerySchema } from "@/server/validators/customer.schema";
import { parseAndValidateQuery } from "@/server/validators/validate";

interface RouteContext {
  params: Promise<{ accountId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const customer = await requireCustomer(request);
    const { accountId } = await context.params;
    const query = parseAndValidateQuery(
      request,
      customerAccountTransactionsQuerySchema
    );
    const { transactions, meta } = await listCustomerAccountTransactions(
      customer.id,
      accountId,
      query
    );

    return apiSuccess(
      { transactions },
      "Account transactions retrieved successfully.",
      200,
      meta as unknown as Record<string, unknown>
    );
  } catch (error) {
    return handleApiError(error);
  }
}
