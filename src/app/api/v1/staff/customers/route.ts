// ============================================================================
// GET  /api/v1/staff/customers — List, Search & Filter Customers
// POST /api/v1/staff/customers — Register a New Customer (Staff Onboarding)
// ============================================================================

import type { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { extractRequestMetadata } from "@/server/auth/cookies";
import { requireStaff } from "@/server/auth/guards";
import { listCustomersForAdmin } from "@/server/services/admin-customers.service";
import { registerCustomerByStaff } from "@/server/services/staff.service";
import { adminCustomerListQuerySchema } from "@/server/validators/admin.schema";
import { staffRegisterCustomerSchema } from "@/server/validators/staff.schema";
import {
  parseAndValidateBody,
  parseAndValidateQuery,
} from "@/server/validators/validate";

export async function GET(request: NextRequest) {
  try {
    await requireStaff(request);
    const query = parseAndValidateQuery(request, adminCustomerListQuerySchema);
    const { customers, summaryCounts, meta } =
      await listCustomersForAdmin(query);

    return apiSuccess(
      { customers, summaryCounts },
      "Customers retrieved successfully.",
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
    const input = await parseAndValidateBody(
      request,
      staffRegisterCustomerSchema
    );
    const { ipAddress } = extractRequestMetadata(request);

    const data = await registerCustomerByStaff({
      staffId: staff.id,
      ipAddress,
      input,
    });

    return apiSuccess(
      data,
      "Customer registered successfully.",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
