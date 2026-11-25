import { requireServerRole } from "@/server/auth/session";
import {
  listCustomerAccounts,
  listCustomerWithdrawalRequests,
} from "@/server/services/customer-banking.service";
import { CustomerWithdrawalRequestsView } from "@/features/customer/CustomerWithdrawalRequestsView";

interface CustomerWithdrawalRequestsPageProps {
  searchParams: Promise<{ accountId?: string }>;
}

export default async function CustomerWithdrawalRequestsPage({
  searchParams,
}: CustomerWithdrawalRequestsPageProps) {
  const user = await requireServerRole(["CUSTOMER"]);
  const [{ accounts }, { withdrawalRequests, meta }, resolvedParams] =
    await Promise.all([
      listCustomerAccounts(user.id),
      listCustomerWithdrawalRequests(user.id, { page: 1, limit: 8 }),
      searchParams,
    ]);

  return (
    <CustomerWithdrawalRequestsView
      initialAccounts={accounts}
      initialWithdrawalRequests={withdrawalRequests}
      initialTotalCount={meta.total}
      initialAccountId={resolvedParams.accountId}
    />
  );
}
