import type { Metadata } from "next";
import { requireServerRole } from "@/server/auth/session";
import { listTransactionsForAdmin } from "@/server/services/admin-transactions.service";
import { AdminTransactionsView } from "@/features/admin/AdminTransactionsView";

export const metadata: Metadata = {
  title: "Transaction Management & Audit — VaultEdge Admin Console",
  description:
    "Monitor double-entry postings, filter transactions by date and type, investigate suspicious activity flags, and execute atomic reversals.",
};

export default async function AdminTransactionsPage() {
  await requireServerRole(["ADMIN"]);

  const { transactions, summaryCounts, meta } = await listTransactionsForAdmin({
    page: 1,
    limit: 10,
  });

  return (
    <AdminTransactionsView
      initialTransactions={transactions}
      initialSummaryCounts={summaryCounts}
      initialMeta={meta}
    />
  );
}
