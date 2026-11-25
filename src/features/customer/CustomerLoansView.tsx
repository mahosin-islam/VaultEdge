"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  useApplyCustomerLoanMutation,
  useGetCustomerAccountsQuery,
  useGetCustomerLoanDetailQuery,
  useGetCustomerLoansQuery,
  useRepayCustomerLoanMutation,
} from "@/features/customer/customerApi";
import type { SafeUserDTO } from "@/types/auth.types";
import type {
  CustomerAccountDetailDTO,
  CustomerEmploymentStatus,
  CustomerLoanListItemDTO,
  CustomerLoanType,
} from "@/types/customer.types";
import { formatCurrencyFull } from "@/utils/formatters";

interface CustomerLoansViewProps {
  user: SafeUserDTO;
  initialAccounts: CustomerAccountDetailDTO[];
  initialLoans: CustomerLoanListItemDTO[];
  initialTotalCount: number;
}

function createIdempotencyKey(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getLoanStatusClasses(status: string): string {
  switch (status) {
    case "ACTIVE":
    case "APPROVED":
    case "COMPLETED":
    case "PAID":
      return "border-status-success-border bg-status-success-bg text-status-success";
    case "PENDING":
    case "UNDER_REVIEW":
    case "PARTIALLY_PAID":
      return "border-status-warning-border bg-status-warning-bg text-status-warning";
    case "REJECTED":
    case "DEFAULTED":
    case "OVERDUE":
      return "border-status-danger-border bg-status-danger-bg text-status-danger";
    default:
      return "border-status-info-border bg-status-info-bg text-status-info";
  }
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

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "data" in error) {
    const data = (
      error as { data?: { error?: { message?: string }; message?: string } }
    ).data;
    if (data?.error?.message) return data.error.message;
    if (data?.message) return data.message;
  }
  return fallback;
}

