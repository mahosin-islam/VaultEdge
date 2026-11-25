'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { KycVerificationStatus, UserStatus } from '@prisma/client';
import { useGetStaffCustomersQuery } from '@/features/staff/staffApi';
import { StaffCustomerInspectorCard } from '@/features/staff/StaffCustomerInspectorCard';
import { StaffRegisterCustomerModal } from '@/features/staff/StaffRegisterCustomerModal';
import type {
  AdminCustomerListItemDTO,
  AdminCustomerSummaryCountsDTO,
} from '@/types/admin.types';
import type { PaginationMeta } from '@/types/api.types';
import { formatCountCompact, formatCurrencyFull } from '@/utils/formatters';

interface StaffCustomersViewProps {
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

export function StaffCustomersView({
  initialCustomers,
  initialSummaryCounts,
  initialMeta,
}: StaffCustomersViewProps) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL');
  const [kycFilter, setKycFilter] = useState<'ALL' | KycVerificationStatus>('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    initialCustomers[0]?.id ?? null,
  );
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

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
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      kycStatus: kycFilter === 'ALL' ? undefined : kycFilter,
    }),
    [page, debouncedSearch, statusFilter, kycFilter],
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

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setStatusFilter('ALL');
    setKycFilter('ALL');
    setPage(1);
  };

  const handleExportCsv = () => {
    const headers = [
      'Customer Code',
      'Full Name',
      'Email',
      'Phone',
      'Status',
      'KYC Status',
      'Accounts Count',
      'Total Balance',
    ];
    const rows = customers.map((c) => [
      c.customerProfile?.customerCode ?? 'N/A',
      c.fullName,
      c.email,
      c.customerProfile?.phone ?? 'N/A',
      c.status,
      c.customerProfile?.kycStatus ?? 'PENDING',
      c.accountsCount,
      c.totalBalance,
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
    anchor.download = `vaultedge-staff-customers-page-${meta.page}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Executive Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            CUSTOMER ONBOARDING // DIRECTORY
          </p>
          <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
            Customer Registration &amp; Management
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-text-secondary sm:text-sm">
            Onboard new retail and business banking customers, search registered
            profiles, and inspect linked accounts and KYC status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* KPI Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                TOTAL
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

            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-status-danger" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                FLAGGED
              </span>
              <span className="font-mono font-semibold text-status-danger">
                {formatCountCompact(summaryCounts.flaggedOrBlockedCustomers)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setRegisterModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-btn-primary px-4 py-2 text-xs font-semibold text-btn-primary-text shadow-sm transition-colors hover:bg-btn-primary-hover"
          >
            + Register Customer
          </button>
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
            placeholder="Search by Customer Name, Email, Code (CUS-...), or Phone..."
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
                setStatusFilter(e.target.value as 'ALL' | UserStatus);
                setPage(1);
              }}
              className="bg-transparent text-xs font-medium text-text-primary focus:outline-none"
            >
              <option value="ALL" className="bg-surface text-text-primary">
                All Statuses
              </option>
              <option value="ACTIVE" className="bg-surface text-text-primary">
                Active
              </option>
              <option value="DEACTIVATED" className="bg-surface text-text-primary">
                Deactivated
              </option>
              <option value="BLOCKED" className="bg-surface text-text-primary">
                Blocked
              </option>
            </select>
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-border bg-surface-inner px-3 py-1.5 text-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              KYC:
            </span>
            <select
              value={kycFilter}
              onChange={(e) => {
                setKycFilter(e.target.value as 'ALL' | KycVerificationStatus);
                setPage(1);
              }}
              className="bg-transparent text-xs font-medium text-text-primary focus:outline-none"
            >
              <option value="ALL" className="bg-surface text-text-primary">
                All KYC
              </option>
              <option value="PENDING" className="bg-surface text-text-primary">
                Pending
              </option>
              <option value="VERIFIED" className="bg-surface text-text-primary">
                Verified
              </option>
              <option value="REJECTED" className="bg-surface text-text-primary">
                Rejected
              </option>
            </select>
          </label>

          {(searchInput || statusFilter !== 'ALL' || kycFilter !== 'ALL') && (
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
            disabled={customers.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-inner px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Main Split Grid: 7 Cols Directory + 5 Cols Customer Dossier Inspector */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="flex flex-col rounded-xl border border-border bg-surface xl:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3.5">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Registered Customer Directory
              </h2>
              <p className="text-[11px] text-text-muted">
                Displaying {customers.length} of {meta.total} customers
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-text-muted">
              <span
                className={`h-2 w-2 rounded-full ${
                  isFetching ? 'animate-pulse bg-accent' : 'bg-status-success'
                }`}
              />
              <span>{isFetching ? 'Syncing directory...' : 'Live Sync'}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-inner/60 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">KYC / Status</th>
                  <th className="px-4 py-3 text-right">Accounts &amp; Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-xs">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center">
                      <p className="text-sm font-medium text-text-primary">
                        No customers match your filters
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        Click &ldquo;+ Register Customer&rdquo; to onboard a new
                        customer profile.
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
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getKycBadgeClasses(
                                customer.customerProfile?.kycStatus,
                              )}`}
                            >
                              {customer.customerProfile?.kycStatus ?? 'PENDING'}
                            </span>
                            <span className="font-mono text-[10px] text-text-muted">
                              {customer.status}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-right align-top">
                          <p className="font-mono text-sm font-semibold text-text-primary">
                            {formatCurrencyFull(customer.totalBalance)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-text-muted">
                            {customer.accountsCount}{' '}
                            {customer.accountsCount === 1 ? 'account' : 'accounts'}
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
            <span>Staff Customer Operations</span>

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

        {/* Right: Customer Dossier Inspector */}
        <aside className="xl:col-span-5">
          <StaffCustomerInspectorCard
            selectedCustomerSummary={selectedCustomerSummary}
          />
        </aside>
      </div>

      {/* Register New Customer Modal */}
      <StaffRegisterCustomerModal
        open={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSuccess={(newId) => {
          setSelectedCustomerId(newId);
          setPage(1);
        }}
      />
    </div>
  );
}
