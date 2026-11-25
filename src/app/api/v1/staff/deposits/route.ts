import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireStaff } from "@/server/auth/guards";
import { listDepositRequestsForAdmin } from "@/server/services/admin-deposits.service";
import { adminRequestListQuerySchema } from "@/server/validators/admin.schema";
import { parseAndValidateQuery } from "@/server/validators/validate";

export async function GET(request: NextRequest) {
  try {
    await requireStaff(request);
    const query = parseAndValidateQuery(request, adminRequestListQuerySchema);
    const result = await listDepositRequestsForAdmin(query);
    return apiSuccess(
      {
        depositRequests: result.depositRequests,
        summaryCounts: result.summaryCounts,
      },
      "Deposit requests retrieved successfully.",
      200,
      result.meta as unknown as Record<string, unknown>
    );
  } catch (error) {
    return handleApiError(error);
  }
}
