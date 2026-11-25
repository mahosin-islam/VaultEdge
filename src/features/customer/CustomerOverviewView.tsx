"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  useGetCustomerNotificationsQuery,
  useGetCustomerOverviewQuery,
} from "@/features/customer/customerApi";
import { setCustomerSelectedAccountId } from "@/features/customer/customerSlice";
import { CustomerOverviewAnalytics } from "@/features/customer/CustomerOverviewAnalytics";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import type { SafeUserDTO } from "@/types/auth.types";
import type {
  CustomerAccountType,
  CustomerNotificationDTO,
  CustomerOverviewDashboardDTO,
} from "@/types/customer.types";
import { formatCurrencyFull } from "@/utils/formatters";

interface CustomerOverviewViewProps {
  user: SafeUserDTO;
  initialOverview: CustomerOverviewDashboardDTO;
  initialNotifications: CustomerNotificationDTO[];
  initialUnreadCount: number;
}

type AccountFilterTab = "ALL" | CustomerAccountType;
type TxFilterTab = "ALL" | "FUND_TRANSFER" | "DEPOSIT" | "WITHDRAWAL" | "LOAN";

function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  return `${accountNumber.slice(0, 6)}••••${accountNumber.slice(-4)}`;
}

function formatShortDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case "ACTIVE":
    case "COMPLETED":
    case "APPROVED":
    case "VERIFIED":
      return "border-status-success-border bg-status-success-bg text-status-success";
    case "PENDING":
    case "UNDER_REVIEW":
      return "border-status-warning-border bg-status-warning-bg text-status-warning";
    case "FROZEN":
    case "CLOSED":
    case "FAILED":
    case "REJECTED":
      return "border-status-danger-border bg-status-danger-bg text-status-danger";
    default:
      return "border-status-info-border bg-status-info-bg text-status-info";
  }
}

