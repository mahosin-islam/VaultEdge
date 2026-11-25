"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  useGetCustomerAccountsQuery,
  useGetCustomerStatementQuery,
} from "@/features/customer/customerApi";
import type {
  CustomerAccountDetailDTO,
  CustomerStatementDTO,
} from "@/types/customer.types";
import { formatCurrencyFull } from "@/utils/formatters";

interface CustomerStatementsViewProps {
  initialAccounts: CustomerAccountDetailDTO[];
  initialStatement: CustomerStatementDTO | null;
  initialAccountId?: string;
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CustomerStatementsView({
  initialAccounts,
  initialStatement,
  initialAccountId,
}: CustomerStatementsViewProps) {
  const { data: accountsRes } = useGetCustomerAccountsQuery();
  const accounts = accountsRes?.data?.accounts ?? initialAccounts;

  const defaultAccountId = useMemo(() => {
    if (initialAccountId && accounts.some((a) => a.id === initialAccountId)) {
      return initialAccountId;
    }
    return accounts[0]?.id ?? "";
  }, [accounts, initialAccountId]);

  const [accountId, setAccountId] = useState(defaultAccountId);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [downloadingFormat, setDownloadingFormat] = useState<
    "csv" | "pdf" | null
  >(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const effectiveAccountId = accounts.some((a) => a.id === accountId)
    ? accountId
    : defaultAccountId;

  const {
    data: stmtRes,
    isFetching,
    isError,
    refetch,
  } = useGetCustomerStatementQuery(
    {
      accountId: effectiveAccountId,
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    },
    { skip: !effectiveAccountId }
  );

  const statement =
    stmtRes?.data?.statement ??
    (!startDate &&
    !endDate &&
    initialStatement?.account.id === effectiveAccountId
      ? initialStatement
      : null);

  const totals = useMemo(() => {
    const entries = statement?.entries ?? [];
    let credits = 0;
    let debits = 0;
    for (const e of entries) {
      const amt = Number(e.amount) || 0;
      if (e.direction === "CREDIT") {
        credits += amt;
      } else {
        debits += amt;
      }
    }
    return { credits, debits, count: entries.length };
  }, [statement?.entries]);

  const handleDownload = async (format: "csv" | "pdf") => {
    if (!effectiveAccountId) return;
    setDownloadingFormat(format);
    setDownloadError(null);

    try {
      const params = new URLSearchParams();
      params.set("accountId", effectiveAccountId);
      params.set("format", format);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/v1/statements?${params.toString()}`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Export failed with status ${res.status}.`);
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = /filename="([^"]+)"/.exec(disposition);
      const filename =
        match?.[1] ?? `vaultedge-statement-${effectiveAccountId}.${format}`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(
        err instanceof Error
          ? err.message
          : "Unable to export statement right now."
      );
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            Account Statements
          </h1>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Generate certified ledger statements by account and date range, and
            export official CSV or PDF copies.
          </p>
        </div>

        <Link
          href="/customer/transactions"
          className="inline-flex shrink-0 items-center whitespace-nowrap rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent"
        >
          Transaction History &rarr;
        </Link>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <p className="text-base font-semibold text-text-primary">
            No bank accounts available for statements
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Once you have an active bank account, you can view and download
            statements here.
          </p>
        </div>
      ) : (
        <>
          {/* Controls & Export Bar */}
          <section
            aria-label="Statement filters and export"
            className="rounded-xl border border-border bg-surface p-5"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <label
                  htmlFor="statementAccount"
                  className="block text-[11px] font-semibold text-text-secondary"
                >
                  Select Account
                </label>
                <select
                  id="statementAccount"
                  value={effectiveAccountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountTitle} ({acc.accountNumber}) —{" "}
                      {formatCurrencyFull(acc.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="stmtStartDate"
                  className="block text-[11px] font-semibold text-text-secondary"
                >
                  From Date
                </label>
                <input
                  id="stmtStartDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="stmtEndDate"
                  className="block text-[11px] font-semibold text-text-secondary"
                >
                  To Date
                </label>
                <input
                  id="stmtEndDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="w-full rounded-lg border border-border bg-surface-inner px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-text-primary"
                >
                  Reset Dates
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-4">
              <div className="text-xs text-text-secondary">
                Period:{" "}
                <strong className="font-mono text-text-primary">
                  {statement?.periodLabel ?? "All Recorded History"}
                </strong>
                {isFetching ? (
                  <span className="ml-2 font-mono text-[10px] text-accent">
                    Refreshing...
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  disabled={downloadingFormat !== null || !effectiveAccountId}
                  onClick={() => handleDownload("csv")}
                  className="rounded-lg border border-border bg-surface-inner px-3.5 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent disabled:opacity-45"
                >
                  {downloadingFormat === "csv"
                    ? "Exporting CSV..."
                    : "Download CSV"}
                </button>
                <button
                  type="button"
                  disabled={downloadingFormat !== null || !effectiveAccountId}
                  onClick={() => handleDownload("pdf")}
                  className="rounded-lg bg-btn-primary px-3.5 py-2 text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover disabled:opacity-45"
                >
                  {downloadingFormat === "pdf"
                    ? "Generating PDF..."
                    : "Download Certified PDF"}
                </button>
              </div>
            </div>

            {downloadError ? (
              <div
                role="alert"
                className="mt-3 rounded-lg border border-status-danger-border bg-status-danger-bg px-3 py-2 text-xs text-status-danger"
              >
                {downloadError}
              </div>
            ) : null}
          </section>

          {/* Summary KPIs */}
          {statement ? (
            <section
              aria-label="Statement summary"
              className="grid grid-cols-1 gap-4 sm:grid-cols-3"
            >
              <div className="rounded-xl border border-border bg-surface p-5">
                <p className="font-mono text-[10px] uppercase text-text-muted">
                  CURRENT ACCOUNT BALANCE
                </p>
                <p className="mt-2 font-mono text-2xl font-bold text-text-primary">
                  {formatCurrencyFull(statement.account.currentBalance)}
                </p>
                <p className="mt-1 font-mono text-[11px] text-text-secondary">
                  {statement.account.accountNumber} •{" "}
                  {statement.account.accountType}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <p className="font-mono text-[10px] uppercase text-text-muted">
                  TOTAL CREDITS IN PERIOD
                </p>
                <p className="mt-2 font-mono text-2xl font-bold text-status-success">
                  +{formatCurrencyFull(totals.credits)}
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  {totals.count} ledger posting(s)
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <p className="font-mono text-[10px] uppercase text-text-muted">
                  TOTAL DEBITS IN PERIOD
                </p>
                <p className="mt-2 font-mono text-2xl font-bold text-text-primary">
                  -{formatCurrencyFull(totals.debits)}
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  {statement.periodLabel}
                </p>
              </div>
            </section>
          ) : null}

          {/* Statement Ledger Table */}
          <section
            aria-label="Statement ledger entries"
            className="rounded-xl border border-border bg-surface p-5"
          >
            {isError ? (
              <div
                role="alert"
                className="flex items-center justify-between gap-3 rounded-lg border border-status-danger-border bg-status-danger-bg p-3 text-xs text-status-danger"
              >
                <span>Unable to load account statement.</span>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="rounded border border-status-danger-border bg-surface px-2.5 py-1 font-semibold text-text-primary"
                >
                  Retry
                </button>
              </div>
            ) : !statement ? (
              <div className="space-y-2.5">
                <div className="h-10 animate-pulse rounded-lg bg-surface-inner" />
                <div className="h-10 animate-pulse rounded-lg bg-surface-inner" />
                <div className="h-10 animate-pulse rounded-lg bg-surface-inner" />
              </div>
            ) : statement.entries.length === 0 ? (
              <div className="rounded-lg border border-border-subtle bg-surface-inner p-10 text-center">
                <p className="text-sm font-medium text-text-primary">
                  No ledger entries in this statement period
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  Try clearing the date filters or selecting another account.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-border-subtle font-mono text-[10px] uppercase tracking-wider text-text-muted">
                      <th className="pb-2.5 pr-3">Date</th>
                      <th className="pb-2.5 pr-3">Reference ID</th>
                      <th className="pb-2.5 pr-3">Type &amp; Memo</th>
                      <th className="pb-2.5 pr-3">Direction</th>
                      <th className="pb-2.5 pr-3 text-right">Amount</th>
                      <th className="pb-2.5 pr-3 text-right">Before</th>
                      <th className="pb-2.5 text-right">After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {statement.entries.map((entry) => {
                      const isCredit = entry.direction === "CREDIT";
                      return (
                        <tr
                          key={entry.id}
                          className="transition-colors hover:bg-surface-hover"
                        >
                          <td className="py-3 pr-3 font-mono text-[11px] text-text-muted">
                            {formatDate(entry.date)}
                          </td>
                          <td className="py-3 pr-3 font-mono text-[11px] font-medium text-text-primary">
                            {entry.referenceId}
                          </td>
                          <td className="py-3 pr-3">
                            <p className="font-medium text-text-primary">
                              {entry.type.replaceAll("_", " ")} (
                              {entry.entryCategory})
                            </p>
                            {entry.description ? (
                              <p className="text-[11px] text-text-muted">
                                {entry.description}
                              </p>
                            ) : null}
                          </td>
                          <td className="py-3 pr-3">
                            <span
                              className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${
                                isCredit
                                  ? "border-status-success-border bg-status-success-bg text-status-success"
                                  : "border-accent-border bg-accent-subtle text-accent"
                              }`}
                            >
                              {entry.direction}
                            </span>
                          </td>
                          <td className="py-3 pr-3 text-right font-mono font-semibold text-text-primary">
                            {isCredit ? "+" : "-"}
                            {formatCurrencyFull(entry.amount)}
                          </td>
                          <td className="py-3 pr-3 text-right font-mono text-text-secondary">
                            {formatCurrencyFull(entry.balanceBefore)}
                          </td>
                          <td className="py-3 text-right font-mono font-semibold text-text-primary">
                            {formatCurrencyFull(entry.balanceAfter)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
