"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  useCreateCustomerDepositRequestMutation,
  useGetCustomerAccountsQuery,
  useGetCustomerDepositRequestDetailQuery,
  useGetCustomerDepositRequestsQuery,
} from "@/features/customer/customerApi";
import type {
  CustomerAccountDetailDTO,
  CustomerDepositRequestDTO,
  CustomerRequestStatus,
} from "@/types/customer.types";
import { formatCurrencyFull } from "@/utils/formatters";

interface CustomerDepositRequestsViewProps {
  initialAccounts: CustomerAccountDetailDTO[];
  initialDepositRequests: CustomerDepositRequestDTO[];
  initialTotalCount: number;
  initialAccountId?: string;
}

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `dep-${crypto.randomUUID()}`;
  }
  return `dep-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getRequestStatusClasses(status: CustomerRequestStatus): string {
  switch (status) {
    case "APPROVED":
      return "border-status-success-border bg-status-success-bg text-status-success";
    case "PENDING":
      return "border-status-warning-border bg-status-warning-bg text-status-warning";
    case "REJECTED":
      return "border-status-danger-border bg-status-danger-bg text-status-danger";
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

function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "data" in error) {
    const data = (
      error as { data?: { error?: { message?: string }; message?: string } }
    ).data;
    if (data?.error?.message) return data.error.message;
    if (data?.message) return data.message;
  }
  return "Unable to submit deposit request. Please check your details and try again.";
}

export function CustomerDepositRequestsView({
  initialAccounts,
  initialDepositRequests,
  initialTotalCount,
  initialAccountId,
}: CustomerDepositRequestsViewProps) {
  const { data: accountsRes } = useGetCustomerAccountsQuery();
  const accounts = accountsRes?.data?.accounts ?? initialAccounts;

  const defaultAccountId = useMemo(() => {
    if (initialAccountId && accounts.some((a) => a.id === initialAccountId)) {
      return initialAccountId;
    }
    return (
      accounts.find((a) => a.status === "ACTIVE")?.id ?? accounts[0]?.id ?? ""
    );
  }, [accounts, initialAccountId]);

  // Form state
  const [accountId, setAccountId] = useState(defaultAccountId);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() =>
    createIdempotencyKey()
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedRequest, setSubmittedRequest] =
    useState<CustomerDepositRequestDTO | null>(null);

  // History filter & pagination state
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"" | CustomerRequestStatus>(
    ""
  );
  const [accountFilter, setAccountFilter] = useState("");
  const [selectedDepositId, setSelectedDepositId] = useState<string | null>(
    null
  );

  const [createDeposit, { isLoading: isSubmitting }] =
    useCreateCustomerDepositRequestMutation();

  const {
    data: listRes,
    isFetching: isListFetching,
    isError: isListError,
    refetch: refetchList,
  } = useGetCustomerDepositRequestsQuery({
    page,
    limit: 8,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(accountFilter ? { accountId: accountFilter } : {}),
  });

  const { data: detailRes, isFetching: isDetailFetching } =
    useGetCustomerDepositRequestDetailQuery(selectedDepositId ?? "", {
      skip: !selectedDepositId,
    });

  const depositRequests =
    listRes?.data?.depositRequests ??
    (page === 1 && !statusFilter && !accountFilter
      ? initialDepositRequests
      : []);

  const meta = listRes?.meta as
    | { page?: number; totalPages?: number; total?: number }
    | undefined;
  const currentPage = meta?.page ?? page;
  const totalPages = meta?.totalPages ?? Math.max(1, Math.ceil(initialTotalCount / 8));
  const totalCount = meta?.total ?? initialTotalCount;

  const effectiveAccountId = accounts.some((a) => a.id === accountId)
    ? accountId
    : defaultAccountId;
  const targetAccount =
    accounts.find((a) => a.id === effectiveAccountId) ?? null;

  const inspectedDeposit =
    detailRes?.data?.depositRequest ??
    depositRequests.find((d) => d.id === selectedDepositId) ??
    null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmittedRequest(null);

    if (!targetAccount) {
      setFormError("Please select a destination bank account.");
      return;
    }
    if (targetAccount.status !== "ACTIVE") {
      setFormError(
        `Account ${targetAccount.accountNumber} is ${targetAccount.status} and cannot receive deposits.`
      );
      return;
    }
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError("Please enter a valid positive deposit amount.");
      return;
    }

    try {
      const res = await createDeposit({
        accountId: targetAccount.id,
        amount: Number(parsedAmount.toFixed(2)),
        ...(description.trim() ? { description: description.trim() } : {}),
        idempotencyKey,
      }).unwrap();

      setSubmittedRequest(res.data.depositRequest);
      setSelectedDepositId(res.data.depositRequest.id);
      setAmount("");
      setDescription("");
      setIdempotencyKey(createIdempotencyKey());
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            Deposit Request
          </h1>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Submit deposit requests to your active VaultEdge accounts and track
            Admin or Bank Staff approval status in real time.
          </p>
        </div>

        <Link
          href="/customer/accounts"
          className="inline-flex shrink-0 items-center whitespace-nowrap rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent"
        >
          View My Accounts &rarr;
        </Link>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <p className="text-base font-semibold text-text-primary">
            No bank accounts available for deposits
          </p>
          <p className="mt-1 text-xs text-text-muted">
            An active bank account is required before submitting a deposit
            request.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Left 5 Columns: Submit Deposit Request Form */}
          <section
            aria-label="Submit deposit request"
            className="rounded-xl border border-border bg-surface p-6 xl:col-span-5"
          >
            <h2 className="text-base font-semibold text-text-primary">
              New Deposit Request
            </h2>
            <p className="mt-1 text-xs text-text-muted">
              Funds are credited atomically to your account once reviewed and
              approved by Admin or Bank Staff.
            </p>

            {formError ? (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-status-danger-border bg-status-danger-bg px-3.5 py-2.5 text-xs text-status-danger"
              >
                {formError}
              </div>
            ) : null}

            {submittedRequest ? (
              <div
                role="status"
                className="mt-4 rounded-lg border border-status-success-border bg-status-success-bg px-3.5 py-3 text-xs text-status-success"
              >
                <p className="font-semibold">
                  Deposit Request Submitted ({submittedRequest.requestReference})
                </p>
                <p className="mt-1">
                  Amount: {formatCurrencyFull(submittedRequest.amount)} • Status:{" "}
                  {submittedRequest.status}
                </p>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="depositAccountId"
                  className="block text-xs font-semibold text-text-primary"
                >
                  Destination Account
                </label>
                <select
                  id="depositAccountId"
                  value={effectiveAccountId}
                  onChange={(e) => {
                    setAccountId(e.target.value);
                    setFormError(null);
                  }}
                  className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountTitle} ({acc.accountNumber}) —{" "}
                      {formatCurrencyFull(acc.balance)} [{acc.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="depositAmount"
                  className="block text-xs font-semibold text-text-primary"
                >
                  Deposit Amount (USD)
                </label>
                <input
                  id="depositAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2.5 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="depositDescription"
                  className="block text-xs font-semibold text-text-primary"
                >
                  Deposit Reference / Description (Optional)
                </label>
                <textarea
                  id="depositDescription"
                  rows={3}
                  maxLength={250}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Cashier deposit slip, wire reference, or check memo..."
                  className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || targetAccount?.status !== "ACTIVE"}
                className="w-full rounded-lg bg-btn-primary py-2.5 text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover disabled:opacity-45"
              >
                {isSubmitting
                  ? "Submitting Deposit Request..."
                  : "Submit Deposit Request"}
              </button>
            </form>
          </section>

          {/* Right 7 Columns: Deposit History & Inspector */}
          <div className="space-y-6 xl:col-span-7">
            <section
              aria-label="Deposit request history"
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-text-primary">
                    Deposit Request History
                  </h2>
                  <p className="text-xs text-text-muted">
                    Click any request to inspect review notes and settlement
                    details
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isListFetching ? (
                    <span className="font-mono text-[10px] text-accent">
                      Refreshing...
                    </span>
                  ) : null}
                  <span className="rounded-md border border-border bg-surface-inner px-2.5 py-1 font-mono text-[10px] text-text-secondary">
                    {totalCount} request(s)
                  </span>
                </div>
              </div>

              {/* Filters */}
              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <select
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(
                      e.target.value as "" | CustomerRequestStatus
                    );
                    setPage(1);
                  }}
                  className="rounded-lg border border-border bg-surface-inner px-3 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>

                <select
                  aria-label="Filter by account"
                  value={accountFilter}
                  onChange={(e) => {
                    setAccountFilter(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-lg border border-border bg-surface-inner px-3 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value="">All Accounts</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountTitle} ({acc.accountNumber.slice(-4)})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("");
                    setAccountFilter("");
                    setPage(1);
                  }}
                  className="rounded-lg border border-border bg-surface-inner px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-text-primary"
                >
                  Reset Filters
                </button>
              </div>

              {isListError ? (
                <div
                  role="alert"
                  className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-status-danger-border bg-status-danger-bg p-3 text-xs text-status-danger"
                >
                  <span>Unable to load deposit requests.</span>
                  <button
                    type="button"
                    onClick={() => refetchList()}
                    className="rounded border border-status-danger-border bg-surface px-2.5 py-1 font-semibold text-text-primary"
                  >
                    Retry
                  </button>
                </div>
              ) : depositRequests.length === 0 ? (
                <div className="mt-4 rounded-lg border border-border-subtle bg-surface-inner p-8 text-center">
                  <p className="text-xs font-medium text-text-primary">
                    No deposit requests found
                  </p>
                  <p className="mt-1 text-[11px] text-text-muted">
                    Submit a deposit request on the left to fund your account.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[540px] text-left text-xs">
                      <thead>
                        <tr className="border-b border-border-subtle font-mono text-[10px] uppercase tracking-wider text-text-muted">
                          <th className="pb-2.5 pr-3">Reference</th>
                          <th className="pb-2.5 pr-3">Account</th>
                          <th className="pb-2.5 pr-3 text-right">Amount</th>
                          <th className="pb-2.5 pr-3">Status</th>
                          <th className="pb-2.5 text-right">Requested</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {depositRequests.map((item) => {
                          const isSelected = item.id === selectedDepositId;
                          return (
                            <tr
                              key={item.id}
                              onClick={() => setSelectedDepositId(item.id)}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-accent-subtle"
                                  : "hover:bg-surface-hover"
                              }`}
                            >
                              <td className="py-3 pr-3 font-mono text-[11px] font-medium text-text-primary">
                                {item.requestReference}
                              </td>
                              <td className="py-3 pr-3">
                                <p className="font-medium text-text-primary">
                                  {item.account.accountTitle}
                                </p>
                                <p className="font-mono text-[10px] text-text-muted">
                                  {item.account.accountNumber}
                                </p>
                              </td>
                              <td className="py-3 pr-3 text-right font-mono font-semibold text-text-primary">
                                {formatCurrencyFull(item.amount)}
                              </td>
                              <td className="py-3 pr-3">
                                <span
                                  className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${getRequestStatusClasses(
                                    item.status
                                  )}`}
                                >
                                  {item.status}
                                </span>
                              </td>
                              <td className="py-3 text-right font-mono text-[11px] text-text-muted">
                                {formatDate(item.requestedAt)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
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

            {/* Selected Deposit Request Inspector */}
            {inspectedDeposit ? (
              <section
                aria-label="Deposit request details"
                className="rounded-xl border border-border bg-surface p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase text-text-muted">
                      DEPOSIT REQUEST DETAILS
                    </p>
                    <h3 className="mt-0.5 font-mono text-sm font-bold text-text-primary">
                      {inspectedDeposit.requestReference}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {isDetailFetching ? (
                      <span className="font-mono text-[10px] text-accent">
                        Syncing...
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold ${getRequestStatusClasses(
                        inspectedDeposit.status
                      )}`}
                    >
                      {inspectedDeposit.status}
                    </span>
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                  <div>
                    <dt className="font-mono text-[10px] uppercase text-text-muted">
                      Amount
                    </dt>
                    <dd className="mt-0.5 font-mono font-semibold text-text-primary">
                      {formatCurrencyFull(inspectedDeposit.amount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase text-text-muted">
                      Target Account
                    </dt>
                    <dd className="mt-0.5 text-text-primary">
                      {inspectedDeposit.account.accountTitle} (
                      {inspectedDeposit.account.accountNumber})
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase text-text-muted">
                      Description
                    </dt>
                    <dd className="mt-0.5 text-text-secondary">
                      {inspectedDeposit.description || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase text-text-muted">
                      Review Note
                    </dt>
                    <dd className="mt-0.5 text-text-secondary">
                      {inspectedDeposit.reviewNote || "Awaiting review"}
                    </dd>
                  </div>
                  {inspectedDeposit.transaction ? (
                    <div className="sm:col-span-2">
                      <dt className="font-mono text-[10px] uppercase text-text-muted">
                        Settled Ledger Transaction
                      </dt>
                      <dd className="mt-0.5 font-mono font-semibold text-status-success">
                        {inspectedDeposit.transaction.referenceId} • Settled on{" "}
                        {formatDate(inspectedDeposit.transaction.executedAt)}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </section>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
