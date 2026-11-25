'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { KycVerificationStatus } from '@prisma/client';
import { useGetStaffCustomersQuery } from '@/features/staff/staffApi';
import { StaffVerificationInspectorCard } from '@/features/staff/StaffVerificationInspectorCard';
import type {
  AdminCustomerListItemDTO,
  AdminCustomerSummaryCountsDTO,
} from '@/types/admin.types';
import type { PaginationMeta } from '@/types/api.types';
import { formatCountCompact } from '@/utils/formatters';

interface StaffVerificationViewProps {
  initialCustomers: AdminCustomerListItemDTO[];
  initialSummaryCounts: AdminCustomerSummaryCountsDTO;
  initialMeta: PaginationMeta;
}

function getKycBadgeClasses(status?: KycVerificationStatus | null): string {
  switch (status) {
    case 'VERIFIED':
      return 'border-border bg-status-success-bg text-status-success';
    case 'REJECTED':
      return 'border-border bg-status-danger-bg text-status-danger';
    case 'PENDING':
    default:
      return 'border-accent-border bg-accent-subtle text-accent';
  }
}

export function StaffVerificationView({
  initialCustomers,
  initialSummaryCounts,
  initialMeta,
}: StaffVerificationViewProps) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [kycFilter, setKycFilter] = useState<'ALL' | KycVerificationStatus>(
    'PENDING',
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    initialCustomers[0]?.id ?? null,
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
      limit: 8,
      search: debouncedSearch || undefined,
      kycStatus: kycFilter === 'ALL' ? undefined : kycFilter,
    }),
    [page, debouncedSearch, kycFilter],
  );

  const { data: customersResponse, isFetching } =
    useGetStaffCustomersQuery(queryArgs);

  const customers = customersResponse?.data?.customers ?? initialCustomers;
  const summaryCounts =
    customersResponse?.data?.summaryCounts ?? initialSummaryCounts;
  const meta =
    (customersResponse?.meta as PaginationMeta | undefined) ?? initialMeta;

  const selectedCustomerSummary = useMemo(() => {
    if (customers.length === 0) return null;
    const found = customers.find((c) => c.id === selectedCustomerId);
    return found ?? customers[0];
  }, [customers, selectedCustomerId]);

  return (
    <div className="space-y-6">
      {/* Top Executive Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            IDENTITY COMPLIANCE // KYC VERIFICATION
          </p>
          <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
            Customer KYC Verification
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-text-secondary sm:text-sm">
            Review customer identity profiles, verify residency and employment
            information, and approve or reject KYC eligibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              CUSTOMERS
            </span>
            <span className="font-mono font-semibold text-text-primary">
              {formatCountCompact(summaryCounts.totalCustomers)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              ACTIVE
            </span>
            <span className="font-mono font-semibold text-status-success">
              {formatCountCompact(summaryCounts.activeCustomers)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface-inner p-1 text-xs">
          {(['PENDING', 'VERIFIED', 'REJECTED', 'ALL'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setKycFilter(tab);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                kycFilter === tab
                  ? 'bg-btn-primary text-btn-primary-text'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab === 'ALL' ? 'All Customers' : tab}
            </button>
          ))}
        </div>

        <div className="relative flex-1 lg:max-w-md">
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
            placeholder="Search by Name, Email, Customer Code, or Phone..."
            className="w-full rounded-lg border border-border bg-surface-inner py-2 pl-9 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {/* Main Split Grid: 7 Cols KYC Queue + 5 Cols Inspector */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="flex flex-col rounded-xl border border-border bg-surface xl:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3.5">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                KYC Verification Queue
              </h2>
              <p className="text-[11px] text-text-muted">
                Displaying {customers.length} of {meta.total} matching customers
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
            <table className="w-full min-w-[600px] text-left">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-inner/60 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">KYC Status</th>
                  <th className="px-4 py-3 text-right">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-xs">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center">
                      <p className="text-sm font-medium text-text-primary">
                        No customers in this KYC filter
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        Switch tabs above to inspect verified or rejected
                        profiles.
                      </p>
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => {
                    const isSelected = selectedCustomerSummary?.id === customer.id;
                    return (
                      <tr
                        key={customer.id}
                        onClick={() => setSelectedCustomerId(customer.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-surface-hover/80'
                            : 'hover:bg-surface-hover/40'
                        }`}
                      >
                        <td className="px-4 py-3.5 align-top">
                          <p className="font-semibold text-text-primary">
                            {customer.fullName}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] text-accent">
                            {customer.customerProfile?.customerCode ?? 'NO CODE'}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 align-top">
                          <p className="truncate text-text-primary">
                            {customer.email}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] text-text-muted">
                            {customer.customerProfile?.phone ?? '—'}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 align-top">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getKycBadgeClasses(
                              customer.customerProfile?.kycStatus,
                            )}`}
                          >
                            {customer.customerProfile?.kycStatus ?? 'PENDING'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right align-top font-mono text-[11px] text-text-muted">
                          {new Date(customer.createdAt).toLocaleDateString()}
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
            <span>KYC Compliance Queue</span>

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

        {/* Right: KYC Verification Inspector */}
        <aside className="xl:col-span-5">
          <StaffVerificationInspectorCard
            selectedCustomerSummary={selectedCustomerSummary}
          />
        </aside>
      </div>
    </div>
  );
}
