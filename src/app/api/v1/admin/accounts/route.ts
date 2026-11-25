// ============================================================================
// GET /api/v1/admin/accounts — List, Search, Filter & Paginate Bank Accounts
// POST /api/v1/admin/accounts — Create Customer Bank Account
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { extractRequestMetadata } from "@/server/auth/cookies";
import { requireAdmin } from "@/server/auth/guards";
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
    await requireAdmin(request);
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
    const admin = await requireAdmin(request);
    const input = await parseAndValidateBody(request, adminCreateAccountSchema);
    const { ipAddress } = extractRequestMetadata(request);

    const data = await createBankAccountForCustomer({
      actorId: admin.id,
      actorRole: "ADMIN",
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
