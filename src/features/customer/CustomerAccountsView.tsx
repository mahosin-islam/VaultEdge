"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  useGetCustomerAccountDetailQuery,
  useGetCustomerAccountsQuery,
} from "@/features/customer/customerApi";
import { CustomerAccountTransactionsPanel } from "@/features/customer/CustomerAccountTransactionsPanel";
import { setCustomerSelectedAccountId } from "@/features/customer/customerSlice";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import type {
  CustomerAccountDetailDTO,
  CustomerAccountStatus,
  CustomerAccountType,
} from "@/types/customer.types";
import { formatCurrencyFull } from "@/utils/formatters";

interface CustomerAccountsViewProps {
  initialAccounts: CustomerAccountDetailDTO[];
}

type AccountTypeFilter = "ALL" | CustomerAccountType;
type AccountStatusFilter = "ALL" | CustomerAccountStatus;

function getAccountStatusClasses(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "border-status-success-border bg-status-success-bg text-status-success";
    case "INACTIVE":
      return "border-status-warning-border bg-status-warning-bg text-status-warning";
    case "FROZEN":
    case "BLOCKED":
    case "CLOSED":
      return "border-status-danger-border bg-status-danger-bg text-status-danger";
    default:
      return "border-status-info-border bg-status-info-bg text-status-info";
  }
}

