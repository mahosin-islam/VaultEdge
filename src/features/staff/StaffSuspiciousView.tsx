'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { FlagStatus } from '@prisma/client';
import { useGetStaffSuspiciousTransactionsQuery } from '@/features/staff/staffApi';
import { StaffTransactionInspectorCard } from '@/features/staff/StaffTransactionInspectorCard';
import type { AdminTransactionListItemDTO } from '@/types/admin.types';
import type { PaginationMeta } from '@/types/api.types';
import type { StaffSuspiciousFlagItemDTO } from '@/types/staff.types';
import { formatCurrencyFull, formatTimeStampHMS } from '@/utils/formatters';

interface StaffSuspiciousViewProps {
  initialFlags: StaffSuspiciousFlagItemDTO[];
  initialMeta: PaginationMeta;
}

function getFlagStatusBadgeClasses(status: FlagStatus): string {
  switch (status) {
    case 'RESOLVED_SAFE':
      return 'border-border bg-status-success-bg text-status-success';
    case 'CONFIRMED_SUSPICIOUS':
      return 'border-border bg-status-danger-bg text-status-danger';
    case 'UNDER_REVIEW':
      return 'border-border bg-status-info-bg text-status-info';
    case 'OPEN':
    default:
      return 'border-accent-border bg-accent-subtle text-accent';
  }
}

export function StaffSuspiciousView({
  initialFlags,
  initialMeta,
}: StaffSuspiciousViewProps) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | FlagStatus>('ALL');
  const [selectedFlagId, setSelectedFlagId] = useState<string | null>(
    initialFlags[0]?.id ?? null,
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
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      search: debouncedSearch || undefined,
    }),
    [page, statusFilter, debouncedSearch],
  );

  const { data: suspResponse, isFetching } =
    useGetStaffSuspiciousTransactionsQuery(queryArgs);

  const flags = suspResponse?.data?.suspiciousFlags ?? initialFlags;
  const meta =
    (suspResponse?.meta as PaginationMeta | undefined) ?? initialMeta;

  const selectedFlag = useMemo(() => {
    if (flags.length === 0) return null;
    const found = flags.find((f) => f.id === selectedFlagId);
    return found ?? flags[0];
  }, [flags, selectedFlagId]);

  const mappedTxSummary: AdminTransactionListItemDTO | null = useMemo(() => {
    if (!selectedFlag) return null;
    const tx = selectedFlag.transaction;
    return {
      id: tx.id,
      referenceId: tx.referenceId,
      type: tx.type,
      status: tx.status,
      amount: tx.amount,
      fee: tx.fee,
      totalAmount: tx.totalAmount,
      description: selectedFlag.reason,
      failureReason: null,
      isFlagged: true,
      reversedTransactionId: null,
      executedAt: tx.executedAt,
      createdAt: selectedFlag.createdAt,
      senderAccount: tx.senderAccount
        ? {
            id: tx.senderAccount.id,
            accountNumber: tx.senderAccount.accountNumber,
            accountTitle: tx.senderAccount.accountTitle,
            accountType: 'SAVINGS',
            isSystemAccount: false,
            ownerName: null,
          }
        : null,
      receiverAccount: tx.receiverAccount
        ? {
            id: tx.receiverAccount.id,
            accountNumber: tx.receiverAccount.accountNumber,
            accountTitle: tx.receiverAccount.accountTitle,
            accountType: 'SAVINGS',
            isSystemAccount: false,
            ownerName: null,
          }
        : null,
      initiatedBy: {
        id: selectedFlag.flaggedBy?.id ?? 'system',
        fullName: selectedFlag.flaggedBy?.fullName ?? 'Automated Rule Engine',
        email: selectedFlag.flaggedBy?.email ?? 'system@vaultedge.internal',
        role: 'STAFF',
      },
      suspiciousFlagsCount: 1,
      openFlagsCount:
        selectedFlag.status === 'OPEN' || selectedFlag.status === 'UNDER_REVIEW'
          ? 1
          : 0,
    };
  }, [selectedFlag]);

  return (
    <div className="space-y-6">
      {/* Top Executive Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            AML &amp; COMPLIANCE // SUSPICIOUS QUEUE
          </p>
          <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
            Suspicious Transactions Queue
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-text-secondary sm:text-sm">
            Inspect rule-flagged and staff-escalated transactions, review
            double-entry ledger trails, and track Admin compliance resolutions.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface-inner p-1 text-xs">
          {(
            [
              'ALL',
              'OPEN',
              'UNDER_REVIEW',
              'CONFIRMED_SUSPICIOUS',
              'RESOLVED_SAFE',
            ] as const
          ).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setStatusFilter(tab);
                setPage(1);
              }}
              className={`rounded-md px-2.5 py-1.5 font-medium transition-colors ${
                statusFilter === tab
                  ? 'bg-btn-primary text-btn-primary-text'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab === 'ALL' ? 'All Flags' : tab.replaceAll('_', ' ')}
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
            placeholder="Search by Transaction Ref, Rule Code, or Reason..."
            className="w-full rounded-lg border border-border bg-surface-inner py-2 pl-9 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="flex flex-col rounded-xl border border-border bg-surface xl:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3.5">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Flagged Activity Queue
              </h2>
              <p className="text-[11px] text-text-muted">
                Displaying {flags.length} of {meta.total} compliance flags
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
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-inner/60 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  <th className="px-4 py-3">Transaction &amp; Source</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Flag Status</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-xs">
                {flags.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center">
                      <p className="text-sm font-medium text-text-primary">
                        No suspicious flags found
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        Flagged transactions from automated AML rules or staff
                        escalations will appear here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  flags.map((flag) => {
                    const isSelected = selectedFlag?.id === flag.id;
                    return (
                      <tr
                        key={flag.id}
                        onClick={() => setSelectedFlagId(flag.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-surface-hover/80'
                            : 'hover:bg-surface-hover/40'
                        }`}
                      >
                        <td className="px-4 py-3.5 align-top">
                          <span className="font-mono font-semibold text-text-primary">
                            {flag.transaction.referenceId}
                          </span>
                          <p className="mt-0.5 font-mono text-[10px] text-text-muted">
                            {flag.source} • {formatTimeStampHMS(flag.createdAt)}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 align-top">
                          <p className="line-clamp-2 text-text-primary">
                            {flag.reason}
                          </p>
                          {flag.ruleCode ? (
                            <p className="mt-0.5 font-mono text-[10px] text-accent">
                              {flag.ruleCode}
                            </p>
                          ) : null}
                        </td>

                        <td className="px-4 py-3.5 align-top">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getFlagStatusBadgeClasses(
                              flag.status,
                            )}`}
                          >
                            {flag.status.replaceAll('_', ' ')}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right align-top font-mono text-sm font-semibold text-text-primary">
                          {formatCurrencyFull(flag.transaction.amount)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-[11px] text-text-muted">
            <span>AML Compliance Escalation Queue</span>

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
            selectedTransactionSummary={mappedTxSummary}
          />
        </aside>
      </div>
    </div>
  );
}
