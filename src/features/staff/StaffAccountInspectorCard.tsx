"use client";

import { useGetStaffAccountDetailQuery } from "@/features/staff/staffApi";
import type { AdminBankAccountListItemDTO } from "@/types/admin.types";
import { formatCurrencyFull, formatTimeStampHMS } from "@/utils/formatters";

interface StaffAccountInspectorCardProps {
  selectedAccountSummary: AdminBankAccountListItemDTO | null;
}

function getStatusBadgeClasses(status: AdminBankAccountListItemDTO["status"]) {
  switch (status) {
    case "ACTIVE":
      return "border-border bg-status-success-bg text-status-success";
    case "FROZEN":
      return "border-border bg-status-info-bg text-status-info";
    case "BLOCKED":
      return "border-border bg-status-danger-bg text-status-danger";
    case "INACTIVE":
    default:
      return "border-border bg-surface-inner text-text-muted";
  }
}

export function StaffAccountInspectorCard({
  selectedAccountSummary,
}: StaffAccountInspectorCardProps) {
  const { data: detailResponse, isFetching } = useGetStaffAccountDetailQuery(
    selectedAccountSummary?.id ?? "",
    { skip: !selectedAccountSummary?.id }
  );

  if (!selectedAccountSummary) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-border bg-surface p-6 text-center">
        <p className="text-sm font-semibold text-text-primary">
          No Bank Account Selected
        </p>
        <p className="mt-1 max-w-xs text-xs text-text-muted">
          Select any customer bank account from the ledger to view effective
          limits, holder details, and recent double-entry postings.
        </p>
      </div>
    );
  }

  const detail = detailResponse?.data;
  const account = detail?.account ?? selectedAccountSummary;
  const effectiveLimits = detail?.effectiveLimits;
  const ledgerEntries = detail?.recentLedgerEntries ?? [];

  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-accent-border bg-accent-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
              ACCOUNT INSPECTOR
            </span>
            <span className="font-mono text-[11px] text-text-muted">
              {account.accountNumber}
            </span>
          </div>
          <h3 className="mt-1.5 text-base font-semibold text-text-primary">
            {account.accountTitle}
          </h3>
          <p className="text-[11px] text-text-muted">
            {account.accountType} • Opened{" "}
            {new Date(account.createdAt).toLocaleDateString()}
            {isFetching ? " • Refreshing..." : ""}
          </p>
        </div>

        <span
          className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getStatusBadgeClasses(
            account.status
          )}`}
        >
          {account.status}
        </span>
      </div>

      <div className="space-y-4 p-4">
        {/* Balance Highlight */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface-inner p-3.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Available Vault Balance
            </p>
            <p className="mt-0.5 font-mono text-2xl font-bold text-accent">
              {formatCurrencyFull(account.balance)}
            </p>
          </div>
          <span className="rounded-md border border-border bg-surface px-2.5 py-1 font-mono text-xs font-semibold text-text-primary">
            {account.currency}
          </span>
        </div>

        {account.frozenReason ? (
          <div className="rounded-lg border border-border bg-status-danger-bg px-3 py-2 text-xs text-status-danger">
            Hold Reason: {account.frozenReason}
          </div>
        ) : null}

        {/* Account Holder */}
        <div className="space-y-1.5 rounded-lg border border-border bg-surface-inner p-3 text-xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Account Holder
          </p>
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-text-primary">
              {account.owner?.fullName ?? "Unassigned"}
            </span>
            <span className="font-mono text-[11px] text-accent">
              {account.owner?.customerCode ?? "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px] text-text-muted">
            <span>{account.owner?.email ?? "—"}</span>
            <span>KYC: {account.owner?.kycStatus ?? "PENDING"}</span>
          </div>
        </div>

        {/* Effective Transaction Limits */}
        <div className="grid grid-cols-3 gap-2.5 rounded-lg border border-border bg-surface-inner p-3 text-xs">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Daily Cap
            </p>
            <p className="mt-0.5 font-mono font-semibold text-text-primary">
              {effectiveLimits
                ? formatCurrencyFull(effectiveLimits.dailyTransferLimit)
                : account.dailyTransferLimit
                  ? formatCurrencyFull(account.dailyTransferLimit)
                  : "Default"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Single Tx
            </p>
            <p className="mt-0.5 font-mono font-semibold text-text-primary">
              {effectiveLimits
                ? formatCurrencyFull(effectiveLimits.maxSingleTransactionLimit)
                : account.maxSingleTransactionLimit
                  ? formatCurrencyFull(account.maxSingleTransactionLimit)
                  : "Default"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Min Bal
            </p>
            <p className="mt-0.5 font-mono font-semibold text-text-primary">
              {effectiveLimits
                ? formatCurrencyFull(effectiveLimits.minBalanceRequired)
                : account.minBalanceRequired
                  ? formatCurrencyFull(account.minBalanceRequired)
                  : "Default"}
            </p>
          </div>
        </div>

        {/* Recent Ledger Postings */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Recent Ledger Postings ({ledgerEntries.length})
          </h4>
          {ledgerEntries.length === 0 ? (
            <p className="rounded-lg border border-border-subtle bg-surface-inner px-3 py-4 text-center text-xs text-text-muted">
              No ledger entries recorded for this account yet.
            </p>
          ) : (
            <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
              {ledgerEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-inner px-3 py-2 text-[11px]"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${
                          entry.direction === "CREDIT"
                            ? "bg-status-success-bg text-status-success"
                            : "bg-status-danger-bg text-status-danger"
                        }`}
                      >
                        {entry.direction}
                      </span>
                      <span className="font-mono font-medium text-text-primary">
                        {entry.referenceId}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-text-muted">
                      {entry.transactionType} •{" "}
                      {formatTimeStampHMS(entry.createdAt)}
                    </p>
                  </div>
                  <span className="font-mono font-semibold text-text-primary">
                    {formatCurrencyFull(entry.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
