// ============================================================================
// GET /api/v1/admin/withdrawals — List, Search, Filter & Paginate Withdrawal Requests
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireAdmin } from "@/server/auth/guards";
import { listWithdrawalRequestsForAdmin } from "@/server/services/admin-withdrawals.service";
import { adminRequestListQuerySchema } from "@/server/validators/admin.schema";
import { parseAndValidateQuery } from "@/server/validators/validate";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const query = parseAndValidateQuery(request, adminRequestListQuerySchema);
    const { withdrawalRequests, summaryCounts, meta } =
      await listWithdrawalRequestsForAdmin(query);

    return apiSuccess(
      { withdrawalRequests, summaryCounts },
      "Withdrawal requests retrieved successfully.",
      200,
      meta as unknown as Record<string, unknown>
    );
  } catch (error) {
    return handleApiError(error);
  }
}
