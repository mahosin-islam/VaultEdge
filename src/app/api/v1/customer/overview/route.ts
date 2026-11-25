// ============================================================================
// GET /api/v1/customer/overview — Customer Personalized Dashboard & Analytics
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireCustomer } from "@/server/auth/guards";
import { getCustomerOverviewDashboard } from "@/server/services/customer-banking.service";
import { customerOverviewQuerySchema } from "@/server/validators/customer.schema";
import { parseAndValidateQuery } from "@/server/validators/validate";

export async function GET(request: NextRequest) {
  try {
    const customer = await requireCustomer(request);
    const query = parseAndValidateQuery(request, customerOverviewQuerySchema);
    const data = await getCustomerOverviewDashboard(customer.id, query);

    return apiSuccess(
      data,
      "Customer overview dashboard retrieved successfully.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
