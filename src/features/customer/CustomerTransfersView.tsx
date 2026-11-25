"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  useExecuteCustomerTransferMutation,
  useGetCustomerAccountsQuery,
} from "@/features/customer/customerApi";
import type { SafeUserDTO } from "@/types/auth.types";
import type {
  CustomerAccountDetailDTO,
  CustomerOverviewTransactionDTO,
} from "@/types/customer.types";
import { formatCurrencyFull } from "@/utils/formatters";

interface CustomerTransfersViewProps {
  user: SafeUserDTO;
  initialAccounts: CustomerAccountDetailDTO[];
  initialFromAccountId?: string;
}

type TransferMode = "INTRA_BANK" | "OWN_ACCOUNT";

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `trf-${crypto.randomUUID()}`;
  }
  return `trf-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { error?: { message?: string }; message?: string } }).data;
    if (data?.error?.message) return data.error.message;
    if (data?.message) return data.message;
  }
  return "Fund transfer failed. Please check your details and try again.";
}

export function CustomerTransfersView({
  user,
  initialAccounts,
  initialFromAccountId,
}: CustomerTransfersViewProps) {
  const { data: accountsRes, isFetching: isAccountsFetching } =
    useGetCustomerAccountsQuery();
  const accounts = accountsRes?.data?.accounts ?? initialAccounts;

  const defaultSenderId = useMemo(() => {
    if (
      initialFromAccountId &&
      accounts.some((a) => a.id === initialFromAccountId)
    ) {
      return initialFromAccountId;
    }
    return (
      accounts.find((a) => a.status === "ACTIVE")?.id ?? accounts[0]?.id ?? ""
    );
  }, [accounts, initialFromAccountId]);

  const [mode, setMode] = useState<TransferMode>("INTRA_BANK");
  const [senderAccountId, setSenderAccountId] = useState(defaultSenderId);
  const [ownTargetAccountId, setOwnTargetAccountId] = useState("");
  const [recipientAccountNumber, setRecipientAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [transactionPin, setTransactionPin] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() =>
    createIdempotencyKey()
  );
  const [isConfirming, setIsConfirming] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [receipt, setReceipt] =
    useState<CustomerOverviewTransactionDTO | null>(null);

  const [executeTransfer, { isLoading: isSubmitting }] =
    useExecuteCustomerTransferMutation();

  const effectiveSenderId = accounts.some((a) => a.id === senderAccountId)
    ? senderAccountId
    : defaultSenderId;

  const senderAccount =
    accounts.find((a) => a.id === effectiveSenderId) ?? null;

  const ownDestinationAccounts = useMemo(
    () =>
      accounts.filter(
        (a) => a.id !== effectiveSenderId && a.status === "ACTIVE"
      ),
    [accounts, effectiveSenderId]
  );

  const effectiveOwnTargetId = ownDestinationAccounts.some(
    (a) => a.id === ownTargetAccountId
  )
    ? ownTargetAccountId
    : ownDestinationAccounts[0]?.id ?? "";

  const resolvedRecipientNumber =
    mode === "OWN_ACCOUNT"
      ? ownDestinationAccounts.find((a) => a.id === effectiveOwnTargetId)
          ?.accountNumber ?? ""
      : recipientAccountNumber.trim();

  const parsedAmount = Number(amount);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!senderAccount) {
      setFormError("Please select a source bank account.");
      return;
    }
    if (senderAccount.status !== "ACTIVE") {
      setFormError(
        `Source account ${senderAccount.accountNumber} is ${senderAccount.status} and cannot send funds.`
      );
      return;
    }
    if (
      !resolvedRecipientNumber ||
      resolvedRecipientNumber.length < 6 ||
      resolvedRecipientNumber.length > 32
    ) {
      setFormError(
        "Recipient account number must be between 6 and 32 characters."
      );
      return;
    }
    if (resolvedRecipientNumber === senderAccount.accountNumber) {
      setFormError("Sender and recipient accounts cannot be the same account.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError("Please enter a valid positive transfer amount.");
      return;
    }
    if (!/^\d{4,6}$/.test(transactionPin.trim())) {
      setFormError("Transaction PIN must be 4 to 6 numeric digits.");
      return;
    }

    setIsConfirming(true);
  };

  const handleConfirmExecute = async () => {
    if (!senderAccount) return;
    setFormError(null);

    try {
      const res = await executeTransfer({
        senderAccountId: senderAccount.id,
        recipientAccountNumber: resolvedRecipientNumber,
        amount: Number(parsedAmount.toFixed(2)),
        ...(description.trim() ? { description: description.trim() } : {}),
        transactionPin: transactionPin.trim(),
        idempotencyKey,
      }).unwrap();

      setReceipt(res.data.transaction);
      setIsConfirming(false);
      setTransactionPin("");
    } catch (err) {
      setIsConfirming(false);
      setFormError(getApiErrorMessage(err));
    }
  };

  const handleNewTransfer = () => {
    setReceipt(null);
    setFormError(null);
    setAmount("");
    setDescription("");
    setTransactionPin("");
    setRecipientAccountNumber("");
    setIdempotencyKey(createIdempotencyKey());
    setIsConfirming(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            Fund Transfer
          </h1>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Execute atomic transfers between your own accounts or to any active
            VaultEdge customer account with Transaction PIN verification.
          </p>
        </div>

        <Link
          href="/customer/transactions"
          className="inline-flex shrink-0 items-center whitespace-nowrap rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent"
        >
          View Transaction History &rarr;
        </Link>
      </div>

      {/* Transaction PIN Setup Warning */}
      {!user.hasTransactionPin ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-status-warning-border bg-status-warning-bg px-4 py-3 text-xs text-status-warning"
        >
          <span>
            You have not configured a Transaction PIN yet. A Transaction PIN is
            required before executing fund transfers.
          </span>
          <Link
            href="/customer/profile-security"
            className="rounded-lg border border-status-warning-border bg-surface px-3 py-1 font-semibold text-text-primary hover:border-accent"
          >
            Configure PIN &rarr;
          </Link>
        </div>
      ) : null}

      {accounts.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <p className="text-base font-semibold text-text-primary">
            No bank accounts available for transfers
          </p>
          <p className="mt-1 text-xs text-text-muted">
            You need at least one active bank account to send funds.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Left 7 Columns: Transfer Form or Certified Receipt */}
          <div className="xl:col-span-7">
            {receipt ? (
              <section
                aria-label="Transfer receipt"
                className="rounded-xl border border-status-success-border bg-surface p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-status-success-border bg-status-success-bg px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-status-success">
                      {receipt.status}
                    </span>
                    <h2 className="mt-2 font-serif text-xl font-bold text-text-primary">
                      Transfer Executed Successfully
                    </h2>
                    <p className="mt-0.5 font-mono text-xs text-text-secondary">
                      Reference: {receipt.referenceId}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-mono text-[10px] uppercase text-text-muted">
                      AMOUNT TRANSFERRED
                    </p>
                    <p className="mt-1 font-mono text-2xl font-bold text-text-primary">
                      {formatCurrencyFull(receipt.amount)}
                    </p>
                  </div>
                </div>

                <dl className="mt-5 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                  <div className="rounded-lg border border-border-subtle bg-surface-inner p-3">
                    <dt className="font-mono text-[10px] uppercase text-text-muted">
                      From Account
                    </dt>
                    <dd className="mt-1 font-semibold text-text-primary">
                      {receipt.senderAccount?.accountTitle ?? "Source Account"}
                    </dd>
                    <dd className="font-mono text-[11px] text-text-secondary">
                      {receipt.senderAccount?.accountNumber ?? "—"}
                    </dd>
                  </div>

                  <div className="rounded-lg border border-border-subtle bg-surface-inner p-3">
                    <dt className="font-mono text-[10px] uppercase text-text-muted">
                      To Account
                    </dt>
                    <dd className="mt-1 font-semibold text-text-primary">
                      {receipt.receiverAccount?.accountTitle ??
                        "Recipient Account"}
                    </dd>
                    <dd className="font-mono text-[11px] text-text-secondary">
                      {receipt.receiverAccount?.accountNumber ?? "—"}
                    </dd>
                  </div>

                  <div className="rounded-lg border border-border-subtle bg-surface-inner p-3">
                    <dt className="font-mono text-[10px] uppercase text-text-muted">
                      Transfer Fee &amp; Total Debit
                    </dt>
                    <dd className="mt-1 font-mono font-semibold text-text-primary">
                      Fee: {formatCurrencyFull(receipt.fee)} • Total:{" "}
                      {formatCurrencyFull(receipt.totalAmount)}
                    </dd>
                  </div>

                  <div className="rounded-lg border border-border-subtle bg-surface-inner p-3">
                    <dt className="font-mono text-[10px] uppercase text-text-muted">
                      Executed At
                    </dt>
                    <dd className="mt-1 font-mono text-text-primary">
                      {new Date(receipt.executedAt).toLocaleString("en-US")}
                    </dd>
                  </div>
                </dl>

                {receipt.description ? (
                  <p className="mt-4 rounded-lg border border-border-subtle bg-surface-inner px-3 py-2 text-xs text-text-secondary">
                    <strong className="text-text-primary">Note:</strong>{" "}
                    {receipt.description}
                  </p>
                ) : null}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleNewTransfer}
                    className="rounded-lg bg-btn-primary px-4 py-2 text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover"
                  >
                    Make Another Transfer
                  </button>
                  <Link
                    href="/customer/accounts"
                    className="rounded-lg border border-border bg-surface-inner px-4 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-accent"
                  >
                    Back to My Accounts
                  </Link>
                </div>
              </section>
            ) : (
              <section
                aria-label="Fund transfer form"
                className="rounded-xl border border-border bg-surface p-6"
              >
                {/* Mode Switcher */}
                <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle pb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("INTRA_BANK");
                      setIsConfirming(false);
                      setFormError(null);
                    }}
                    className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                      mode === "INTRA_BANK"
                        ? "bg-btn-primary text-btn-primary-text"
                        : "border border-border bg-surface-inner text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    To Another Account
                  </button>
                  <button
                    type="button"
                    disabled={ownDestinationAccounts.length === 0}
                    onClick={() => {
                      setMode("OWN_ACCOUNT");
                      setIsConfirming(false);
                      setFormError(null);
                    }}
                    className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors disabled:opacity-45 ${
                      mode === "OWN_ACCOUNT"
                        ? "bg-btn-primary text-btn-primary-text"
                        : "border border-border bg-surface-inner text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Between Own Accounts
                  </button>
                </div>

                {formError ? (
                  <div
                    role="alert"
                    className="mt-4 rounded-lg border border-status-danger-border bg-status-danger-bg px-3.5 py-2.5 text-xs text-status-danger"
                  >
                    {formError}
                  </div>
                ) : null}

                <form onSubmit={handleReviewSubmit} className="mt-5 space-y-4">
                  {/* Source Account */}
                  <div>
                    <label
                      htmlFor="senderAccountId"
                      className="block text-xs font-semibold text-text-primary"
                    >
                      From Account
                    </label>
                    <select
                      id="senderAccountId"
                      value={effectiveSenderId}
                      disabled={isConfirming}
                      onChange={(e) => {
                        setSenderAccountId(e.target.value);
                        setFormError(null);
                      }}
                      className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2.5 text-xs text-text-primary focus:border-accent focus:outline-none disabled:opacity-60"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountTitle} ({acc.accountNumber}) —{" "}
                          {formatCurrencyFull(acc.balance)} [{acc.status}]
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Recipient */}
                  {mode === "OWN_ACCOUNT" ? (
                    <div>
                      <label
                        htmlFor="ownTargetAccountId"
                        className="block text-xs font-semibold text-text-primary"
                      >
                        To Your Account
                      </label>
                      <select
                        id="ownTargetAccountId"
                        value={effectiveOwnTargetId}
                        disabled={isConfirming}
                        onChange={(e) => setOwnTargetAccountId(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2.5 text-xs text-text-primary focus:border-accent focus:outline-none disabled:opacity-60"
                      >
                        {ownDestinationAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.accountTitle} ({acc.accountNumber}) —{" "}
                            {formatCurrencyFull(acc.balance)}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label
                        htmlFor="recipientAccountNumber"
                        className="block text-xs font-semibold text-text-primary"
                      >
                        Recipient Account Number
                      </label>
                      <input
                        id="recipientAccountNumber"
                        type="text"
                        required
                        disabled={isConfirming}
                        value={recipientAccountNumber}
                        onChange={(e) =>
                          setRecipientAccountNumber(e.target.value)
                        }
                        placeholder="e.g. VE-SAV-10002459"
                        className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2.5 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none disabled:opacity-60"
                      />
                    </div>
                  )}

                  {/* Amount & PIN */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="transferAmount"
                        className="block text-xs font-semibold text-text-primary"
                      >
                        Transfer Amount (USD)
                      </label>
                      <input
                        id="transferAmount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        disabled={isConfirming}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2.5 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="transactionPin"
                        className="block text-xs font-semibold text-text-primary"
                      >
                        Transaction PIN (4–6 digits)
                      </label>
                      <input
                        id="transactionPin"
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        required
                        disabled={isConfirming}
                        value={transactionPin}
                        onChange={(e) =>
                          setTransactionPin(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="••••"
                        className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2.5 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="transferDescription"
                      className="block text-xs font-semibold text-text-primary"
                    >
                      Description / Reference Note (Optional)
                    </label>
                    <input
                      id="transferDescription"
                      type="text"
                      maxLength={250}
                      disabled={isConfirming}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Invoice payment, savings top-up, etc."
                      className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none disabled:opacity-60"
                    />
                  </div>

                  {/* Confirmation Panel or Submit */}
                  {isConfirming ? (
                    <div className="rounded-xl border border-accent-border bg-accent-subtle p-4">
                      <p className="text-xs font-semibold text-text-primary">
                        Confirm Atomic Transfer
                      </p>
                      <p className="mt-1 text-xs text-text-secondary">
                        Send{" "}
                        <strong className="font-mono text-text-primary">
                          {formatCurrencyFull(parsedAmount)}
                        </strong>{" "}
                        from{" "}
                        <strong className="font-mono text-text-primary">
                          {senderAccount?.accountNumber}
                        </strong>{" "}
                        to{" "}
                        <strong className="font-mono text-text-primary">
                          {resolvedRecipientNumber}
                        </strong>
                        ?
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={handleConfirmExecute}
                          className="rounded-lg bg-btn-primary px-4 py-2 text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover disabled:opacity-50"
                        >
                          {isSubmitting
                            ? "Executing Transfer..."
                            : "Confirm & Execute Transfer"}
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => setIsConfirming(false)}
                          className="rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-medium text-text-primary hover:border-accent"
                        >
                          Edit Details
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={senderAccount?.status !== "ACTIVE"}
                      className="w-full rounded-lg bg-btn-primary py-2.5 text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover disabled:opacity-45"
                    >
                      Review &amp; Confirm Transfer
                    </button>
                  )}
                </form>
              </section>
            )}
          </div>

          {/* Right 5 Columns: Source Account Limits & Security Guarantees */}
          <div className="space-y-6 xl:col-span-5">
            {senderAccount ? (
              <section
                aria-label="Source account limits"
                className="rounded-xl border border-border bg-surface p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                      SOURCE ACCOUNT LIMITS
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-text-primary">
                      {senderAccount.accountTitle}
                    </h2>
                  </div>
                  {isAccountsFetching ? (
                    <span className="font-mono text-[10px] text-accent">
                      Syncing...
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-inner px-3.5 py-2.5">
                    <span className="text-text-secondary">
                      Available Balance
                    </span>
                    <span className="font-mono font-bold text-text-primary">
                      {formatCurrencyFull(senderAccount.balance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-inner px-3.5 py-2.5">
                    <span className="text-text-secondary">
                      Daily Transfer Limit
                    </span>
                    <span className="font-mono font-semibold text-text-primary">
                      {formatCurrencyFull(
                        senderAccount.effectiveLimits.dailyTransferLimit
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-inner px-3.5 py-2.5">
                    <span className="text-text-secondary">
                      Max Single Transfer
                    </span>
                    <span className="font-mono font-semibold text-text-primary">
                      {formatCurrencyFull(
                        senderAccount.effectiveLimits.maxSingleTransactionLimit
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-inner px-3.5 py-2.5">
                    <span className="text-text-secondary">
                      Min Balance Required
                    </span>
                    <span className="font-mono font-semibold text-text-primary">
                      {formatCurrencyFull(
                        senderAccount.effectiveLimits.minBalanceRequired
                      )}
                    </span>
                  </div>
                </div>
              </section>
            ) : null}

            <section
              aria-label="Transfer security policies"
              className="rounded-xl border border-border bg-surface p-5"
            >
              <h2 className="text-sm font-semibold text-text-primary">
                Security &amp; Settlement Protections
              </h2>
              <ul className="mt-3 space-y-2 text-xs text-text-secondary">
                <li>
                  • <strong className="text-text-primary">Atomic Settlement:</strong>{" "}
                  Sender debit, recipient credit, and double-entry ledger
                  records execute inside one atomic database transaction.
                </li>
                <li>
                  • <strong className="text-text-primary">PIN Lockout Guard:</strong>{" "}
                  5 consecutive invalid Transaction PIN attempts temporarily lock
                  PIN authorization for 15 minutes.
                </li>
                <li>
                  • <strong className="text-text-primary">Idempotency Key:</strong>{" "}
                  Each transfer attempt carries a unique idempotency token to
                  prevent duplicate debits.
                </li>
              </ul>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
