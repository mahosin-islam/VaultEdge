// ============================================================================
// GET /api/v1/statements — Account Statement Retrieval (JSON, CSV, PDF)
// ============================================================================

import { NextResponse, type NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireCustomer } from "@/server/auth/guards";
import { getCustomerAccountStatement } from "@/server/services/customer-banking.service";
import { customerStatementQuerySchema } from "@/server/validators/customer.schema";
import { parseAndValidateQuery } from "@/server/validators/validate";

export async function GET(request: NextRequest) {
  try {
    const customer = await requireCustomer(request);
    const query = parseAndValidateQuery(request, customerStatementQuerySchema);
    const result = await getCustomerAccountStatement(customer.id, query);

    if (result.format === "csv") {
      return new NextResponse(result.content, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${result.filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    if (result.format === "pdf") {
      return new NextResponse(new Uint8Array(result.buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${result.filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return apiSuccess(
      { statement: result.statement },
      "Account statement retrieved successfully.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
