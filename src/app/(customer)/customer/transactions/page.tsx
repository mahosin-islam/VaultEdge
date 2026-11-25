import { requireServerRole } from "@/server/auth/session";
import {
  listCustomerAccounts,
  listCustomerTransactions,
} from "@/server/services/customer-banking.service";
import { CustomerTransactionsView } from "@/features/customer/CustomerTransactionsView";

export default async function CustomerTransactionsPage() {
  const user = await requireServerRole(["CUSTOMER"]);

  const [{ accounts }, { transactions, meta }] = await Promise.all([
    listCustomerAccounts(user.id),
    listCustomerTransactions(user.id, { page: 1, limit: 10 }),
  ]);

  return (
    <CustomerTransactionsView
      initialAccounts={accounts}
      initialTransactions={transactions}
      initialTotalCount={meta.total}
    />
  );
}
