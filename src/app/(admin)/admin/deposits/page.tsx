import type { Metadata } from "next";
import { requireServerRole } from "@/server/auth/session";
import { listDepositRequestsForAdmin } from "@/server/services/admin-deposits.service";
import { AdminDepositsView } from "@/features/admin/AdminDepositsView";

export const metadata: Metadata = {
  title: "Deposit Requests Management — VaultEdge Admin Console",
  description:
    "Review incoming customer deposit submissions, verify target vault standing, and atomically credit funds with double-entry treasury settlement.",
};

export default async function AdminDepositsPage() {
  await requireServerRole(["ADMIN"]);

  const { depositRequests, summaryCounts, meta } =
    await listDepositRequestsForAdmin({
      page: 1,
      limit: 10,
    });

  return (
    <AdminDepositsView
      initialDeposits={depositRequests}
      initialSummaryCounts={summaryCounts}
      initialMeta={meta}
    />
  );
}
