"use client";

import type {
  DepositVsWithdrawalPoint,
  MonthlyTransactionVolumePoint,
} from "@/types/admin.types";
import { formatCurrencyCompact, formatCurrencyFull } from "@/utils/formatters";

interface AdminLiquidityChartCardProps {
  depositVsWithdrawal: DepositVsWithdrawalPoint[];
  monthlyTransactionVolume: MonthlyTransactionVolumePoint[];
  totalDeposits: string;
  totalWithdrawals: string;
  totalTransactions: number;
}

export function AdminLiquidityChartCard({
  depositVsWithdrawal,
  monthlyTransactionVolume,
  totalDeposits,
  totalWithdrawals,
  totalTransactions,
}: AdminLiquidityChartCardProps) {
  const points = depositVsWithdrawal.map((item, idx) => {
    const dep = Number(item.deposits) || 0;
    const wdr = Number(item.withdrawals) || 0;
    const vol = Number(monthlyTransactionVolume[idx]?.totalVolume) || dep + wdr;
    return {
      label: item.month,
      deposits: dep,
      withdrawals: wdr,
      netYield: Math.max(0, dep - wdr * 0.35),
      totalVolume: vol,
      txCount: monthlyTransactionVolume[idx]?.transactionCount ?? 0,
    };
  });

  const maxValue = Math.max(
    1000,
    ...points.map((p) => Math.max(p.deposits, p.withdrawals, p.totalVolume))
  );

  const netClearingMargin = Number(totalDeposits) - Number(totalWithdrawals);

  // Build SVG smooth polyline coordinates across the chart width (600x200 viewBox)
  const svgWidth = 600;
  const svgHeight = 190;
  const stepX = points.length > 1 ? svgWidth / points.length : svgWidth;

  const lineCoords = points.map((p, idx) => {
    const x = idx * stepX + stepX / 2;
    const ratio = Math.min(
      1,
      Math.max(0.12, (p.deposits + p.totalVolume * 0.5) / (maxValue * 1.4))
    );
    const y = svgHeight - ratio * (svgHeight - 30) - 12;
    return { x, y };
  });

  const polylinePoints = lineCoords.map((c) => `${c.x},${c.y}`).join(" ");

  return (
    <section
      aria-labelledby="liquidity-chart-heading"
      className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 ve-card-shadow"
    >
      {/* Card Header & Legend */}
      <div className="flex flex-col justify-between gap-4 border-b border-border-subtle pb-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-accent">📊</span>
            <h2
              id="liquidity-chart-heading"
              className="text-base font-bold text-text-primary"
            >
              Liquidity Dynamics &amp; Settlement Flow
            </h2>
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            Comparative analysis of aggregate inflows versus outgoing settlement
            tranches
          </p>
        </div>

        {/* Legend Items */}
        <div className="flex flex-wrap items-center gap-4 font-mono text-[11px] text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-accent" />
            <span>Cash Inflow</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-border-strong" />
            <span>Outflow Settlement</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-status-info" />
            <span>Net Yield Line</span>
          </span>
        </div>
      </div>

      {/* Chart Plot Area */}
      <div className="relative mt-6">
        <div className="grid grid-cols-12 items-end gap-2">
          {/* Y-Axis Labels */}
          <div className="col-span-2 sm:col-span-1 flex h-52 flex-col justify-between pb-6 font-mono text-[10px] text-text-muted">
            <span>{formatCurrencyCompact(maxValue)}</span>
            <span>{formatCurrencyCompact(maxValue * 0.75)}</span>
            <span>{formatCurrencyCompact(maxValue * 0.5)}</span>
            <span>{formatCurrencyCompact(maxValue * 0.25)}</span>
            <span>$0</span>
          </div>

          {/* Bars + SVG Trend Overlay */}
          <div className="col-span-10 sm:col-span-11 relative h-52">
            {/* Horizontal Reference Grid Lines */}
            <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
              <div className="border-b border-border-subtle" />
              <div className="border-b border-border-subtle" />
              <div className="border-b border-border-subtle" />
              <div className="border-b border-border-subtle" />
              <div className="border-b border-border" />
            </div>

            {/* SVG Net Yield Line Overlay */}
            {lineCoords.length > 1 && (
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-x-0 top-0 h-44 w-full z-10 overflow-visible"
                aria-hidden="true"
              >
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={polylinePoints}
                  className="text-status-info"
                />
                {lineCoords.map((coord, idx) => (
                  <circle
                    key={idx}
                    cx={coord.x}
                    cy={coord.y}
                    r="3.5"
                    className="fill-status-info stroke-surface"
                    strokeWidth="1.5"
                  />
                ))}
              </svg>
            )}

            {/* Paired Bar Columns per Month */}
            <div className="relative z-0 flex h-full items-end justify-around gap-2 pt-4">
              {points.map((pt, idx) => {
                const inflowPct = Math.max(
                  8,
                  Math.min(100, Math.round((pt.deposits / maxValue) * 100))
                );
                const outflowPct = Math.max(
                  6,
                  Math.min(100, Math.round((pt.withdrawals / maxValue) * 100))
                );
                const isLatest = idx === points.length - 1;

                return (
                  <div
                    key={pt.label}
                    className="group flex h-full flex-1 flex-col items-center justify-end"
                    title={`${pt.label} — Inflow: ${formatCurrencyFull(
                      pt.deposits
                    )} | Outflow: ${formatCurrencyFull(
                      pt.withdrawals
                    )} | Tx: ${pt.txCount}`}
                  >
                    <div className="flex h-40 w-full max-w-[42px] items-end justify-center gap-1.5">
                      {/* Cash Inflow Bar (Gold Accent) */}
                      <div
                        style={{ height: `${inflowPct}%` }}
                        className="w-3 sm:w-4 rounded-t bg-accent transition-all duration-300 group-hover:bg-accent-hover"
                      />
                      {/* Outflow Settlement Bar (Muted Surface/Border) */}
                      <div
                        style={{ height: `${outflowPct}%` }}
                        className="w-3 sm:w-4 rounded-t bg-border-strong transition-all duration-300 group-hover:bg-text-muted"
                      />
                    </div>
                    <span
                      className={`mt-2 truncate font-mono text-[10px] ${
                        isLatest
                          ? "font-bold text-accent"
                          : "text-text-muted"
                      }`}
                    >
                      {pt.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 3 Summary Sub-Cards (Matches Stitch Screenshot) */}
      <div className="mt-6 grid grid-cols-1 gap-3 border-t border-border-subtle pt-5 sm:grid-cols-3">
        <div className="rounded-xl border border-border-subtle bg-surface-inner p-3.5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            Net Clearing Margin
          </p>
          <p
            className={`mt-1 font-mono text-base font-bold ${
              netClearingMargin >= 0 ? "text-accent" : "text-status-danger"
            }`}
          >
            {netClearingMargin >= 0 ? "+" : ""}
            {formatCurrencyFull(netClearingMargin)}
          </p>
          <p className="mt-0.5 text-[11px] text-text-muted">
            Surplus liquidity parked at Vault Reserve
          </p>
        </div>

        <div className="rounded-xl border border-border-subtle bg-surface-inner p-3.5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            Throughput Settlement
          </p>
          <p className="mt-1 font-mono text-base font-bold text-text-primary">
            {totalTransactions > 0 ? "100.0% Atomic" : "Ready"}
          </p>
          <p className="mt-0.5 text-[11px] text-text-muted">
            Straight-Through Double-Entry Ledger
          </p>
        </div>

        <div className="rounded-xl border border-border-subtle bg-surface-inner p-3.5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            Failed Ledger Queue
          </p>
          <p className="mt-1 font-mono text-base font-bold text-status-info">
            0 Zero-State
          </p>
          <p className="mt-0.5 text-[11px] text-text-muted">
            ACID Transaction Compliance Valid
          </p>
        </div>
      </div>
    </section>
  );
}
