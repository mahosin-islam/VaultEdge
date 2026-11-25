"use client";

import Link from "next/link";
import { useGetStaffCustomerDetailQuery } from "@/features/staff/staffApi";
import type { AdminCustomerListItemDTO } from "@/types/admin.types";
import { formatCurrencyFull } from "@/utils/formatters";

interface StaffCustomerInspectorCardProps {
  selectedCustomerSummary: AdminCustomerListItemDTO | null;
}

function getKycBadgeClasses(kycStatus?: string | null) {
  switch (kycStatus) {
    case "VERIFIED":
      return "border-border bg-status-success-bg text-status-success";
    case "REJECTED":
      return "border-border bg-status-danger-bg text-status-danger";
    case "PENDING":
    default:
      return "border-accent-border bg-accent-subtle text-accent";
  }
}

export function StaffCustomerInspectorCard({
  selectedCustomerSummary,
}: StaffCustomerInspectorCardProps) {
  const { data: detailResponse, isFetching } = useGetStaffCustomerDetailQuery(
    selectedCustomerSummary?.id ?? "",
    { skip: !selectedCustomerSummary?.id }
  );

  if (!selectedCustomerSummary) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-border bg-surface p-6 text-center">
        <p className="text-sm font-semibold text-text-primary">
          No Customer Selected
        </p>
        <p className="mt-1 max-w-xs text-xs text-text-muted">
          Select any customer row from the directory to inspect their KYC
          standing, profile details, and linked bank accounts.
        </p>
      </div>
    );
  }

  const detail = detailResponse?.data;
  const customer = detail?.customer ?? selectedCustomerSummary;
  const profile = customer.customerProfile;
  const accounts = detail?.accounts ?? selectedCustomerSummary.accounts;
  const financialSummary = detail?.financialSummary ?? {
    totalAccounts: selectedCustomerSummary.accountsCount,
    totalBalance: selectedCustomerSummary.totalBalance,
    activeLoansCount: 0,
  };

  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-accent-border bg-accent-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
              CUSTOMER DOSSIER
            </span>
            <span className="font-mono text-[11px] text-text-muted">
              {profile?.customerCode ?? "NO CODE"}
            </span>
          </div>
          <h3 className="mt-1.5 text-base font-semibold text-text-primary">
            {customer.fullName}
          </h3>
          <p className="text-[11px] text-text-muted">
            {customer.email}
            {isFetching ? " • Refreshing..." : ""}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span
            className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getKycBadgeClasses(
              profile?.kycStatus
            )}`}
          >
            KYC: {profile?.kycStatus ?? "PENDING"}
          </span>
          <span className="font-mono text-[10px] uppercase text-text-muted">
            Account: {customer.status}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* Financial Summary */}
        <div className="grid grid-cols-3 gap-2.5 rounded-lg border border-border bg-surface-inner p-3 text-xs">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Accounts
            </p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-text-primary">
              {financialSummary.totalAccounts}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Total Balance
            </p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-accent">
              {formatCurrencyFull(financialSummary.totalBalance)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Active Loans
            </p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-text-primary">
              {financialSummary.activeLoansCount}
            </p>
          </div>
        </div>

        {/* Profile & Contact Metadata */}
        <div className="space-y-2 rounded-lg border border-border bg-surface-inner p-3 text-xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Contact &amp; Identity Profile
          </p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-text-muted">Phone</span>
            <span className="font-mono text-text-primary">
              {profile?.phone ?? "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-text-muted">Date of Birth</span>
            <span className="font-mono text-text-primary">
              {profile?.dateOfBirth
                ? new Date(profile.dateOfBirth).toLocaleDateString()
                : "Not provided"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-text-muted">Employment</span>
            <span className="text-text-primary">
              {profile?.employmentStatus ?? "—"} •{" "}
              {profile?.monthlyIncome
                ? `${formatCurrencyFull(profile.monthlyIncome)}/mo`
                : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-text-muted">Location</span>
            <span className="text-text-primary">
              {[profile?.city, profile?.country].filter(Boolean).join(", ") ||
                "—"}
            </span>
          </div>
        </div>

        {/* Linked Bank Accounts */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Linked Bank Accounts ({accounts.length})
            </h4>
            <Link
              href="/staff/accounts"
              className="text-[11px] font-semibold text-accent hover:underline"
            >
              Open Account →
            </Link>
          </div>

          {accounts.length === 0 ? (
            <p className="rounded-lg border border-border-subtle bg-surface-inner px-3 py-4 text-center text-xs text-text-muted">
              No bank accounts opened for this customer yet.
            </p>
          ) : (
            <div className="space-y-1.5">
              {accounts.map((acct) => (
                <div
                  key={acct.id}
                  className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-inner px-3 py-2 text-xs"
                >
                  <div>
                    <p className="font-mono font-semibold text-text-primary">
                      {acct.accountNumber}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {acct.accountTitle} • {acct.accountType} ({acct.status})
                    </p>
                  </div>
                  <span className="font-mono font-semibold text-text-primary">
                    {formatCurrencyFull(acct.balance)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Staff Operational Links */}
        <div className="grid grid-cols-2 gap-2.5 border-t border-border pt-3">
          <Link
            href="/staff/verification"
            className="rounded-lg bg-btn-primary px-3 py-2 text-center text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover"
          >
            Review KYC
          </Link>
          <Link
            href="/staff/accounts"
            className="rounded-lg border border-border bg-surface-inner px-3 py-2 text-center text-xs font-semibold text-text-primary transition-colors hover:bg-surface-hover"
          >
            Manage Accounts
          </Link>
        </div>
      </div>
    </div>
  );
}
