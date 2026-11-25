'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { LoanStatus, LoanType } from '@prisma/client';
import { useGetStaffLoansQuery } from '@/features/staff/staffApi';
import { StaffLoanInspectorCard } from '@/features/staff/StaffLoanInspectorCard';
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

interface StaffLoansViewProps {
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

export function StaffLoansView({
  initialLoans,
  initialSummaryCounts,
  initialMeta,
}: StaffLoansViewProps) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loanTypeFilter, setLoanTypeFilter] = useState<'ALL' | LoanType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | LoanStatus>('ALL');
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
    }),
    [page, debouncedSearch, loanTypeFilter, statusFilter],
  );

  const { data: loansResponse, isFetching } = useGetStaffLoansQuery(queryArgs);

  const loans = loansResponse?.data?.loans ?? initialLoans;
  const summaryCounts =
    loansResponse?.data?.summaryCounts ?? initialSummaryCounts;
  const meta =
    (loansResponse?.meta as PaginationMeta | undefined) ?? initialMeta;

  const selectedLoanSummary = useMemo(() => {
    if (loans.length === 0) return null;
    const found = loans.find((l) => l.id === selectedLoanId);
    return found ?? loans[0];
  }, [loans, selectedLoanId]);

  return (
    <div className="space-y-6">
      {/* Top Executive Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            CREDIT ASSISTANCE // STAFF UNDERWRITING
          </p>
          <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
            Loan Application Review
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-text-secondary sm:text-sm">
            Review customer loan applications, verify income &amp; employment
            information, add internal notes, and forward for Admin approval.
          </p>
        </div>

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
              IN REVIEW
            </span>
            <span className="font-mono font-semibold text-accent">
              {formatCountCompact(summaryCounts.pendingReviewCount)}
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

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3.5 lg:flex-row lg:items-center lg:justify-between">
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
            placeholder="Search by Loan Reference, Customer Name, or Email..."
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
              <option
                value="EDUCATION"
                className="bg-surface text-text-primary"
              >
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
              <option
                value="UNDER_REVIEW"
                className="bg-surface text-text-primary"
              >
                Under Review
              </option>
              <option value="ACTIVE" className="bg-surface text-text-primary">
                Active
              </option>
              <option value="APPROVED" className="bg-surface text-text-primary">
                Approved
              </option>
              <option
                value="COMPLETED"
                className="bg-surface text-text-primary"
              >
                Completed
              </option>
              <option value="REJECTED" className="bg-surface text-text-primary">
                Rejected
              </option>
            </select>
          </label>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="flex flex-col rounded-xl border border-border bg-surface xl:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3.5">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Loan Review Queue
              </h2>
              <p className="text-[11px] text-text-muted">
                Displaying {loans.length} of {meta.total} loan applications
              </p>
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
            <table className="w-full min-w-[620px] text-left">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-inner/60 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  <th className="px-4 py-3">Loan Ref &amp; Type</th>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Requested</th>
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
                        Customer loan applications will appear here for staff
                        review and forwarding.
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
                          <span className="font-mono font-semibold text-text-primary">
                            {loan.loanReference}
                          </span>
                          <p className="mt-0.5 text-[11px] text-text-muted">
                            {loan.loanType} • {loan.durationMonths}m
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
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getStatusBadgeClasses(
                              loan.status,
                            )}`}
                          >
                            {loan.status.replaceAll('_', ' ')}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right align-top font-mono text-sm font-semibold text-text-primary">
                          {formatCurrencyFull(loan.requestedAmount)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-[11px] text-text-muted">
            <span>Staff Loan Assistance</span>

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
          <StaffLoanInspectorCard selectedLoanSummary={selectedLoanSummary} />
        </aside>
      </div>
    </div>
  );
}
