// ============================================================================
// GET /api/v1/admin/customers/[customerId] — Complete Customer Details & Accounts
// PATCH /api/v1/admin/customers/[customerId] — Activate, Deactivate, or Block Customer
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { extractRequestMetadata } from "@/server/auth/cookies";
import { requireAdmin } from "@/server/auth/guards";
import {
  getCustomerDetailsForAdmin,
  updateCustomerStatusForAdmin,
} from "@/server/services/admin-customers.service";
import { adminUpdateCustomerStatusSchema } from "@/server/validators/admin.schema";
import { parseAndValidateBody } from "@/server/validators/validate";

interface RouteContext {
  params: Promise<{ customerId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request);
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

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin(request);
    const { customerId } = await context.params;
    const input = await parseAndValidateBody(
      request,
      adminUpdateCustomerStatusSchema
    );
    const { ipAddress } = extractRequestMetadata(request);

    const data = await updateCustomerStatusForAdmin({
      adminId: admin.id,
      ipAddress,
      customerId,
      input,
    });

    return apiSuccess(
      data,
      `Customer status updated to ${input.status} successfully.`,
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
