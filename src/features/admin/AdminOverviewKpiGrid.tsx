import Link from "next/link";
import type { AdminOverviewKpisDTO } from "@/types/admin.types";
import {
  formatCountCompact,
  formatCurrencyCompact,
  formatCurrencyFull,
} from "@/utils/formatters";

interface AdminOverviewKpiGridProps {
  kpis: AdminOverviewKpisDTO;
}

export function AdminOverviewKpiGrid({ kpis }: AdminOverviewKpiGridProps) {
  const depositsNum = Number(kpis.totalDeposits);
  const withdrawalsNum = Number(kpis.totalWithdrawals);
  const totalFlow = depositsNum + withdrawalsNum;
  const reserveRatioPct =
    totalFlow > 0
      ? (((depositsNum - withdrawalsNum) / totalFlow) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-4">
      {/* 6-Card KPI Row (2-col span for Total Vault Liquidity + 5 metric cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {/* 1. Total Vault Liquidity (Spans 2 columns on large screens) */}
        <article className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 lg:col-span-2 ve-card-shadow">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
                TOTAL VAULT LIQUIDITY
              </p>
              <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-accent sm:text-[1.7rem]">
                {formatCurrencyFull(kpis.totalBankBalance)}
              </p>
            </div>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent-border bg-accent-subtle text-accent">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M3 21h18" />
                <path d="M3 10h18" />
                <path d="M5 6l7-3 7 3" />
                <path d="M4 10v11" />
                <path d="M20 10v11" />
                <path d="M8 14v3" />
                <path d="M12 14v3" />
                <path d="M16 14v3" />
              </svg>
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2 font-mono text-[11px] text-text-secondary">
            <span className="font-semibold text-status-success">
              ↗ {Number(reserveRatioPct) >= 0 ? "+" : ""}
              {reserveRatioPct}%
            </span>
            <span className="text-text-muted">net vault reserve ratio</span>
          </div>
        </article>

        {/* 2. Total Registered Customers */}
        <article className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 ve-card-shadow">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
              CUSTOMERS
            </p>
            <span className="text-text-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-text-primary">
            {formatCountCompact(kpis.totalRegisteredCustomers)}
          </p>
          <div className="mt-3 flex items-center justify-between font-mono text-[10px]">
            <span className="font-semibold text-status-success">
              {kpis.activeCustomers} Active
            </span>
            <span className="text-text-muted">
              {kpis.blockedCustomers > 0
                ? `${kpis.blockedCustomers} Blocked`
                : "Verified KYC"}
            </span>
          </div>
        </article>

        {/* 3. Total Bank Accounts */}
        <article className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 ve-card-shadow">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
              ACCOUNTS
            </p>
            <span className="text-text-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
            </span>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-text-primary">
            {formatCountCompact(kpis.totalBankAccounts)}
          </p>
          <p className="mt-3 font-mono text-[10px] text-text-muted">
            Active in 3 tiers
          </p>
        </article>

        {/* 4. Total Deposits */}
        <article className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 ve-card-shadow">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
              DEPOSITS MTD
            </p>
            <span className="text-status-info">↓</span>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-text-primary">
            {formatCurrencyCompact(kpis.totalDeposits)}
          </p>
          <p className="mt-3 font-mono text-[10px] text-status-info">
            {kpis.totalDepositsCount} cleared ({kpis.pendingDepositRequests}{" "}
            pending)
          </p>
        </article>

        {/* 5. Total Withdrawals & Total Transactions Combined / Split Columns */}
        <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-1 lg:grid-cols-1">
          <article className="flex flex-col justify-between rounded-xl border border-border bg-surface p-4 ve-card-shadow">
            <div className="flex items-center justify-between gap-1">
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-text-muted">
                WITHDRAWALS
              </p>
              <span className="text-accent">↑</span>
            </div>
            <p className="mt-1 font-mono text-lg font-bold text-text-primary">
              {formatCurrencyCompact(kpis.totalWithdrawals)}
            </p>
            <div className="mt-2 flex items-center justify-between border-t border-border-subtle pt-2 font-mono text-[10px]">
              <span className="text-text-muted">TRANSACTIONS</span>
              <span className="font-bold text-accent">
                {formatCountCompact(kpis.totalTransactions)}
              </span>
            </div>
          </article>
        </div>
      </div>

      {/* Underwriting Pipeline Banner (Pending Loan Applications) — Matches Stitch Screenshot */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-surface px-5 py-4 sm:flex-row sm:items-center ve-card-shadow">
        <div className="flex items-start gap-3.5 sm:items-center">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent-border bg-accent-subtle text-accent">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M12 2v20" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-sm font-bold text-text-primary">
                Underwriting Pipeline: {kpis.pendingLoanApplications} Pending
                Loan Dossiers
              </h2>
              <span className="rounded border border-accent-border bg-accent-subtle px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-accent">
                HIGH PRIORITY
              </span>
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              Pending deposit reviews: {kpis.pendingDepositRequests} • Pending
              withdrawal reviews: {kpis.pendingWithdrawalRequests} • Flagged
              transactions: {kpis.flaggedTransactionsCount}.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/deposits"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-btn-secondary-border bg-btn-secondary px-3.5 text-xs font-semibold text-btn-secondary-text transition-colors hover:border-accent hover:bg-btn-secondary-hover"
          >
            Review Deposits
          </Link>
          <Link
            href="/admin/loans"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-btn-primary px-4 text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover"
          >
            Open Credit Queue
          </Link>
        </div>
      </div>
    </div>
  );
}
