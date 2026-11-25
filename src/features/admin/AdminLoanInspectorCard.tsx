"use client";

import { useState } from "react";
import {
  useDecideAdminLoanMutation,
  useGetAdminLoanDetailQuery,
} from "@/features/admin/adminApi";
import type {
  AdminLoanDetailDTO,
  AdminLoanListItemDTO,
} from "@/types/admin.types";
import type { ApiErrorEnvelope } from "@/types/api.types";
import { formatCurrencyFull, formatTimeStampHMS } from "@/utils/formatters";

interface AdminLoanInspectorCardProps {
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

function getLoanTypeLabel(type: AdminLoanListItemDTO["loanType"]): string {
  switch (type) {
    case "PERSONAL":
      return "Personal Loan";
    case "BUSINESS":
      return "Business Facility";
    case "EDUCATION":
      return "Education Loan";
    case "HOME":
      return "Mortgage / Home";
    case "AUTO":
      return "Auto Financing";
    default:
      return type;
  }
}

function LoanInspectorBody({
  summary,
  detail,
  isFetchingDetail,
}: {
  summary: AdminLoanListItemDTO;
  detail: AdminLoanDetailDTO | undefined;
  isFetchingDetail: boolean;
}) {
  const loan = detail ?? summary;
  const [activeTab, setActiveTab] = useState<"UNDERWRITING" | "SCHEDULE" | "REPAYMENTS">(
    "UNDERWRITING"
  );
  const [approvedAmountInput, setApprovedAmountInput] = useState(
    loan.requestedAmount
  );
  const [interestRateInput, setInterestRateInput] = useState(loan.interestRate);
  const [decisionNote, setDecisionNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  const [decideLoan, { isLoading: isSubmitting }] = useDecideAdminLoanMutation();

  const canDecide =
    loan.status === "PENDING" || loan.status === "UNDER_REVIEW";

  const handleDecision = async (decision: "APPROVE" | "REJECT") => {
    setFeedback(null);

    if (decision === "APPROVE") {
      const parsedAmount = Number(approvedAmountInput);
      const parsedRate = Number(interestRateInput);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        setFeedback({
          kind: "error",
          message: "Approved amount must be a positive number.",
        });
        return;
      }
      if (!Number.isFinite(parsedRate) || parsedRate < 0 || parsedRate > 100) {
        setFeedback({
          kind: "error",
          message: "Interest rate must be between 0 and 100%.",
        });
        return;
      }

      try {
        await decideLoan({
          loanId: loan.id,
          decision: "APPROVE",
          approvedAmount: parsedAmount,
          interestRate: parsedRate,
          note: decisionNote.trim() || undefined,
        }).unwrap();
        setDecisionNote("");
        setFeedback({
          kind: "success",
          message:
            "Loan approved, repayment schedule generated, and funds disbursed.",
        });
      } catch (err) {
        const apiErr = err as { data?: ApiErrorEnvelope };
        setFeedback({
          kind: "error",
          message:
            apiErr?.data?.error?.message ?? "Failed to approve loan application.",
        });
      }
    } else {
      const trimmedReason = rejectionReason.trim();
      if (trimmedReason.length < 5) {
        setFeedback({
          kind: "error",
          message:
            "Please provide a rejection reason (at least 5 characters) before rejecting.",
        });
        return;
      }

      try {
        await decideLoan({
          loanId: loan.id,
          decision: "REJECT",
          rejectionReason: trimmedReason,
          note: decisionNote.trim() || undefined,
        }).unwrap();
        setRejectionReason("");
        setDecisionNote("");
        setFeedback({
          kind: "success",
          message: "Loan application rejected and logged.",
        });
      } catch (err) {
        const apiErr = err as { data?: ApiErrorEnvelope };
        setFeedback({
          kind: "error",
          message:
            apiErr?.data?.error?.message ?? "Failed to reject loan application.",
        });
      }
    }
  };

  const notes = detail?.notes ?? [];
  const schedule = detail?.repaymentSchedule ?? [];
  const repayments = detail?.repayments ?? [];

  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-accent-border bg-accent-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
              CREDIT INSPECTOR
            </span>
            <span className="font-mono text-[11px] text-text-muted">
              {loan.loanReference}
            </span>
          </div>
          <h3 className="mt-1.5 text-base font-semibold text-text-primary">
            {getLoanTypeLabel(loan.loanType)}
          </h3>
          <p className="text-[11px] text-text-muted">
            Applied {new Date(loan.createdAt).toLocaleDateString()} •{" "}
            {formatTimeStampHMS(loan.createdAt)}
            {isFetchingDetail ? " • Refreshing..." : ""}
          </p>
        </div>

        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getLoanStatusBadgeClasses(
            loan.status
          )}`}
        >
          {loan.status.replaceAll("_", " ")}
        </span>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex border-b border-border bg-surface-inner/60 px-4 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("UNDERWRITING")}
          className={`border-b-2 px-3 py-2.5 font-medium transition-colors ${
            activeTab === "UNDERWRITING"
              ? "border-accent text-accent"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Underwriting
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("SCHEDULE")}
          className={`border-b-2 px-3 py-2.5 font-medium transition-colors ${
            activeTab === "SCHEDULE"
              ? "border-accent text-accent"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Schedule ({schedule.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("REPAYMENTS")}
          className={`border-b-2 px-3 py-2.5 font-medium transition-colors ${
            activeTab === "REPAYMENTS"
              ? "border-accent text-accent"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Repayments ({repayments.length})
        </button>
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
        {activeTab === "UNDERWRITING" ? (
          <>
            {/* Financial Terms Grid */}
            <div className="grid grid-cols-2 gap-2.5 rounded-lg border border-border bg-surface-inner p-3 text-xs sm:grid-cols-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  Requested
                </p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-text-primary">
                  {formatCurrencyFull(loan.requestedAmount)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  Approved
                </p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-accent">
                  {loan.approvedAmount
                    ? formatCurrencyFull(loan.approvedAmount)
                    : "Pending"}
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
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  Remaining
                </p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-text-primary">
                  {formatCurrencyFull(loan.remainingBalance)}
                </p>
              </div>
            </div>

            {/* Applicant & Disbursement Vault */}
            <div className="space-y-2 rounded-lg border border-border bg-surface-inner p-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-text-primary">
                  {loan.customer.fullName}
                </span>
                <span className="font-mono text-[11px] text-accent">
                  {loan.customer.customerCode ?? "NO CODE"} • KYC:{" "}
                  {loan.customer.kycStatus ?? "UNVERIFIED"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px] text-text-muted">
                <span>Income: {formatCurrencyFull(loan.monthlyIncome)}/mo</span>
                <span>{loan.employmentStatus}</span>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-border-subtle pt-2 text-[11px]">
                <span className="text-text-muted">Disbursement Vault</span>
                <span className="font-mono font-medium text-text-primary">
                  {loan.disbursementAccount.accountNumber} (
                  {loan.disbursementAccount.accountTitle})
                </span>
              </div>
              {loan.description ? (
                <div className="border-t border-border-subtle pt-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Purpose / Description
                  </p>
                  <p className="mt-0.5 text-text-secondary">{loan.description}</p>
                </div>
              ) : null}
            </div>

            {/* Staff & Internal Notes */}
            {notes.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  Underwriting Notes ({notes.length})
                </p>
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
            ) : null}

            {/* Admin Decision Controls or Outcome */}
            {canDecide ? (
              <div className="space-y-3 rounded-lg border border-border bg-surface-inner p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Admin Credit Decision &amp; Disbursement
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  <label className="block text-[11px] text-text-muted">
                    Approved Amount
                    <input
                      type="number"
                      step="0.01"
                      value={approvedAmountInput}
                      onChange={(e) => setApprovedAmountInput(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                    />
                  </label>
                  <label className="block text-[11px] text-text-muted">
                    Interest Rate (%)
                    <input
                      type="number"
                      step="0.01"
                      value={interestRateInput}
                      onChange={(e) => setInterestRateInput(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                    />
                  </label>
                </div>

                <input
                  type="text"
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  placeholder="Optional underwriting note..."
                  className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                />

                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Rejection reason (required if rejecting, min 5 chars)..."
                  className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                />

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleDecision("APPROVE")}
                    className="rounded-lg bg-btn-primary px-3 py-2 text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover disabled:opacity-50"
                  >
                    {isSubmitting ? "Processing..." : "Approve & Disburse"}
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleDecision("REJECT")}
                    className="rounded-lg border border-border bg-status-danger-bg px-3 py-2 text-xs font-semibold text-status-danger transition-colors hover:opacity-90 disabled:opacity-50"
                  >
                    Reject Application
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 rounded-lg border border-border bg-surface-inner p-3 text-xs">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  Decision &amp; Disbursement Audit
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Decided By</span>
                  <span className="font-medium text-text-primary">
                    {loan.decidedByAdmin?.fullName ?? "System"}
                  </span>
                </div>
                {loan.monthlyInstallment ? (
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Monthly EMI</span>
                    <span className="font-mono font-semibold text-accent">
                      {formatCurrencyFull(loan.monthlyInstallment)}
                    </span>
                  </div>
                ) : null}
                {loan.disbursementTransaction ? (
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Disbursement Ref</span>
                    <span className="font-mono font-semibold text-status-success">
                      {loan.disbursementTransaction.referenceId}
                    </span>
                  </div>
                ) : null}
                {loan.rejectionReason ? (
                  <div className="border-t border-border-subtle pt-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-status-danger">
                      Rejection Reason
                    </p>
                    <p className="mt-0.5 text-status-danger">
                      {loan.rejectionReason}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </>
        ) : null}

        {activeTab === "SCHEDULE" ? (
          schedule.length === 0 ? (
            <p className="rounded-lg border border-border-subtle bg-surface-inner px-3 py-6 text-center text-xs text-text-muted">
              Repayment schedule will be generated automatically once the loan is
              approved and disbursed.
            </p>
          ) : (
            <div className="max-h-96 space-y-1.5 overflow-y-auto pr-1">
              {schedule.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-inner px-3 py-2 text-xs"
                >
                  <div>
                    <span className="font-mono font-semibold text-text-primary">
                      #{item.installmentNumber}
                    </span>
                    <span className="ml-2 text-[11px] text-text-muted">
                      Due {new Date(item.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold text-text-primary">
                      {formatCurrencyFull(item.totalInstallment)}
                    </p>
                    <p className="text-[10px] text-text-muted">{item.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : null}

        {activeTab === "REPAYMENTS" ? (
          repayments.length === 0 ? (
            <p className="rounded-lg border border-border-subtle bg-surface-inner px-3 py-6 text-center text-xs text-text-muted">
              No loan repayments recorded yet.
            </p>
          ) : (
            <div className="max-h-96 space-y-1.5 overflow-y-auto pr-1">
              {repayments.map((rep) => (
                <div
                  key={rep.id}
                  className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-inner px-3 py-2 text-xs"
                >
                  <div>
                    <p className="font-mono font-semibold text-text-primary">
                      {rep.transaction.referenceId}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      From {rep.paidFromAccount.accountNumber} •{" "}
                      {new Date(rep.paidAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold text-status-success">
                      {formatCurrencyFull(rep.amountPaid)}
                    </p>
                    <p className="font-mono text-[10px] text-text-muted">
                      Rem: {formatCurrencyFull(rep.remainingBalanceAfter)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}

export function AdminLoanInspectorCard({
  selectedLoanSummary,
}: AdminLoanInspectorCardProps) {
  const { data: detailResponse, isFetching } = useGetAdminLoanDetailQuery(
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
          Select any loan application from the queue to review underwriting
          terms, approve &amp; disburse funds, or inspect repayment history.
        </p>
      </div>
    );
  }

  return (
    <LoanInspectorBody
      key={selectedLoanSummary.id}
      summary={selectedLoanSummary}
      detail={detailResponse?.data?.loan}
      isFetchingDetail={isFetching}
    />
  );
}
