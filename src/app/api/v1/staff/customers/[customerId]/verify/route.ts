// ============================================================================
// PATCH /api/v1/staff/customers/[customerId]/verify — Staff KYC Verification
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { extractRequestMetadata } from "@/server/auth/cookies";
import { requireStaff } from "@/server/auth/guards";
import { verifyCustomerKycByStaff } from "@/server/services/staff.service";
import { staffVerifyCustomerSchema } from "@/server/validators/staff.schema";
import { parseAndValidateBody } from "@/server/validators/validate";

interface RouteContext {
  params: Promise<{ customerId: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const staff = await requireStaff(request);
    const { customerId } = await context.params;
    const input = await parseAndValidateBody(
      request,
      staffVerifyCustomerSchema
    );
    const { ipAddress } = extractRequestMetadata(request);

    const data = await verifyCustomerKycByStaff({
      staffId: staff.id,
      ipAddress,
      customerId,
      input,
    });

    return apiSuccess(
      data,
      `Customer KYC status updated to ${input.kycStatus}.`,
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
