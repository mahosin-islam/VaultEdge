'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { TransactionStatus, TransactionType } from '@prisma/client';
import { useGetStaffTransactionsQuery } from '@/features/staff/staffApi';
import { StaffTransactionInspectorCard } from '@/features/staff/StaffTransactionInspectorCard';
import type {
  AdminTransactionListItemDTO,
  AdminTransactionSummaryCountsDTO,
} from '@/types/admin.types';
import type { PaginationMeta } from '@/types/api.types';
import {
  formatCountCompact,
  formatCurrencyCompact,
  formatCurrencyFull,
  formatTimeStampHMS,
} from '@/utils/formatters';

interface StaffTransactionsViewProps {
  initialTransactions: AdminTransactionListItemDTO[];
  initialSummaryCounts: AdminTransactionSummaryCountsDTO;
  initialMeta: PaginationMeta;
}

function getStatusBadgeClasses(status: TransactionStatus): string {
  switch (status) {
    case 'COMPLETED':
      return 'border-border bg-status-success-bg text-status-success';
    case 'PENDING':
      return 'border-accent-border bg-accent-subtle text-accent';
    case 'REVERSED':
      return 'border-border bg-status-info-bg text-status-info';
    case 'FAILED':
    default:
      return 'border-border bg-status-danger-bg text-status-danger';
  }
}

