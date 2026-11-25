"use client";

import { useState } from "react";
import { useGetCustomerAccountTransactionsQuery } from "@/features/customer/customerApi";
import { formatCurrencyFull } from "@/utils/formatters";

interface CustomerAccountTransactionsPanelProps {
  accountId: string;
  accountNumber: string;
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

function formatDateTime(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CustomerAccountTransactionsPanel({
  accountId,
  accountNumber,
}: CustomerAccountTransactionsPanelProps) {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, isLoading, isFetching, isError, refetch } =
    useGetCustomerAccountTransactionsQuery({
      accountId,
      page,
      limit: 8,
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    });

  const transactions = data?.data?.transactions ?? [];
  const meta = data?.meta as
    | { page?: number; totalPages?: number; total?: number }
    | undefined;

  const currentPage = meta?.page ?? page;
  const totalPages = meta?.totalPages ?? 1;
  const totalCount = meta?.total ?? transactions.length;

  const handleResetFilters = () => {
    setTypeFilter("");
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <section
      aria-label="Account transaction ledger"
      className="rounded-xl border border-border bg-surface p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            Account Transaction History
          </h3>
          <p className="text-xs text-text-muted">
            Scoped ledger entries for{" "}
            <span className="font-mono text-text-secondary">
              {accountNumber}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isFetching ? (
            <span className="font-mono text-[10px] text-accent">
              Refreshing...
            </span>
          ) : null}
          <span className="rounded-md border border-border bg-surface-inner px-2.5 py-1 font-mono text-[10px] text-text-secondary">
            {totalCount} record(s)
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
        <select
          aria-label="Filter by transaction type"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-border bg-surface-inner px-3 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="FUND_TRANSFER">Fund Transfer</option>
          <option value="DEPOSIT">Deposit</option>
          <option value="WITHDRAWAL">Withdrawal</option>
          <option value="LOAN_DISBURSEMENT">Loan Disbursement</option>
          <option value="LOAN_REPAYMENT">Loan Repayment</option>
        </select>

        <select
          aria-label="Filter by transaction status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-border bg-surface-inner px-3 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="REVERSED">Reversed</option>
        </select>

        <input
          type="date"
          aria-label="Start date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-border bg-surface-inner px-3 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
        />

        <input
          type="date"
          aria-label="End date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-border bg-surface-inner px-3 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
        />

        <button
          type="button"
          onClick={handleResetFilters}
          className="rounded-lg border border-border bg-surface-inner px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-text-primary"
        >
          Reset Filters
        </button>
      </div>

      {/* States */}
      {isError ? (
        <div
          role="alert"
          className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-status-danger-border bg-status-danger-bg p-3 text-xs text-status-danger"
        >
          <span>Unable to load transactions for this account.</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded border border-status-danger-border bg-surface px-2.5 py-1 font-semibold text-text-primary"
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="mt-4 space-y-2.5">
          {[1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="h-11 animate-pulse rounded-lg border border-border-subtle bg-surface-inner"
            />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="mt-4 rounded-lg border border-border-subtle bg-surface-inner p-8 text-center">
          <p className="text-xs font-medium text-text-primary">
            No transactions found for this account
          </p>
          <p className="mt-1 text-[11px] text-text-muted">
            Adjust your filters or initiate a transfer or deposit to see ledger
            activity.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead>
                <tr className="border-b border-border-subtle font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  <th className="pb-2.5 pr-3">Reference</th>
                  <th className="pb-2.5 pr-3">Direction</th>
                  <th className="pb-2.5 pr-3">Description &amp; Counterparty</th>
                  <th className="pb-2.5 pr-3 text-right">Amount</th>
                  <th className="pb-2.5 pr-3">Status</th>
                  <th className="pb-2.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {transactions.map((tx) => {
                  const isInbound = tx.direction === "INBOUND";
                  return (
                    <tr
                      key={tx.id}
                      className="transition-colors hover:bg-surface-hover"
                    >
                      <td className="py-3 pr-3 font-mono text-[11px] font-medium text-text-primary">
                        {tx.referenceId}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${
                            isInbound
                              ? "border-status-success-border bg-status-success-bg text-status-success"
                              : "border-accent-border bg-accent-subtle text-accent"
                          }`}
                        >
                          {tx.direction}
                        </span>
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
                      <td className="py-3 pr-3 text-right font-mono font-semibold text-text-primary">
                        <span>
                          {isInbound ? "+" : "-"}
                          {formatCurrencyFull(tx.amount)}
                        </span>
                        {Number(tx.fee) > 0 ? (
                          <span className="block text-[10px] font-normal text-text-muted">
                            Fee: {formatCurrencyFull(tx.fee)}
                          </span>
                        ) : null}
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
                        {formatDateTime(tx.executedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
                  className="rounded-lg border border-border bg-surface-inner px-3 py-1 font-medium text-text-primary transition-colors hover:border-accent disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-border bg-surface-inner px-3 py-1 font-medium text-text-primary transition-colors hover:border-accent disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
