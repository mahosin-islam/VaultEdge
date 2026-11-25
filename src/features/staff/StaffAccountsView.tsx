'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { AccountStatus, AccountType } from '@prisma/client';
import {
  useGetStaffAccountsQuery,
  useGetStaffCustomersQuery,
} from '@/features/staff/staffApi';
import { StaffAccountInspectorCard } from '@/features/staff/StaffAccountInspectorCard';
import { StaffCreateAccountModal } from '@/features/staff/StaffCreateAccountModal';
import type {
  AdminBankAccountListItemDTO,
  AdminBankAccountSummaryCountsDTO,
  AdminCustomerListItemDTO,
} from '@/types/admin.types';
import type { PaginationMeta } from '@/types/api.types';
import {
  formatCountCompact,
  formatCurrencyCompact,
  formatCurrencyFull,
} from '@/utils/formatters';

type FilterableAccountType = 'SAVINGS' | 'CURRENT' | 'BUSINESS';

interface StaffAccountsViewProps {
  initialAccounts: AdminBankAccountListItemDTO[];
  initialSummaryCounts: AdminBankAccountSummaryCountsDTO;
  initialMeta: PaginationMeta;
  initialCustomers: AdminCustomerListItemDTO[];
}

function getStatusBadgeClasses(status: AccountStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'border-border bg-status-success-bg text-status-success';
    case 'FROZEN':
      return 'border-border bg-status-info-bg text-status-info';
    case 'BLOCKED':
      return 'border-border bg-status-danger-bg text-status-danger';
    case 'INACTIVE':
    default:
      return 'border-border bg-surface-inner text-text-muted';
  }
}

function getAccountTypeLabel(type: AccountType): string {
  switch (type) {
    case 'SAVINGS':
      return 'Savings Vault';
    case 'CURRENT':
      return 'Current Account';
    case 'BUSINESS':
      return 'Business Treasury';
    default:
      return type;
  }
}

