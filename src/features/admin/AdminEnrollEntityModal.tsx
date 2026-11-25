"use client";

import { useState, type FormEvent } from "react";
import { useCreateAdminBankAccountMutation } from "@/features/admin/adminApi";
import type { AdminCustomerListItemDTO } from "@/types/admin.types";
import type { ApiErrorEnvelope } from "@/types/api.types";

interface AdminEnrollEntityModalProps {
  open: boolean;
  onClose: () => void;
  customers: AdminCustomerListItemDTO[];
  defaultSelectedCustomerId: string | null;
}

export function AdminEnrollEntityModal({
  open,
  onClose,
  customers,
  defaultSelectedCustomerId,
}: AdminEnrollEntityModalProps) {
  const [createAccount, { isLoading }] = useCreateAdminBankAccountMutation();

  const [selectedUserId, setSelectedUserId] = useState<string>(
    defaultSelectedCustomerId ?? customers[0]?.id ?? ""
  );
  const [accountType, setAccountType] = useState<
    "SAVINGS" | "CURRENT" | "BUSINESS"
  >("SAVINGS");
  const [accountTitle, setAccountTitle] = useState("");
  const [initialDeposit, setInitialDeposit] = useState("1000");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  const effectiveUserId =
    selectedUserId || defaultSelectedCustomerId || customers[0]?.id || "";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!effectiveUserId) {
      setErrorMsg("Please select a registered customer to provision a vault.");
      return;
    }

    const depositNum = Number(initialDeposit);
    if (!Number.isFinite(depositNum) || depositNum < 0) {
      setErrorMsg("Initial deposit must be a valid non-negative amount.");
      return;
    }

    try {
      await createAccount({
        userId: effectiveUserId,
        accountType,
        ...(accountTitle.trim().length >= 2
          ? { accountTitle: accountTitle.trim() }
          : {}),
        initialDeposit: depositNum,
      }).unwrap();

      setSuccessMsg(
        `New ${accountType} bank account provisioned and funded successfully.`
      );
      setAccountTitle("");
      onClose();
    } catch (err: unknown) {
      const apiErr = (err as { data?: ApiErrorEnvelope })?.data;
      setErrorMsg(
        apiErr?.error?.message ??
          "Unable to provision bank account for this customer."
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="enroll-entity-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-background-glass backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-surface p-6 ve-elevated-shadow">
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <span className="rounded border border-accent-border bg-accent-subtle px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-accent">
              ENTITY VAULT PROVISIONING
            </span>
            <h2
              id="enroll-entity-modal-title"
              className="mt-2 text-lg font-bold text-text-primary"
            >
              Provision Customer Bank Account
            </h2>
            <p className="mt-0.5 text-xs text-text-secondary">
              Assign a new Savings, Current, or Business ledger vault to a
              registered customer profile.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-inner text-text-secondary transition-colors hover:border-accent hover:text-accent"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-status-danger-border bg-status-danger-bg px-3.5 py-2.5 text-xs text-status-danger"
          >
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            className="mt-4 rounded-xl border border-status-success-border bg-status-success-bg px-3.5 py-2.5 text-xs text-status-success"
          >
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="enroll-customer-select"
              className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-text-primary"
            >
              TARGET CUSTOMER ENTITY
            </label>
            <select
              id="enroll-customer-select"
              value={effectiveUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={isLoading || customers.length === 0}
              className="mt-1.5 h-10 w-full rounded-lg border border-input-border bg-input-bg px-3 text-xs text-text-primary focus:border-accent focus:outline-none"
            >
              {customers.length === 0 ? (
                <option value="">No customers registered yet</option>
              ) : (
                customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.email}) —{" "}
                    {c.customerProfile?.customerCode ?? "CUSTOMER"}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="enroll-account-type"
                className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-text-primary"
              >
                ACCOUNT TIER / TYPE
              </label>
              <select
                id="enroll-account-type"
                value={accountType}
                onChange={(e) =>
                  setAccountType(
                    e.target.value as "SAVINGS" | "CURRENT" | "BUSINESS"
                  )
                }
                disabled={isLoading}
                className="mt-1.5 h-10 w-full rounded-lg border border-input-border bg-input-bg px-3 text-xs text-text-primary focus:border-accent focus:outline-none"
              >
                <option value="SAVINGS">High-Yield Savings Vault</option>
                <option value="CURRENT">Daily Operating Current</option>
                <option value="BUSINESS">Corporate Business Treasury</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="enroll-initial-deposit"
                className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-text-primary"
              >
                INITIAL TREASURY DEPOSIT ($)
              </label>
              <input
                id="enroll-initial-deposit"
                type="number"
                min="0"
                step="0.01"
                value={initialDeposit}
                onChange={(e) => setInitialDeposit(e.target.value)}
                disabled={isLoading}
                className="mt-1.5 h-10 w-full rounded-lg border border-input-border bg-input-bg px-3 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="enroll-account-title"
              className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-text-primary"
            >
              CUSTOM VAULT TITLE (OPTIONAL)
            </label>
            <input
              id="enroll-account-title"
              type="text"
              value={accountTitle}
              onChange={(e) => setAccountTitle(e.target.value)}
              placeholder="e.g. Obsidian Private Reserve"
              disabled={isLoading}
              className="mt-1.5 h-10 w-full rounded-lg border border-input-border bg-input-bg px-3 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-border-subtle pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-btn-secondary-border bg-btn-secondary px-4 text-xs font-semibold text-btn-secondary-text transition-colors hover:bg-btn-secondary-hover"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isLoading || customers.length === 0}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-btn-primary px-4 text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover disabled:opacity-60"
            >
              <span>{isLoading ? "Provisioning..." : "Provision Account"}</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
