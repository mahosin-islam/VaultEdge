import type { Metadata } from "next";
import { requireServerRole } from "@/server/auth/session";
import { listTransactionsForAdmin } from "@/server/services/admin-transactions.service";
import { StaffTransactionsView } from "@/features/staff/StaffTransactionsView";

export const metadata: Metadata = {
  title: "Transaction Review & Flagging — VaultEdge Staff Console",
  description:
    "Search transactions by Transaction ID, filter by date and type, review settlements, and flag suspicious activity for Admin.",
};

export default async function StaffTransactionsPage() {
  await requireServerRole(["STAFF"]);

  const { transactions, summaryCounts, meta } =
    await listTransactionsForAdmin({
      page: 1,
      limit: 10,
    });

  return (
    <StaffTransactionsView
      initialTransactions={transactions}
      initialSummaryCounts={summaryCounts}
      initialMeta={meta}
    />
  );
}
