// ============================================================================
// GET  /api/v1/deposits — List Customer Deposit Requests
// POST /api/v1/deposits — Submit Deposit Request (Admin Approval Required)
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { extractRequestMetadata } from "@/server/auth/cookies";
import { requireCustomer } from "@/server/auth/guards";
import {
  createCustomerDepositRequest,
  listCustomerDepositRequests,
} from "@/server/services/customer-banking.service";
import {
  customerDepositRequestSchema,
  customerRequestListQuerySchema,
} from "@/server/validators/customer.schema";
import {
  parseAndValidateBody,
  parseAndValidateQuery,
} from "@/server/validators/validate";

export async function GET(request: NextRequest) {
  try {
    const customer = await requireCustomer(request);
    const query = parseAndValidateQuery(request, customerRequestListQuerySchema);
    const { depositRequests, meta } = await listCustomerDepositRequests(
      customer.id,
      query
    );

    return apiSuccess(
      { depositRequests },
      "Deposit requests retrieved successfully.",
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
      customerDepositRequestSchema
    );
    const { ipAddress } = extractRequestMetadata(request);

    const data = await createCustomerDepositRequest({
      customerId: customer.id,
      ipAddress,
      input,
    });

    return apiSuccess(
      data,
      "Deposit request submitted for administrative approval.",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
