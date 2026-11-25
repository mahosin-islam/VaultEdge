'use client';

import React, { useMemo, useState } from 'react';
import { useGetAdminAnalyticsQuery } from '@/features/admin/adminApi';
import { AdminOverviewKpiGrid } from '@/features/admin/AdminOverviewKpiGrid';
import { AdminLiquidityChartCard } from '@/features/admin/AdminLiquidityChartCard';
import { AdminDistributionCards } from '@/features/admin/AdminDistributionCards';
import type { AdminAnalyticsReportDTO } from '@/types/admin.types';
import { formatCurrencyFull } from '@/utils/formatters';

interface AdminAnalyticsViewProps {
  initialAnalytics: AdminAnalyticsReportDTO;
}

export function AdminAnalyticsView({
  initialAnalytics,
}: AdminAnalyticsViewProps) {
  const [months, setMonths] = useState<number>(6);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const queryArgs = useMemo(
    () => ({
      months,
      startDate: startDate ? `${startDate}T00:00:00.000Z` : undefined,
      endDate: endDate ? `${endDate}T23:59:59.999Z` : undefined,
    }),
    [months, startDate, endDate],
  );

  const { data: analyticsResponse, isFetching } =
    useGetAdminAnalyticsQuery(queryArgs);

  const report = analyticsResponse?.data ?? initialAnalytics;
  const { kpis, charts } = report;

  const totalAccountStatusCount = charts.accountStatusDistribution.reduce(
    (sum, item) => sum + item.count,
    0,
  );

  const handleExportCsv = () => {
    const headers = [
      'Month',
      'Tx Count',
      'Total Volume',
      'Deposits',
      'Withdrawals',
      'Transfers Volume',
      'Loan Disbursements',
      'Loan Repayments',
      'New Customers',
      'New Accounts',
    ];
    const rows = charts.monthlyBankingActivity.map((act, idx) => {
      const vol = charts.monthlyTransactionVolume[idx];
      const dw = charts.depositVsWithdrawal[idx];
      return [
        act.month,
        vol?.transactionCount ?? 0,
        vol?.totalVolume ?? '0.00',
        dw?.deposits ?? '0.00',
        dw?.withdrawals ?? '0.00',
        act.transfersVolume,
        act.loanDisbursementsVolume,
        act.loanRepaymentsVolume,
        act.newCustomers,
        act.newAccounts,
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','),
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `vaultedge-analytics-${months}m.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Executive Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            INSTITUTIONAL BI / FINANCIAL ANALYTICS
          </p>
          <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
            Platform Analytics &amp; Reporting
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-text-secondary sm:text-sm">
            Real-time liquidity flow, deposit versus withdrawal velocity, account
            tier distribution, and credit portfolio performance.
          </p>
        </div>

        {/* Window & Export Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border border-border bg-surface p-1 text-xs">
            {[3, 6, 12, 24].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMonths(m)}
                className={`rounded-md px-2.5 py-1 font-mono text-xs font-medium transition-colors ${
                  months === m
                    ? 'bg-btn-primary text-btn-primary-text'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {m}M
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              FROM:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent font-mono text-xs text-text-primary focus:outline-none"
            />
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              TO:
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent font-mono text-xs text-text-primary focus:outline-none"
            />
          </label>

          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-hover"
            >
              Reset
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg bg-btn-primary px-3.5 py-2 text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover"
          >
            Export Analytics CSV
          </button>
        </div>
      </div>

      {/* Sync Indicator */}
      <div className="flex items-center justify-end gap-2 text-[11px] text-text-muted">
        <span
          className={`h-2 w-2 rounded-full ${
            isFetching ? 'animate-pulse bg-accent' : 'bg-status-success'
          }`}
        />
        <span>
          {isFetching
            ? 'Recalculating database aggregations...'
            : `Live PostgreSQL Aggregations • Trailing ${months} Months`}
        </span>
      </div>

      {/* KPI Summary Grid */}
      <AdminOverviewKpiGrid kpis={kpis} />

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <AdminLiquidityChartCard
            depositVsWithdrawal={charts.depositVsWithdrawal}
            monthlyTransactionVolume={charts.monthlyTransactionVolume}
            totalDeposits={kpis.totalDeposits}
            totalWithdrawals={kpis.totalWithdrawals}
            totalTransactions={kpis.totalTransactions}
          />
        </div>
        <div className="xl:col-span-4">
          <AdminDistributionCards
            accountDistribution={charts.accountDistribution}
            loanApprovalStatistics={charts.loanApprovalStatistics}
          />
        </div>
      </div>

      {/* Secondary Analytics Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left: Monthly Banking Activity Matrix */}
        <section className="rounded-xl border border-border bg-surface xl:col-span-7">
          <div className="border-b border-border px-4 py-3.5">
            <h2 className="text-sm font-semibold text-text-primary">
              Monthly Banking Activity Matrix
            </h2>
            <p className="text-[11px] text-text-muted">
              Intra-bank transfers, credit disbursements, repayments, and customer
              growth by month
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-inner/60 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  <th className="px-4 py-3">Month</th>
                  <th className="px-4 py-3 text-right">Transfers</th>
                  <th className="px-4 py-3 text-right">Disbursements</th>
                  <th className="px-4 py-3 text-right">Repayments</th>
                  <th className="px-4 py-3 text-right">New Users / Accts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {charts.monthlyBankingActivity.map((row) => (
                  <tr key={row.monthKey} className="hover:bg-surface-hover/40">
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {row.month}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-text-primary">
                      {formatCurrencyFull(row.transfersVolume)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-accent">
                      {formatCurrencyFull(row.loanDisbursementsVolume)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-status-success">
                      {formatCurrencyFull(row.loanRepaymentsVolume)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-text-secondary">
                      +{row.newCustomers} / +{row.newAccounts}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right: Account Status & Loan Type Distribution */}
        <section className="space-y-4 rounded-xl border border-border bg-surface p-4 xl:col-span-5">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">
              Account Status Distribution
            </h2>
            <p className="text-[11px] text-text-muted">
              Current operational standing across all customer vaults
            </p>
            <div className="mt-3 space-y-2.5">
              {charts.accountStatusDistribution.length === 0 ? (
                <p className="text-xs text-text-muted">
                  No customer bank accounts registered yet.
                </p>
              ) : (
                charts.accountStatusDistribution.map((item) => {
                  const pct =
                    totalAccountStatusCount > 0
                      ? Math.round((item.count / totalAccountStatusCount) * 100)
                      : 0;
                  return (
                    <div key={item.status} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-text-primary">
                          {item.status}
                        </span>
                        <span className="font-mono text-text-secondary">
                          {item.count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-inner">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-text-primary">
              Loan Portfolio by Facility Type
            </h3>
            <div className="mt-3 space-y-2">
              {charts.loanTypeDistribution.length === 0 ? (
                <p className="text-xs text-text-muted">
                  No loan applications submitted yet.
                </p>
              ) : (
                charts.loanTypeDistribution.map((item) => (
                  <div
                    key={item.loanType}
                    className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-inner px-3 py-2 text-xs"
                  >
                    <div>
                      <span className="font-medium text-text-primary">
                        {item.loanType}
                      </span>
                      <span className="ml-2 text-[11px] text-text-muted">
                        ({item.count} apps)
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-accent">
                      {formatCurrencyFull(item.totalRequestedAmount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
