// ============================================================================
// GET /api/v1/admin/analytics — Full Admin Analytics & Chart Aggregations
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireAdmin } from "@/server/auth/guards";
import { getAdminAnalyticsReport } from "@/server/services/admin-analytics.service";
import { adminOverviewQuerySchema } from "@/server/validators/admin.schema";
import { parseAndValidateQuery } from "@/server/validators/validate";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const query = parseAndValidateQuery(request, adminOverviewQuerySchema);
    const data = await getAdminAnalyticsReport(query);

    return apiSuccess(
      data,
      "Admin analytics report retrieved successfully.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
