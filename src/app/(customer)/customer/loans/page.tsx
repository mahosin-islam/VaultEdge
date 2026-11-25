import { requireServerRole } from "@/server/auth/session";
import { listCustomerAccounts } from "@/server/services/customer-banking.service";
import { listCustomerLoans } from "@/server/services/customer-portal.service";
import { CustomerLoansView } from "@/features/customer/CustomerLoansView";

export default async function CustomerLoansPage() {
  const user = await requireServerRole(["CUSTOMER"]);

  const [{ accounts }, { loans, meta }] = await Promise.all([
    listCustomerAccounts(user.id),
    listCustomerLoans(user.id, { page: 1, limit: 8 }),
  ]);

  return (
    <CustomerLoansView
      user={user}
      initialAccounts={accounts}
      initialLoans={loans}
      initialTotalCount={meta.total}
    />
  );
}
