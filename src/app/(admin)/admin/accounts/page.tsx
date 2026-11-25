import type { Metadata } from "next";
import { requireServerRole } from "@/server/auth/session";
import { listBankAccountsForAdmin } from "@/server/services/admin-accounts.service";
import { listCustomersForAdmin } from "@/server/services/admin-customers.service";
import { AdminAccountsView } from "@/features/admin/AdminAccountsView";

export const metadata: Metadata = {
  title: "Bank Account Management — VaultEdge Admin Console",
  description:
    "Provision multi-tier banking vaults, govern account freeze states, configure per-account velocity limits, and audit double-entry ledger postings.",
};

export default async function AdminAccountsPage() {
  await requireServerRole(["ADMIN"]);

  const [{ accounts, summaryCounts, meta }, { customers }] = await Promise.all([
    listBankAccountsForAdmin({
      page: 1,
      limit: 8,
    }),
    listCustomersForAdmin({
      page: 1,
      limit: 50,
    }),
  ]);

  return (
    <AdminAccountsView
      initialAccounts={accounts}
      initialSummaryCounts={summaryCounts}
      initialMeta={meta}
      initialCustomers={customers}
    />
  );
}