export function CustomerOverviewView({
  user,
  initialOverview,
  initialNotifications,
  initialUnreadCount,
}: CustomerOverviewViewProps) {
  const dispatch = useAppDispatch();
  const selectedAccountId = useAppSelector(
    (state) => state.customer?.selectedAccountId ?? null
  );
  const searchQuery = useAppSelector(
    (state) => state.customer?.searchQuery ?? ""
  )
    .trim()
    .toLowerCase();

  const [accountTab, setAccountTab] = useState<AccountFilterTab>("ALL");
  const [txTab, setTxTab] = useState<TxFilterTab>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const {
    data: overviewRes,
    isFetching: isOverviewFetching,
    isError: isOverviewError,
    refetch: refetchOverview,
  } = useGetCustomerOverviewQuery(
    selectedAccountId ? { accountId: selectedAccountId, months: 6 } : { months: 6 }
  );

  const {
    data: notifRes,
    isError: isNotifError,
    refetch: refetchNotifs,
  } = useGetCustomerNotificationsQuery({ limit: 4 });

  const overview = overviewRes?.data ?? initialOverview;
  const notifications = notifRes?.data?.notifications ?? initialNotifications;
  const unreadCount = notifRes?.data?.unreadCount ?? initialUnreadCount;

  const { kpis, accounts, activeLoans, recentTransactions, charts } = overview;

  const totalLoanRemaining = useMemo(
    () =>
      activeLoans.reduce(
        (sum, loan) => sum + (Number(loan.remainingBalance) || 0),
        0
      ),
    [activeLoans]
  );

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesTab = accountTab === "ALL" || acc.accountType === accountTab;
      const matchesSearch =
        !searchQuery ||
        acc.accountTitle.toLowerCase().includes(searchQuery) ||
        acc.accountNumber.toLowerCase().includes(searchQuery) ||
        acc.accountType.toLowerCase().includes(searchQuery);
      return matchesTab && matchesSearch;
    });
  }, [accounts, accountTab, searchQuery]);

  const filteredTransactions = useMemo(() => {
    return recentTransactions.filter((tx) => {
      const matchesTab =
        txTab === "ALL" ||
        (txTab === "LOAN"
          ? tx.type === "LOAN_DISBURSEMENT" || tx.type === "LOAN_REPAYMENT"
          : tx.type === txTab);
      const matchesSearch =
        !searchQuery ||
        tx.referenceId.toLowerCase().includes(searchQuery) ||
        (tx.description ?? "").toLowerCase().includes(searchQuery) ||
        tx.type.toLowerCase().includes(searchQuery) ||
        (tx.senderAccount?.accountNumber ?? "")
          .toLowerCase()
          .includes(searchQuery) ||
        (tx.receiverAccount?.accountNumber ?? "")
          .toLowerCase()
          .includes(searchQuery);
      return matchesTab && matchesSearch;
    });
  }, [recentTransactions, txTab, searchQuery]);

  const primaryLoan = activeLoans[0] ?? null;
  const loanSanctioned = Number(primaryLoan?.approvedAmount ?? 0) || 0;
  const loanRemaining = Number(primaryLoan?.remainingBalance ?? 0) || 0;
  const loanRepaid = Math.max(0, loanSanctioned - loanRemaining);
  const loanRepaidPct =
    loanSanctioned > 0
      ? Math.min(100, Math.round((loanRepaid / loanSanctioned) * 100))
      : 0;

  const handleCopyAccountNumber = async (id: string, accountNumber: string) => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1800);
    } catch {
      // Clipboard unavailable
    }
  };

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {isOverviewError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-status-danger-border bg-status-danger-bg px-4 py-3 text-xs text-status-danger"
        >
          <span>
            Unable to refresh your live customer overview data. Please retry.
          </span>
          <button
            type="button"
            onClick={() => refetchOverview()}
            className="rounded-lg border border-status-danger-border bg-surface px-3 py-1 font-semibold text-text-primary transition-colors hover:border-accent"
          >
            Retry
          </button>
        </div>
      ) : null}

      {/* Welcome Header & Quick Actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              Welcome back, {user.firstName}!
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${getStatusBadgeClasses(
                user.customerProfile?.kycStatus ?? "PENDING"
              )}`}
            >
              {user.customerProfile?.kycStatus === "VERIFIED"
                ? "Verified Client"
                : `KYC ${user.customerProfile?.kycStatus ?? "PENDING"}`}
            </span>
            {isOverviewFetching ? (
              <span className="font-mono text-[10px] text-accent">
                Syncing ledger...
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Here is your consolidated financial summary across your VaultEdge
            accounts. All balances are updated in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-[11px] text-text-secondary sm:inline-flex">
            {todayLabel}
          </span>
          <Link
            href="/customer/transfers"
            className="inline-flex items-center gap-1.5 rounded-lg bg-btn-primary px-3.5 py-2 text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover"
          >
            <span>Transfer Funds</span>
          </Link>
          <Link
            href="/customer/deposit-requests"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent"
          >
            <span>+ Deposit</span>
          </Link>
          <Link
            href="/customer/withdrawal-requests"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent"
          >
            <span>↑ Withdraw</span>
          </Link>
          <Link
            href="/customer/statements"
            aria-label="Account Statements"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-surface p-2 text-text-secondary transition-colors hover:border-accent hover:text-accent"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Account Scope Switcher */}
      {accounts.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border-subtle bg-surface-inner px-4 py-2.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            Dashboard Scope:
          </span>
          <button
            type="button"
            onClick={() => dispatch(setCustomerSelectedAccountId(null))}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              selectedAccountId === null
                ? "bg-btn-primary text-btn-primary-text"
                : "border border-border bg-surface text-text-secondary hover:text-text-primary"
            }`}
          >
            All Accounts ({accounts.length})
          </button>
          {accounts.map((acc) => (
            <button
              key={acc.id}
              type="button"
              onClick={() => dispatch(setCustomerSelectedAccountId(acc.id))}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedAccountId === acc.id
                  ? "bg-btn-primary text-btn-primary-text"
                  : "border border-border bg-surface text-text-secondary hover:text-text-primary"
              }`}
            >
              {acc.accountTitle} ({acc.accountNumber.slice(-4)})
            </button>
          ))}
        </div>
      ) : null}

      {/* 4 KPI Cards */}
      <section
        aria-label="Key financial metrics"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            TOTAL AVAILABLE BALANCE
          </p>
          <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-text-primary">
            {formatCurrencyFull(kpis.totalAccountBalance)}
          </p>
          <p className="mt-2 text-xs text-text-secondary">
            Across {kpis.accountsCount} account(s)
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            TOTAL DEPOSITS
          </p>
          <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-text-primary">
            {formatCurrencyFull(kpis.totalDeposits)}
          </p>
          <p className="mt-2 text-xs text-status-success">
            {kpis.totalDepositsCount} completed transaction(s)
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            TOTAL WITHDRAWALS
          </p>
          <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-text-primary">
            {formatCurrencyFull(kpis.totalWithdrawals)}
          </p>
          <p className="mt-2 text-xs text-text-secondary">
            {kpis.totalWithdrawalsCount} completed transaction(s)
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            ACTIVE FACILITY LOANS
          </p>
          <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-text-primary">
            {formatCurrencyFull(totalLoanRemaining)}
          </p>
          <p className="mt-2 text-xs text-accent">
            {kpis.activeLoansCount} Active Loan(s)
          </p>
        </div>
      </section>

      {/* My Accounts Section */}
      <section aria-label="My accounts" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-text-primary">
              My Accounts
            </h2>
            <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 font-mono text-[10px] text-text-secondary">
              {accounts.length} Total
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { key: "ALL", label: `All (${accounts.length})` },
                { key: "SAVINGS", label: "Savings" },
                { key: "CURRENT", label: "Current" },
                { key: "BUSINESS", label: "Business" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setAccountTab(tab.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  accountTab === tab.key
                    ? "border border-accent-border bg-accent-subtle text-accent"
                    : "border border-border bg-surface text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredAccounts.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className="text-sm font-medium text-text-primary">
              No bank accounts found
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {accounts.length === 0
                ? "Your bank accounts will appear here once opened by Bank Staff or Admin."
                : "Try clearing your account filter or search query."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredAccounts.map((acc) => (
              <div
                key={acc.id}
                className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent-border"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                      {acc.accountType} ACCOUNT
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${getStatusBadgeClasses(
                        acc.status
                      )}`}
                    >
                      {acc.status}
                    </span>
                  </div>

                  <h3 className="mt-2 text-base font-semibold text-text-primary">
                    {acc.accountTitle}
                  </h3>

                  <div className="mt-1.5 flex items-center gap-2 font-mono text-xs text-text-secondary">
                    <span>{maskAccountNumber(acc.accountNumber)}</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyAccountNumber(acc.id, acc.accountNumber)
                      }
                      className="rounded border border-border bg-surface-inner px-1.5 py-0.5 text-[10px] text-text-muted transition-colors hover:border-accent hover:text-accent"
                    >
                      {copiedId === acc.id ? "Copied" : "Copy"}
                    </button>
                  </div>

                  <p className="mt-4 font-mono text-2xl font-bold text-text-primary">
                    {formatCurrencyFull(acc.balance)}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase text-text-muted">
                    Available Balance • {acc.currency}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border-subtle pt-3">
                  <Link
                    href="/customer/accounts"
                    className="text-xs font-medium text-text-secondary transition-colors hover:text-accent"
                  >
                    View Details &rsaquo;
                  </Link>
                  <Link
                    href={`/customer/transfers?from=${acc.id}`}
                    className="rounded-lg bg-btn-primary px-3 py-1.5 text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover"
                  >
                    Transfer
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Action Strip */}
      <section
        aria-label="Quick banking actions"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {[
          {
            title: "Fund Transfer",
            subtitle: "PIN Authenticated",
            href: "/customer/transfers",
          },
          {
            title: "Deposit Money",
            subtitle: "Submit Deposit Request",
            href: "/customer/deposit-requests",
          },
          {
            title: "Withdraw Money",
            subtitle: "Request Payout",
            href: "/customer/withdrawal-requests",
          },
          {
            title: "View Statements",
            subtitle: "Certified PDF / CSV",
            href: "/customer/statements",
          },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="rounded-xl border border-border bg-surface p-4 text-center transition-colors hover:border-accent hover:bg-surface-hover"
          >
            <p className="text-xs font-semibold text-text-primary sm:text-sm">
              {action.title}
            </p>
            <p className="mt-0.5 text-[11px] text-text-muted">
              {action.subtitle}
            </p>
          </Link>
        ))}
      </section>

      {/* Analytics Row from GET /api/v1/customer/overview */}
      <CustomerOverviewAnalytics charts={charts} />

      {/* Main Bottom 2-Column Split */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left 8 Columns: Recent Transactions */}
        <section
          aria-label="Recent transactions"
          className="rounded-xl border border-border bg-surface p-5 xl:col-span-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                Recent Transactions
              </h2>
              <p className="text-xs text-text-muted">
                Audited real-time ledger entries across your holdings
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { key: "ALL", label: "All" },
                  { key: "FUND_TRANSFER", label: "Transfers" },
                  { key: "DEPOSIT", label: "Deposits" },
                  { key: "WITHDRAWAL", label: "Withdrawals" },
                  { key: "LOAN", label: "Loans" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setTxTab(tab.key)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    txTab === tab.key
                      ? "border border-accent-border bg-accent-subtle text-accent"
                      : "border border-border bg-surface-inner text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <Link
                href="/customer/transactions"
                className="ml-1 text-xs font-semibold text-accent hover:underline"
              >
                View All &rarr;
              </Link>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="mt-5 rounded-lg border border-border-subtle bg-surface-inner p-8 text-center text-xs text-text-muted">
              No transactions match the current filter.
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-xs">
                <thead>
                  <tr className="border-b border-border-subtle font-mono text-[10px] uppercase tracking-wider text-text-muted">
                    <th className="pb-2.5 pr-3">Transaction ID</th>
                    <th className="pb-2.5 pr-3">Description &amp; Counterparty</th>
                    <th className="pb-2.5 pr-3">Type</th>
                    <th className="pb-2.5 pr-3 text-right">Amount</th>
                    <th className="pb-2.5 pr-3">Status</th>
                    <th className="pb-2.5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="transition-colors hover:bg-surface-hover"
                    >
                      <td className="py-3 pr-3 font-mono text-[11px] font-medium text-text-primary">
                        {tx.referenceId}
                      </td>
                      <td className="py-3 pr-3">
                        <p className="font-medium text-text-primary">
                          {tx.description || tx.type.replaceAll("_", " ")}
                        </p>
                        <p className="font-mono text-[10px] text-text-muted">
                          {tx.senderAccount?.accountNumber ?? "SYSTEM"} &rarr;{" "}
                          {tx.receiverAccount?.accountNumber ?? "SYSTEM"}
                        </p>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="rounded-md border border-border bg-surface-inner px-2 py-0.5 font-mono text-[10px] text-text-secondary">
                          {tx.type.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-right font-mono font-semibold text-text-primary">
                        {formatCurrencyFull(tx.amount)}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${getStatusBadgeClasses(
                            tx.status
                          )}`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-[11px] text-text-muted">
                        {formatShortDate(tx.executedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Right 4 Columns: Active Loan Facility + Recent Notifications */}
        <div className="space-y-6 xl:col-span-4">
          {/* Active Loan Facility Card */}
          <section
            aria-label="Active loan facility"
            className="rounded-xl border border-border bg-surface p-5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  CREDIT FACILITY
                </p>
                <h2 className="mt-1 text-base font-semibold text-text-primary">
                  Active Loan Facility
                </h2>
              </div>
              {primaryLoan ? (
                <span
                  className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold ${getStatusBadgeClasses(
                    primaryLoan.status
                  )}`}
                >
                  {primaryLoan.status}
                </span>
              ) : null}
            </div>

            {primaryLoan ? (
              <div className="mt-4 space-y-4">
                <p className="text-xs text-text-secondary">
                  {primaryLoan.loanType} Loan •{" "}
                  <span className="font-mono text-text-primary">
                    #{primaryLoan.loanReference}
                  </span>
                </p>

                <div className="grid grid-cols-2 gap-3 rounded-lg border border-border-subtle bg-surface-inner p-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase text-text-muted">
                      Remaining Balance
                    </p>
                    <p className="mt-1 font-mono text-lg font-bold text-text-primary">
                      {formatCurrencyFull(primaryLoan.remainingBalance)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] uppercase text-text-muted">
                      Sanctioned
                    </p>
                    <p className="mt-1 font-mono text-sm font-semibold text-text-secondary">
                      {formatCurrencyFull(primaryLoan.approvedAmount ?? "0")}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[11px] text-text-secondary">
                    <span>
                      Repaid {loanRepaidPct}% ({formatCurrencyFull(loanRepaid)})
                    </span>
                    <span>{100 - loanRepaidPct}% remaining</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-background-secondary">
                    <div
                      style={{ width: `${loanRepaidPct}%` }}
                      className="h-full rounded-full bg-accent transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border-subtle pt-3 text-xs">
                  <span className="text-text-secondary">Monthly EMI</span>
                  <span className="font-mono font-semibold text-text-primary">
                    {primaryLoan.monthlyInstallment
                      ? formatCurrencyFull(primaryLoan.monthlyInstallment)
                      : "—"}
                  </span>
                </div>

                <Link
                  href="/customer/loans"
                  className="block w-full rounded-lg bg-btn-primary py-2.5 text-center text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover"
                >
                  Make Repayment
                </Link>
                <Link
                  href="/customer/loans"
                  className="block text-center text-xs font-medium text-text-secondary hover:text-accent"
                >
                  View Loan Schedule &amp; Details &rarr;
                </Link>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-border-subtle bg-surface-inner p-5 text-center">
                <p className="text-xs font-medium text-text-primary">
                  No active loan facilities
                </p>
                <p className="mt-1 text-[11px] text-text-muted">
                  Apply for a personal, business, or auto loan anytime.
                </p>
                <Link
                  href="/customer/loans"
                  className="mt-3 inline-block rounded-lg border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-accent transition-colors hover:border-accent"
                >
                  Explore Loans &rarr;
                </Link>
              </div>
            )}
          </section>

          {/* Recent Notifications Card */}
          <section
            aria-label="Recent notifications"
            className="rounded-xl border border-border bg-surface p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-text-primary">
                  Recent Notifications
                </h2>
                {unreadCount > 0 ? (
                  <span className="rounded-full bg-accent-subtle px-2 py-0.5 font-mono text-[10px] font-bold text-accent">
                    {unreadCount} new
                  </span>
                ) : null}
              </div>
              <Link
                href="/customer/notifications"
                className="text-xs font-semibold text-accent hover:underline"
              >
                View All
              </Link>
            </div>

            {isNotifError ? (
              <div className="mt-4 rounded-lg border border-status-danger-border bg-status-danger-bg p-3 text-xs text-status-danger">
                <span>Could not load notifications. </span>
                <button
                  type="button"
                  onClick={() => refetchNotifs()}
                  className="font-semibold underline"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="mt-4 rounded-lg border border-border-subtle bg-surface-inner p-5 text-center text-xs text-text-muted">
                No notifications yet.
              </div>
            ) : (
              <div className="mt-4 space-y-2.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-lg border p-3 ${
                      n.isRead
                        ? "border-border-subtle bg-surface-inner"
                        : "border-accent-border bg-accent-subtle"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-text-primary">
                        {n.title}
                      </p>
                      <span className="shrink-0 font-mono text-[10px] text-text-muted">
                        {formatShortDate(n.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] text-text-secondary">
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
