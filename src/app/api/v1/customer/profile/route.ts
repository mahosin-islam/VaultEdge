// ============================================================================
// GET   /api/v1/customer/profile — View Authenticated Customer Profile
// PATCH /api/v1/customer/profile — Update Permitted Customer Profile Fields
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { extractRequestMetadata } from "@/server/auth/cookies";
import { requireCustomer } from "@/server/auth/guards";
import {
  getCustomerProfile,
  updateCustomerProfile,
} from "@/server/services/customer-portal.service";
import { customerUpdateProfileSchema } from "@/server/validators/customer.schema";
import { parseAndValidateBody } from "@/server/validators/validate";

export async function GET(request: NextRequest) {
  try {
    const customer = await requireCustomer(request);
    const data = await getCustomerProfile(customer.id);

    return apiSuccess(data, "Customer profile retrieved successfully.", 200);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const customer = await requireCustomer(request);
    const input = await parseAndValidateBody(
      request,
      customerUpdateProfileSchema
    );
    const { ipAddress } = extractRequestMetadata(request);

    const data = await updateCustomerProfile({
      customerId: customer.id,
      ipAddress,
      input,
    });

    return apiSuccess(data, "Customer profile updated successfully.", 200);
  } catch (error) {
    return handleApiError(error);
  }
}
