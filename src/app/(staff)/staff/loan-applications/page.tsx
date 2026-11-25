import type { Metadata } from "next";
import { requireServerRole } from "@/server/auth/session";
import { listLoansForAdmin } from "@/server/services/admin-loans.service";
import { StaffLoansView } from "@/features/staff/StaffLoansView";

export const metadata: Metadata = {
  title: "Loan Application Review — VaultEdge Staff Console",
  description:
    "Review customer loan applications, verify income and employment information, add internal notes, and forward for Admin approval.",
};

export default async function StaffLoanApplicationsPage() {
  await requireServerRole(["STAFF"]);

  const { loans, summaryCounts, meta } = await listLoansForAdmin({
    page: 1,
    limit: 10,
  });

  return (
    <StaffLoansView
      initialLoans={loans}
      initialSummaryCounts={summaryCounts}
      initialMeta={meta}
    />
  );
}
