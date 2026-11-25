"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useGetStaffOverviewQuery } from "@/features/staff/staffApi";
import { useAppSelector } from "@/hooks/redux";
import type { StaffOverviewDashboardDTO } from "@/types/staff.types";
import {
  formatCountCompact,
  formatCurrencyFull,
  formatTimeStampHMS,
} from "@/utils/formatters";

interface StaffOverviewViewProps {
  initialOverview: StaffOverviewDashboardDTO;
}

export function StaffOverviewView({ initialOverview }: StaffOverviewViewProps) {
  const searchQuery = useAppSelector(
    (state) => state.staff?.searchQuery ?? ""
  ).trim().toLowerCase();

  const {
    data: overviewResponse,
    isFetching,
    isError,
    refetch,
  } = useGetStaffOverviewQuery();

  const overview = overviewResponse?.data ?? initialOverview;
  const { kpis, queues } = overview;

  const filteredVerifications = useMemo(() => {
    if (!searchQuery) return queues.pendingVerifications;
    return queues.pendingVerifications.filter(
      (item) =>
        item.fullName.toLowerCase().includes(searchQuery) ||
        item.email.toLowerCase().includes(searchQuery) ||
        item.customerCode.toLowerCase().includes(searchQuery)
    );
  }, [queues.pendingVerifications, searchQuery]);

  const filteredSuspicious = useMemo(() => {
    if (!searchQuery) return queues.openSuspiciousFlags;
    return queues.openSuspiciousFlags.filter(
      (item) =>
        item.transaction.referenceId.toLowerCase().includes(searchQuery) ||
        item.reason.toLowerCase().includes(searchQuery) ||
        item.transaction.type.toLowerCase().includes(searchQuery)
    );
  }, [queues.openSuspiciousFlags, searchQuery]);

  const filteredLoans = useMemo(() => {
    if (!searchQuery) return queues.loanQueue;
    return queues.loanQueue.filter(
      (item) =>
        item.loanReference.toLowerCase().includes(searchQuery) ||
        item.customerName.toLowerCase().includes(searchQuery) ||
        item.customerEmail.toLowerCase().includes(searchQuery) ||
        item.loanType.toLowerCase().includes(searchQuery)
    );
  }, [queues.loanQueue, searchQuery]);

  const totalLoanReviewCount =
    kpis.pendingLoanApplications + kpis.underReviewLoanApplications;

  return (
    <div className="space-y-6">
      {/* Top Operational Desk Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            OPERATIONAL DESK // BANK STAFF CONSOLE
          </p>
          <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
            Operational Desk Overview
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-text-secondary sm:text-sm">
            Daily customer onboarding, KYC verification queues, transaction
            monitoring, suspicious flagging, and loan review pipeline.
          </p>
        </div>

        {/* Quick Operational Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/staff/customers"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-hover"
          >
            Register Customer
          </Link>
          <Link
            href="/staff/accounts"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-hover"
          >
            Open New Account
          </Link>
          <Link
            href="/staff/verification"
            className="inline-flex items-center gap-2 rounded-lg bg-btn-primary px-4 py-2 text-xs font-semibold text-btn-primary-text shadow-sm transition-colors hover:bg-btn-primary-hover"
          >
            Verification Queue
          </Link>
        </div>
      </div>

      {/* Error State Banner */}
      {isError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-status-danger-bg px-4 py-3 text-xs text-status-danger">
          <span>
            Unable to refresh live operational metrics from the server.
          </span>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-lg border border-border bg-surface px-3 py-1 font-semibold text-text-primary hover:bg-surface-hover"
          >
            Retry Sync
          </button>
        </div>
      ) : null}

      {/* 6-Card Operational KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            CUSTOMERS
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-text-primary">
            {formatCountCompact(kpis.totalCustomers)}
          </p>
          <p className="mt-1 text-[11px] text-status-success">
            {formatCountCompact(kpis.verifiedCustomers)} KYC verified
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            BANK ACCOUNTS
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-text-primary">
            {formatCountCompact(kpis.totalBankAccounts)}
          </p>
          <p className="mt-1 text-[11px] text-text-muted">
            Customer vaults
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            KYC IN QUEUE
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-accent">
            {formatCountCompact(kpis.pendingKycVerifications)}
          </p>
          <p className="mt-1 text-[11px] text-text-muted">
            Pending verification
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            PENDING TX
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-text-primary">
            {formatCountCompact(kpis.pendingTransactions)}
          </p>
          <p className="mt-1 text-[11px] text-text-muted">
            Awaiting settlement
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            SUSPICIOUS FLAGS
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-status-danger">
            {formatCountCompact(kpis.openSuspiciousFlags)}
          </p>
          <p className="mt-1 text-[11px] text-text-muted">
            {formatCountCompact(kpis.flaggedTransactions)} total flagged
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            LOAN REVIEW
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-text-primary">
            {formatCountCompact(totalLoanReviewCount)}
          </p>
          <p className="mt-1 text-[11px] text-text-muted">
            {formatCountCompact(kpis.underReviewLoanApplications)} forwarded
          </p>
        </div>
      </div>

      {/* Main Two-Column Operational Queues */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left Column (7 Cols): Loan Applications Under Review + Operational Sync Bar */}
        <div className="space-y-6 xl:col-span-7">
          <section className="rounded-xl border border-border bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3.5">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  Loan Applications Awaiting Review
                </h2>
                <p className="text-[11px] text-text-muted">
                  Review customer eligibility, add internal notes, and forward
                  to Admin for final decision
                </p>
              </div>
              <Link
                href="/staff/loan-applications"
                className="rounded-lg border border-border bg-surface-inner px-3 py-1.5 text-[11px] font-semibold text-accent hover:bg-surface-hover"
              >
                Open Full Queue ({totalLoanReviewCount}) →
              </Link>
            </div>

            {filteredLoans.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-sm font-medium text-text-primary">
                  No loan applications awaiting staff review
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  New customer loan submissions will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[580px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-border-subtle bg-surface-inner/60 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                      <th className="px-4 py-3">Reference &amp; Type</th>
                      <th className="px-4 py-3">Applicant</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Requested</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {filteredLoans.map((loan) => (
                      <tr
                        key={loan.id}
                        className="transition-colors hover:bg-surface-hover/40"
                      >
                        <td className="px-4 py-3.5">
                          <p className="font-mono font-semibold text-text-primary">
                            {loan.loanReference}
                          </p>
                          <p className="mt-0.5 text-[11px] text-text-muted">
                            {loan.loanType} •{" "}
                            {new Date(loan.createdAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-text-primary">
                            {loan.customerName}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-text-muted">
                            {loan.customerEmail}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex rounded-full border border-accent-border bg-accent-subtle px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                            {loan.status.replaceAll("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-semibold text-text-primary">
                          {formatCurrencyFull(loan.requestedAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Operational Desk Sync & Transaction Review Shortcut */}
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Operational Desk Synchronization
              </h3>
              <p className="mt-0.5 text-xs text-text-muted">
                {isFetching
                  ? "Refreshing live queues from PostgreSQL..."
                  : "All customer, KYC, transaction, and loan queues are synced."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/staff/transactions"
                className="rounded-lg border border-border bg-surface-inner px-3.5 py-2 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover"
              >
                Transaction Ledger
              </Link>
              <button
                type="button"
                disabled={isFetching}
                onClick={() => refetch()}
                className="rounded-lg bg-btn-primary px-3.5 py-2 text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover disabled:opacity-50"
              >
                {isFetching ? "Syncing..." : "Sync Terminal"}
              </button>
            </div>
          </section>
        </div>

        {/* Right Column (5 Cols): Pending Verification Queue + Suspicious Activity Reports */}
        <div className="space-y-6 xl:col-span-5">
          {/* Pending Verification Queue */}
          <section className="rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3.5">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  Pending Verification Queue
                </h2>
                <p className="text-[11px] text-text-muted">
                  Customer KYC profiles awaiting verification
                </p>
              </div>
              <span className="rounded-full border border-accent-border bg-accent-subtle px-2.5 py-0.5 font-mono text-[10px] font-semibold text-accent">
                {kpis.pendingKycVerifications} Pending
              </span>
            </div>

            <div className="divide-y divide-border-subtle">
              {filteredVerifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-text-muted">
                  No pending KYC verifications in queue.
                </div>
              ) : (
                filteredVerifications.map((item) => (
                  <div
                    key={item.userId}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-text-primary">
                        {item.fullName}
                      </p>
                      <p className="truncate font-mono text-[11px] text-text-muted">
                        {item.customerCode} • {item.email}
                      </p>
                    </div>
                    <Link
                      href="/staff/verification"
                      className="shrink-0 rounded-lg bg-btn-primary px-2.5 py-1.5 text-[11px] font-semibold text-btn-primary-text hover:bg-btn-primary-hover"
                    >
                      Verify KYC
                    </Link>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Suspicious Activity Reports */}
          <section className="rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3.5">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  Suspicious Activity Reports
                </h2>
                <p className="text-[11px] text-text-muted">
                  Open &amp; escalated flags for Admin review
                </p>
              </div>
              <span className="rounded-full border border-border bg-status-danger-bg px-2.5 py-0.5 font-mono text-[10px] font-semibold text-status-danger">
                {kpis.openSuspiciousFlags} Open
              </span>
            </div>

            <div className="divide-y divide-border-subtle">
              {filteredSuspicious.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-text-muted">
                  No open suspicious transaction flags.
                </div>
              ) : (
                filteredSuspicious.map((flag) => (
                  <div key={flag.flagId} className="space-y-1.5 px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-text-primary">
                        {flag.transaction.referenceId} •{" "}
                        {formatCurrencyFull(flag.transaction.amount)}
                      </span>
                      <span className="rounded border border-border bg-status-danger-bg px-2 py-0.5 text-[10px] font-semibold uppercase text-status-danger">
                        {flag.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">{flag.reason}</p>
                    <p className="font-mono text-[10px] text-text-muted">
                      {flag.source} • {formatTimeStampHMS(flag.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border px-4 py-2.5 text-right">
              <Link
                href="/staff/suspicious-transactions"
                className="text-[11px] font-semibold text-accent hover:underline"
              >
                Inspect All Suspicious Transactions →
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
