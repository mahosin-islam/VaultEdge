// ============================================================================
// GET   /api/v1/notifications/[notificationId] — Read Notification Details
// PATCH /api/v1/notifications/[notificationId] — Mark Notification as Read
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireCustomer } from "@/server/auth/guards";
import {
  getCustomerNotificationDetails,
  markCustomerNotificationRead,
} from "@/server/services/customer-portal.service";

interface RouteContext {
  params: Promise<{ notificationId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const customer = await requireCustomer(request);
    const { notificationId } = await context.params;
    const data = await getCustomerNotificationDetails(
      customer.id,
      notificationId
    );

    return apiSuccess(
      data,
      "Notification details retrieved successfully.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const customer = await requireCustomer(request);
    const { notificationId } = await context.params;
    const data = await markCustomerNotificationRead(
      customer.id,
      notificationId
    );

    return apiSuccess(data, "Notification marked as read.", 200);
  } catch (error) {
    return handleApiError(error);
  }
}
