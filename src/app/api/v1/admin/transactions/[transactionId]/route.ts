// ============================================================================
// GET /api/v1/admin/transactions/[transactionId] — Complete Transaction Details & Ledger
// PATCH /api/v1/admin/transactions/[transactionId] — Review Flag or Execute Atomic Reversal
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { extractRequestMetadata } from "@/server/auth/cookies";
import { requireAdmin } from "@/server/auth/guards";
import {
  getTransactionDetailsForAdmin,
  reviewTransactionForAdmin,
} from "@/server/services/admin-transactions.service";
import { adminReviewTransactionSchema } from "@/server/validators/admin.schema";
import { parseAndValidateBody } from "@/server/validators/validate";

interface RouteContext {
  params: Promise<{ transactionId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request);
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

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin(request);
    const { transactionId } = await context.params;
    const input = await parseAndValidateBody(
      request,
      adminReviewTransactionSchema
    );
    const { ipAddress } = extractRequestMetadata(request);

    const data = await reviewTransactionForAdmin({
      adminId: admin.id,
      ipAddress,
      transactionId,
      input,
    });

    return apiSuccess(
      data,
      `Transaction action (${input.action}) completed successfully.`,
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
