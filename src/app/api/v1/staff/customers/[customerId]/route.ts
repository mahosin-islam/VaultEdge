// ============================================================================
// GET /api/v1/staff/customers/[customerId] — View Customer Profile & Accounts
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireStaff } from "@/server/auth/guards";
import { getCustomerDetailsForAdmin } from "@/server/services/admin-customers.service";

interface RouteContext {
  params: Promise<{ customerId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireStaff(request);
    const { customerId } = await context.params;
    const data = await getCustomerDetailsForAdmin(customerId);

    return apiSuccess(
      data,
      "Customer details retrieved successfully.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
