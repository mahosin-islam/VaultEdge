// ============================================================================
// GET /api/v1/admin/settings — Retrieve Bank-Wide Financial Settings
// PATCH /api/v1/admin/settings — Update Bank-Wide Financial Limits & Fees
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { extractRequestMetadata } from "@/server/auth/cookies";
import { requireAdmin } from "@/server/auth/guards";
import {
  getSystemSettings,
  updateSystemSettings,
} from "@/server/services/admin-settings.service";
import { adminUpdateSettingsSchema } from "@/server/validators/admin.schema";
import { parseAndValidateBody } from "@/server/validators/validate";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const settings = await getSystemSettings();

    return apiSuccess(
      { settings },
      "System settings retrieved successfully.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const input = await parseAndValidateBody(
      request,
      adminUpdateSettingsSchema
    );
    const { ipAddress } = extractRequestMetadata(request);

    const settings = await updateSystemSettings({
      adminId: admin.id,
      ipAddress,
      input,
    });

    return apiSuccess(
      { settings },
      "System settings updated successfully.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
