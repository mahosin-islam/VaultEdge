import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireStaff } from "@/server/auth/guards";
import { listWithdrawalRequestsForAdmin } from "@/server/services/admin-withdrawals.service";
import { adminRequestListQuerySchema } from "@/server/validators/admin.schema";
import { parseAndValidateQuery } from "@/server/validators/validate";

export async function GET(request: NextRequest) {
  try {
    await requireStaff(request);
    const query = parseAndValidateQuery(request, adminRequestListQuerySchema);
    const result = await listWithdrawalRequestsForAdmin(query);
    return apiSuccess(
      {
        withdrawalRequests: result.withdrawalRequests,
        summaryCounts: result.summaryCounts,
      },
      "Withdrawal requests retrieved successfully.",
      200,
      result.meta as unknown as Record<string, unknown>
    );
  } catch (error) {
    return handleApiError(error);
  }
}
