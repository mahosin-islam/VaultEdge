// ============================================================================
// GET /api/v1/staff/loans — List, Search & Filter Loan Applications
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireStaff } from "@/server/auth/guards";
import { listLoansForAdmin } from "@/server/services/admin-loans.service";
import { adminLoanListQuerySchema } from "@/server/validators/admin.schema";
import { parseAndValidateQuery } from "@/server/validators/validate";

export async function GET(request: NextRequest) {
  try {
    await requireStaff(request);
    const query = parseAndValidateQuery(request, adminLoanListQuerySchema);
    const { loans, summaryCounts, meta } = await listLoansForAdmin(query);

    return apiSuccess(
      { loans, summaryCounts },
      "Loan applications retrieved successfully.",
      200,
      meta as unknown as Record<string, unknown>
    );
  } catch (error) {
    return handleApiError(error);
  }
}
