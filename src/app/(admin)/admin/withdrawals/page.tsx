import type { Metadata } from "next";
import { requireServerRole } from "@/server/auth/session";
import { listWithdrawalRequestsForAdmin } from "@/server/services/admin-withdrawals.service";
import { AdminWithdrawalsView } from "@/features/admin/AdminWithdrawalsView";

export const metadata: Metadata = {
  title: "Withdrawal Requests Management — VaultEdge Admin Console",
  description:
    "Authorize outgoing customer withdrawal requests, verify available vault balances, and execute atomic debit settlement against treasury reserves.",
};

export default async function AdminWithdrawalsPage() {
  await requireServerRole(["ADMIN"]);

  const { withdrawalRequests, summaryCounts, meta } =
    await listWithdrawalRequestsForAdmin({
      page: 1,
      limit: 10,
    });

  return (
    <AdminWithdrawalsView
      initialWithdrawals={withdrawalRequests}
      initialSummaryCounts={summaryCounts}
      initialMeta={meta}
    />
  );
}