export function StaffTransactionsView({
  initialTransactions,
  initialSummaryCounts,
  initialMeta,
}: StaffTransactionsViewProps) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TransactionStatus>(
    'ALL',
  );
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(initialTransactions[0]?.id ?? null);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const queryArgs = useMemo(
    () => ({
      page,
      limit: 10,
      search: debouncedSearch || undefined,
      type: typeFilter === 'ALL' ? undefined : typeFilter,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      startDate: startDate ? `${startDate}T00:00:00.000Z` : undefined,
      endDate: endDate ? `${endDate}T23:59:59.999Z` : undefined,
    }),
    [page, debouncedSearch, typeFilter, statusFilter, startDate, endDate],
  );

  const { data: txResponse, isFetching } =
    useGetStaffTransactionsQuery(queryArgs);

  const transactions = txResponse?.data?.transactions ?? initialTransactions;
  const summaryCounts =
    txResponse?.data?.summaryCounts ?? initialSummaryCounts;
  const meta = (txResponse?.meta as PaginationMeta | undefined) ?? initialMeta;

  const selectedTransactionSummary = useMemo(() => {
    if (transactions.length === 0) return null;
    const found = transactions.find((t) => t.id === selectedTransactionId);
    return found ?? transactions[0];
  }, [transactions, selectedTransactionId]);

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Executive Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            TRANSACTION MONITORING // STAFF REVIEW
          </p>
          <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
            Transaction Review &amp; Flagging
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-text-secondary sm:text-sm">
            Search transactions by Transaction ID, filter by date and type,
            review pending settlements, and flag suspicious activity for Admin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              TOTAL
            </span>
            <span className="font-mono font-semibold text-text-primary">
              {formatCountCompact(summaryCounts.totalTransactions)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-status-danger" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              FLAGGED
            </span>
            <span className="font-mono font-semibold text-status-danger">
              {formatCountCompact(summaryCounts.flaggedTransactions)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              VOLUME
            </span>
            <span className="font-mono font-semibold text-text-primary">
              {formatCurrencyCompact(summaryCounts.totalCompletedVolume)}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Multi-Filter Toolbar */}
      <div className="space-y-3 rounded-xl border border-border bg-surface p-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by Transaction ID (Ref), Account Number, or Description..."
              className="w-full rounded-lg border border-border bg-surface-inner py-2 pl-9 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-lg border border-border bg-surface-inner px-3 py-1.5 text-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                TYPE:
              </span>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as 'ALL' | TransactionType);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-medium text-text-primary focus:outline-none"
              >
                <option value="ALL" className="bg-surface text-text-primary">
                  All Types
                </option>
                <option value="DEPOSIT" className="bg-surface text-text-primary">
                  Deposit
                </option>
                <option
                  value="WITHDRAWAL"
                  className="bg-surface text-text-primary"
                >
                  Withdrawal
                </option>
                <option
                  value="FUND_TRANSFER"
                  className="bg-surface text-text-primary"
                >
                  Fund Transfer
                </option>
                <option
                  value="LOAN_DISBURSEMENT"
                  className="bg-surface text-text-primary"
                >
                  Loan Disbursement
                </option>
                <option
                  value="LOAN_REPAYMENT"
                  className="bg-surface text-text-primary"
                >
                  Loan Repayment
                </option>
              </select>
            </label>

            <label className="flex items-center gap-2 rounded-lg border border-border bg-surface-inner px-3 py-1.5 text-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                STATUS:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'ALL' | TransactionStatus);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-medium text-text-primary focus:outline-none"
              >
                <option value="ALL" className="bg-surface text-text-primary">
                  All Statuses
                </option>
                <option
                  value="COMPLETED"
                  className="bg-surface text-text-primary"
                >
                  Completed
                </option>
                <option value="PENDING" className="bg-surface text-text-primary">
                  Pending
                </option>
                <option value="FAILED" className="bg-surface text-text-primary">
                  Failed
                </option>
                <option
                  value="REVERSED"
                  className="bg-surface text-text-primary"
                >
                  Reversed
                </option>
              </select>
            </label>

            <label className="flex items-center gap-2 rounded-lg border border-border bg-surface-inner px-3 py-1.5 text-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                FROM:
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent font-mono text-xs text-text-primary focus:outline-none"
              />
            </label>

            <label className="flex items-center gap-2 rounded-lg border border-border bg-surface-inner px-3 py-1.5 text-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                TO:
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent font-mono text-xs text-text-primary focus:outline-none"
              />
            </label>

            {(searchInput ||
              typeFilter !== 'ALL' ||
              statusFilter !== 'ALL' ||
              startDate ||
              endDate) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-lg border border-border bg-surface-inner px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-hover"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="flex flex-col rounded-xl border border-border bg-surface xl:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3.5">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Transaction Review Ledger
              </h2>
              <p className="text-[11px] text-text-muted">
                Displaying {transactions.length} of {meta.total} transactions
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-text-muted">
              <span
                className={`h-2 w-2 rounded-full ${
                  isFetching ? 'animate-pulse bg-accent' : 'bg-status-success'
                }`}
              />
              <span>{isFetching ? 'Syncing ledger...' : 'Live Sync'}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-inner/60 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  <th className="px-4 py-3">Transaction ID</th>
                  <th className="px-4 py-3">Counterparties</th>
                  <th className="px-4 py-3">Type / Status</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-xs">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center">
                      <p className="text-sm font-medium text-text-primary">
                        No transactions match your filters
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        Try clearing your search or date range filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const isSelected =
                      selectedTransactionSummary?.id === tx.id;
                    return (
                      <tr
                        key={tx.id}
                        onClick={() => setSelectedTransactionId(tx.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-surface-hover/80'
                            : 'hover:bg-surface-hover/40'
                        }`}
                      >
                        <td className="px-4 py-3.5 align-top">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-semibold text-text-primary">
                              {tx.referenceId}
                            </span>
                            {tx.isFlagged ? (
                              <span className="h-2 w-2 rounded-full bg-status-danger" />
                            ) : null}
                          </div>
                          <p className="mt-0.5 font-mono text-[11px] text-text-muted">
                            {new Date(tx.executedAt).toLocaleDateString()} •{' '}
                            {formatTimeStampHMS(tx.executedAt)}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 align-top">
                          <p className="font-mono text-[11px] text-text-primary">
                            {tx.senderAccount?.accountNumber ?? 'System'} →{' '}
                            {tx.receiverAccount?.accountNumber ?? 'System'}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-text-muted">
                            {tx.initiatedBy.fullName}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 align-top">
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-[11px] text-text-secondary">
                              {tx.type.replaceAll('_', ' ')}
                            </span>
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getStatusBadgeClasses(
                                tx.status,
                              )}`}
                            >
                              {tx.status}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-right align-top font-mono text-sm font-semibold text-text-primary">
                          {formatCurrencyFull(tx.amount)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-[11px] text-text-muted">
            <span>Staff Transaction Review</span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={!meta.hasPrevPage}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="rounded-md border border-border bg-surface-inner px-2.5 py-1 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover disabled:opacity-40"
              >
                Prev
              </button>
              <span className="px-2 font-mono text-xs text-text-secondary">
                Page {meta.page} / {Math.max(1, meta.totalPages)}
              </span>
              <button
                type="button"
                disabled={!meta.hasNextPage}
                onClick={() => setPage((prev) => prev + 1)}
                className="rounded-md border border-border bg-surface-inner px-2.5 py-1 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        <aside className="xl:col-span-5">
          <StaffTransactionInspectorCard
            selectedTransactionSummary={selectedTransactionSummary}
          />
        </aside>
      </div>
    </div>
  );
}