export function StaffAccountsView({
  initialAccounts,
  initialSummaryCounts,
  initialMeta,
  initialCustomers,
}: StaffAccountsViewProps) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState<
    'ALL' | FilterableAccountType
  >('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AccountStatus>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    initialAccounts[0]?.id ?? null,
  );
  const [createModalOpen, setCreateModalOpen] = useState(false);

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
      accountType: accountTypeFilter === 'ALL' ? undefined : accountTypeFilter,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
    }),
    [page, debouncedSearch, accountTypeFilter, statusFilter],
  );

  const { data: accountsResponse, isFetching } =
    useGetStaffAccountsQuery(queryArgs);
  const { data: customersResponse } = useGetStaffCustomersQuery({
    page: 1,
    limit: 50,
  });

  const accounts = accountsResponse?.data?.accounts ?? initialAccounts;
  const summaryCounts =
    accountsResponse?.data?.summaryCounts ?? initialSummaryCounts;
  const meta =
    (accountsResponse?.meta as PaginationMeta | undefined) ?? initialMeta;
  const customers = customersResponse?.data?.customers ?? initialCustomers;

  const selectedAccountSummary = useMemo(() => {
    if (accounts.length === 0) return null;
    const found = accounts.find((a) => a.id === selectedAccountId);
    return found ?? accounts[0];
  }, [accounts, selectedAccountId]);

  const handleExportCsv = () => {
    const headers = [
      'Account Number',
      'Account Title',
      'Type',
      'Status',
      'Currency',
      'Balance',
      'Owner Name',
      'Owner Email',
    ];
    const rows = accounts.map((acc) => [
      acc.accountNumber,
      acc.accountTitle,
      acc.accountType,
      acc.status,
      acc.currency,
      acc.balance,
      acc.owner?.fullName ?? 'Unassigned',
      acc.owner?.email ?? 'N/A',
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
    anchor.download = `vaultedge-staff-accounts-page-${meta.page}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Executive Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            ACCOUNT OPERATIONS // VAULT PROVISIONING
          </p>
          <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
            Customer Account Management
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-text-secondary sm:text-sm">
            Open Savings, Current, and Business bank accounts for verified
            customers and inspect account balances, limits, and ledger history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                TOTAL
              </span>
              <span className="font-mono font-semibold text-text-primary">
                {formatCountCompact(summaryCounts.totalAccounts)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                ACTIVE
              </span>
              <span className="font-mono font-semibold text-status-success">
                {formatCountCompact(summaryCounts.activeAccounts)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                LIQUIDITY
              </span>
              <span className="font-mono font-semibold text-text-primary">
                {formatCurrencyCompact(summaryCounts.totalLiquidity)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-btn-primary px-4 py-2 text-xs font-semibold text-btn-primary-text shadow-sm transition-colors hover:bg-btn-primary-hover"
          >
            + Open Bank Account
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
            placeholder="Search by Account Number, Title, or Holder Name / Email..."
            className="w-full rounded-lg border border-border bg-surface-inner py-2 pl-9 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-border bg-surface-inner px-3 py-1.5 text-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              TYPE:
            </span>
            <select
              value={accountTypeFilter}
              onChange={(e) => {
                setAccountTypeFilter(
                  e.target.value as 'ALL' | FilterableAccountType,
                );
                setPage(1);
              }}
              className="bg-transparent text-xs font-medium text-text-primary focus:outline-none"
            >
              <option value="ALL" className="bg-surface text-text-primary">
                All Types
              </option>
              <option value="SAVINGS" className="bg-surface text-text-primary">
                Savings
              </option>
              <option value="CURRENT" className="bg-surface text-text-primary">
                Current
              </option>
              <option value="BUSINESS" className="bg-surface text-text-primary">
                Business
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
                setStatusFilter(e.target.value as 'ALL' | AccountStatus);
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
              <option value="FROZEN" className="bg-surface text-text-primary">
                Frozen
              </option>
              <option value="INACTIVE" className="bg-surface text-text-primary">
                Inactive
              </option>
              <option value="BLOCKED" className="bg-surface text-text-primary">
                Blocked
              </option>
            </select>
          </label>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={accounts.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-inner px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Main Split Grid: 7 Cols Accounts Ledger + 5 Cols Account Inspector */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="flex flex-col rounded-xl border border-border bg-surface xl:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3.5">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Customer Bank Accounts Directory
              </h2>
              <p className="text-[11px] text-text-muted">
                Displaying {accounts.length} of {meta.total} registered vaults
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-text-muted">
              <span
                className={`h-2 w-2 rounded-full ${
                  isFetching ? 'animate-pulse bg-accent' : 'bg-status-success'
                }`}
              />
              <span>{isFetching ? 'Syncing accounts...' : 'Live Sync'}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-inner/60 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  <th className="px-4 py-3">Account &amp; Title</th>
                  <th className="px-4 py-3">Holder</th>
                  <th className="px-4 py-3">Type / Status</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-xs">
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center">
                      <p className="text-sm font-medium text-text-primary">
                        No bank accounts found
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        Click &ldquo;+ Open Bank Account&rdquo; to provision a new
                        account for an active customer.
                      </p>
                    </td>
                  </tr>
                ) : (
                  accounts.map((account) => {
                    const isSelected = selectedAccountSummary?.id === account.id;
                    return (
                      <tr
                        key={account.id}
                        onClick={() => setSelectedAccountId(account.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-surface-hover/80'
                            : 'hover:bg-surface-hover/40'
                        }`}
                      >
                        <td className="px-4 py-3.5 align-top">
                          <span className="font-mono text-xs font-semibold text-text-primary">
                            {account.accountNumber}
                          </span>
                          <p className="mt-0.5 truncate text-xs text-text-secondary">
                            {account.accountTitle}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 align-top">
                          <p className="font-medium text-text-primary">
                            {account.owner?.fullName ?? 'Unassigned'}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-text-muted">
                            {account.owner?.email ?? '—'}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 align-top">
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-[11px] font-medium text-text-secondary">
                              {getAccountTypeLabel(account.accountType)}
                            </span>
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getStatusBadgeClasses(
                                account.status,
                              )}`}
                            >
                              {account.status}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-right align-top">
                          <p className="font-mono text-sm font-semibold text-text-primary">
                            {formatCurrencyFull(account.balance)}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] text-text-muted">
                            {account.currency}
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
            <span>Staff Account Provisioning</span>

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

        {/* Right: Read-Only Account Inspector */}
        <aside className="xl:col-span-5">
          <StaffAccountInspectorCard
            selectedAccountSummary={selectedAccountSummary}
          />
        </aside>
      </div>

      {/* Create Bank Account Modal */}
      <StaffCreateAccountModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        customers={customers}
        defaultSelectedCustomerId={selectedAccountSummary?.owner?.id ?? null}
        onSuccess={(newId) => {
          setSelectedAccountId(newId);
          setPage(1);
        }}
      />
    </div>
  );
}
