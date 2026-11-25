// ============================================================================
// GET /api/v1/admin/deposits — List, Search, Filter & Paginate Deposit Requests
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireAdmin } from "@/server/auth/guards";
import { listDepositRequestsForAdmin } from "@/server/services/admin-deposits.service";
import { adminRequestListQuerySchema } from "@/server/validators/admin.schema";
import { parseAndValidateQuery } from "@/server/validators/validate";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const query = parseAndValidateQuery(request, adminRequestListQuerySchema);
    const { depositRequests, summaryCounts, meta } =
      await listDepositRequestsForAdmin(query);

    return apiSuccess(
      { depositRequests, summaryCounts },
      "Deposit requests retrieved successfully.",
      200,
      meta as unknown as Record<string, unknown>
    );
  } catch (error) {
    return handleApiError(error);
  }
}
