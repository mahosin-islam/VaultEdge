import { requireServerRole } from "@/server/auth/session";
import {
  getCustomerAccountStatement,
  listCustomerAccounts,
} from "@/server/services/customer-banking.service";
import { CustomerStatementsView } from "@/features/customer/CustomerStatementsView";

interface CustomerStatementsPageProps {
  searchParams: Promise<{ accountId?: string }>;
}

export default async function CustomerStatementsPage({
  searchParams,
}: CustomerStatementsPageProps) {
  const user = await requireServerRole(["CUSTOMER"]);
  const [{ accounts }, resolvedParams] = await Promise.all([
    listCustomerAccounts(user.id),
    searchParams,
  ]);

  const targetAccountId =
    resolvedParams.accountId &&
    accounts.some((a) => a.id === resolvedParams.accountId)
      ? resolvedParams.accountId
      : accounts[0]?.id;

  let initialStatement = null;
  if (targetAccountId) {
    const res = await getCustomerAccountStatement(user.id, {
      accountId: targetAccountId,
      format: "json",
    });
    if (res.format === "json") {
      initialStatement = res.statement;
    }
  }

  return (
    <CustomerStatementsView
      initialAccounts={accounts}
      initialStatement={initialStatement}
      initialAccountId={targetAccountId}
    />
  );
}
