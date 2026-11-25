"use client";

import { useState, type FormEvent } from "react";
import {
  useFlagStaffTransactionMutation,
  useGetStaffTransactionDetailQuery,
} from "@/features/staff/staffApi";
import type {
  AdminTransactionDetailDTO,
  AdminTransactionListItemDTO,
} from "@/types/admin.types";
import type { ApiErrorEnvelope } from "@/types/api.types";
import { formatCurrencyFull, formatTimeStampHMS } from "@/utils/formatters";

interface StaffTransactionInspectorCardProps {
  selectedTransactionSummary: AdminTransactionListItemDTO | null;
}

function getStatusBadgeClasses(status: AdminTransactionListItemDTO["status"]) {
  switch (status) {
    case "COMPLETED":
      return "border-border bg-status-success-bg text-status-success";
    case "PENDING":
      return "border-accent-border bg-accent-subtle text-accent";
    case "REVERSED":
      return "border-border bg-status-info-bg text-status-info";
    case "FAILED":
    default:
      return "border-border bg-status-danger-bg text-status-danger";
  }
}

function StaffTxInspectorBody({
  summary,
  detail,
  isFetchingDetail,
}: {
  summary: AdminTransactionListItemDTO;
  detail: AdminTransactionDetailDTO | undefined;
  isFetchingDetail: boolean;
}) {
  const [flagReason, setFlagReason] = useState("");
  const [ruleCode, setRuleCode] = useState("STAFF_MANUAL_REVIEW");
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  const [flagTransaction, { isLoading: isFlagging }] =
    useFlagStaffTransactionMutation();

  const tx = detail ?? summary;
  const ledgerEntries = detail?.ledgerEntries ?? [];
  const suspiciousFlags = detail?.suspiciousFlags ?? [];

  const handleFlagSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const trimmedReason = flagReason.trim();
    if (trimmedReason.length < 5) {
      setFeedback({
        kind: "error",
        message: "Flag reason must be at least 5 characters.",
      });
      return;
    }

    try {
      await flagTransaction({
        transactionId: tx.id,
        reason: trimmedReason,
        ruleCode: ruleCode.trim() || undefined,
      }).unwrap();

      setFlagReason("");
      setFeedback({
        kind: "success",
        message: "Transaction flagged and escalated to Admin review queue.",
      });
    } catch (err) {
      const apiErr = err as { data?: ApiErrorEnvelope };
      setFeedback({
        kind: "error",
        message:
          apiErr?.data?.error?.message ?? "Failed to flag transaction.",
      });
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-accent-border bg-accent-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
              TX INSPECTOR
            </span>
            <span className="font-mono text-[11px] text-text-muted">
              {tx.referenceId}
            </span>
          </div>
          <h3 className="mt-1.5 text-base font-semibold text-text-primary">
            {tx.type.replaceAll("_", " ")}
          </h3>
          <p className="text-[11px] text-text-muted">
            Executed {formatTimeStampHMS(tx.executedAt)} •{" "}
            {new Date(tx.executedAt).toLocaleDateString()}
            {isFetchingDetail ? " • Refreshing..." : ""}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span
            className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getStatusBadgeClasses(
              tx.status
            )}`}
          >
            {tx.status}
          </span>
          {tx.isFlagged ? (
            <span className="rounded-full border border-border bg-status-danger-bg px-2 py-0.5 text-[10px] font-semibold uppercase text-status-danger">
              FLAGGED FOR ADMIN
            </span>
          ) : null}
        </div>
      </div>

      {feedback ? (
        <div
          className={`mx-4 mt-3 rounded-lg border px-3 py-2 text-xs ${
            feedback.kind === "success"
              ? "border-border bg-status-success-bg text-status-success"
              : "border-border bg-status-danger-bg text-status-danger"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="space-y-4 p-4">
        {/* Financial Summary */}
        <div className="grid grid-cols-3 gap-2.5 rounded-lg border border-border bg-surface-inner p-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Principal
            </p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-text-primary">
              {formatCurrencyFull(tx.amount)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Fee
            </p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-text-secondary">
              {formatCurrencyFull(tx.fee)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Total
            </p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-accent">
              {formatCurrencyFull(tx.totalAmount)}
            </p>
          </div>
        </div>

        {/* Counterparties */}
        <div className="space-y-2 rounded-lg border border-border bg-surface-inner p-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-text-muted">Sender</span>
            <span className="font-mono text-text-primary">
              {tx.senderAccount
                ? `${tx.senderAccount.accountNumber} (${tx.senderAccount.accountTitle})`
                : "External / System"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-text-muted">Receiver</span>
            <span className="font-mono text-text-primary">
              {tx.receiverAccount
                ? `${tx.receiverAccount.accountNumber} (${tx.receiverAccount.accountTitle})`
                : "External / System"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-text-muted">Initiated By</span>
            <span className="text-text-primary">
              {tx.initiatedBy.fullName} ({tx.initiatedBy.role})
            </span>
          </div>
          {tx.description ? (
            <div className="border-t border-border-subtle pt-2 text-text-secondary">
              {tx.description}
            </div>
          ) : null}
        </div>

        {/* Ledger Postings */}
        <div className="space-y-1.5">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Double-Entry Ledger Postings ({ledgerEntries.length})
          </h4>
          {ledgerEntries.length === 0 ? (
            <p className="rounded-lg border border-border-subtle bg-surface-inner px-3 py-3 text-xs text-text-muted">
              {isFetchingDetail
                ? "Loading ledger entries..."
                : "No ledger entries recorded."}
            </p>
          ) : (
            ledgerEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-inner px-3 py-2 text-[11px]"
              >
                <div>
                  <span
                    className={`mr-1.5 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${
                      entry.direction === "CREDIT"
                        ? "bg-status-success-bg text-status-success"
                        : "bg-status-danger-bg text-status-danger"
                    }`}
                  >
                    {entry.direction}
                  </span>
                  <span className="font-mono text-text-primary">
                    {entry.accountNumber}
                  </span>
                </div>
                <span className="font-mono font-semibold text-text-primary">
                  {formatCurrencyFull(entry.amount)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Existing Flags */}
        {suspiciousFlags.length > 0 ? (
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-status-danger">
              Existing Flags ({suspiciousFlags.length})
            </h4>
            {suspiciousFlags.map((flag) => (
              <div
                key={flag.id}
                className="rounded-lg border border-border bg-status-danger-bg/40 p-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-semibold text-status-danger">
                    {flag.source} {flag.ruleCode ? `• ${flag.ruleCode}` : ""}
                  </span>
                  <span className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-text-primary">
                    {flag.status}
                  </span>
                </div>
                <p className="mt-1 text-text-primary">{flag.reason}</p>
              </div>
            ))}
          </div>
        ) : null}

        {/* Staff Flag Suspicious Form */}
        <form
          onSubmit={handleFlagSubmit}
          className="space-y-2.5 rounded-lg border border-border bg-surface-inner p-3"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Escalate Suspicious Activity to Admin
          </p>

          <input
            type="text"
            value={ruleCode}
            onChange={(e) => setRuleCode(e.target.value)}
            placeholder="Rule Code (e.g. STAFF_MANUAL_REVIEW)"
            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />

          <textarea
            rows={2}
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            placeholder="Describe suspicious pattern or compliance concern (min 5 chars)..."
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />

          <button
            type="submit"
            disabled={isFlagging}
            className="w-full rounded-lg border border-border bg-status-danger-bg px-3 py-2 text-xs font-semibold text-status-danger transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {isFlagging
              ? "Flagging Transaction..."
              : "Flag Suspicious for Admin Review"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function StaffTransactionInspectorCard({
  selectedTransactionSummary,
}: StaffTransactionInspectorCardProps) {
  const { data: detailResponse, isFetching } = useGetStaffTransactionDetailQuery(
    selectedTransactionSummary?.id ?? "",
    { skip: !selectedTransactionSummary?.id }
  );

  if (!selectedTransactionSummary) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-border bg-surface p-6 text-center">
        <p className="text-sm font-semibold text-text-primary">
          No Transaction Selected
        </p>
        <p className="mt-1 max-w-xs text-xs text-text-muted">
          Select any transaction row from the ledger to inspect postings or
          escalate suspicious activity to Admin.
        </p>
      </div>
    );
  }

  return (
    <StaffTxInspectorBody
      key={selectedTransactionSummary.id}
      summary={selectedTransactionSummary}
      detail={detailResponse?.data?.transaction}
      isFetchingDetail={isFetching}
    />
  );
}
