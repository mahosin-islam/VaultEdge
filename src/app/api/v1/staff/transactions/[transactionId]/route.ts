// ============================================================================
// GET /api/v1/staff/transactions/[transactionId] — Transaction Details & Ledger
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireStaff } from "@/server/auth/guards";
import { getTransactionDetailsForAdmin } from "@/server/services/admin-transactions.service";

interface RouteContext {
  params: Promise<{ transactionId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireStaff(request);
    const { transactionId } = await context.params;
    const data = await getTransactionDetailsForAdmin(transactionId);

    return apiSuccess(
      data,
      "Transaction details retrieved successfully.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
