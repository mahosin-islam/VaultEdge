"use client";

import { useState, type FormEvent } from "react";
import {
  useGetAdminAccountDetailQuery,
  useUpdateAdminAccountInfoMutation,
  useUpdateAdminAccountLimitsMutation,
  useUpdateAdminAccountStatusMutation,
} from "@/features/admin/adminApi";
import type {
  AdminBankAccountDetailResponseDTO,
  AdminBankAccountListItemDTO,
} from "@/types/admin.types";
import type { ApiErrorEnvelope } from "@/types/api.types";
import { formatCurrencyFull, formatTimeStampHMS } from "@/utils/formatters";

interface AdminAccountInspectorCardProps {
  selectedAccountSummary: AdminBankAccountListItemDTO | null;
  onOpenCreateAccount: () => void;
}

function getStatusBadgeClasses(status: AdminBankAccountListItemDTO["status"]) {
  switch (status) {
    case "ACTIVE":
      return "border-status-info-border bg-status-info-bg text-status-info";
    case "FROZEN":
      return "border-accent-border bg-accent-subtle text-accent";
    case "INACTIVE":
      return "border-border bg-surface-inner text-text-muted";
    case "BLOCKED":
      return "border-status-danger-border bg-status-danger-bg text-status-danger";
  }
}

