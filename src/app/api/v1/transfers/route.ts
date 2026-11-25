// ============================================================================
// POST /api/v1/transfers — Execute Atomic Internal / Intra-Bank Fund Transfer
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { extractRequestMetadata } from "@/server/auth/cookies";
import { requireCustomer } from "@/server/auth/guards";
import { executeCustomerFundTransfer } from "@/server/services/customer-banking.service";
import { customerTransferSchema } from "@/server/validators/customer.schema";
import { parseAndValidateBody } from "@/server/validators/validate";

export async function POST(request: NextRequest) {
  try {
    const customer = await requireCustomer(request);
    const input = await parseAndValidateBody(request, customerTransferSchema);
    const { ipAddress } = extractRequestMetadata(request);

    const data = await executeCustomerFundTransfer({
      customerId: customer.id,
      ipAddress,
      input,
    });

    return apiSuccess(data, "Fund transfer completed successfully.", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
