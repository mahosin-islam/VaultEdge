"use client";

import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  setAdminOverviewMonths,
  type AdminTimeframeMonths,
} from "@/features/admin/adminSlice";
import { useGetAdminOverviewQuery } from "@/features/admin/adminApi";
import { AdminOverviewKpiGrid } from "@/features/admin/AdminOverviewKpiGrid";
import { AdminLiquidityChartCard } from "@/features/admin/AdminLiquidityChartCard";
import { AdminDistributionCards } from "@/features/admin/AdminDistributionCards";
import { AdminActionQueueCard } from "@/features/admin/AdminActionQueueCard";
import { AdminLiveTransactionStreamCard } from "@/features/admin/AdminLiveTransactionStreamCard";
import type { AdminOverviewDashboardDTO } from "@/types/admin.types";

interface AdminOverviewViewProps {
  initialData: AdminOverviewDashboardDTO;
}

const TIMEFRAME_OPTIONS: ReadonlyArray<{
  label: string;
  months: AdminTimeframeMonths;
}> = [
  { label: "Last 30 Days", months: 1 },
  { label: "Last 90 Days", months: 3 },
  { label: "Last 6 Months", months: 6 },
  { label: "Last 12 Months", months: 12 },
];

export function AdminOverviewView({ initialData }: AdminOverviewViewProps) {
  const dispatch = useAppDispatch();
  const selectedMonths = useAppSelector(
    (state) => state.admin?.overviewMonths ?? 6
  );

  const {
    data: queryResponse,
    isFetching,
    isError,
    refetch,
  } = useGetAdminOverviewQuery({ months: selectedMonths });

  const dashboard = queryResponse?.data ?? initialData;
  const totalPendingActions =
    dashboard.kpis.pendingDepositRequests +
    dashboard.kpis.pendingWithdrawalRequests +
    dashboard.kpis.pendingLoanApplications +
    dashboard.kpis.flaggedTransactionsCount;

  const handleExportAuditPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Executive Header Section (Matches Stitch Screenshot) */}
      <div className="flex flex-col justify-between gap-4 border-b border-border-subtle pb-5 lg:flex-row lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em]">
            <span className="text-accent">CONSOLIDATED RESERVE LEDGER</span>
            <span className="text-status-info">●</span>
            <span className="text-text-muted">NYSE: NY-FED DIRECT</span>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            Institutional Banking Overview
          </h1>

          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-text-secondary sm:text-sm">
            Real-time liquidity, platform settlement operations, and supervised
            banking activities across retail, enterprise, and algorithmic
            vaults.
          </p>
        </div>

        {/* Right Controls: System Health Pill + Timeframe Selector + Export Audit PDF */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex h-9 items-center gap-2 rounded-lg border border-status-info-border bg-status-info-bg px-3 font-mono text-[11px] font-semibold text-status-info">
            <span>✓</span>
            <span>System Health: 99.99% Nominal</span>
          </div>

          <label className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs text-text-secondary">
            <span className="text-accent">📅</span>
            <select
              aria-label="Select overview reporting timeframe"
              value={selectedMonths}
              onChange={(e) =>
                dispatch(
                  setAdminOverviewMonths(
                    Number(e.target.value) as AdminTimeframeMonths
                  )
                )
              }
              className="bg-transparent font-mono text-xs font-semibold text-text-primary focus:outline-none"
            >
              {TIMEFRAME_OPTIONS.map((opt) => (
                <option
                  key={opt.months}
                  value={opt.months}
                  className="bg-surface text-text-primary"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh live ledger telemetry"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-btn-secondary-border bg-btn-secondary px-3 font-mono text-xs font-semibold text-btn-secondary-text transition-colors hover:border-accent hover:bg-btn-secondary-hover disabled:opacity-60"
          >
            {isFetching ? "Syncing..." : "↻ Sync"}
          </button>

          <button
            type="button"
            onClick={handleExportAuditPdf}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-btn-primary px-4 text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span>⇩</span>
            <span>Export Audit PDF</span>
          </button>
        </div>
      </div>

      {/* Non-Blocking Sync / Error Status Banner */}
      {isError && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl border border-status-danger-border bg-status-danger-bg px-4 py-3 text-xs text-status-danger"
        >
          <span>
            Live telemetry sync encountered an error. Displaying last verified
            server snapshot.
          </span>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded border border-status-danger-border px-2.5 py-1 font-mono font-semibold hover:bg-surface"
          >
            Retry
          </button>
        </div>
      )}

      {/* Row 1 & 2: 6 KPI Cards + Underwriting Pipeline Banner */}
      <AdminOverviewKpiGrid kpis={dashboard.kpis} />

      {/* Row 3: Liquidity Dynamics Chart (8 cols) + Account Tier & Loan Risk Cards (4 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <AdminLiquidityChartCard
            depositVsWithdrawal={dashboard.charts.depositVsWithdrawal}
            monthlyTransactionVolume={dashboard.charts.monthlyTransactionVolume}
            totalDeposits={dashboard.kpis.totalDeposits}
            totalWithdrawals={dashboard.kpis.totalWithdrawals}
            totalTransactions={dashboard.kpis.totalTransactions}
          />
        </div>
        <div className="lg:col-span-4">
          <AdminDistributionCards
            accountDistribution={dashboard.charts.accountDistribution}
            loanApprovalStatistics={dashboard.charts.loanApprovalStatistics}
          />
        </div>
      </div>

      {/* Row 4: Action Queue (5 cols) + Live Transaction Ledger Stream (7 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <AdminActionQueueCard
            items={dashboard.actionQueue}
            totalPendingCount={totalPendingActions}
          />
        </div>
        <div className="lg:col-span-7">
          <AdminLiveTransactionStreamCard
            transactions={dashboard.recentTransactions}
            totalTransactions={dashboard.kpis.totalTransactions}
          />
        </div>
      </div>
    </div>
  );
}