function AccountInspectorBody({
  summary,
  detail,
  isFetchingDetail,
}: {
  summary: AdminBankAccountListItemDTO;
  detail: AdminBankAccountDetailResponseDTO | undefined;
  isFetchingDetail: boolean;
}) {
  const account = detail?.account ?? summary;
  const effectiveLimits = detail?.effectiveLimits;
  const recentLedgerEntries = detail?.recentLedgerEntries ?? [];

  const [updateAccountInfo, { isLoading: isUpdatingInfo }] =
    useUpdateAdminAccountInfoMutation();
  const [updateAccountLimits, { isLoading: isUpdatingLimits }] =
    useUpdateAdminAccountLimitsMutation();
  const [updateAccountStatus, { isLoading: isUpdatingStatus }] =
    useUpdateAdminAccountStatusMutation();

  const [accountTitle, setAccountTitle] = useState(account.accountTitle);
  const [accountType, setAccountType] = useState<
    "SAVINGS" | "CURRENT" | "BUSINESS"
  >(
    account.accountType === "CURRENT" || account.accountType === "BUSINESS"
      ? account.accountType
      : "SAVINGS"
  );

  const [dailyLimitInput, setDailyLimitInput] = useState(
    account.dailyTransferLimit ?? effectiveLimits?.dailyTransferLimit ?? ""
  );
  const [maxSingleInput, setMaxSingleInput] = useState(
    account.maxSingleTransactionLimit ??
      effectiveLimits?.maxSingleTransactionLimit ??
      ""
  );
  const [minBalanceInput, setMinBalanceInput] = useState(
    account.minBalanceRequired ?? effectiveLimits?.minBalanceRequired ?? ""
  );
  const [statusReason, setStatusReason] = useState("");

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSaveInfo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);

    if (accountTitle.trim().length < 2) {
      setFeedback({
        type: "error",
        text: "Account title must be at least 2 characters.",
      });
      return;
    }

    try {
      await updateAccountInfo({
        accountId: account.id,
        accountTitle: accountTitle.trim(),
        accountType,
      }).unwrap();

      setFeedback({
        type: "success",
        text: "Account title & tier updated successfully.",
      });
    } catch (err: unknown) {
      const apiErr = (err as { data?: ApiErrorEnvelope })?.data;
      setFeedback({
        type: "error",
        text:
          apiErr?.error?.message ?? "Failed to update bank account details.",
      });
    }
  };

  const handleSaveLimits = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);

    const parsedDaily =
      dailyLimitInput.trim() === "" ? null : Number(dailyLimitInput);
    const parsedMaxSingle =
      maxSingleInput.trim() === "" ? null : Number(maxSingleInput);
    const parsedMinBal =
      minBalanceInput.trim() === "" ? null : Number(minBalanceInput);

    if (
      (parsedDaily !== null && (!Number.isFinite(parsedDaily) || parsedDaily <= 0)) ||
      (parsedMaxSingle !== null &&
        (!Number.isFinite(parsedMaxSingle) || parsedMaxSingle <= 0)) ||
      (parsedMinBal !== null && (!Number.isFinite(parsedMinBal) || parsedMinBal < 0))
    ) {
      setFeedback({
        type: "error",
        text: "Transaction limits must be valid positive numbers (min balance >= 0).",
      });
      return;
    }

    try {
      await updateAccountLimits({
        accountId: account.id,
        dailyTransferLimit: parsedDaily,
        maxSingleTransactionLimit: parsedMaxSingle,
        minBalanceRequired: parsedMinBal,
      }).unwrap();

      setFeedback({
        type: "success",
        text: "Per-account transaction limits updated and logged.",
      });
    } catch (err: unknown) {
      const apiErr = (err as { data?: ApiErrorEnvelope })?.data;
      setFeedback({
        type: "error",
        text:
          apiErr?.error?.message ??
          "Failed to update account transaction limits.",
      });
    }
  };

  const handleStatusDirective = async (
    nextStatus: "ACTIVE" | "FROZEN" | "INACTIVE" | "BLOCKED"
  ) => {
    setFeedback(null);
    const defaultReason =
      nextStatus === "FROZEN"
        ? "Frozen by Admin for compliance & liquidity verification."
        : nextStatus === "BLOCKED"
          ? "Blocked by Admin due to suspicious activity."
          : nextStatus === "INACTIVE"
            ? "Deactivated by Admin."
            : "Account unfrozen and restored to ACTIVE status by Admin.";

    const reasonToSend =
      statusReason.trim().length >= 3 ? statusReason.trim() : defaultReason;

    try {
      await updateAccountStatus({
        accountId: account.id,
        status: nextStatus,
        reason: reasonToSend,
      }).unwrap();

      setStatusReason("");
      setFeedback({
        type: "success",
        text: `Account #${account.accountNumber} transitioned to ${nextStatus}.`,
      });
    } catch (err: unknown) {
      const apiErr = (err as { data?: ApiErrorEnvelope })?.data;
      setFeedback({
        type: "error",
        text:
          apiErr?.error?.message ??
          "Failed to update bank account status.",
      });
    }
  };

  return (
    <aside
      aria-label="Live Bank Account Inspector"
      className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 ve-card-shadow"
    >
      <div>
        {/* Top Bar: LIVE ACCOUNT INSPECTOR + Status Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider">
            <span className="rounded border border-accent-border bg-accent-subtle px-2 py-0.5 text-accent">
              VAULT INSPECTOR
            </span>
            <span className="text-text-muted">#{account.accountNumber}</span>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold ${getStatusBadgeClasses(
              account.status
            )}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            <span>{account.status}</span>
          </span>
        </div>

        {/* Balance & Holder Summary Box */}
        <div className="mt-4 rounded-xl border border-border-subtle bg-surface-inner p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-text-primary">
                {account.accountTitle}
              </p>
              <p className="mt-0.5 truncate text-xs text-text-secondary">
                {account.owner
                  ? `${account.owner.fullName} • ${account.owner.email}`
                  : "Institutional Holder"}
              </p>
              {account.owner?.customerCode && (
                <p className="mt-1 font-mono text-[10px] text-accent">
                  {account.owner.customerCode} • KYC:{" "}
                  {account.owner.kycStatus ?? "PENDING"}
                </p>
              )}
            </div>

            <div className="text-right shrink-0">
              <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                AVAILABLE ({account.currency})
              </p>
              <p className="mt-0.5 font-mono text-xl font-bold text-accent">
                {formatCurrencyFull(account.balance)}
              </p>
            </div>
          </div>

          {account.frozenReason && (
            <div className="mt-3 rounded-lg border border-status-danger-border bg-status-danger-bg px-3 py-2 font-mono text-[10px] text-status-danger">
              Hold Reason: {account.frozenReason}
            </div>
          )}
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            role={feedback.type === "error" ? "alert" : "status"}
            className={`mt-4 rounded-xl border px-3.5 py-2.5 text-xs ${
              feedback.type === "success"
                ? "border-status-success-border bg-status-success-bg text-status-success"
                : "border-status-danger-border bg-status-danger-bg text-status-danger"
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* Section 1: Update Account Information */}
        <form
          onSubmit={handleSaveInfo}
          className="mt-5 border-t border-border-subtle pt-4"
        >
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
              ACCOUNT INFORMATION
            </p>
            {isFetchingDetail && (
              <span className="font-mono text-[10px] text-text-muted">
                Syncing...
              </span>
            )}
          </div>

          <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-12">
            <div className="sm:col-span-7">
              <input
                type="text"
                value={accountTitle}
                onChange={(e) => setAccountTitle(e.target.value)}
                aria-label="Account Title"
                disabled={isUpdatingInfo}
                className="h-9 w-full rounded-lg border border-input-border bg-input-bg px-3 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
            <div className="sm:col-span-5">
              <select
                value={accountType}
                onChange={(e) =>
                  setAccountType(
                    e.target.value as "SAVINGS" | "CURRENT" | "BUSINESS"
                  )
                }
                aria-label="Account Type"
                disabled={isUpdatingInfo}
                className="h-9 w-full rounded-lg border border-input-border bg-input-bg px-2.5 text-xs text-text-primary focus:border-accent focus:outline-none"
              >
                <option value="SAVINGS">SAVINGS</option>
                <option value="CURRENT">CURRENT</option>
                <option value="BUSINESS">BUSINESS</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isUpdatingInfo}
            className="mt-2.5 inline-flex h-8 w-full items-center justify-center rounded-lg border border-btn-secondary-border bg-surface-inner font-mono text-[11px] font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
          >
            {isUpdatingInfo ? "Saving Info..." : "Save Account Details"}
          </button>
        </form>

        {/* Section 2: Configure Transaction Limits */}
        <form
          onSubmit={handleSaveLimits}
          className="mt-5 border-t border-border-subtle pt-4"
        >
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
              TRANSACTION LIMITS (USD)
            </p>
            {effectiveLimits && (
              <span className="font-mono text-[10px] text-accent">
                Eff. Daily: {formatCurrencyFull(effectiveLimits.dailyTransferLimit)}
              </span>
            )}
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-2">
            <div>
              <label
                htmlFor="limit-daily"
                className="block font-mono text-[9px] uppercase text-text-muted"
              >
                Daily Limit
              </label>
              <input
                id="limit-daily"
                type="number"
                min="1"
                step="0.01"
                value={dailyLimitInput}
                onChange={(e) => setDailyLimitInput(e.target.value)}
                placeholder={effectiveLimits?.dailyTransferLimit ?? "25000"}
                className="mt-1 h-9 w-full rounded-lg border border-input-border bg-input-bg px-2.5 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="limit-single"
                className="block font-mono text-[9px] uppercase text-text-muted"
              >
                Max Single Tx
              </label>
              <input
                id="limit-single"
                type="number"
                min="1"
                step="0.01"
                value={maxSingleInput}
                onChange={(e) => setMaxSingleInput(e.target.value)}
                placeholder={effectiveLimits?.maxSingleTransactionLimit ?? "10000"}
                className="mt-1 h-9 w-full rounded-lg border border-input-border bg-input-bg px-2.5 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="limit-min-bal"
                className="block font-mono text-[9px] uppercase text-text-muted"
              >
                Min Balance
              </label>
              <input
                id="limit-min-bal"
                type="number"
                min="0"
                step="0.01"
                value={minBalanceInput}
                onChange={(e) => setMinBalanceInput(e.target.value)}
                placeholder={effectiveLimits?.minBalanceRequired ?? "100"}
                className="mt-1 h-9 w-full rounded-lg border border-input-border bg-input-bg px-2.5 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isUpdatingLimits}
            className="mt-2.5 inline-flex h-8 w-full items-center justify-center rounded-lg bg-btn-primary font-mono text-[11px] font-bold text-btn-primary-text transition-colors hover:bg-btn-primary-hover disabled:opacity-60"
          >
            {isUpdatingLimits ? "Applying Limits..." : "Apply Account Limits"}
          </button>
        </form>

        {/* Section 3: Freeze / Unfreeze & Status Directives */}
        <div className="mt-5 border-t border-border-subtle pt-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
            FREEZE &amp; STATUS CONTROLS
          </p>

          <input
            type="text"
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
            placeholder="Optional audit reason for freeze/unfreeze..."
            aria-label="Reason for account status change"
            className="mt-2 h-9 w-full rounded-lg border border-input-border bg-input-bg px-3 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />

          <div className="mt-2.5 grid grid-cols-2 gap-2">
            {account.status === "FROZEN" || account.status === "BLOCKED" || account.status === "INACTIVE" ? (
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleStatusDirective("ACTIVE")}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-status-success-border bg-status-success-bg px-3 font-mono text-xs font-bold text-status-success transition-colors hover:bg-status-success hover:text-background disabled:opacity-60"
              >
                <span>🔓</span>
                <span>Unfreeze / Activate</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleStatusDirective("FROZEN")}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-accent-border bg-accent-subtle px-3 font-mono text-xs font-bold text-accent transition-colors hover:bg-btn-primary hover:text-btn-primary-text disabled:opacity-60"
              >
                <span>❄️</span>
                <span>Freeze Account</span>
              </button>
            )}

            <button
              type="button"
              disabled={isUpdatingStatus || account.status === "BLOCKED"}
              onClick={() => handleStatusDirective("BLOCKED")}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-status-danger-border bg-status-danger-bg px-3 font-mono text-xs font-bold text-status-danger transition-colors hover:bg-status-danger hover:text-background disabled:opacity-50"
            >
              <span>⊘</span>
              <span>Block Vault</span>
            </button>
          </div>
        </div>

        {/* Section 4: Recent Double-Entry Ledger Postings */}
        <div className="mt-5 border-t border-border-subtle pt-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
            RECENT LEDGER POSTINGS ({recentLedgerEntries.length})
          </p>

          {recentLedgerEntries.length === 0 ? (
            <p className="mt-2 text-xs text-text-muted">
              No double-entry ledger postings recorded for this account yet.
            </p>
          ) : (
            <div className="mt-2.5 max-h-44 space-y-2 overflow-y-auto pr-1">
              {recentLedgerEntries.slice(0, 6).map((entry) => {
                const isCredit = entry.direction === "CREDIT";
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-inner px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[11px] font-semibold text-text-primary">
                        {entry.referenceId} • {entry.transactionType}
                      </p>
                      <p className="truncate font-mono text-[10px] text-text-muted">
                        {formatTimeStampHMS(entry.createdAt)} • Bal:{" "}
                        {formatCurrencyFull(entry.balanceBefore)} →{" "}
                        {formatCurrencyFull(entry.balanceAfter)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 font-mono text-xs font-bold ${
                        isCredit ? "text-status-success" : "text-text-primary"
                      }`}
                    >
                      {isCredit ? "+" : "-"}
                      {formatCurrencyFull(entry.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Hash */}
      <div className="mt-5 flex items-center justify-between border-t border-border-subtle pt-3.5 font-mono text-[10px] text-text-muted">
        <span>
          VAULT ID: {account.id.slice(0, 6)}...{account.id.slice(-4)}
        </span>
        <span>🔒 Atomic Ledger Protected</span>
      </div>
    </aside>
  );
}

