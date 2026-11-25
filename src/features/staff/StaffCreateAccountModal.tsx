"use client";

import { useState, type FormEvent } from "react";
import { useCreateStaffAccountMutation } from "@/features/staff/staffApi";
import type { AdminCustomerListItemDTO } from "@/types/admin.types";
import type { ApiErrorEnvelope } from "@/types/api.types";

interface StaffCreateAccountModalProps {
  open: boolean;
  onClose: () => void;
  customers: AdminCustomerListItemDTO[];
  defaultSelectedCustomerId: string | null;
  onSuccess?: (accountId: string) => void;
}

export function StaffCreateAccountModal({
  open,
  onClose,
  customers,
  defaultSelectedCustomerId,
  onSuccess,
}: StaffCreateAccountModalProps) {
  const activeCustomers = customers.filter((c) => c.status === "ACTIVE");
  const [userId, setUserId] = useState(
    defaultSelectedCustomerId ?? activeCustomers[0]?.id ?? ""
  );
  const [accountType, setAccountType] = useState<
    "SAVINGS" | "CURRENT" | "BUSINESS"
  >("SAVINGS");
  const [accountTitle, setAccountTitle] = useState("");
  const [initialDeposit, setInitialDeposit] = useState("0");
  const [dailyLimit, setDailyLimit] = useState("");
  const [maxSingleLimit, setMaxSingleLimit] = useState("");
  const [minBalance, setMinBalance] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [createAccount, { isLoading }] = useCreateStaffAccountMutation();

  if (!open) return null;

  const effectiveUserId = userId || activeCustomers[0]?.id || "";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!effectiveUserId) {
      setErrorMsg("Please select an active customer.");
      return;
    }

    const parsedDeposit = Number(initialDeposit || "0");
    if (!Number.isFinite(parsedDeposit) || parsedDeposit < 0) {
      setErrorMsg("Initial deposit must be 0 or greater.");
      return;
    }

    const parsedDaily = dailyLimit.trim() ? Number(dailyLimit) : undefined;
    const parsedSingle = maxSingleLimit.trim()
      ? Number(maxSingleLimit)
      : undefined;
    const parsedMinBal = minBalance.trim() ? Number(minBalance) : undefined;

    if (
      parsedDaily !== undefined &&
      parsedSingle !== undefined &&
      parsedDaily < parsedSingle
    ) {
      setErrorMsg(
        "Daily transfer limit cannot be less than max single transaction limit."
      );
      return;
    }

    try {
      const res = await createAccount({
        userId: effectiveUserId,
        accountType,
        ...(accountTitle.trim() ? { accountTitle: accountTitle.trim() } : {}),
        currency: "USD",
        initialDeposit: parsedDeposit,
        ...(parsedDaily !== undefined ? { dailyTransferLimit: parsedDaily } : {}),
        ...(parsedSingle !== undefined
          ? { maxSingleTransactionLimit: parsedSingle }
          : {}),
        ...(parsedMinBal !== undefined ? { minBalanceRequired: parsedMinBal } : {}),
      }).unwrap();

      setAccountTitle("");
      setInitialDeposit("0");
      setDailyLimit("");
      setMaxSingleLimit("");
      setMinBalance("");
      onSuccess?.(res.data.account.id);
      onClose();
    } catch (err) {
      const apiErr = err as { data?: ApiErrorEnvelope };
      setErrorMsg(
        apiErr?.data?.error?.message ?? "Failed to open customer bank account."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <span className="rounded border border-accent-border bg-accent-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
              STAFF ACCOUNT OPENING
            </span>
            <h2 className="mt-1.5 font-serif text-lg font-semibold text-text-primary">
              Open Customer Bank Account
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-surface-inner px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-surface-hover"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5 text-xs">
          {errorMsg ? (
            <div className="rounded-lg border border-border bg-status-danger-bg px-3 py-2 text-xs text-status-danger">
              {errorMsg}
            </div>
          ) : null}

          <label className="block">
            <span className="font-medium text-text-secondary">
              Customer Holder *
            </span>
            <select
              value={effectiveUserId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
            >
              {activeCustomers.length === 0 ? (
                <option value="">No active customers available</option>
              ) : (
                activeCustomers.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                    className="bg-surface text-text-primary"
                  >
                    {c.fullName} ({c.email})
                  </option>
                ))
              )}
            </select>
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="font-medium text-text-secondary">
                Account Type *
              </span>
              <select
                value={accountType}
                onChange={(e) =>
                  setAccountType(
                    e.target.value as "SAVINGS" | "CURRENT" | "BUSINESS"
                  )
                }
                className="mt-1 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
              >
                <option value="SAVINGS" className="bg-surface text-text-primary">
                  Savings Vault
                </option>
                <option value="CURRENT" className="bg-surface text-text-primary">
                  Current Account
                </option>
                <option value="BUSINESS" className="bg-surface text-text-primary">
                  Business Treasury
                </option>
              </select>
            </label>

            <label className="block">
              <span className="font-medium text-text-secondary">
                Initial Deposit (USD)
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={initialDeposit}
                onChange={(e) => setInitialDeposit(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 font-mono text-text-primary focus:border-accent focus:outline-none"
              />
            </label>
          </div>

          <label className="block">
            <span className="font-medium text-text-secondary">
              Account Title (Optional)
            </span>
            <input
              type="text"
              value={accountTitle}
              onChange={(e) => setAccountTitle(e.target.value)}
              placeholder="Auto-generated from customer name if omitted"
              className="mt-1 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="font-medium text-text-secondary">
                Daily Limit
              </span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                placeholder="Default"
                className="mt-1 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 font-mono text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="font-medium text-text-secondary">
                Single Tx Cap
              </span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={maxSingleLimit}
                onChange={(e) => setMaxSingleLimit(e.target.value)}
                placeholder="Default"
                className="mt-1 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 font-mono text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="font-medium text-text-secondary">
                Min Balance
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={minBalance}
                onChange={(e) => setMinBalance(e.target.value)}
                placeholder="Default"
                className="mt-1 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 font-mono text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg border border-border bg-surface-inner px-4 py-2 font-medium text-text-primary hover:bg-surface-hover disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || activeCustomers.length === 0}
              className="rounded-lg bg-btn-primary px-4 py-2 font-semibold text-btn-primary-text hover:bg-btn-primary-hover disabled:opacity-50"
            >
              {isLoading ? "Opening Account..." : "Open Bank Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
