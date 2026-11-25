import type { Metadata } from "next";
import { requireServerRole } from "@/server/auth/session";
import { listBankAccountsForAdmin } from "@/server/services/admin-accounts.service";
import { listCustomersForAdmin } from "@/server/services/admin-customers.service";
import { StaffAccountsView } from "@/features/staff/StaffAccountsView";

export const metadata: Metadata = {
  title: "Customer Account Management — VaultEdge Staff Console",
  description:
    "Open Savings, Current, and Business bank accounts for verified customers and inspect account balances, limits, and ledger history.",
};

export default async function StaffAccountsPage() {
  await requireServerRole(["STAFF"]);

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
    <StaffAccountsView
      initialAccounts={accounts}
      initialSummaryCounts={summaryCounts}
      initialMeta={meta}
      initialCustomers={customers}
    />
  );
}
