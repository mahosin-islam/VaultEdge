'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { RequestStatus } from '@prisma/client';
import { useGetAdminDepositsQuery } from '@/features/admin/adminApi';
import { AdminDepositInspectorCard } from '@/features/admin/AdminDepositInspectorCard';
import type {
  AdminDepositRequestItemDTO,
  AdminDepositSummaryCountsDTO,
} from '@/types/admin.types';
import type { PaginationMeta } from '@/types/api.types';
import {
  formatCountCompact,
  formatCurrencyCompact,
  formatCurrencyFull,
  formatTimeStampHMS,
} from '@/utils/formatters';

interface AdminDepositsViewProps {
  initialDeposits: AdminDepositRequestItemDTO[];
  initialSummaryCounts: AdminDepositSummaryCountsDTO;
  initialMeta: PaginationMeta;
}

function getStatusBadgeClasses(status: RequestStatus): string {
  switch (status) {
    case 'APPROVED':
      return 'border-border bg-status-success-bg text-status-success';
    case 'PENDING':
      return 'border-accent-border bg-accent-subtle text-accent';
    case 'REJECTED':
    default:
      return 'border-border bg-status-danger-bg text-status-danger';
  }
}

function getStatusDotClasses(status: RequestStatus): string {
  switch (status) {
    case 'APPROVED':
      return 'bg-status-success';
    case 'PENDING':
      return 'bg-accent';
    case 'REJECTED':
    default:
      return 'bg-status-danger';
  }
}

