"use client";

import Link from "next/link";
import { useState } from "react";
import {
  useGetCustomerAccountsQuery,
  useGetCustomerTransactionDetailQuery,
  useGetCustomerTransactionsQuery,
} from "@/features/customer/customerApi";
import { useAppSelector } from "@/hooks/redux";
import type {
  CustomerAccountDetailDTO,
  CustomerOverviewTransactionDTO,
} from "@/types/customer.types";
import { formatCurrencyFull } from "@/utils/formatters";

interface CustomerTransactionsViewProps {
  initialAccounts: CustomerAccountDetailDTO[];
  initialTransactions: CustomerOverviewTransactionDTO[];
  initialTotalCount: number;
}

function getTxStatusBadge(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "border-status-success-border bg-status-success-bg text-status-success";
    case "PENDING":
      return "border-status-warning-border bg-status-warning-bg text-status-warning";
    case "FAILED":
    case "REVERSED":
      return "border-status-danger-border bg-status-danger-bg text-status-danger";
    default:
      return "border-status-info-border bg-status-info-bg text-status-info";
  }
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

export function CustomerTransactionsView({
  initialAccounts,
  initialTransactions,
  initialTotalCount,
}: CustomerTransactionsViewProps) {
  const topbarSearch = useAppSelector(
    (state) => state.customer?.searchQuery ?? ""
  ).trim();

  const [page, setPage] = useState(1);
  const [accountId, setAccountId] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedTxId, setSelectedTxId] = useState<string | null>(
    initialTransactions[0]?.id ?? null
  );

  const effectiveSearch = searchInput.trim() || topbarSearch;

  const { data: accountsRes } = useGetCustomerAccountsQuery();
  const accounts = accountsRes?.data?.accounts ?? initialAccounts;

  const hasFilters = Boolean(
    accountId ||
      typeFilter ||
      statusFilter ||
      effectiveSearch ||
      startDate ||
      endDate ||
      page > 1
  );

  const {
    data: txRes,
    isFetching: isListFetching,
    isError: isListError,
    refetch: refetchList,
  } = useGetCustomerTransactionsQuery({
    page,
    limit: 10,
    ...(accountId ? { accountId } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(effectiveSearch ? { search: effectiveSearch } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  });

  const transactions =
    txRes?.data?.transactions ?? (!hasFilters ? initialTransactions : []);

  const meta = txRes?.meta as
    | { page?: number; totalPages?: number; total?: number }
    | undefined;
  const currentPage = meta?.page ?? page;
  const totalPages =
    meta?.totalPages ?? Math.max(1, Math.ceil(initialTotalCount / 10));
  const totalCount = meta?.total ?? initialTotalCount;

  const activeTxId = selectedTxId ?? transactions[0]?.id ?? null;

  const {
    data: detailRes,
    isFetching: isDetailFetching,
    isError: isDetailError,
    refetch: refetchDetail,
  } = useGetCustomerTransactionDetailQuery(activeTxId ?? "", {
    skip: !activeTxId,
  });

  const inspectedTx = detailRes?.data?.transaction ?? null;

  const handleReset = () => {
    setAccountId("");
    setTypeFilter("");
    setStatusFilter("");
    setSearchInput("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            Transaction History
          </h1>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Search, filter, and inspect immutable double-entry ledger records
            across all your VaultEdge accounts.
          </p>
        </div>

        <Link
          href="/customer/statements"
          className="inline-flex shrink-0 items-center whitespace-nowrap rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent"
        >
          Account Statements &rarr;
        </Link>
      </div>

      {/* Filter Bar */}
      <section
        aria-label="Transaction filters"
        className="rounded-xl border border-border bg-surface p-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <input
            type="text"
            aria-label="Search by reference ID or description"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            placeholder="Search reference or memo..."
            className="rounded-lg border border-border bg-input px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none lg:col-span-2"
          />

          <select
            aria-label="Filter by account"
            value={accountId}
            onChange={(e) => {
              setAccountId(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-input px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
          >
            <option value="">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.accountTitle} ({acc.accountNumber.slice(-4)})
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by type"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-input px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="FUND_TRANSFER">Fund Transfer</option>
            <option value="DEPOSIT">Deposit</option>
            <option value="WITHDRAWAL">Withdrawal</option>
            <option value="LOAN_DISBURSEMENT">Loan Disbursement</option>
            <option value="LOAN_REPAYMENT">Loan Repayment</option>
          </select>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-input px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REVERSED">Reversed</option>
          </select>

          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-border bg-surface-inner px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-text-primary"
          >
            Reset Filters
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-[11px] text-text-muted">
              <span>From:</span>
              <input
                type="date"
                aria-label="Start date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-border bg-input px-2.5 py-1 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-1.5 text-[11px] text-text-muted">
              <span>To:</span>
              <input
                type="date"
                aria-label="End date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-border bg-input px-2.5 py-1 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </label>
          </div>

          <div className="flex items-center gap-2">
            {isListFetching ? (
              <span className="font-mono text-[10px] text-accent">
                Syncing ledger...
              </span>
            ) : null}
            <span className="rounded-md border border-border bg-surface-inner px-2.5 py-1 font-mono text-[10px] text-text-secondary">
              {totalCount} record(s)
            </span>
          </div>
        </div>
      </section>

      {/* Main Split */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left 7 Columns: Ledger Table */}
        <section
          aria-label="Transactions list"
          className="rounded-xl border border-border bg-surface p-5 xl:col-span-7"
        >
          {isListError ? (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 rounded-lg border border-status-danger-border bg-status-danger-bg p-3 text-xs text-status-danger"
            >
              <span>Unable to load transaction history.</span>
              <button
                type="button"
                onClick={() => refetchList()}
                className="rounded border border-status-danger-border bg-surface px-2.5 py-1 font-semibold text-text-primary"
              >
                Retry
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="rounded-lg border border-border-subtle bg-surface-inner p-10 text-center">
              <p className="text-sm font-medium text-text-primary">
                No transactions found
              </p>
              <p className="mt-1 text-xs text-text-muted">
                Adjust your filters or complete a transfer, deposit, or
                withdrawal to see records here.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-border-subtle font-mono text-[10px] uppercase tracking-wider text-text-muted">
                      <th className="pb-2.5 pr-3">Reference</th>
                      <th className="pb-2.5 pr-3">Description &amp; Accounts</th>
                      <th className="pb-2.5 pr-3">Type</th>
                      <th className="pb-2.5 pr-3 text-right">Amount</th>
                      <th className="pb-2.5 pr-3">Status</th>
                      <th className="pb-2.5 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {transactions.map((tx) => {
                      const isSelected = tx.id === activeTxId;
                      return (
                        <tr
                          key={tx.id}
                          onClick={() => setSelectedTxId(tx.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-accent-subtle"
                              : "hover:bg-surface-hover"
                          }`}
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
                              className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${getTxStatusBadge(
                                tx.status
                              )}`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-3 text-right font-mono text-[11px] text-text-muted">
                            {formatDate(tx.executedAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 ? (
                <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3 text-xs">
                  <span className="font-mono text-[11px] text-text-muted">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded-lg border border-border bg-surface-inner px-3 py-1 font-medium text-text-primary hover:border-accent disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="rounded-lg border border-border bg-surface-inner px-3 py-1 font-medium text-text-primary hover:border-accent disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>

        {/* Right 5 Columns: Transaction & Ledger Entry Inspector */}
        <section
          aria-label="Transaction details inspector"
          className="rounded-xl border border-border bg-surface p-5 xl:col-span-5"
        >
          {!activeTxId ? (
            <div className="p-6 text-center text-xs text-text-muted">
              Select a transaction row to inspect its full receipt and
              double-entry ledger postings.
            </div>
          ) : isDetailError ? (
            <div className="rounded-lg border border-status-danger-border bg-status-danger-bg p-3 text-xs text-status-danger">
              <span>Unable to load transaction details. </span>
              <button
                type="button"
                onClick={() => refetchDetail()}
                className="font-semibold underline"
              >
                Retry
              </button>
            </div>
          ) : !inspectedTx ? (
            <div className="space-y-3">
              <div className="h-14 animate-pulse rounded-lg bg-surface-inner" />
              <div className="h-28 animate-pulse rounded-lg bg-surface-inner" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-border-subtle pb-3">
                <div>
                  <p className="font-mono text-[10px] uppercase text-text-muted">
                    TRANSACTION RECEIPT
                  </p>
                  <h2 className="mt-0.5 font-mono text-sm font-bold text-text-primary">
                    {inspectedTx.referenceId}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {isDetailFetching ? (
                    <span className="font-mono text-[10px] text-accent">
                      Syncing...
                    </span>
                  ) : null}
                  <span
                    className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold ${getTxStatusBadge(
                      inspectedTx.status
                    )}`}
                  >
                    {inspectedTx.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-lg border border-border-subtle bg-surface-inner p-3 text-xs">
                <div>
                  <span className="block font-mono text-[9px] uppercase text-text-muted">
                    Amount
                  </span>
                  <span className="font-mono font-bold text-text-primary">
                    {formatCurrencyFull(inspectedTx.amount)}
                  </span>
                </div>
                <div>
                  <span className="block font-mono text-[9px] uppercase text-text-muted">
                    Fee
                  </span>
                  <span className="font-mono font-semibold text-text-secondary">
                    {formatCurrencyFull(inspectedTx.fee)}
                  </span>
                </div>
                <div>
                  <span className="block font-mono text-[9px] uppercase text-text-muted">
                    Total
                  </span>
                  <span className="font-mono font-bold text-text-primary">
                    {formatCurrencyFull(inspectedTx.totalAmount)}
                  </span>
                </div>
              </div>

              <dl className="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-2">
                <div className="rounded-lg border border-border-subtle bg-surface-inner p-2.5">
                  <dt className="font-mono text-[9px] uppercase text-text-muted">
                    Sender
                  </dt>
                  <dd className="mt-0.5 font-medium text-text-primary">
                    {inspectedTx.senderAccount?.accountTitle ?? "System Vault"}
                  </dd>
                  <dd className="font-mono text-[10px] text-text-muted">
                    {inspectedTx.senderAccount?.accountNumber ?? "SYSTEM"}
                  </dd>
                </div>

                <div className="rounded-lg border border-border-subtle bg-surface-inner p-2.5">
                  <dt className="font-mono text-[9px] uppercase text-text-muted">
                    Recipient
                  </dt>
                  <dd className="mt-0.5 font-medium text-text-primary">
                    {inspectedTx.receiverAccount?.accountTitle ??
                      "System Vault"}
                  </dd>
                  <dd className="font-mono text-[10px] text-text-muted">
                    {inspectedTx.receiverAccount?.accountNumber ?? "SYSTEM"}
                  </dd>
                </div>
              </dl>

              <div className="text-xs">
                <p className="font-mono text-[10px] uppercase text-text-muted">
                  Description &amp; Timestamp
                </p>
                <p className="mt-1 text-text-primary">
                  {inspectedTx.description || "—"}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-text-muted">
                  Executed: {new Date(inspectedTx.executedAt).toLocaleString("en-US")}
                </p>
                {inspectedTx.failureReason ? (
                  <p className="mt-2 rounded border border-status-danger-border bg-status-danger-bg px-2.5 py-1.5 text-status-danger">
                    Failure Reason: {inspectedTx.failureReason}
                  </p>
                ) : null}
              </div>

              {/* Customer-Scoped Ledger Entries */}
              <div className="border-t border-border-subtle pt-3">
                <h3 className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  Your Account Ledger Postings ({inspectedTx.ledgerEntries.length})
                </h3>
                {inspectedTx.ledgerEntries.length === 0 ? (
                  <p className="mt-2 text-xs text-text-muted">
                    No direct ledger postings for your accounts on this record.
                  </p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {inspectedTx.ledgerEntries.map((le) => (
                      <div
                        key={le.id}
                        className="rounded-lg border border-border-subtle bg-surface-inner p-2.5 text-[11px]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-semibold text-text-primary">
                            {le.direction} • {le.entryCategory}
                          </span>
                          <span className="font-mono font-bold text-text-primary">
                            {formatCurrencyFull(le.amount)}
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-[10px] text-text-muted">
                          {le.accountTitle} ({le.accountNumber})
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] text-text-secondary">
                          Balance: {formatCurrencyFull(le.balanceBefore)} &rarr;{" "}
                          {formatCurrencyFull(le.balanceAfter)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
