// ============================================================================
// POST  /api/v1/customer/security/pin — Set Initial Transaction PIN
// PATCH /api/v1/customer/security/pin — Change Existing Transaction PIN
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { extractRequestMetadata } from "@/server/auth/cookies";
import { requireCustomer } from "@/server/auth/guards";
import { configureCustomerTransactionPin } from "@/server/services/customer-portal.service";
import { customerConfigurePinSchema } from "@/server/validators/customer.schema";
import { parseAndValidateBody } from "@/server/validators/validate";

async function handlePinConfig(request: NextRequest) {
  try {
    const customer = await requireCustomer(request);
    const input = await parseAndValidateBody(
      request,
      customerConfigurePinSchema
    );
    const { ipAddress } = extractRequestMetadata(request);

    const data = await configureCustomerTransactionPin({
      customerId: customer.id,
      ipAddress,
      input,
    });

    return apiSuccess(
      data,
      "Transaction PIN configured successfully.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  return handlePinConfig(request);
}

export async function PATCH(request: NextRequest) {
  return handlePinConfig(request);
}