export function AdminDepositsView({
  initialDeposits,
  initialSummaryCounts,
  initialMeta,
}: AdminDepositsViewProps) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | RequestStatus>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDepositId, setSelectedDepositId] = useState<string | null>(
    initialDeposits[0]?.id ?? null,
  );

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
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      startDate: startDate ? `${startDate}T00:00:00.000Z` : undefined,
      endDate: endDate ? `${endDate}T23:59:59.999Z` : undefined,
    }),
    [page, debouncedSearch, statusFilter, startDate, endDate],
  );

  const { data: depositsResponse, isFetching } = useGetAdminDepositsQuery(queryArgs);

  const depositRequests = depositsResponse?.data?.depositRequests ?? initialDeposits;
  const summaryCounts = depositsResponse?.data?.summaryCounts ?? initialSummaryCounts;
  const meta = (depositsResponse?.meta as PaginationMeta | undefined) ?? initialMeta;

  const selectedDepositSummary = useMemo(() => {
    if (depositRequests.length === 0) return null;
    const found = depositRequests.find((d) => d.id === selectedDepositId);
    return found ?? depositRequests[0];
  }, [depositRequests, selectedDepositId]);

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setStatusFilter('ALL');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleExportCsv = () => {
    const headers = [
      'Request Reference',
      'Status',
      'Amount',
      'Currency',
      'Account Number',
      'Account Title',
      'Customer Name',
      'Customer Email',
      'Requested At',
      'Reviewed At',
      'Review Note',
    ];
    const rows = depositRequests.map((req) => [
      req.requestReference,
      req.status,
      req.amount,
      req.account.currency,
      req.account.accountNumber,
      req.account.accountTitle,
      req.customer.fullName,
      req.customer.email,
      req.requestedAt,
      req.reviewedAt ?? '',
      req.reviewNote ?? '',
    ]);
    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','),
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `vaultedge-deposit-requests-page-${meta.page}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Executive Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            TREASURY INFLOW QUEUE / DEPOSIT SETTLEMENT
          </p>
          <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
            Deposit Requests Management
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-text-secondary sm:text-sm">
            Review incoming customer deposit submissions, verify target vault standing,
            and atomically credit funds with double-entry treasury settlement.
          </p>
        </div>

        {/* KPI Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              TOTAL
            </span>
            <span className="font-mono font-semibold text-text-primary">
              {formatCountCompact(summaryCounts.totalRequests)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              PENDING
            </span>
            <span className="font-mono font-semibold text-accent">
              {formatCountCompact(summaryCounts.pendingCount)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              APPROVED
            </span>
            <span className="font-mono font-semibold text-status-success">
              {formatCountCompact(summaryCounts.approvedCount)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              CREDITED
            </span>
            <span className="font-mono font-semibold text-text-primary">
              {formatCurrencyCompact(summaryCounts.totalApprovedVolume)}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3.5">
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
              placeholder="Search by Request Reference, Account Number, Customer Name, or Email..."
              className="w-full rounded-lg border border-border bg-surface-inner py-2 pl-9 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-lg border border-border bg-surface-inner px-3 py-1.5 text-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                STATUS:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'ALL' | RequestStatus);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-medium text-text-primary focus:outline-none"
              >
                <option value="ALL" className="bg-surface text-text-primary">
                  All Statuses
                </option>
                <option value="PENDING" className="bg-surface text-text-primary">
                  Pending Review
                </option>
                <option value="APPROVED" className="bg-surface text-text-primary">
                  Approved
                </option>
                <option value="REJECTED" className="bg-surface text-text-primary">
                  Rejected
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

            {(searchInput || statusFilter !== 'ALL' || startDate || endDate) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-lg border border-border bg-surface-inner px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-hover"
              >
                Reset
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={depositRequests.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-inner px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover disabled:opacity-50"
            >
              <svg
                className="h-3.5 w-3.5 text-accent"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              Audit Export
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Grid: 7 Cols Deposit Queue + 5 Cols Live Inspector */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="flex flex-col rounded-xl border border-border bg-surface xl:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-inner text-accent">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 3v12" />
                  <path d="m8 11 4 4 4-4" />
                  <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  Deposit Settlement Queue
                </h2>
                <p className="text-[11px] text-text-muted">
                  Displaying {depositRequests.length} of {meta.total} deposit requests
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-text-muted">
              <span
                className={`h-2 w-2 rounded-full ${
                  isFetching ? 'animate-pulse bg-accent' : 'bg-status-success'
                }`}
              />
              <span>{isFetching ? 'Syncing queue...' : 'Live Sync'}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[660px] text-left">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-inner/60 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  <th className="px-4 py-3">Request Ref &amp; Time</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Target Vault</th>
                  <th className="px-4 py-3 text-right">Amount &amp; Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-xs">
                {depositRequests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center">
                      <p className="text-sm font-medium text-text-primary">
                        No deposit requests found
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        Deposit requests submitted by customers will appear here for
                        Admin review and credit settlement.
                      </p>
                    </td>
                  </tr>
                ) : (
                  depositRequests.map((req) => {
                    const isSelected = selectedDepositSummary?.id === req.id;
                    return (
                      <tr
                        key={req.id}
                        onClick={() => setSelectedDepositId(req.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-surface-hover/80'
                            : 'hover:bg-surface-hover/40'
                        }`}
                      >
                        <td className="px-4 py-3.5 align-top">
                          <span className="font-mono text-xs font-semibold text-text-primary">
                            {req.requestReference}
                          </span>
                          <p className="mt-0.5 font-mono text-[11px] text-text-muted">
                            {new Date(req.requestedAt).toLocaleDateString()} •{' '}
                            {formatTimeStampHMS(req.requestedAt)}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 align-top">
                          <p className="font-medium text-text-primary">
                            {req.customer.fullName}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-text-muted">
                            {req.customer.email}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 align-top">
                          <p className="font-mono text-xs font-medium text-text-primary">
                            {req.account.accountNumber}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-text-muted">
                            {req.account.accountTitle}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 text-right align-top">
                          <p className="font-mono text-sm font-semibold text-text-primary">
                            {formatCurrencyFull(req.amount)}
                          </p>
                          <span
                            className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getStatusBadgeClasses(
                              req.status,
                            )}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${getStatusDotClasses(
                                req.status,
                              )}`}
                            />
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-[11px] text-text-muted">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent" />
                Pending Review
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-status-success" />
                Approved &amp; Credited
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-status-danger" />
                Rejected
              </span>
            </div>

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

        {/* Right: Live Deposit Inspector */}
        <aside className="xl:col-span-5">
          <AdminDepositInspectorCard
            selectedDepositSummary={selectedDepositSummary}
          />
        </aside>
      </div>
    </div>
  );
}
