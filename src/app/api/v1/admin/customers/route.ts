// ============================================================================
// GET /api/v1/admin/customers — List, Search, Filter & Paginate Customers
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireAdmin } from "@/server/auth/guards";
import { listCustomersForAdmin } from "@/server/services/admin-customers.service";
import { adminCustomerListQuerySchema } from "@/server/validators/admin.schema";
import { parseAndValidateQuery } from "@/server/validators/validate";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const query = parseAndValidateQuery(request, adminCustomerListQuerySchema);
    const { customers, summaryCounts, meta } =
      await listCustomersForAdmin(query);

    return apiSuccess(
      { customers, summaryCounts },
      "Customers retrieved successfully.",
      200,
      meta as unknown as Record<string, unknown>
    );
  } catch (error) {
    return handleApiError(error);
  }
}
