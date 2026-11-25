"use client";

import { useState } from "react";
import {
  useGetStaffLoanDetailQuery,
  useReviewStaffLoanMutation,
} from "@/features/staff/staffApi";
import type {
  AdminLoanDetailDTO,
  AdminLoanListItemDTO,
} from "@/types/admin.types";
import type { ApiErrorEnvelope } from "@/types/api.types";
import { formatCurrencyFull, formatTimeStampHMS } from "@/utils/formatters";

interface StaffLoanInspectorCardProps {
  selectedLoanSummary: AdminLoanListItemDTO | null;
}

function getLoanStatusBadgeClasses(status: AdminLoanListItemDTO["status"]) {
  switch (status) {
    case "ACTIVE":
    case "APPROVED":
    case "COMPLETED":
      return "border-border bg-status-success-bg text-status-success";
    case "PENDING":
    case "UNDER_REVIEW":
      return "border-accent-border bg-accent-subtle text-accent";
    case "REJECTED":
    default:
      return "border-border bg-status-danger-bg text-status-danger";
  }
}

function StaffLoanInspectorBody({
  summary,
  detail,
  isFetchingDetail,
}: {
  summary: AdminLoanListItemDTO;
  detail: AdminLoanDetailDTO | undefined;
  isFetchingDetail: boolean;
}) {
  const loan = detail ?? summary;
  const [note, setNote] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  const [reviewLoan, { isLoading: isSubmitting }] = useReviewStaffLoanMutation();

  const canReview =
    loan.status === "PENDING" || loan.status === "UNDER_REVIEW";
  const notes = detail?.notes ?? [];

  const handleAction = async (
    action: "ADD_NOTE" | "FORWARD_FOR_APPROVAL"
  ) => {
    setFeedback(null);
    const trimmed = note.trim();
    if (trimmed.length < 3) {
      setFeedback({
        kind: "error",
        message: "Review note must be at least 3 characters.",
      });
      return;
    }

    try {
      await reviewLoan({
        loanId: loan.id,
        action,
        note: trimmed,
        isInternal,
      }).unwrap();

      setNote("");
      setFeedback({
        kind: "success",
        message:
          action === "FORWARD_FOR_APPROVAL"
            ? "Application forwarded to Admin for final credit decision."
            : "Internal review note added to loan dossier.",
      });
    } catch (err) {
      const apiErr = err as { data?: ApiErrorEnvelope };
      setFeedback({
        kind: "error",
        message:
          apiErr?.data?.error?.message ??
          "Failed to submit staff loan review.",
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
              STAFF REVIEW
            </span>
            <span className="font-mono text-[11px] text-text-muted">
              {loan.loanReference}
            </span>
          </div>
          <h3 className="mt-1.5 text-base font-semibold text-text-primary">
            {loan.loanType} Facility
          </h3>
          <p className="text-[11px] text-text-muted">
            Applied {new Date(loan.createdAt).toLocaleDateString()} •{" "}
            {formatTimeStampHMS(loan.createdAt)}
            {isFetchingDetail ? " • Refreshing..." : ""}
          </p>
        </div>

        <span
          className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getLoanStatusBadgeClasses(
            loan.status
          )}`}
        >
          {loan.status.replaceAll("_", " ")}
        </span>
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
        <div className="grid grid-cols-3 gap-2.5 rounded-lg border border-border bg-surface-inner p-3 text-xs">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Requested
            </p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-accent">
              {formatCurrencyFull(loan.requestedAmount)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Rate / Term
            </p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-text-primary">
              {loan.interestRate}% • {loan.durationMonths}m
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Income / Mo
            </p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-text-primary">
              {formatCurrencyFull(loan.monthlyIncome)}
            </p>
          </div>
        </div>

        {/* Customer Financial Profile */}
        <div className="space-y-2 rounded-lg border border-border bg-surface-inner p-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-text-primary">
              {loan.customer.fullName}
            </span>
            <span className="font-mono text-[11px] text-accent">
              KYC: {loan.customer.kycStatus ?? "PENDING"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px] text-text-muted">
            <span>{loan.customer.email}</span>
            <span>{loan.employmentStatus}</span>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border-subtle pt-2 text-[11px]">
            <span className="text-text-muted">Disbursement Vault</span>
            <span className="font-mono text-text-primary">
              {loan.disbursementAccount.accountNumber} (
              {loan.disbursementAccount.accountType})
            </span>
          </div>
          {loan.description ? (
            <div className="border-t border-border-subtle pt-2 text-text-secondary">
              {loan.description}
            </div>
          ) : null}
        </div>

        {/* Review Notes */}
        <div className="space-y-1.5">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Staff &amp; Underwriting Notes ({notes.length})
          </h4>
          {notes.length === 0 ? (
            <p className="rounded-lg border border-border-subtle bg-surface-inner px-3 py-3 text-xs text-text-muted">
              No review notes recorded yet.
            </p>
          ) : (
            <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className="rounded-lg border border-border-subtle bg-surface-inner px-3 py-2 text-xs"
                >
                  <div className="flex items-center justify-between text-[10px] text-text-muted">
                    <span>
                      {n.author.fullName} ({n.author.role})
                    </span>
                    <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1 text-text-primary">{n.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Staff Review Controls */}
        {canReview ? (
          <div className="space-y-3 rounded-lg border border-border bg-surface-inner p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Staff Assessment &amp; Admin Escalation
            </p>

            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter income verification findings or recommendation for Admin (min 3 chars)..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />

            <label className="flex items-center gap-2 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded border-border"
              />
              <span>Mark as internal staff/admin note</span>
            </label>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleAction("ADD_NOTE")}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-hover disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Add Review Note"}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleAction("FORWARD_FOR_APPROVAL")}
                className="rounded-lg bg-btn-primary px-3 py-2 text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover disabled:opacity-50"
              >
                {isSubmitting ? "Forwarding..." : "Forward to Admin"}
              </button>
            </div>

            <p className="text-[10px] text-text-muted">
              Staff cannot approve or reject loans directly. Forwarded
              applications move to Admin underwriting.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-surface-inner p-3 text-xs text-text-muted">
            This loan is in <span className="font-semibold">{loan.status}</span>{" "}
            status and is locked from further staff review edits.
          </div>
        )}
      </div>
    </div>
  );
}

export function StaffLoanInspectorCard({
  selectedLoanSummary,
}: StaffLoanInspectorCardProps) {
  const { data: detailResponse, isFetching } = useGetStaffLoanDetailQuery(
    selectedLoanSummary?.id ?? "",
    { skip: !selectedLoanSummary?.id }
  );

  if (!selectedLoanSummary) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-border bg-surface p-6 text-center">
        <p className="text-sm font-semibold text-text-primary">
          No Loan Application Selected
        </p>
        <p className="mt-1 max-w-xs text-xs text-text-muted">
          Select any loan application to review customer financials, add
          internal notes, or forward for Admin approval.
        </p>
      </div>
    );
  }

  return (
    <StaffLoanInspectorBody
      key={selectedLoanSummary.id}
      summary={selectedLoanSummary}
      detail={detailResponse?.data?.loan}
      isFetchingDetail={isFetching}
    />
  );
}
