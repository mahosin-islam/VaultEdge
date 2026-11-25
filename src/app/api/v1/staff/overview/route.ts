// ============================================================================
// GET /api/v1/staff/overview — Bank Staff Operational Overview
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireStaff } from "@/server/auth/guards";
import { getStaffOverviewDashboard } from "@/server/services/staff.service";

export async function GET(request: NextRequest) {
  try {
    await requireStaff(request);
    const data = await getStaffOverviewDashboard();

    return apiSuccess(
      data,
      "Staff overview dashboard retrieved successfully.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
