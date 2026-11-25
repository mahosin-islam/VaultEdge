import { requireServerRole } from "@/server/auth/session";
import { listCustomerAccounts } from "@/server/services/customer-banking.service";
import { CustomerAccountsView } from "@/features/customer/CustomerAccountsView";

export default async function CustomerAccountsPage() {
  const user = await requireServerRole(["CUSTOMER"]);
  const { accounts } = await listCustomerAccounts(user.id);

  return <CustomerAccountsView initialAccounts={accounts} />;
}
