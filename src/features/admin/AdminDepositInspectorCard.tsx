"use client";

import { useState } from "react";
import {
  useDecideAdminDepositMutation,
  useGetAdminDepositDetailQuery,
} from "@/features/admin/adminApi";
import type { AdminDepositRequestItemDTO } from "@/types/admin.types";
import type { ApiErrorEnvelope } from "@/types/api.types";
import { formatCurrencyFull, formatTimeStampHMS } from "@/utils/formatters";

interface AdminDepositInspectorCardProps {
  selectedDepositSummary: AdminDepositRequestItemDTO | null;
}

function getRequestStatusBadgeClasses(status: AdminDepositRequestItemDTO["status"]) {
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

function DepositInspectorBody({
  deposit,
  isFetchingDetail,
}: {
  deposit: AdminDepositRequestItemDTO;
  isFetchingDetail: boolean;
}) {
  const [reviewNote, setReviewNote] = useState("");
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  const [decideDeposit, { isLoading: isSubmitting }] =
    useDecideAdminDepositMutation();

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
      await decideDeposit({
        depositId: deposit.id,
        decision,
        reviewNote: trimmed || undefined,
      }).unwrap();
      setReviewNote("");
      setFeedback({
        kind: "success",
        message:
          decision === "APPROVE"
            ? "Deposit approved and funds credited to customer vault."
            : "Deposit request rejected.",
      });
    } catch (err) {
      const apiErr = err as { data?: ApiErrorEnvelope };
      setFeedback({
        kind: "error",
        message:
          apiErr?.data?.error?.message ??
          "Failed to process deposit request decision.",
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
              {deposit.requestReference}
            </span>
          </div>
          <h3 className="mt-1.5 text-base font-semibold text-text-primary">
            Deposit Credit Request
          </h3>
          <p className="text-[11px] text-text-muted">
            Requested {formatTimeStampHMS(deposit.requestedAt)} •{" "}
            {new Date(deposit.requestedAt).toLocaleDateString()}
            {isFetchingDetail ? " • Refreshing..." : ""}
          </p>
        </div>

        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getRequestStatusBadgeClasses(
            deposit.status
          )}`}
        >
          {deposit.status}
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
              Requested Deposit Amount
            </p>
            <p className="mt-0.5 font-mono text-2xl font-bold text-accent">
              {formatCurrencyFull(deposit.amount)}
            </p>
          </div>
          <span className="rounded-md border border-border bg-surface px-2.5 py-1 font-mono text-xs font-semibold text-text-primary">
            {deposit.account.currency}
          </span>
        </div>

        {/* Target Vault Account */}
        <div className="space-y-2 rounded-lg border border-border bg-surface-inner p-3 text-xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Target Bank Account
          </p>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono font-semibold text-text-primary">
              {deposit.account.accountNumber}
            </span>
            <span className="rounded border border-border bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase text-text-secondary">
              {deposit.account.accountType} • {deposit.account.status}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-text-secondary">
            <span>{deposit.account.accountTitle}</span>
            <span className="font-mono font-medium text-text-primary">
              Bal: {formatCurrencyFull(deposit.account.balance)}
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
              {deposit.customer.fullName}
            </span>
            <span className="font-mono text-[11px] text-accent">
              {deposit.customer.customerCode ?? "NO CODE"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px] text-text-muted">
            <span>{deposit.customer.email}</span>
            <span>KYC: {deposit.customer.kycStatus ?? "UNVERIFIED"}</span>
          </div>
          {deposit.description ? (
            <div className="border-t border-border-subtle pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                Customer Note
              </p>
              <p className="mt-0.5 text-xs text-text-secondary">
                {deposit.description}
              </p>
            </div>
          ) : null}
        </div>

        {/* Decision Controls or Audit Trail */}
        {deposit.status === "PENDING" ? (
          <div className="space-y-3 rounded-lg border border-border bg-surface-inner p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Treasury Settlement Authorization
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
                {isSubmitting ? "Processing..." : "Approve & Credit"}
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
                {deposit.reviewedBy
                  ? `${deposit.reviewedBy.fullName} (${deposit.reviewedBy.role})`
                  : "System"}
              </span>
            </div>
            {deposit.reviewedAt ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-text-muted">Reviewed At</span>
                <span className="font-mono text-text-secondary">
                  {new Date(deposit.reviewedAt).toLocaleDateString()} •{" "}
                  {formatTimeStampHMS(deposit.reviewedAt)}
                </span>
              </div>
            ) : null}
            {deposit.transaction ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-text-muted">Ledger Reference</span>
                <span className="font-mono font-semibold text-status-success">
                  {deposit.transaction.referenceId}
                </span>
              </div>
            ) : null}
            {deposit.reviewNote ? (
              <div className="border-t border-border-subtle pt-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  Review Note
                </p>
                <p className="mt-0.5 text-text-secondary">{deposit.reviewNote}</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminDepositInspectorCard({
  selectedDepositSummary,
}: AdminDepositInspectorCardProps) {
  const { data: detailResponse, isFetching } = useGetAdminDepositDetailQuery(
    selectedDepositSummary?.id ?? "",
    { skip: !selectedDepositSummary?.id }
  );

  if (!selectedDepositSummary) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-border bg-surface p-6 text-center">
        <p className="text-sm font-semibold text-text-primary">
          No Deposit Request Selected
        </p>
        <p className="mt-1 max-w-xs text-xs text-text-muted">
          Select any deposit request from the queue to inspect target vault
          details, verify customer KYC, or authorize settlement.
        </p>
      </div>
    );
  }

  const deposit = detailResponse?.data?.depositRequest ?? selectedDepositSummary;

  return (
    <DepositInspectorBody
      key={selectedDepositSummary.id}
      deposit={deposit}
      isFetchingDetail={isFetching}
    />
  );
}
