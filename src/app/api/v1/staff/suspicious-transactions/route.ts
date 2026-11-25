// ============================================================================
// GET /api/v1/staff/suspicious-transactions — Suspicious Activity Queue
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireStaff } from "@/server/auth/guards";
import { listSuspiciousTransactionsForStaff } from "@/server/services/staff.service";
import { staffSuspiciousListQuerySchema } from "@/server/validators/staff.schema";
import { parseAndValidateQuery } from "@/server/validators/validate";

export async function GET(request: NextRequest) {
  try {
    await requireStaff(request);
    const query = parseAndValidateQuery(
      request,
      staffSuspiciousListQuerySchema
    );
    const { suspiciousFlags, meta } =
      await listSuspiciousTransactionsForStaff(query);

    return apiSuccess(
      { suspiciousFlags },
      "Suspicious transaction flags retrieved successfully.",
      200,
      meta as unknown as Record<string, unknown>
    );
  } catch (error) {
    return handleApiError(error);
  }
}
