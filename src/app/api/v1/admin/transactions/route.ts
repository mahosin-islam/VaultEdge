// ============================================================================
// GET /api/v1/admin/transactions — List, Search, Filter & Paginate Transactions
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireAdmin } from "@/server/auth/guards";
import { listTransactionsForAdmin } from "@/server/services/admin-transactions.service";
import { adminTransactionListQuerySchema } from "@/server/validators/admin.schema";
import { parseAndValidateQuery } from "@/server/validators/validate";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const query = parseAndValidateQuery(
      request,
      adminTransactionListQuerySchema
    );
    const { transactions, summaryCounts, meta } =
      await listTransactionsForAdmin(query);

    return apiSuccess(
      { transactions, summaryCounts },
      "Transactions retrieved successfully.",
      200,
      meta as unknown as Record<string, unknown>
    );
  } catch (error) {
    return handleApiError(error);
  }
}
