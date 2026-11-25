// ============================================================================
// POST /api/v1/staff/transactions/[transactionId]/flag — Flag Suspicious Tx
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { extractRequestMetadata } from "@/server/auth/cookies";
import { requireStaff } from "@/server/auth/guards";
import { flagTransactionByStaff } from "@/server/services/staff.service";
import { staffFlagTransactionSchema } from "@/server/validators/staff.schema";
import { parseAndValidateBody } from "@/server/validators/validate";

interface RouteContext {
  params: Promise<{ transactionId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const staff = await requireStaff(request);
    const { transactionId } = await context.params;
    const input = await parseAndValidateBody(
      request,
      staffFlagTransactionSchema
    );
    const { ipAddress } = extractRequestMetadata(request);

    const data = await flagTransactionByStaff({
      staffId: staff.id,
      ipAddress,
      transactionId,
      input,
    });

    return apiSuccess(
      data,
      "Transaction flagged for administrative review.",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
