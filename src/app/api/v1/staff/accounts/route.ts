// ============================================================================
// GET  /api/v1/staff/accounts — List, Search & Filter Customer Bank Accounts
// POST /api/v1/staff/accounts — Create Customer Bank Account (Staff)
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { extractRequestMetadata } from "@/server/auth/cookies";
import { requireStaff } from "@/server/auth/guards";
import {
  createBankAccountForCustomer,
  listBankAccountsForAdmin,
} from "@/server/services/admin-accounts.service";
import {
  adminAccountListQuerySchema,
  adminCreateAccountSchema,
} from "@/server/validators/admin.schema";
import {
  parseAndValidateBody,
  parseAndValidateQuery,
} from "@/server/validators/validate";

export async function GET(request: NextRequest) {
  try {
    await requireStaff(request);
    const query = parseAndValidateQuery(request, adminAccountListQuerySchema);
    const { accounts, summaryCounts, meta } =
      await listBankAccountsForAdmin(query);

    return apiSuccess(
      { accounts, summaryCounts },
      "Bank accounts retrieved successfully.",
      200,
      meta as unknown as Record<string, unknown>
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const staff = await requireStaff(request);
    const input = await parseAndValidateBody(request, adminCreateAccountSchema);
    const { ipAddress } = extractRequestMetadata(request);

    const data = await createBankAccountForCustomer({
      actorId: staff.id,
      actorRole: "STAFF",
      ipAddress,
      input,
    });

    return apiSuccess(
      data,
      "Customer bank account created successfully.",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
