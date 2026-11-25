// ============================================================================
// GET /api/v1/notifications — List Customer Notifications & Unread Count
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireCustomer } from "@/server/auth/guards";
import { listCustomerNotifications } from "@/server/services/customer-portal.service";
import { customerNotificationListQuerySchema } from "@/server/validators/customer.schema";
import { parseAndValidateQuery } from "@/server/validators/validate";

export async function GET(request: NextRequest) {
  try {
    const customer = await requireCustomer(request);
    const query = parseAndValidateQuery(
      request,
      customerNotificationListQuerySchema
    );
    const { notifications, unreadCount, meta } =
      await listCustomerNotifications(customer.id, query);

    return apiSuccess(
      { notifications, unreadCount },
      "Notifications retrieved successfully.",
      200,
      meta as unknown as Record<string, unknown>
    );
  } catch (error) {
    return handleApiError(error);
  }
}