function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  return `${accountNumber.slice(0, 6)}••••${accountNumber.slice(-4)}`;
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CustomerAccountsView({
  initialAccounts,
}: CustomerAccountsViewProps) {
  const dispatch = useAppDispatch();
  const reduxSelectedId = useAppSelector(
    (state) => state.customer?.selectedAccountId ?? null
  );
  const searchQuery = useAppSelector(
    (state) => state.customer?.searchQuery ?? ""
  )
    .trim()
    .toLowerCase();

  const [typeFilter, setTypeFilter] = useState<AccountTypeFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<AccountStatusFilter>("ALL");
  const [revealNumber, setRevealNumber] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const {
    data: accountsRes,
    isFetching: isAccountsFetching,
    isError: isAccountsError,
    refetch: refetchAccounts,
  } = useGetCustomerAccountsQuery();

  const accounts = accountsRes?.data?.accounts ?? initialAccounts;

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesType =
        typeFilter === "ALL" || acc.accountType === typeFilter;
      const matchesStatus =
        statusFilter === "ALL" || acc.status === statusFilter;
      const matchesSearch =
        !searchQuery ||
        acc.accountTitle.toLowerCase().includes(searchQuery) ||
        acc.accountNumber.toLowerCase().includes(searchQuery) ||
        acc.accountType.toLowerCase().includes(searchQuery);
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [accounts, typeFilter, statusFilter, searchQuery]);

  const activeAccountId = useMemo(() => {
    if (
      reduxSelectedId &&
      filteredAccounts.some((acc) => acc.id === reduxSelectedId)
    ) {
      return reduxSelectedId;
    }
    return filteredAccounts[0]?.id ?? accounts[0]?.id ?? null;
  }, [reduxSelectedId, filteredAccounts, accounts]);

  const {
    data: detailRes,
    isFetching: isDetailFetching,
    isError: isDetailError,
    refetch: refetchDetail,
  } = useGetCustomerAccountDetailQuery(activeAccountId ?? "", {
    skip: !activeAccountId,
  });

  const selectedAccount =
    detailRes?.data?.account ??
    accounts.find((a) => a.id === activeAccountId) ??
    null;

  const summary = useMemo(() => {
    const totalBalance = accounts.reduce(
      (sum, acc) => sum + (Number(acc.balance) || 0),
      0
    );
    const activeCount = accounts.filter((a) => a.status === "ACTIVE").length;
    const restrictedCount = accounts.length - activeCount;
    return {
      totalBalance,
      activeCount,
      restrictedCount,
    };
  }, [accounts]);

  const handleCopyAccountNumber = async (id: string, accountNumber: string) => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1800);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            My Bank Accounts
          </h1>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            View balances, effective transfer limits, account statuses, and
            account-scoped ledger activity across your holdings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/customer/transfers"
            className="rounded-lg bg-btn-primary px-3.5 py-2 text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover"
          >
            Transfer Funds
          </Link>
          <Link
            href="/customer/statements"
            className="rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent"
          >
            Account Statements
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {isAccountsError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-status-danger-border bg-status-danger-bg px-4 py-3 text-xs text-status-danger"
        >
          <span>Unable to refresh your accounts list. Please retry.</span>
          <button
            type="button"
            onClick={() => refetchAccounts()}
            className="rounded-lg border border-status-danger-border bg-surface px-3 py-1 font-semibold text-text-primary"
          >
            Retry
          </button>
        </div>
      ) : null}

      {/* 3 Summary KPIs */}
      <section
        aria-label="Account summary metrics"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            COMBINED AVAILABLE BALANCE
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-text-primary">
            {formatCurrencyFull(summary.totalBalance)}
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Across {accounts.length} owned account(s)
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            ACTIVE ACCOUNTS
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-status-success">
            {summary.activeCount}
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Ready for transfers, deposits &amp; withdrawals
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            FROZEN / RESTRICTED
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-text-primary">
            {summary.restrictedCount}
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {summary.restrictedCount > 0
              ? "Select an account to inspect restriction details"
              : "All accounts in good standing"}
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
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
              onClick={() => setTypeFilter(tab.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                typeFilter === tab.key
                  ? "border border-accent-border bg-accent-subtle text-accent"
                  : "border border-border bg-surface-inner text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {isAccountsFetching ? (
            <span className="font-mono text-[10px] text-accent">
              Syncing...
            </span>
          ) : null}
          <select
            aria-label="Filter by account status"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as AccountStatusFilter)
            }
            className="rounded-lg border border-border bg-surface-inner px-3 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="FROZEN">Frozen</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BLOCKED">Blocked</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Main Master-Detail Layout */}
      {accounts.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <p className="text-base font-semibold text-text-primary">
            No bank accounts opened yet
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Once Bank Staff or Admin opens a Savings, Current, or Business
            account for your profile, it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Left 4 Columns: Account Switcher List */}
          <div className="space-y-3 xl:col-span-4">
            <h2 className="text-sm font-semibold text-text-primary">
              Select Account ({filteredAccounts.length})
            </h2>

            {filteredAccounts.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface p-6 text-center text-xs text-text-muted">
                No accounts match the selected filters.
              </div>
            ) : (
              filteredAccounts.map((acc) => {
                const isSelected = acc.id === selectedAccount?.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      dispatch(setCustomerSelectedAccountId(acc.id));
                      setRevealNumber(false);
                    }}
                    className={`w-full rounded-xl border p-4 text-left transition-colors ${
                      isSelected
                        ? "border-accent bg-accent-subtle"
                        : "border-border bg-surface hover:border-accent-border hover:bg-surface-hover"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                        {acc.accountType}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${getAccountStatusClasses(
                          acc.status
                        )}`}
                      >
                        {acc.status}
                      </span>
                    </div>

                    <p className="mt-1.5 text-sm font-semibold text-text-primary">
                      {acc.accountTitle}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-text-secondary">
                      {maskAccountNumber(acc.accountNumber)}
                    </p>
                    <p className="mt-3 font-mono text-xl font-bold text-text-primary">
                      {formatCurrencyFull(acc.balance)}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          {/* Right 8 Columns: Account Details + Scoped Transactions */}
          <div className="space-y-6 xl:col-span-8">
            {selectedAccount ? (
              <>
                {/* Account Inspector */}
                <section
                  aria-label="Selected account details"
                  className="rounded-xl border border-border bg-surface p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-subtle pb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-accent">
                          {selectedAccount.accountType} ACCOUNT
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold ${getAccountStatusClasses(
                            selectedAccount.status
                          )}`}
                        >
                          {selectedAccount.status}
                        </span>
                        {isDetailFetching ? (
                          <span className="font-mono text-[10px] text-accent">
                            Updating...
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mt-1.5 font-serif text-xl font-bold text-text-primary sm:text-2xl">
                        {selectedAccount.accountTitle}
                      </h2>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-xs text-text-secondary">
                        <span>
                          {revealNumber
                            ? selectedAccount.accountNumber
                            : maskAccountNumber(selectedAccount.accountNumber)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setRevealNumber((v) => !v)}
                          className="rounded border border-border bg-surface-inner px-2 py-0.5 text-[10px] text-text-secondary hover:border-accent hover:text-accent"
                        >
                          {revealNumber ? "Hide" : "Reveal"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyAccountNumber(
                              selectedAccount.id,
                              selectedAccount.accountNumber
                            )
                          }
                          className="rounded border border-border bg-surface-inner px-2 py-0.5 text-[10px] text-text-secondary hover:border-accent hover:text-accent"
                        >
                          {copiedId === selectedAccount.id ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                        AVAILABLE BALANCE ({selectedAccount.currency})
                      </p>
                      <p className="mt-1 font-mono text-2xl font-bold text-text-primary sm:text-3xl">
                        {formatCurrencyFull(selectedAccount.balance)}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-text-muted">
                        Opened {formatDate(selectedAccount.createdAt)}
                      </p>
                    </div>
                  </div>

                  {isDetailError ? (
                    <div className="mt-4 flex items-center justify-between rounded-lg border border-status-danger-border bg-status-danger-bg px-3 py-2 text-xs text-status-danger">
                      <span>Could not refresh live account details.</span>
                      <button
                        type="button"
                        onClick={() => refetchDetail()}
                        className="font-semibold underline"
                      >
                        Retry
                      </button>
                    </div>
                  ) : null}

                  {selectedAccount.frozenReason ? (
                    <div className="mt-4 rounded-lg border border-status-danger-border bg-status-danger-bg p-3 text-xs text-status-danger">
                      <p className="font-semibold">
                        Account Restriction Notice
                      </p>
                      <p className="mt-0.5">{selectedAccount.frozenReason}</p>
                      {selectedAccount.frozenAt ? (
                        <p className="mt-1 font-mono text-[10px]">
                          Effective: {formatDate(selectedAccount.frozenAt)}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Effective Limits */}
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-border-subtle bg-surface-inner p-3.5">
                      <p className="font-mono text-[10px] uppercase text-text-muted">
                        Daily Transfer Limit
                      </p>
                      <p className="mt-1 font-mono text-base font-semibold text-text-primary">
                        {formatCurrencyFull(
                          selectedAccount.effectiveLimits.dailyTransferLimit
                        )}
                      </p>
                    </div>

                    <div className="rounded-lg border border-border-subtle bg-surface-inner p-3.5">
                      <p className="font-mono text-[10px] uppercase text-text-muted">
                        Max Single Transfer
                      </p>
                      <p className="mt-1 font-mono text-base font-semibold text-text-primary">
                        {formatCurrencyFull(
                          selectedAccount.effectiveLimits
                            .maxSingleTransactionLimit
                        )}
                      </p>
                    </div>

                    <div className="rounded-lg border border-border-subtle bg-surface-inner p-3.5">
                      <p className="font-mono text-[10px] uppercase text-text-muted">
                        Min Balance Required
                      </p>
                      <p className="mt-1 font-mono text-base font-semibold text-text-primary">
                        {formatCurrencyFull(
                          selectedAccount.effectiveLimits.minBalanceRequired
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-5 flex flex-wrap items-center gap-2.5">
                    <Link
                      href={`/customer/transfers?from=${selectedAccount.id}`}
                      className="rounded-lg bg-btn-primary px-3.5 py-2 text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover"
                    >
                      Transfer from Account
                    </Link>
                    <Link
                      href={`/customer/deposit-requests?accountId=${selectedAccount.id}`}
                      className="rounded-lg border border-border bg-surface-inner px-3.5 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent"
                    >
                      Request Deposit
                    </Link>
                    <Link
                      href={`/customer/withdrawal-requests?accountId=${selectedAccount.id}`}
                      className="rounded-lg border border-border bg-surface-inner px-3.5 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent"
                    >
                      Request Withdrawal
                    </Link>
                    <Link
                      href={`/customer/statements?accountId=${selectedAccount.id}`}
                      className="rounded-lg border border-border bg-surface-inner px-3.5 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent"
                    >
                      Export Statement
                    </Link>
                  </div>
                </section>

                {/* Scoped Account Transactions */}
                <CustomerAccountTransactionsPanel
                  key={selectedAccount.id}
                  accountId={selectedAccount.id}
                  accountNumber={selectedAccount.accountNumber}
                />
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
