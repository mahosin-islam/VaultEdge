// ============================================================================
// GET  /api/v1/withdrawals — List Customer Withdrawal Requests
// POST /api/v1/withdrawals — Submit Withdrawal Request (Admin Approval Required)
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { extractRequestMetadata } from "@/server/auth/cookies";
import { requireCustomer } from "@/server/auth/guards";
import {
  createCustomerWithdrawalRequest,
  listCustomerWithdrawalRequests,
} from "@/server/services/customer-banking.service";
import {
  customerRequestListQuerySchema,
  customerWithdrawalRequestSchema,
} from "@/server/validators/customer.schema";
import {
  parseAndValidateBody,
  parseAndValidateQuery,
} from "@/server/validators/validate";

export async function GET(request: NextRequest) {
  try {
    const customer = await requireCustomer(request);
    const query = parseAndValidateQuery(request, customerRequestListQuerySchema);
    const { withdrawalRequests, meta } = await listCustomerWithdrawalRequests(
      customer.id,
      query
    );

    return apiSuccess(
      { withdrawalRequests },
      "Withdrawal requests retrieved successfully.",
      200,
      meta as unknown as Record<string, unknown>
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const customer = await requireCustomer(request);
    const input = await parseAndValidateBody(
      request,
      customerWithdrawalRequestSchema
    );
    const { ipAddress } = extractRequestMetadata(request);

    const data = await createCustomerWithdrawalRequest({
      customerId: customer.id,
      ipAddress,
      input,
    });

    return apiSuccess(
      data,
      "Withdrawal request submitted for administrative approval.",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
