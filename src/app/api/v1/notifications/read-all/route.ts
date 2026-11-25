// ============================================================================
// PATCH /api/v1/notifications/read-all — Mark All Customer Notifications Read
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireCustomer } from "@/server/auth/guards";
import { markAllCustomerNotificationsRead } from "@/server/services/customer-portal.service";

export async function PATCH(request: NextRequest) {
  try {
    const customer = await requireCustomer(request);
    const data = await markAllCustomerNotificationsRead(customer.id);

    return apiSuccess(
      data,
      "All notifications marked as read.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
