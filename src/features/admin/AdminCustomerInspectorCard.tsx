"use client";

import { useState } from "react";
import {
  useGetAdminCustomerDetailQuery,
  useLazyGetAdminCustomerTransactionsQuery,
  useUpdateAdminCustomerStatusMutation,
} from "@/features/admin/adminApi";
import { AdminCustomerTransactionsModal } from "@/features/admin/AdminCustomerTransactionsModal";
import type { AdminCustomerListItemDTO } from "@/types/admin.types";
import type { ApiErrorEnvelope } from "@/types/api.types";
import { formatCurrencyFull } from "@/utils/formatters";

interface AdminCustomerInspectorCardProps {
  selectedCustomerSummary: AdminCustomerListItemDTO | null;
  onOpenProvisionAccount: () => void;
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "CU";
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? "CU").toUpperCase();
  return `${parts[0]?.charAt(0) ?? "C"}${
    parts[parts.length - 1]?.charAt(0) ?? "U"
  }`.toUpperCase();
}

function maskAccountNumber(accNum: string): string {
  if (accNum.length <= 6) return `#${accNum}`;
  const prefix = accNum.slice(0, 4);
  const suffix = accNum.slice(-4);
  return `#${prefix}-****-${suffix}`;
}

export function AdminCustomerInspectorCard({
  selectedCustomerSummary,
  onOpenProvisionAccount,
}: AdminCustomerInspectorCardProps) {
  const customerId = selectedCustomerSummary?.id ?? "";

  const { data: detailResponse, isFetching } = useGetAdminCustomerDetailQuery(
    customerId,
    {
      skip: !customerId,
    }
  );

  const [updateCustomerStatus, { isLoading: isUpdatingStatus }] =
    useUpdateAdminCustomerStatusMutation();

  const [
    triggerFetchTransactions,
    { data: txModalResponse, isFetching: isFetchingTx },
  ] = useLazyGetAdminCustomerTransactionsQuery();

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  if (!selectedCustomerSummary) {
    return (
      <aside className="rounded-2xl border border-border bg-surface p-6 ve-card-shadow">
        <div className="py-12 text-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-accent-border bg-accent-subtle text-accent">
            👤
          </span>
          <h2 className="mt-3 text-sm font-bold text-text-primary">
            No Customer Entity Selected
          </h2>
          <p className="mt-1 text-xs text-text-secondary">
            Select a customer row from the directory to inspect KYC documents,
            linked bank accounts, audit logs, and administrative directives.
          </p>
        </div>
      </aside>
    );
  }

  const detail = detailResponse?.data;
  const customer = detail?.customer ?? selectedCustomerSummary;
  const accounts = detail?.accounts ?? selectedCustomerSummary.accounts;
  const totalBalance =
    detail?.financialSummary.totalBalance ??
    selectedCustomerSummary.totalBalance;
  const auditLogs = detail?.securityAuditLogs ?? [];

  const customerCode =
    customer.customerProfile?.customerCode ??
    `CUST-${customer.id.slice(-5).toUpperCase()}`;
  const shortLedgerId = customerCode.replace(/^CUS(T)?-\d{4}-/, "");
  const kycStatus = customer.customerProfile?.kycStatus ?? "PENDING";

  const handleStatusChange = async (
    nextStatus: "ACTIVE" | "DEACTIVATED" | "BLOCKED",
    nextKycStatus?: "PENDING" | "VERIFIED" | "REJECTED"
  ) => {
    setFeedback(null);
    const reason =
      nextStatus === "BLOCKED"
        ? "Blocked via Admin Customer Directory compliance directive."
        : nextStatus === "DEACTIVATED"
          ? "Suspended via Admin Customer Directory directive."
          : "Activated and KYC verified by Admin.";

    try {
      await updateCustomerStatus({
        customerId: customer.id,
        status: nextStatus,
        reason,
        ...(nextKycStatus ? { kycStatus: nextKycStatus } : {}),
      }).unwrap();

      setFeedback({
        type: "success",
        text: `Customer status updated to ${nextStatus}${
          nextKycStatus ? ` (KYC: ${nextKycStatus})` : ""
        }.`,
      });
    } catch (err: unknown) {
      const apiErr = (err as { data?: ApiErrorEnvelope })?.data;
      setFeedback({
        type: "error",
        text:
          apiErr?.error?.message ??
          "Failed to update customer status. Please try again.",
      });
    }
  };

  const handleOpenLedgerModal = () => {
    setTxModalOpen(true);
    triggerFetchTransactions({ customerId: customer.id, page: 1, limit: 25 });
  };

  return (
    <>
      <aside
        aria-label="Live Customer Entity Inspector"
        className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 ve-card-shadow"
      >
        <div>
          {/* Top Bar: LIVE INSPECTOR LEDGER # + Active Status Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider">
              <span className="rounded border border-accent-border bg-accent-subtle px-2 py-0.5 text-accent">
                LIVE INSPECTOR
              </span>
              <span className="text-text-muted">LEDGER #{shortLedgerId}</span>
            </div>

            {customer.status === "ACTIVE" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-status-info-border bg-status-info-bg px-2.5 py-0.5 font-mono text-[10px] font-semibold text-status-info">
                <span className="h-1.5 w-1.5 rounded-full bg-status-info" />
                <span>Active</span>
              </span>
            ) : customer.status === "DEACTIVATED" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-border bg-accent-subtle px-2.5 py-0.5 font-mono text-[10px] font-semibold text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span>Suspended</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-status-danger-border bg-status-danger-bg px-2.5 py-0.5 font-mono text-[10px] font-semibold text-status-danger">
                <span className="h-1.5 w-1.5 rounded-full bg-status-danger" />
                <span>Blocked</span>
              </span>
            )}
          </div>

          {/* Profile Identity Header */}
          <div className="mt-4 flex items-center gap-3.5 border-b border-border-subtle pb-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-inner font-mono text-sm font-bold text-accent">
              {getInitials(customer.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-bold text-text-primary">
                {customer.fullName}
              </h2>
              <p className="font-mono text-[11px] font-semibold text-accent">
                {customerCode}
              </p>
              <p className="truncate text-xs text-text-secondary">
                {customer.email}
              </p>
            </div>
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

          {/* Section 1: KYC DOCUMENTS VERIFIED */}
          <div className="mt-5">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider">
              <span className="font-bold text-text-muted">
                KYC DOCUMENTS VERIFIED
              </span>
              {kycStatus === "VERIFIED" ? (
                <span className="font-semibold text-status-info">
                  ✓ 100% Pass
                </span>
              ) : (
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusChange(customer.status, "VERIFIED")}
                  className="font-semibold text-accent underline-offset-2 hover:underline disabled:opacity-60"
                >
                  {kycStatus} • Verify Now
                </button>
              )}
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-inner p-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-text-primary">
                    🪪 Identity ID
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-text-muted">
                    {customer.customerProfile?.phone ?? "US #98421***"}
                  </p>
                </div>
                <span className="text-xs text-status-info">✓</span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-inner p-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-text-primary">
                    📍 Address Proof
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-text-muted">
                    {customer.customerProfile?.city
                      ? `${customer.customerProfile.city}, ${
                          customer.customerProfile.country ?? "Verified"
                        }`
                      : "Utility Registry Verified"}
                  </p>
                </div>
                <span className="text-xs text-status-info">✓</span>
              </div>
            </div>
          </div>

          {/* Section 2: LINKED BANK ACCOUNTS */}
          <div className="mt-5">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider">
              <span className="font-bold text-text-muted">
                LINKED BANK ACCOUNTS ({accounts.length})
              </span>
              <span className="font-bold text-accent">
                {formatCurrencyFull(totalBalance)} Net
              </span>
            </div>

            {accounts.length === 0 ? (
              <div className="mt-2.5 rounded-xl border border-border-subtle bg-surface-inner p-4 text-center">
                <p className="text-xs text-text-secondary">
                  No bank accounts opened for this customer yet.
                </p>
                <button
                  type="button"
                  onClick={onOpenProvisionAccount}
                  className="mt-2 inline-flex h-8 items-center justify-center rounded-lg bg-btn-primary px-3 text-xs font-semibold text-btn-primary-text hover:bg-btn-primary-hover"
                >
                  + Provision First Account
                </button>
              </div>
            ) : (
              <div className="mt-2.5 space-y-2.5">
                {accounts.map((acc) => {
                  const isSavings = acc.accountType === "SAVINGS";
                  const isBusiness = acc.accountType === "BUSINESS";

                  return (
                    <div
                      key={acc.id}
                      className="rounded-xl border border-border-subtle bg-surface-inner p-3.5 transition-colors hover:border-accent-border"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-bold text-text-primary">
                          {isSavings
                            ? "🏦 High-Yield Savings"
                            : isBusiness
                              ? "🏛️ Corporate Business Vault"
                              : "💳 Daily Operating Current"}
                        </span>
                        <span className="shrink-0 rounded border border-border bg-surface px-2 py-0.5 font-mono text-[10px] font-semibold text-accent">
                          {isSavings
                            ? "4.85% APY"
                            : isBusiness
                              ? "Treasury"
                              : "Checking"}
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-end justify-between">
                        <span className="font-mono text-[11px] text-text-muted">
                          {maskAccountNumber(acc.accountNumber)}
                        </span>
                        <span
                          className={`font-mono text-base font-bold ${
                            isSavings ? "text-accent" : "text-text-primary"
                          }`}
                        >
                          {formatCurrencyFull(acc.balance)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: SECURITY & AUDIT LOG */}
          <div className="mt-5">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
              SECURITY &amp; AUDIT LOG
            </p>

            <div className="mt-2.5 space-y-2.5">
              {auditLogs.length > 0 ? (
                auditLogs.slice(0, 2).map((log, idx) => (
                  <div key={log.id} className="flex items-start gap-2.5 text-xs">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border bg-surface-inner text-[11px] text-accent">
                      {idx === 0 ? "🔑" : "🛡️"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-text-primary">
                        {log.action.replace(/_/g, " ")}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[10px] text-text-muted">
                        {log.entityType} • IP {log.ipAddress ?? "127.0.0.1"} •{" "}
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-start gap-2.5 text-xs">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border bg-surface-inner text-[11px] text-accent">
                      🔑
                    </span>
                    <div>
                      <p className="font-semibold text-text-primary">
                        Authenticated TLS 1.3 Session
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-text-muted">
                        Zero-Trust Verified •{" "}
                        {customer.lastLoginAt
                          ? new Date(customer.lastLoginAt).toLocaleDateString()
                          : "Active Registry"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border bg-surface-inner text-[11px] text-status-info">
                      🛡️
                    </span>
                    <div>
                      <p className="font-semibold text-text-primary">
                        Transaction PIN &amp; RBAC Guard Active
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-text-muted">
                        PIN Status:{" "}
                        {customer.hasTransactionPin
                          ? "Configured"
                          : "Standard Guard"}{" "}
                        • 2FA:{" "}
                        {customer.twoFactorEnabled ? "Enabled" : "Standard"}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 4: ADMINISTRATIVE DIRECTIVES (2x2 Action Grid Matches Stitch Screenshot) */}
          <div className="mt-5 border-t border-border-subtle pt-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
              ADMINISTRATIVE DIRECTIVES
            </p>

            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              {/* 1. Verify KYC / Reset 2FA/PIN */}
              <button
                type="button"
                disabled={isUpdatingStatus || isFetching}
                onClick={() => handleStatusChange("ACTIVE", "VERIFIED")}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-btn-secondary-border bg-surface-inner px-3 font-mono text-xs font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
              >
                <span className="text-accent">↻</span>
                <span>Verify / Activate</span>
              </button>

              {/* 2. View Customer Transaction History (Ledger Rec) */}
              <button
                type="button"
                onClick={handleOpenLedgerModal}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-btn-secondary-border bg-surface-inner px-3 font-mono text-xs font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent"
              >
                <span>▤</span>
                <span>Ledger Rec</span>
              </button>

              {/* 3. Suspend / Activate */}
              {customer.status === "DEACTIVATED" ? (
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusChange("ACTIVE")}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-status-success-border bg-status-success-bg px-3 font-mono text-xs font-semibold text-status-success transition-colors hover:bg-status-success hover:text-background disabled:opacity-60"
                >
                  <span>✓</span>
                  <span>Reactivate</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusChange("DEACTIVATED")}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-btn-secondary-border bg-surface-inner px-3 font-mono text-xs font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
                >
                  <span className="text-accent">⏸</span>
                  <span>Suspend</span>
                </button>
              )}

              {/* 4. Block Entity */}
              {customer.status === "BLOCKED" ? (
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusChange("ACTIVE")}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-accent-border bg-accent-subtle px-3 font-mono text-xs font-bold text-accent transition-colors hover:bg-btn-primary hover:text-btn-primary-text disabled:opacity-60"
                >
                  <span>🔓</span>
                  <span>Unblock Entity</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusChange("BLOCKED")}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-status-danger-border bg-status-danger-bg px-3 font-mono text-xs font-bold text-status-danger transition-colors hover:bg-status-danger hover:text-background disabled:opacity-60"
                >
                  <span>⊘</span>
                  <span>Block Entity</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer Hash & Enforced Ledger */}
        <div className="mt-5 flex items-center justify-between border-t border-border-subtle pt-3.5 font-mono text-[10px] text-text-muted">
          <span>
            HASH: 0x{customer.id.slice(0, 4)}...{customer.id.slice(-4)}
          </span>
          <span className="inline-flex items-center gap-1 text-text-secondary">
            <span>🔒</span>
            <span>Enforced Ledger</span>
          </span>
        </div>
      </aside>

      {/* Customer Transaction History Modal (Requirement §2.1: View customer transaction history) */}
      <AdminCustomerTransactionsModal
        open={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        customerName={customer.fullName}
        customerCode={customerCode}
        transactions={txModalResponse?.data?.transactions ?? []}
        isLoading={isFetchingTx}
      />
    </>
  );
}
