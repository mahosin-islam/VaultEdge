'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { LoanStatus, LoanType } from '@prisma/client';
import { useGetAdminLoansQuery } from '@/features/admin/adminApi';
import { AdminLoanInspectorCard } from '@/features/admin/AdminLoanInspectorCard';
import type {
  AdminLoanListItemDTO,
  AdminLoanSummaryCountsDTO,
} from '@/types/admin.types';
import type { PaginationMeta } from '@/types/api.types';
import {
  formatCountCompact,
  formatCurrencyCompact,
  formatCurrencyFull,
} from '@/utils/formatters';

interface AdminLoansViewProps {
  initialLoans: AdminLoanListItemDTO[];
  initialSummaryCounts: AdminLoanSummaryCountsDTO;
  initialMeta: PaginationMeta;
}

function getStatusBadgeClasses(status: LoanStatus): string {
  switch (status) {
    case 'ACTIVE':
    case 'APPROVED':
    case 'COMPLETED':
      return 'border-border bg-status-success-bg text-status-success';
    case 'PENDING':
    case 'UNDER_REVIEW':
      return 'border-accent-border bg-accent-subtle text-accent';
    case 'REJECTED':
    default:
      return 'border-border bg-status-danger-bg text-status-danger';
  }
}

function getStatusDotClasses(status: LoanStatus): string {
  switch (status) {
    case 'ACTIVE':
    case 'APPROVED':
    case 'COMPLETED':
      return 'bg-status-success';
    case 'PENDING':
    case 'UNDER_REVIEW':
      return 'bg-accent';
    case 'REJECTED':
    default:
      return 'bg-status-danger';
  }
}

function getLoanTypeLabel(type: LoanType): string {
  switch (type) {
    case 'PERSONAL':
      return 'Personal';
    case 'BUSINESS':
      return 'Business';
    case 'EDUCATION':
      return 'Education';
    case 'HOME':
      return 'Home';
    case 'AUTO':
      return 'Auto';
    default:
      return type;
  }
}

