"use client";

import type { CustomerOverviewChartsDTO } from "@/types/customer.types";
import { formatCurrencyCompact, formatCurrencyFull } from "@/utils/formatters";

interface CustomerOverviewAnalyticsProps {
  charts: CustomerOverviewChartsDTO;
}

export function CustomerOverviewAnalytics({
  charts,
}: CustomerOverviewAnalyticsProps) {
  const deposits = charts.monthlyDepositHistory;
  const spending = charts.monthlySpending;
  const distribution = charts.transactionDistribution;

  const maxMonthlyVal = Math.max(
    1,
    ...deposits.map((d) => Number(d.amount) || 0),
    ...spending.map((s) => Number(s.amount) || 0)
  );

  const totalDistCount = distribution.reduce((sum, item) => sum + item.count, 0);

  return (
    <section
      aria-label="Financial analytics"
      className="grid grid-cols-1 gap-4 lg:grid-cols-12"
    >
      {/* Monthly Deposits vs Spending */}
      <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">
              Monthly Cashflow History
            </h2>
            <p className="text-xs text-text-muted">
              Deposits vs. outgoing spending across the last {deposits.length} months
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-text-secondary">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-status-success" />
              Deposits
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-accent" />
              Spending
            </span>
          </div>
        </div>

        {deposits.length === 0 ? (
          <div className="mt-6 rounded-lg border border-border-subtle bg-surface-inner p-6 text-center text-xs text-text-muted">
            No monthly cashflow records available yet.
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {deposits.map((dep, idx) => {
              const spend = spending[idx];
              const depNum = Number(dep.amount) || 0;
              const spendNum = Number(spend?.amount ?? 0) || 0;
              const depPct = depNum > 0 ? Math.max(8, Math.round((depNum / maxMonthlyVal) * 100)) : 2;
              const spendPct = spendNum > 0 ? Math.max(8, Math.round((spendNum / maxMonthlyVal) * 100)) : 2;

              return (
                <div
                  key={dep.monthKey}
                  className="flex flex-col items-center rounded-lg border border-border-subtle bg-surface-inner px-2 py-3"
                >
                  <div className="flex h-28 w-full items-end justify-center gap-1.5">
                    <div
                      title={`Deposits: ${formatCurrencyFull(depNum)}`}
                      style={{ height: `${depPct}%` }}
                      className="w-3.5 rounded-t bg-status-success transition-all"
                    />
                    <div
                      title={`Spending: ${formatCurrencyFull(spendNum)}`}
                      style={{ height: `${spendPct}%` }}
                      className="w-3.5 rounded-t bg-accent transition-all"
                    />
                  </div>
                  <span className="mt-2 font-mono text-[10px] font-medium text-text-secondary">
                    {dep.month.split(" ")[0]}
                  </span>
                  <span className="font-mono text-[9px] text-text-muted">
                    +{formatCurrencyCompact(depNum)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction Distribution */}
      <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">
              Transaction Distribution
            </h2>
            <p className="text-xs text-text-muted">
              Completed ledger breakdown by operation type
            </p>
          </div>
          <span className="rounded-md border border-border bg-surface-inner px-2 py-0.5 font-mono text-[10px] text-text-secondary">
            {totalDistCount} total
          </span>
        </div>

        {distribution.length === 0 ? (
          <div className="mt-6 rounded-lg border border-border-subtle bg-surface-inner p-6 text-center text-xs text-text-muted">
            No completed transactions yet.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {distribution.map((item) => {
              const sharePct =
                totalDistCount > 0
                  ? Math.round((item.count / totalDistCount) * 100)
                  : 0;
              return (
                <div
                  key={item.type}
                  className="rounded-lg border border-border-subtle bg-surface-inner p-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-text-primary">
                      {item.type.replaceAll("_", " ")}
                    </span>
                    <span className="font-mono font-semibold text-text-primary">
                      {formatCurrencyFull(item.totalAmount)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background-secondary">
                    <div
                      style={{ width: `${Math.max(4, sharePct)}%` }}
                      className="h-full rounded-full bg-accent transition-all"
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-text-muted">
                    <span>{item.count} operation(s)</span>
                    <span>{sharePct}% share</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
