import type { Metadata } from "next";
import { requireServerRole } from "@/server/auth/session";
import { listLoansForAdmin } from "@/server/services/admin-loans.service";
import { AdminLoansView } from "@/features/admin/AdminLoansView";

export const metadata: Metadata = {
  title: "Loan Applications & Disbursement — VaultEdge Admin Console",
  description:
    "Underwrite customer loan facilities, approve and disburse funds with automated EMI schedules, and audit repayment histories.",
};

export default async function AdminLoansPage() {
  await requireServerRole(["ADMIN"]);

  const { loans, summaryCounts, meta } = await listLoansForAdmin({
    page: 1,
    limit: 10,
  });

  return (
    <AdminLoansView
      initialLoans={loans}
      initialSummaryCounts={summaryCounts}
      initialMeta={meta}
    />
  );
}
