import { requireServerRole } from "@/server/auth/session";
import { listCustomerAccounts } from "@/server/services/customer-banking.service";
import { CustomerTransfersView } from "@/features/customer/CustomerTransfersView";

interface CustomerTransfersPageProps {
  searchParams: Promise<{ from?: string }>;
}

export default async function CustomerTransfersPage({
  searchParams,
}: CustomerTransfersPageProps) {
  const user = await requireServerRole(["CUSTOMER"]);
  const [{ accounts }, resolvedParams] = await Promise.all([
    listCustomerAccounts(user.id),
    searchParams,
  ]);

  return (
    <CustomerTransfersView
      user={user}
      initialAccounts={accounts}
      initialFromAccountId={resolvedParams.from}
    />
  );
}