export function AdminLoansView({
  initialLoans,
  initialSummaryCounts,
  initialMeta,
}: AdminLoansViewProps) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loanTypeFilter, setLoanTypeFilter] = useState<'ALL' | LoanType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | LoanStatus>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(
    initialLoans[0]?.id ?? null,
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
      loanType: loanTypeFilter === 'ALL' ? undefined : loanTypeFilter,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      startDate: startDate ? `${startDate}T00:00:00.000Z` : undefined,
      endDate: endDate ? `${endDate}T23:59:59.999Z` : undefined,
    }),
    [page, debouncedSearch, loanTypeFilter, statusFilter, startDate, endDate],
  );

  const { data: loansResponse, isFetching } = useGetAdminLoansQuery(queryArgs);

  const loans = loansResponse?.data?.loans ?? initialLoans;
  const summaryCounts = loansResponse?.data?.summaryCounts ?? initialSummaryCounts;
  const meta = (loansResponse?.meta as PaginationMeta | undefined) ?? initialMeta;

  const selectedLoanSummary = useMemo(() => {
    if (loans.length === 0) return null;
    const found = loans.find((l) => l.id === selectedLoanId);
    return found ?? loans[0];
  }, [loans, selectedLoanId]);

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setLoanTypeFilter('ALL');
    setStatusFilter('ALL');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleExportCsv = () => {
    const headers = [
      'Loan Reference',
      'Loan Type',
      'Status',
      'Requested Amount',
      'Approved Amount',
      'Interest Rate',
      'Duration Months',
      'Remaining Balance',
      'Customer Name',
      'Customer Email',
      'Created At',
    ];
    const rows = loans.map((loan) => [
      loan.loanReference,
      loan.loanType,
      loan.status,
      loan.requestedAmount,
      loan.approvedAmount ?? 'Pending',
      loan.interestRate,
      loan.durationMonths,
      loan.remainingBalance,
      loan.customer.fullName,
      loan.customer.email,
      loan.createdAt,
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
    anchor.download = `vaultedge-loans-page-${meta.page}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Executive Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            CREDIT UNDERWRITING / LOAN PORTFOLIO
          </p>
          <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
            Loan Applications &amp; Disbursement
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-text-secondary sm:text-sm">
            Underwrite customer loan facilities, approve &amp; disburse funds with
            automated EMI schedules, and audit repayment histories.
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
              {formatCountCompact(summaryCounts.totalLoans)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              PENDING
            </span>
            <span className="font-mono font-semibold text-accent">
              {formatCountCompact(summaryCounts.pendingReviewCount)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              ACTIVE
            </span>
            <span className="font-mono font-semibold text-status-success">
              {formatCountCompact(summaryCounts.activeCount)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              PORTFOLIO
            </span>
            <span className="font-mono font-semibold text-text-primary">
              {formatCurrencyCompact(summaryCounts.totalDisbursedPortfolio)}
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
              placeholder="Search by Loan Reference, Customer Name, Email, or Purpose..."
              className="w-full rounded-lg border border-border bg-surface-inner py-2 pl-9 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-lg border border-border bg-surface-inner px-3 py-1.5 text-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                TYPE:
              </span>
              <select
                value={loanTypeFilter}
                onChange={(e) => {
                  setLoanTypeFilter(e.target.value as 'ALL' | LoanType);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-medium text-text-primary focus:outline-none"
              >
                <option value="ALL" className="bg-surface text-text-primary">
                  All Types
                </option>
                <option value="PERSONAL" className="bg-surface text-text-primary">
                  Personal
                </option>
                <option value="BUSINESS" className="bg-surface text-text-primary">
                  Business
                </option>
                <option value="EDUCATION" className="bg-surface text-text-primary">
                  Education
                </option>
                <option value="HOME" className="bg-surface text-text-primary">
                  Home
                </option>
                <option value="AUTO" className="bg-surface text-text-primary">
                  Auto
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
                  setStatusFilter(e.target.value as 'ALL' | LoanStatus);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-medium text-text-primary focus:outline-none"
              >
                <option value="ALL" className="bg-surface text-text-primary">
                  All Statuses
                </option>
                <option value="PENDING" className="bg-surface text-text-primary">
                  Pending
                </option>
                <option value="UNDER_REVIEW" className="bg-surface text-text-primary">
                  Under Review
                </option>
                <option value="ACTIVE" className="bg-surface text-text-primary">
                  Active
                </option>
                <option value="APPROVED" className="bg-surface text-text-primary">
                  Approved
                </option>
                <option value="COMPLETED" className="bg-surface text-text-primary">
                  Completed
                </option>
                <option value="REJECTED" className="bg-surface text-text-primary">
                  Rejected
                </option>
              </select>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3">
          <div className="flex flex-wrap items-center gap-2">
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
              loanTypeFilter !== 'ALL' ||
              statusFilter !== 'ALL' ||
              startDate ||
              endDate) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-lg border border-border bg-surface-inner px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-hover"
              >
                Reset Filters
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={loans.length === 0}
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
            Audit Export CSV
          </button>
        </div>
      </div>

      {/* Main Split Grid: 7 Cols Loan Underwriting Queue + 5 Cols Credit Inspector */}
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
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" x2="8" y1="13" y2="13" />
                  <line x1="16" x2="8" y1="17" y2="17" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  Loan Underwriting Queue
                </h2>
                <p className="text-[11px] text-text-muted">
                  Displaying {loans.length} of {meta.total} loan applications
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
                  <th className="px-4 py-3">Loan Ref &amp; Type</th>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Terms &amp; Status</th>
                  <th className="px-4 py-3 text-right">Amount &amp; Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-xs">
                {loans.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center">
                      <p className="text-sm font-medium text-text-primary">
                        No loan applications found
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        Loan applications submitted by customers or forwarded by Bank
                        Staff will appear here for underwriting.
                      </p>
                    </td>
                  </tr>
                ) : (
                  loans.map((loan) => {
                    const isSelected = selectedLoanSummary?.id === loan.id;
                    return (
                      <tr
                        key={loan.id}
                        onClick={() => setSelectedLoanId(loan.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-surface-hover/80'
                            : 'hover:bg-surface-hover/40'
                        }`}
                      >
                        <td className="px-4 py-3.5 align-top">
                          <span className="font-mono text-xs font-semibold text-text-primary">
                            {loan.loanReference}
                          </span>
                          <p className="mt-0.5 text-[11px] text-text-muted">
                            {getLoanTypeLabel(loan.loanType)} •{' '}
                            {new Date(loan.createdAt).toLocaleDateString()}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 align-top">
                          <p className="font-medium text-text-primary">
                            {loan.customer.fullName}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-text-muted">
                            {loan.customer.email}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 align-top">
                          <div className="flex flex-col items-start gap-1.5">
                            <span className="font-mono text-[11px] text-text-secondary">
                              {loan.interestRate}% APR • {loan.durationMonths}m
                            </span>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getStatusBadgeClasses(
                                loan.status,
                              )}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${getStatusDotClasses(
                                  loan.status,
                                )}`}
                              />
                              {loan.status.replaceAll('_', ' ')}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-right align-top">
                          <p className="font-mono text-sm font-semibold text-text-primary">
                            {formatCurrencyFull(
                              loan.approvedAmount ?? loan.requestedAmount,
                            )}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] text-text-muted">
                            Rem: {formatCurrencyFull(loan.remainingBalance)}
                          </p>
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
                Pending / Under Review
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-status-success" />
                Active / Completed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-status-danger" />
                Rejected / Defaulted
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

        {/* Right: Live Credit Inspector */}
        <aside className="xl:col-span-5">
          <AdminLoanInspectorCard selectedLoanSummary={selectedLoanSummary} />
        </aside>
      </div>
    </div>
  );
}
