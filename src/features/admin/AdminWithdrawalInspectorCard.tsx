"use client";

import { useState } from "react";
import {
  useDecideAdminWithdrawalMutation,
  useGetAdminWithdrawalDetailQuery,
} from "@/features/admin/adminApi";
import type { AdminWithdrawalRequestItemDTO } from "@/types/admin.types";
import type { ApiErrorEnvelope } from "@/types/api.types";
import { formatCurrencyFull, formatTimeStampHMS } from "@/utils/formatters";

interface AdminWithdrawalInspectorCardProps {
  selectedWithdrawalSummary: AdminWithdrawalRequestItemDTO | null;
}

function getRequestStatusBadgeClasses(
  status: AdminWithdrawalRequestItemDTO["status"]
) {
  switch (status) {
    case "APPROVED":
      return "border-border bg-status-success-bg text-status-success";
    case "PENDING":
      return "border-accent-border bg-accent-subtle text-accent";
    case "REJECTED":
    default:
      return "border-border bg-status-danger-bg text-status-danger";
  }
}

function WithdrawalInspectorBody({
  withdrawal,
  isFetchingDetail,
}: {
  withdrawal: AdminWithdrawalRequestItemDTO;
  isFetchingDetail: boolean;
}) {
  const [reviewNote, setReviewNote] = useState("");
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  const [decideWithdrawal, { isLoading: isSubmitting }] =
    useDecideAdminWithdrawalMutation();

  const hasSufficientBalance =
    Number(withdrawal.account.balance) >= Number(withdrawal.amount);

  const handleDecision = async (decision: "APPROVE" | "REJECT") => {
    setFeedback(null);
    const trimmed = reviewNote.trim();
    if (trimmed.length > 0 && trimmed.length < 2) {
      setFeedback({
        kind: "error",
        message: "Review note must be at least 2 characters if provided.",
      });
      return;
    }

    try {
      await decideWithdrawal({
        withdrawalId: withdrawal.id,
        decision,
        reviewNote: trimmed || undefined,
      }).unwrap();
      setReviewNote("");
      setFeedback({
        kind: "success",
        message:
          decision === "APPROVE"
            ? "Withdrawal approved and funds debited from customer vault."
            : "Withdrawal request rejected.",
      });
    } catch (err) {
      const apiErr = err as { data?: ApiErrorEnvelope };
      setFeedback({
        kind: "error",
        message:
          apiErr?.data?.error?.message ??
          "Failed to process withdrawal request decision.",
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
              LIVE INSPECTOR
            </span>
            <span className="font-mono text-[11px] text-text-muted">
              {withdrawal.requestReference}
            </span>
          </div>
          <h3 className="mt-1.5 text-base font-semibold text-text-primary">
            Withdrawal Disbursement Request
          </h3>
          <p className="text-[11px] text-text-muted">
            Requested {formatTimeStampHMS(withdrawal.requestedAt)} •{" "}
            {new Date(withdrawal.requestedAt).toLocaleDateString()}
            {isFetchingDetail ? " • Refreshing..." : ""}
          </p>
        </div>

        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getRequestStatusBadgeClasses(
            withdrawal.status
          )}`}
        >
          {withdrawal.status}
        </span>
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
        {/* Amount Highlight */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface-inner p-3.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Requested Withdrawal Amount
            </p>
            <p className="mt-0.5 font-mono text-2xl font-bold text-accent">
              {formatCurrencyFull(withdrawal.amount)}
            </p>
          </div>
          <span className="rounded-md border border-border bg-surface px-2.5 py-1 font-mono text-xs font-semibold text-text-primary">
            {withdrawal.account.currency}
          </span>
        </div>

        {/* Source Vault Account */}
        <div className="space-y-2 rounded-lg border border-border bg-surface-inner p-3 text-xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Source Bank Account
            </p>
            {withdrawal.status === "PENDING" ? (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                  hasSufficientBalance
                    ? "bg-status-success-bg text-status-success"
                    : "bg-status-danger-bg text-status-danger"
                }`}
              >
                {hasSufficientBalance ? "Sufficient Funds" : "Insufficient Funds"}
              </span>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono font-semibold text-text-primary">
              {withdrawal.account.accountNumber}
            </span>
            <span className="rounded border border-border bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase text-text-secondary">
              {withdrawal.account.accountType} • {withdrawal.account.status}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-text-secondary">
            <span>{withdrawal.account.accountTitle}</span>
            <span className="font-mono font-medium text-text-primary">
              Bal: {formatCurrencyFull(withdrawal.account.balance)}
            </span>
          </div>
        </div>

        {/* Customer Identity & KYC */}
        <div className="space-y-2 rounded-lg border border-border bg-surface-inner p-3 text-xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Customer Identity &amp; KYC
          </p>
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-text-primary">
              {withdrawal.customer.fullName}
            </span>
            <span className="font-mono text-[11px] text-accent">
              {withdrawal.customer.customerCode ?? "NO CODE"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px] text-text-muted">
            <span>{withdrawal.customer.email}</span>
            <span>KYC: {withdrawal.customer.kycStatus ?? "UNVERIFIED"}</span>
          </div>
          {withdrawal.description ? (
            <div className="border-t border-border-subtle pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                Customer Note
              </p>
              <p className="mt-0.5 text-xs text-text-secondary">
                {withdrawal.description}
              </p>
            </div>
          ) : null}
        </div>

        {/* Decision Controls or Audit Trail */}
        {withdrawal.status === "PENDING" ? (
          <div className="space-y-3 rounded-lg border border-border bg-surface-inner p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Treasury Outflow Authorization
            </p>
            <textarea
              rows={2}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Optional approval or rejection note (recorded in audit log)..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDecision("APPROVE")}
                className="rounded-lg bg-btn-primary px-3 py-2 text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : "Approve & Debit"}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDecision("REJECT")}
                className="rounded-lg border border-border bg-status-danger-bg px-3 py-2 text-xs font-semibold text-status-danger transition-colors hover:opacity-90 disabled:opacity-50"
              >
                Reject Request
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 rounded-lg border border-border bg-surface-inner p-3 text-xs">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Settlement Audit Trail
            </p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-text-muted">Reviewed By</span>
              <span className="font-medium text-text-primary">
                {withdrawal.reviewedBy
                  ? `${withdrawal.reviewedBy.fullName} (${withdrawal.reviewedBy.role})`
                  : "System"}
              </span>
            </div>
            {withdrawal.reviewedAt ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-text-muted">Reviewed At</span>
                <span className="font-mono text-text-secondary">
                  {new Date(withdrawal.reviewedAt).toLocaleDateString()} •{" "}
                  {formatTimeStampHMS(withdrawal.reviewedAt)}
                </span>
              </div>
            ) : null}
            {withdrawal.transaction ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-text-muted">Ledger Reference</span>
                <span className="font-mono font-semibold text-status-success">
                  {withdrawal.transaction.referenceId}
                </span>
              </div>
            ) : null}
            {withdrawal.reviewNote ? (
              <div className="border-t border-border-subtle pt-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  Review Note
                </p>
                <p className="mt-0.5 text-text-secondary">
                  {withdrawal.reviewNote}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminWithdrawalInspectorCard({
  selectedWithdrawalSummary,
}: AdminWithdrawalInspectorCardProps) {
  const { data: detailResponse, isFetching } =
    useGetAdminWithdrawalDetailQuery(selectedWithdrawalSummary?.id ?? "", {
      skip: !selectedWithdrawalSummary?.id,
    });

  if (!selectedWithdrawalSummary) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-border bg-surface p-6 text-center">
        <p className="text-sm font-semibold text-text-primary">
          No Withdrawal Request Selected
        </p>
        <p className="mt-1 max-w-xs text-xs text-text-muted">
          Select any withdrawal request from the queue to verify source vault
          balance, customer KYC, or authorize disbursement.
        </p>
      </div>
    );
  }

  const withdrawal =
    detailResponse?.data?.withdrawalRequest ?? selectedWithdrawalSummary;

  return (
    <WithdrawalInspectorBody
      key={selectedWithdrawalSummary.id}
      withdrawal={withdrawal}
      isFetchingDetail={isFetching}
    />
  );
}
