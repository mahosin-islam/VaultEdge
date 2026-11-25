"use client";

import { useState } from "react";
import {
  useGetAdminTransactionDetailQuery,
  useReviewAdminTransactionMutation,
} from "@/features/admin/adminApi";
import type {
  AdminReviewTransactionAction,
  AdminTransactionDetailDTO,
  AdminTransactionListItemDTO,
} from "@/types/admin.types";
import type { ApiErrorEnvelope } from "@/types/api.types";
import { formatCurrencyFull, formatTimeStampHMS } from "@/utils/formatters";

interface AdminTransactionInspectorCardProps {
  selectedTransactionSummary: AdminTransactionListItemDTO | null;
}

function getTxStatusBadgeClasses(status: AdminTransactionListItemDTO["status"]) {
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

function getTxTypeLabel(type: AdminTransactionListItemDTO["type"]): string {
  switch (type) {
    case "DEPOSIT":
      return "Deposit";
    case "WITHDRAWAL":
      return "Withdrawal";
    case "FUND_TRANSFER":
      return "Fund Transfer";
    case "LOAN_DISBURSEMENT":
      return "Loan Disbursement";
    case "LOAN_REPAYMENT":
      return "Loan Repayment";
    default:
      return type;
  }
}

function TransactionInspectorBody({
  summary,
  detail,
  isFetchingDetail,
}: {
  summary: AdminTransactionListItemDTO;
  detail: AdminTransactionDetailDTO | undefined;
  isFetchingDetail: boolean;
}) {
  const [reviewNote, setReviewNote] = useState("");
  const [confirmReverse, setConfirmReverse] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  const [reviewTransaction, { isLoading: isSubmitting }] =
    useReviewAdminTransactionMutation();

  const tx = detail ?? summary;
  const ledgerEntries = detail?.ledgerEntries ?? [];
  const suspiciousFlags = detail?.suspiciousFlags ?? [];
  const openFlag = suspiciousFlags.find(
    (f) => f.status === "OPEN" || f.status === "UNDER_REVIEW"
  );

  const canReverse =
    tx.status === "COMPLETED" && !detail?.reversalTransaction && !summary.reversedTransactionId;

  const handleAction = async (action: AdminReviewTransactionAction) => {
    setFeedback(null);
    const trimmedNote = reviewNote.trim();
    if (trimmedNote.length < 3) {
      setFeedback({
        kind: "error",
        message: "Please enter a compliance note (at least 3 characters) before executing an action.",
      });
      return;
    }

    try {
      await reviewTransaction({
        transactionId: tx.id,
        action,
        note: trimmedNote,
        flagId: openFlag?.id,
      }).unwrap();
      setReviewNote("");
      setConfirmReverse(false);
      setFeedback({
        kind: "success",
        message: `Compliance directive (${action.replaceAll("_", " ")}) applied.`,
      });
    } catch (err) {
      const apiErr = err as { data?: ApiErrorEnvelope };
      setFeedback({
        kind: "error",
        message:
          apiErr?.data?.error?.message ??
          "Failed to execute transaction compliance action.",
      });
    }
  };

  const handleDownloadReceipt = () => {
    const lines = [
      "============================================================",
      "VAULTEDGE INSTITUTIONAL BANKING — TRANSACTION AUDIT RECEIPT",
      "============================================================",
      `Reference ID     : ${tx.referenceId}`,
      `Transaction ID   : ${tx.id}`,
      `Type             : ${getTxTypeLabel(tx.type)}`,
      `Status           : ${tx.status}`,
      `Executed At      : ${tx.executedAt}`,
      `Flagged          : ${tx.isFlagged ? "YES" : "NO"}`,
      "------------------------------------------------------------",
      `Principal Amount : ${formatCurrencyFull(tx.amount)}`,
      `Fee              : ${formatCurrencyFull(tx.fee)}`,
      `Total Amount     : ${formatCurrencyFull(tx.totalAmount)}`,
      "------------------------------------------------------------",
      `Sender Account   : ${
        tx.senderAccount
          ? `${tx.senderAccount.accountNumber} (${tx.senderAccount.accountTitle})`
          : "N/A"
      }`,
      `Receiver Account : ${
        tx.receiverAccount
          ? `${tx.receiverAccount.accountNumber} (${tx.receiverAccount.accountTitle})`
          : "N/A"
      }`,
      `Initiated By     : ${tx.initiatedBy.fullName} (${tx.initiatedBy.role})`,
      `Description      : ${tx.description ?? "N/A"}`,
      ...(tx.failureReason ? [`Failure Reason   : ${tx.failureReason}`] : []),
      "============================================================",
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `vaultedge-receipt-${tx.referenceId}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-accent-border bg-accent-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
              LIVE INSPECTOR
            </span>
            <span className="font-mono text-[11px] text-text-muted">
              {tx.referenceId}
            </span>
          </div>
          <h3 className="mt-1.5 text-base font-semibold text-text-primary">
            {getTxTypeLabel(tx.type)}
          </h3>
          <p className="text-[11px] text-text-muted">
            Executed {formatTimeStampHMS(tx.executedAt)} •{" "}
            {new Date(tx.executedAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getTxStatusBadgeClasses(
              tx.status
            )}`}
          >
            {tx.status}
          </span>
          {tx.isFlagged ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-status-danger-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-status-danger">
              FLAGGED FOR REVIEW
            </span>
          ) : null}
        </div>
      </div>

      {/* Feedback Banner */}
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
              Total Settled
            </p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-accent">
              {formatCurrencyFull(tx.totalAmount)}
            </p>
          </div>
        </div>

        {/* Counterparties & Metadata */}
        <div className="space-y-2 rounded-lg border border-border bg-surface-inner p-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-text-muted">
              Sender Account
            </span>
            <span className="text-right font-mono font-medium text-text-primary">
              {tx.senderAccount
                ? `${tx.senderAccount.accountNumber} (${tx.senderAccount.accountTitle})`
                : "External / System"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-text-muted">
              Receiver Account
            </span>
            <span className="text-right font-mono font-medium text-text-primary">
              {tx.receiverAccount
                ? `${tx.receiverAccount.accountNumber} (${tx.receiverAccount.accountTitle})`
                : "External / System"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-text-muted">
              Initiated By
            </span>
            <span className="text-right text-text-primary">
              {tx.initiatedBy.fullName}{" "}
              <span className="font-mono text-[10px] text-text-muted">
                ({tx.initiatedBy.role})
              </span>
            </span>
          </div>
          {tx.description ? (
            <div className="border-t border-border-subtle pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                Description
              </p>
              <p className="mt-0.5 text-xs text-text-secondary">
                {tx.description}
              </p>
            </div>
          ) : null}
          {tx.failureReason ? (
            <div className="border-t border-border-subtle pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-status-danger">
                Failure Reason
              </p>
              <p className="mt-0.5 text-xs text-status-danger">
                {tx.failureReason}
              </p>
            </div>
          ) : null}
          {detail?.reversalTransaction ? (
            <div className="border-t border-border-subtle pt-2 text-[11px] text-status-info">
              Reversed via{" "}
              <span className="font-mono font-semibold">
                {detail.reversalTransaction.referenceId}
              </span>
            </div>
          ) : null}
          {detail?.reversedTransaction ? (
            <div className="border-t border-border-subtle pt-2 text-[11px] text-status-info">
              Reversal for original tx{" "}
              <span className="font-mono font-semibold">
                {detail.reversedTransaction.referenceId}
              </span>
            </div>
          ) : null}
        </div>

        {/* Double-Entry Ledger Postings */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Double-Entry Ledger Postings
            </h4>
            {isFetchingDetail ? (
              <span className="text-[10px] text-text-muted">Loading...</span>
            ) : (
              <span className="font-mono text-[10px] text-text-muted">
                {ledgerEntries.length} entries
              </span>
            )}
          </div>

          {ledgerEntries.length === 0 ? (
            <p className="rounded-lg border border-border-subtle bg-surface-inner px-3 py-2.5 text-xs text-text-muted">
              {isFetchingDetail
                ? "Fetching ledger postings..."
                : "No ledger postings recorded for this transaction."}
            </p>
          ) : (
            <div className="space-y-1.5">
              {ledgerEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border-subtle bg-surface-inner px-3 py-2 text-[11px]"
                >
                  <div className="min-w-0">
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
                        {entry.accountNumber}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        ({entry.entryCategory})
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[10px] text-text-muted">
                      Bal: {formatCurrencyFull(entry.balanceBefore)} →{" "}
                      {formatCurrencyFull(entry.balanceAfter)}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono font-semibold text-text-primary">
                    {formatCurrencyFull(entry.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Suspicious Flags */}
        {suspiciousFlags.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-status-danger">
              Suspicious Activity Flags ({suspiciousFlags.length})
            </h4>
            <div className="space-y-1.5">
              {suspiciousFlags.map((flag) => (
                <div
                  key={flag.id}
                  className="rounded-lg border border-border bg-status-danger-bg/40 p-2.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-semibold uppercase text-status-danger">
                      {flag.source} {flag.ruleCode ? `• ${flag.ruleCode}` : ""}
                    </span>
                    <span className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-text-primary">
                      {flag.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-text-primary">{flag.reason}</p>
                  {flag.resolutionNote ? (
                    <p className="mt-1 text-[11px] text-text-secondary">
                      Resolution: {flag.resolutionNote}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Administrative Compliance Directives */}
        <div className="space-y-2.5 rounded-lg border border-border bg-surface-inner p-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Compliance &amp; Reversal Directives
            </h4>
            <button
              type="button"
              onClick={handleDownloadReceipt}
              className="text-[11px] font-medium text-accent hover:underline"
            >
              Download Receipt
            </button>
          </div>

          <textarea
            rows={2}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="Enter mandatory compliance note or reversal justification (min 3 chars)..."
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />

          <div className="flex flex-wrap gap-2">
            {!tx.isFlagged ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleAction("FLAG_SUSPICIOUS")}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-status-danger transition-colors hover:bg-status-danger-bg disabled:opacity-50"
              >
                Flag Suspicious
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleAction("RESOLVE_FLAG_SAFE")}
                  className="rounded-lg border border-border bg-status-success-bg px-3 py-1.5 text-xs font-semibold text-status-success transition-colors hover:opacity-90 disabled:opacity-50"
                >
                  Mark Safe
                </button>
                {openFlag ? (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleAction("CONFIRM_SUSPICIOUS")}
                    className="rounded-lg border border-border bg-status-danger-bg px-3 py-1.5 text-xs font-semibold text-status-danger transition-colors hover:opacity-90 disabled:opacity-50"
                  >
                    Confirm Suspicious
                  </button>
                ) : null}
              </>
            )}

            {canReverse ? (
              !confirmReverse ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setConfirmReverse(true)}
                  className="ml-auto rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover disabled:opacity-50"
                >
                  Reverse Transaction
                </button>
              ) : (
                <div className="ml-auto flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleAction("REVERSE_TRANSACTION")}
                    className="rounded-lg bg-btn-primary px-3 py-1.5 text-xs font-semibold text-btn-primary-text hover:bg-btn-primary-hover disabled:opacity-50"
                  >
                    Confirm Reversal
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setConfirmReverse(false)}
                    className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text-secondary hover:bg-surface-hover"
                  >
                    Cancel
                  </button>
                </div>
              )
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminTransactionInspectorCard({
  selectedTransactionSummary,
}: AdminTransactionInspectorCardProps) {
  const { data: detailResponse, isFetching } = useGetAdminTransactionDetailQuery(
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
          Select any transaction row from the ledger to inspect double-entry
          postings, compliance flags, or execute reversals.
        </p>
      </div>
    );
  }

  return (
    <TransactionInspectorBody
      key={selectedTransactionSummary.id}
      summary={selectedTransactionSummary}
      detail={detailResponse?.data?.transaction}
      isFetchingDetail={isFetching}
    />
  );
}