export function CustomerLoansView({
  user,
  initialAccounts,
  initialLoans,
  initialTotalCount,
}: CustomerLoansViewProps) {
  const { data: accountsRes } = useGetCustomerAccountsQuery();
  const accounts = accountsRes?.data?.accounts ?? initialAccounts;
  const activeAccounts = useMemo(
    () => accounts.filter((a) => a.status === "ACTIVE"),
    [accounts]
  );

  // List filters & selection
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loanTypeFilter, setLoanTypeFilter] = useState("");
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(
    initialLoans[0]?.id ?? null
  );

  // Apply form toggle & state
  const [showApplyForm, setShowApplyForm] = useState(initialLoans.length === 0);
  const [disbursementAccountId, setDisbursementAccountId] = useState(
    activeAccounts[0]?.id ?? ""
  );
  const [loanType, setLoanType] = useState<CustomerLoanType>("PERSONAL");
  const [requestedAmount, setRequestedAmount] = useState("");
  const [durationMonths, setDurationMonths] = useState("12");
  const [monthlyIncome, setMonthlyIncome] = useState(
    user.customerProfile?.monthlyIncome ?? ""
  );
  const [employmentStatus, setEmploymentStatus] =
    useState<CustomerEmploymentStatus>(
      (user.customerProfile?.employmentStatus as CustomerEmploymentStatus) ??
        "EMPLOYED"
    );
  const [description, setDescription] = useState("");
  const [applyKey, setApplyKey] = useState(() => createIdempotencyKey("ln"));
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);

  // Repayment form state
  const [paidFromAccountId, setPaidFromAccountId] = useState(
    activeAccounts[0]?.id ?? ""
  );
  const [scheduleId, setScheduleId] = useState("");
  const [repayAmount, setRepayAmount] = useState("");
  const [transactionPin, setTransactionPin] = useState("");
  const [repayKey, setRepayKey] = useState(() => createIdempotencyKey("rep"));
  const [repayError, setRepayError] = useState<string | null>(null);
  const [repaySuccess, setRepaySuccess] = useState<string | null>(null);

  const [applyLoan, { isLoading: isApplying }] = useApplyCustomerLoanMutation();
  const [repayLoan, { isLoading: isRepaying }] = useRepayCustomerLoanMutation();

  const hasFilters = Boolean(statusFilter || loanTypeFilter || page > 1);

  const {
    data: loansRes,
    isFetching: isLoansFetching,
    isError: isLoansError,
    refetch: refetchLoans,
  } = useGetCustomerLoansQuery({
    page,
    limit: 8,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(loanTypeFilter ? { loanType: loanTypeFilter } : {}),
  });

  const loans = loansRes?.data?.loans ?? (!hasFilters ? initialLoans : []);
  const meta = loansRes?.meta as
    | { page?: number; totalPages?: number; total?: number }
    | undefined;
  const currentPage = meta?.page ?? page;
  const totalPages =
    meta?.totalPages ?? Math.max(1, Math.ceil(initialTotalCount / 8));
  const totalCount = meta?.total ?? initialTotalCount;

  const activeLoanId = selectedLoanId ?? loans[0]?.id ?? null;

  const {
    data: detailRes,
    isFetching: isDetailFetching,
    isError: isDetailError,
    refetch: refetchDetail,
  } = useGetCustomerLoanDetailQuery(activeLoanId ?? "", {
    skip: !activeLoanId,
  });

  const inspectedLoan = detailRes?.data?.loan ?? null;

  const unpaidSchedules = useMemo(
    () =>
      (inspectedLoan?.repaymentSchedule ?? []).filter(
        (s) => s.status !== "PAID"
      ),
    [inspectedLoan?.repaymentSchedule]
  );

  const effectiveDisbursementId = activeAccounts.some(
    (a) => a.id === disbursementAccountId
  )
    ? disbursementAccountId
    : activeAccounts[0]?.id ?? "";

  const effectivePaidFromId = activeAccounts.some(
    (a) => a.id === paidFromAccountId
  )
    ? paidFromAccountId
    : activeAccounts[0]?.id ?? "";

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError(null);
    setApplySuccess(null);

    if (!effectiveDisbursementId) {
      setApplyError("An active bank account is required for loan disbursement.");
      return;
    }
    const amt = Number(requestedAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setApplyError("Please enter a valid positive requested amount.");
      return;
    }
    const months = Number(durationMonths);
    if (!Number.isInteger(months) || months < 1 || months > 360) {
      setApplyError("Loan duration must be between 1 and 360 months.");
      return;
    }
    if (description.trim().length < 10) {
      setApplyError("Loan purpose description must be at least 10 characters.");
      return;
    }

    try {
      const res = await applyLoan({
        disbursementAccountId: effectiveDisbursementId,
        loanType,
        requestedAmount: Number(amt.toFixed(2)),
        durationMonths: months,
        ...(monthlyIncome !== ""
          ? { monthlyIncome: Number(Number(monthlyIncome).toFixed(2)) }
          : {}),
        employmentStatus,
        description: description.trim(),
        idempotencyKey: applyKey,
      }).unwrap();

      const createdId = String(res.data.loan?.id ?? "");
      if (createdId) setSelectedLoanId(createdId);
      setApplySuccess("Loan application submitted for Staff/Admin review.");
      setRequestedAmount("");
      setDescription("");
      setApplyKey(createIdempotencyKey("ln"));
      setShowApplyForm(false);
    } catch (err) {
      setApplyError(
        getApiErrorMessage(err, "Unable to submit loan application.")
      );
    }
  };

  const handleRepaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectedLoan) return;
    setRepayError(null);
    setRepaySuccess(null);

    if (!effectivePaidFromId) {
      setRepayError("Please select an active source account for repayment.");
      return;
    }
    if (!/^\d{4,6}$/.test(transactionPin.trim())) {
      setRepayError("Transaction PIN must be 4 to 6 numeric digits.");
      return;
    }

    const parsedAmt = repayAmount ? Number(repayAmount) : undefined;
    if (parsedAmt !== undefined && (!Number.isFinite(parsedAmt) || parsedAmt <= 0)) {
      setRepayError("Repayment amount must be positive.");
      return;
    }

    try {
      await repayLoan({
        loanId: inspectedLoan.id,
        paidFromAccountId: effectivePaidFromId,
        ...(parsedAmt !== undefined ? { amount: Number(parsedAmt.toFixed(2)) } : {}),
        ...(scheduleId ? { scheduleId } : {}),
        transactionPin: transactionPin.trim(),
        idempotencyKey: repayKey,
      }).unwrap();

      setRepaySuccess("Loan repayment executed successfully.");
      setRepayAmount("");
      setScheduleId("");
      setTransactionPin("");
      setRepayKey(createIdempotencyKey("rep"));
    } catch (err) {
      setRepayError(
        getApiErrorMessage(err, "Unable to process loan repayment.")
      );
    }
  };

  const canRepay =
    inspectedLoan &&
    (inspectedLoan.status === "APPROVED" || inspectedLoan.status === "ACTIVE") &&
    Number(inspectedLoan.remainingBalance) > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            Loan Management
          </h1>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Apply for personal, business, education, home, or auto loans, inspect
            EMI schedules, and execute PIN-protected repayments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowApplyForm((v) => !v);
            setApplyError(null);
          }}
          className="inline-flex shrink-0 items-center whitespace-nowrap rounded-lg bg-btn-primary px-4 py-2 text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover"
        >
          {showApplyForm ? "Close Application Form" : "+ Apply for Loan"}
        </button>
      </div>

      {/* Transaction PIN Notice */}
      {!user.hasTransactionPin ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-status-warning-border bg-status-warning-bg px-4 py-3 text-xs text-status-warning"
        >
          <span>
            Configure a Transaction PIN in Profile &amp; Security before
            executing loan repayments.
          </span>
          <Link
            href="/customer/profile-security"
            className="shrink-0 whitespace-nowrap rounded-lg border border-status-warning-border bg-surface px-3 py-1 font-semibold text-text-primary hover:border-accent"
          >
            Configure PIN &rarr;
          </Link>
        </div>
      ) : null}

      {applySuccess ? (
        <div
          role="status"
          className="rounded-xl border border-status-success-border bg-status-success-bg px-4 py-3 text-xs text-status-success"
        >
          {applySuccess}
        </div>
      ) : null}

      {/* Apply for New Loan Panel */}
      {showApplyForm ? (
        <section
          aria-label="New loan application"
          className="rounded-xl border border-border bg-surface p-6"
        >
          <h2 className="text-base font-semibold text-text-primary">
            Submit New Loan Application
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            Applications are reviewed by Bank Staff and approved/disbursed by
            Admin into your chosen active account.
          </p>

          {applyError ? (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-status-danger-border bg-status-danger-bg px-3.5 py-2.5 text-xs text-status-danger"
            >
              {applyError}
            </div>
          ) : null}

          {activeAccounts.length === 0 ? (
            <div className="mt-4 rounded-lg border border-border-subtle bg-surface-inner p-4 text-xs text-text-muted">
              You need at least one ACTIVE bank account to receive loan
              disbursements.
            </div>
          ) : (
            <form
              onSubmit={handleApplySubmit}
              className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <div>
                <label
                  htmlFor="loanDisbursementAccount"
                  className="block text-xs font-semibold text-text-primary"
                >
                  Disbursement Account
                </label>
                <select
                  id="loanDisbursementAccount"
                  value={effectiveDisbursementId}
                  onChange={(e) => setDisbursementAccountId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                >
                  {activeAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountTitle} ({acc.accountNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="loanType"
                  className="block text-xs font-semibold text-text-primary"
                >
                  Loan Type
                </label>
                <select
                  id="loanType"
                  value={loanType}
                  onChange={(e) =>
                    setLoanType(e.target.value as CustomerLoanType)
                  }
                  className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value="PERSONAL">Personal</option>
                  <option value="BUSINESS">Business</option>
                  <option value="EDUCATION">Education</option>
                  <option value="HOME">Home</option>
                  <option value="AUTO">Auto</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="loanAmount"
                  className="block text-xs font-semibold text-text-primary"
                >
                  Requested Amount (USD)
                </label>
                <input
                  id="loanAmount"
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                  placeholder="10000.00"
                  className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="loanDuration"
                  className="block text-xs font-semibold text-text-primary"
                >
                  Duration (Months)
                </label>
                <input
                  id="loanDuration"
                  type="number"
                  min="1"
                  max="360"
                  required
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="loanIncome"
                  className="block text-xs font-semibold text-text-primary"
                >
                  Monthly Income (USD)
                </label>
                <input
                  id="loanIncome"
                  type="number"
                  step="0.01"
                  min="0"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder="5000.00"
                  className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="loanEmployment"
                  className="block text-xs font-semibold text-text-primary"
                >
                  Employment Status
                </label>
                <select
                  id="loanEmployment"
                  value={employmentStatus}
                  onChange={(e) =>
                    setEmploymentStatus(
                      e.target.value as CustomerEmploymentStatus
                    )
                  }
                  className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value="EMPLOYED">Employed</option>
                  <option value="SELF_EMPLOYED">Self Employed</option>
                  <option value="BUSINESS_OWNER">Business Owner</option>
                  <option value="STUDENT">Student</option>
                  <option value="RETIRED">Retired</option>
                  <option value="UNEMPLOYED">Unemployed</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label
                  htmlFor="loanDescription"
                  className="block text-xs font-semibold text-text-primary"
                >
                  Loan Purpose Description (Min 10 characters)
                </label>
                <textarea
                  id="loanDescription"
                  rows={2}
                  minLength={10}
                  maxLength={1000}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the purpose of your loan application..."
                  className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <button
                  type="submit"
                  disabled={isApplying}
                  className="rounded-lg bg-btn-primary px-5 py-2.5 text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover disabled:opacity-50"
                >
                  {isApplying
                    ? "Submitting Application..."
                    : "Submit Loan Application"}
                </button>
              </div>
            </form>
          )}
        </section>
      ) : null}

      {/* Main Split: Loans List + Details/Schedule/Repay */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left 5 Columns: Loans List */}
        <section
          aria-label="My loan applications"
          className="rounded-xl border border-border bg-surface p-5 xl:col-span-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-text-primary">
              Your Loans ({totalCount})
            </h2>
            {isLoansFetching ? (
              <span className="font-mono text-[10px] text-accent">
                Syncing...
              </span>
            ) : null}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <select
              aria-label="Filter by loan status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-border bg-surface-inner px-2.5 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <select
              aria-label="Filter by loan type"
              value={loanTypeFilter}
              onChange={(e) => {
                setLoanTypeFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-border bg-surface-inner px-2.5 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="PERSONAL">Personal</option>
              <option value="BUSINESS">Business</option>
              <option value="EDUCATION">Education</option>
              <option value="HOME">Home</option>
              <option value="AUTO">Auto</option>
            </select>
          </div>

          {isLoansError ? (
            <div
              role="alert"
              className="mt-4 flex items-center justify-between rounded-lg border border-status-danger-border bg-status-danger-bg p-3 text-xs text-status-danger"
            >
              <span>Unable to load loans.</span>
              <button
                type="button"
                onClick={() => refetchLoans()}
                className="font-semibold underline"
              >
                Retry
              </button>
            </div>
          ) : loans.length === 0 ? (
            <div className="mt-4 rounded-lg border border-border-subtle bg-surface-inner p-8 text-center text-xs text-text-muted">
              No loan applications found. Click &ldquo;+ Apply for Loan&rdquo;
              above to submit a new application.
            </div>
          ) : (
            <>
              <div className="mt-4 space-y-2.5">
                {loans.map((loan) => {
                  const isSelected = loan.id === activeLoanId;
                  return (
                    <button
                      key={loan.id}
                      type="button"
                      onClick={() => {
                        setSelectedLoanId(loan.id);
                        setRepayError(null);
                        setRepaySuccess(null);
                      }}
                      className={`w-full rounded-xl border p-4 text-left transition-colors ${
                        isSelected
                          ? "border-accent bg-accent-subtle"
                          : "border-border bg-surface-inner hover:border-accent-border"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold text-text-primary">
                          {loan.loanReference}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${getLoanStatusClasses(
                            loan.status
                          )}`}
                        >
                          {loan.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-text-secondary">
                        {loan.loanType} • {loan.durationMonths} months @{" "}
                        {loan.interestRate}% APR
                      </p>
                      <div className="mt-2.5 flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-text-primary">
                          {formatCurrencyFull(
                            loan.approvedAmount ?? loan.requestedAmount
                          )}
                        </span>
                        <span className="font-mono text-[11px] text-text-muted">
                          Remaining: {formatCurrencyFull(loan.remainingBalance)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {totalPages > 1 ? (
                <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3 text-xs">
                  <span className="font-mono text-[11px] text-text-muted">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded-lg border border-border bg-surface-inner px-3 py-1 font-medium text-text-primary hover:border-accent disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="rounded-lg border border-border bg-surface-inner px-3 py-1 font-medium text-text-primary hover:border-accent disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>

        {/* Right 7 Columns: Loan Inspector, Schedule & Repayment */}
        <section
          aria-label="Loan details and repayment"
          className="space-y-6 xl:col-span-7"
        >
          {!activeLoanId ? (
            <div className="rounded-xl border border-border bg-surface p-10 text-center text-xs text-text-muted">
              Select a loan application on the left to view terms, schedule, and
              repayments.
            </div>
          ) : isDetailError ? (
            <div className="rounded-xl border border-status-danger-border bg-status-danger-bg p-4 text-xs text-status-danger">
              <span>Unable to load loan details. </span>
              <button
                type="button"
                onClick={() => refetchDetail()}
                className="font-semibold underline"
              >
                Retry
              </button>
            </div>
          ) : !inspectedLoan ? (
            <div className="h-48 animate-pulse rounded-xl border border-border bg-surface" />
          ) : (
            <>
              {/* Overview & Progress */}
              <div className="rounded-xl border border-border bg-surface p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle pb-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase text-text-muted">
                      {inspectedLoan.loanType} FACILITY
                    </p>
                    <h2 className="mt-0.5 font-mono text-lg font-bold text-text-primary">
                      {inspectedLoan.loanReference}
                    </h2>
                    <p className="mt-1 text-xs text-text-secondary">
                      Disbursement Account:{" "}
                      {inspectedLoan.disbursementAccount.accountTitle} (
                      {inspectedLoan.disbursementAccount.accountNumber})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isDetailFetching ? (
                      <span className="font-mono text-[10px] text-accent">
                        Syncing...
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold ${getLoanStatusClasses(
                        inspectedLoan.status
                      )}`}
                    >
                      {inspectedLoan.status}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-border-subtle bg-surface-inner p-3">
                    <span className="block font-mono text-[9px] uppercase text-text-muted">
                      Principal
                    </span>
                    <span className="mt-1 block font-mono text-sm font-bold text-text-primary">
                      {formatCurrencyFull(
                        inspectedLoan.approvedAmount ??
                          inspectedLoan.requestedAmount
                      )}
                    </span>
                  </div>
                  <div className="rounded-lg border border-border-subtle bg-surface-inner p-3">
                    <span className="block font-mono text-[9px] uppercase text-text-muted">
                      Monthly EMI
                    </span>
                    <span className="mt-1 block font-mono text-sm font-bold text-text-primary">
                      {inspectedLoan.monthlyInstallment
                        ? formatCurrencyFull(inspectedLoan.monthlyInstallment)
                        : "—"}
                    </span>
                  </div>
                  <div className="rounded-lg border border-border-subtle bg-surface-inner p-3">
                    <span className="block font-mono text-[9px] uppercase text-text-muted">
                      Total Repaid
                    </span>
                    <span className="mt-1 block font-mono text-sm font-bold text-status-success">
                      {formatCurrencyFull(inspectedLoan.totalRepaidAmount)}
                    </span>
                  </div>
                  <div className="rounded-lg border border-border-subtle bg-surface-inner p-3">
                    <span className="block font-mono text-[9px] uppercase text-text-muted">
                      Remaining
                    </span>
                    <span className="mt-1 block font-mono text-sm font-bold text-text-primary">
                      {formatCurrencyFull(inspectedLoan.remainingBalance)}
                    </span>
                  </div>
                </div>

                {inspectedLoan.rejectionReason ? (
                  <div className="mt-4 rounded-lg border border-status-danger-border bg-status-danger-bg p-3 text-xs text-status-danger">
                    <strong>Rejection Reason:</strong>{" "}
                    {inspectedLoan.rejectionReason}
                  </div>
                ) : null}

                {inspectedLoan.notes.length > 0 ? (
                  <div className="mt-4 space-y-2 border-t border-border-subtle pt-3">
                    <p className="font-mono text-[10px] uppercase text-text-muted">
                      Review Notes
                    </p>
                    {inspectedLoan.notes.map((n) => (
                      <div
                        key={n.id}
                        className="rounded-lg border border-border-subtle bg-surface-inner p-2.5 text-xs"
                      >
                        <p className="text-text-primary">{n.note}</p>
                        <p className="mt-1 font-mono text-[10px] text-text-muted">
                          {n.authorName} ({n.authorRole}) •{" "}
                          {formatDate(n.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Make Repayment Card */}
              {canRepay ? (
                <div className="rounded-xl border border-border bg-surface p-6">
                  <h3 className="text-base font-semibold text-text-primary">
                    Execute Loan Repayment
                  </h3>
                  <p className="mt-1 text-xs text-text-muted">
                    Pay a scheduled installment or custom amount atomically with
                    Transaction PIN authorization.
                  </p>

                  {repayError ? (
                    <div
                      role="alert"
                      className="mt-3 rounded-lg border border-status-danger-border bg-status-danger-bg px-3.5 py-2 text-xs text-status-danger"
                    >
                      {repayError}
                    </div>
                  ) : null}
                  {repaySuccess ? (
                    <div
                      role="status"
                      className="mt-3 rounded-lg border border-status-success-border bg-status-success-bg px-3.5 py-2 text-xs text-status-success"
                    >
                      {repaySuccess}
                    </div>
                  ) : null}

                  <form
                    onSubmit={handleRepaySubmit}
                    className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
                  >
                    <div>
                      <label
                        htmlFor="repayFromAccount"
                        className="block text-xs font-semibold text-text-primary"
                      >
                        Pay From Account
                      </label>
                      <select
                        id="repayFromAccount"
                        value={effectivePaidFromId}
                        onChange={(e) => setPaidFromAccountId(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                      >
                        {activeAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.accountTitle} ({acc.accountNumber}) —{" "}
                            {formatCurrencyFull(acc.balance)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="repayScheduleId"
                        className="block text-xs font-semibold text-text-primary"
                      >
                        Installment (Optional)
                      </label>
                      <select
                        id="repayScheduleId"
                        value={scheduleId}
                        onChange={(e) => setScheduleId(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                      >
                        <option value="">Next Due / Custom Amount</option>
                        {unpaidSchedules.map((s) => (
                          <option key={s.id} value={s.id}>
                            #{s.installmentNumber} • Due{" "}
                            {formatDate(s.dueDate)} •{" "}
                            {formatCurrencyFull(s.totalInstallment)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="repayAmount"
                        className="block text-xs font-semibold text-text-primary"
                      >
                        Amount (USD, optional if installment chosen)
                      </label>
                      <input
                        id="repayAmount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={repayAmount}
                        onChange={(e) => setRepayAmount(e.target.value)}
                        placeholder={
                          inspectedLoan.monthlyInstallment ?? "0.00"
                        }
                        className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="repayPin"
                        className="block text-xs font-semibold text-text-primary"
                      >
                        Transaction PIN (4–6 digits)
                      </label>
                      <input
                        id="repayPin"
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        required
                        value={transactionPin}
                        onChange={(e) =>
                          setTransactionPin(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="••••"
                        className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        disabled={isRepaying || activeAccounts.length === 0}
                        className="w-full rounded-lg bg-btn-primary py-2.5 text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover disabled:opacity-45"
                      >
                        {isRepaying
                          ? "Processing Repayment..."
                          : "Confirm & Pay Loan Installment"}
                      </button>
                    </div>
                  </form>
                </div>
              ) : null}

              {/* Repayment Schedule Table */}
              {inspectedLoan.repaymentSchedule.length > 0 ? (
                <div className="rounded-xl border border-border bg-surface p-5">
                  <h3 className="text-sm font-semibold text-text-primary">
                    Repayment Schedule ({inspectedLoan.repaymentSchedule.length})
                  </h3>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[500px] text-left text-xs">
                      <thead>
                        <tr className="border-b border-border-subtle font-mono text-[10px] uppercase text-text-muted">
                          <th className="pb-2 pr-2">#</th>
                          <th className="pb-2 pr-2">Due Date</th>
                          <th className="pb-2 pr-2 text-right">Principal</th>
                          <th className="pb-2 pr-2 text-right">Interest</th>
                          <th className="pb-2 pr-2 text-right">Total</th>
                          <th className="pb-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {inspectedLoan.repaymentSchedule.map((s) => (
                          <tr key={s.id}>
                            <td className="py-2 pr-2 font-mono">
                              #{s.installmentNumber}
                            </td>
                            <td className="py-2 pr-2 font-mono text-text-secondary">
                              {formatDate(s.dueDate)}
                            </td>
                            <td className="py-2 pr-2 text-right font-mono">
                              {formatCurrencyFull(s.principalAmount)}
                            </td>
                            <td className="py-2 pr-2 text-right font-mono">
                              {formatCurrencyFull(s.interestAmount)}
                            </td>
                            <td className="py-2 pr-2 text-right font-mono font-semibold">
                              {formatCurrencyFull(s.totalInstallment)}
                            </td>
                            <td className="py-2 text-right">
                              <span
                                className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${getLoanStatusClasses(
                                  s.status
                                )}`}
                              >
                                {s.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {/* Repayment History */}
              {inspectedLoan.repayments.length > 0 ? (
                <div className="rounded-xl border border-border bg-surface p-5">
                  <h3 className="text-sm font-semibold text-text-primary">
                    Completed Repayments ({inspectedLoan.repayments.length})
                  </h3>
                  <div className="mt-3 space-y-2">
                    {inspectedLoan.repayments.map((r) => (
                      <div
                        key={r.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-subtle bg-surface-inner px-3 py-2.5 text-xs"
                      >
                        <div>
                          <p className="font-mono font-semibold text-text-primary">
                            {r.transaction.referenceId} •{" "}
                            {formatCurrencyFull(r.amountPaid)}
                          </p>
                          <p className="font-mono text-[10px] text-text-muted">
                            From {r.paidFromAccount.accountNumber} • Remaining:{" "}
                            {formatCurrencyFull(r.remainingBalanceAfter)}
                          </p>
                        </div>
                        <span className="font-mono text-[10px] text-text-muted">
                          {formatDate(r.paidAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
