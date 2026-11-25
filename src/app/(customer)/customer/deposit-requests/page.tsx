import { requireServerRole } from "@/server/auth/session";
import {
  listCustomerAccounts,
  listCustomerDepositRequests,
} from "@/server/services/customer-banking.service";
import { CustomerDepositRequestsView } from "@/features/customer/CustomerDepositRequestsView";

interface CustomerDepositRequestsPageProps {
  searchParams: Promise<{ accountId?: string }>;
}

export default async function CustomerDepositRequestsPage({
  searchParams,
}: CustomerDepositRequestsPageProps) {
  const user = await requireServerRole(["CUSTOMER"]);
  const [{ accounts }, { depositRequests, meta }, resolvedParams] =
    await Promise.all([
      listCustomerAccounts(user.id),
      listCustomerDepositRequests(user.id, { page: 1, limit: 8 }),
      searchParams,
    ]);

  return (
    <CustomerDepositRequestsView
      initialAccounts={accounts}
      initialDepositRequests={depositRequests}
      initialTotalCount={meta.total}
      initialAccountId={resolvedParams.accountId}
    />
  );
}
