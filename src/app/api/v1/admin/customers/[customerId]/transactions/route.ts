// ============================================================================
// GET /api/v1/admin/customers/[customerId]/transactions — Customer Transaction History
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireAdmin } from "@/server/auth/guards";
import { getCustomerTransactionsForAdmin } from "@/server/services/admin-customers.service";
import { adminTransactionListQuerySchema } from "@/server/validators/admin.schema";
import { parseAndValidateQuery } from "@/server/validators/validate";

interface RouteContext {
  params: Promise<{ customerId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request);
    const { customerId } = await context.params;
    const query = parseAndValidateQuery(
      request,
      adminTransactionListQuerySchema
    );

    const { transactions, meta } = await getCustomerTransactionsForAdmin(
      customerId,
      query
    );

    return apiSuccess(
      { transactions },
      "Customer transaction history retrieved successfully.",
      200,
      meta as unknown as Record<string, unknown>
    );
  } catch (error) {
    return handleApiError(error);
  }
}