export function AdminAccountInspectorCard({
  selectedAccountSummary,
  onOpenCreateAccount,
}: AdminAccountInspectorCardProps) {
  const accountId = selectedAccountSummary?.id ?? "";
  const { data: detailResponse, isFetching } = useGetAdminAccountDetailQuery(
    accountId,
    {
      skip: !accountId,
    }
  );

  if (!selectedAccountSummary) {
    return (
      <aside className="rounded-2xl border border-border bg-surface p-6 ve-card-shadow">
        <div className="py-12 text-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-accent-border bg-accent-subtle text-accent">
            💳
          </span>
          <h2 className="mt-3 text-sm font-bold text-text-primary">
            No Bank Account Selected
          </h2>
          <p className="mt-1 text-xs text-text-secondary">
            Select a bank account row from the directory to edit details,
            configure transaction limits, freeze/unfreeze, or inspect ledger
            postings.
          </p>
          <button
            type="button"
            onClick={onOpenCreateAccount}
            className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-btn-primary px-4 text-xs font-semibold text-btn-primary-text hover:bg-btn-primary-hover"
          >
            + Open Bank Account
          </button>
        </div>
      </aside>
    );
  }

  return (
    <AccountInspectorBody
      key={selectedAccountSummary.id}
      summary={selectedAccountSummary}
      detail={detailResponse?.data}
      isFetchingDetail={isFetching}
    />
  );
}
