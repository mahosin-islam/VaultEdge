"use client";

import { useState } from "react";
import type { KycVerificationStatus } from "@prisma/client";
import {
  useGetStaffCustomerDetailQuery,
  useVerifyStaffCustomerKycMutation,
} from "@/features/staff/staffApi";
import type { AdminCustomerListItemDTO } from "@/types/admin.types";
import type { ApiErrorEnvelope } from "@/types/api.types";
import type { SafeUserDTO } from "@/types/auth.types";
import { formatCurrencyFull } from "@/utils/formatters";

interface StaffVerificationInspectorCardProps {
  selectedCustomerSummary: AdminCustomerListItemDTO | null;
}

function getKycBadgeClasses(status?: KycVerificationStatus | null) {
  switch (status) {
    case "VERIFIED":
      return "border-border bg-status-success-bg text-status-success";
    case "REJECTED":
      return "border-border bg-status-danger-bg text-status-danger";
    case "PENDING":
    default:
      return "border-accent-border bg-accent-subtle text-accent";
  }
}

function VerificationInspectorBody({
  customer,
  accountsCount,
  isFetchingDetail,
}: {
  customer: SafeUserDTO;
  accountsCount: number;
  isFetchingDetail: boolean;
}) {
  const [kycNotes, setKycNotes] = useState("");
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  const [verifyKyc, { isLoading: isSubmitting }] =
    useVerifyStaffCustomerKycMutation();

  const profile = customer.customerProfile;
  const currentKyc = profile?.kycStatus ?? "PENDING";

  const handleVerify = async (nextStatus: KycVerificationStatus) => {
    setFeedback(null);
    const trimmedNotes = kycNotes.trim();

    try {
      await verifyKyc({
        customerId: customer.id,
        kycStatus: nextStatus,
        ...(trimmedNotes ? { kycNotes: trimmedNotes } : {}),
      }).unwrap();

      setKycNotes("");
      setFeedback({
        kind: "success",
        message: `Customer KYC status updated to ${nextStatus} and customer notified.`,
      });
    } catch (err) {
      const apiErr = err as { data?: ApiErrorEnvelope };
      setFeedback({
        kind: "error",
        message:
          apiErr?.data?.error?.message ??
          "Failed to update customer KYC verification status.",
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
              KYC INSPECTOR
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
            {isFetchingDetail ? " • Refreshing..." : ""}
          </p>
        </div>

        <span
          className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getKycBadgeClasses(
            currentKyc
          )}`}
        >
          {currentKyc}
        </span>
      </div>

      {/* Feedback */}
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
        {/* Identity & Contact Details */}
        <div className="space-y-2 rounded-lg border border-border bg-surface-inner p-3 text-xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Identity &amp; Residency Verification
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
            <span className="text-text-muted">Address</span>
            <span className="text-right text-text-primary">
              {[
                profile?.addressLine1,
                profile?.city,
                profile?.state,
                profile?.country,
              ]
                .filter(Boolean)
                .join(", ") || "Not provided"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-text-muted">Employment &amp; Income</span>
            <span className="text-text-primary">
              {profile?.employmentStatus ?? "—"} •{" "}
              {profile?.monthlyIncome
                ? `${formatCurrencyFull(profile.monthlyIncome)}/mo`
                : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border-subtle pt-2">
            <span className="text-text-muted">Account Standing</span>
            <span className="font-mono text-text-primary">
              {customer.status} • {accountsCount}{" "}
              {accountsCount === 1 ? "account" : "accounts"}
            </span>
          </div>
          {profile?.verifiedAt ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-text-muted">Verified At</span>
              <span className="font-mono text-status-success">
                {new Date(profile.verifiedAt).toLocaleString()}
              </span>
            </div>
          ) : null}
        </div>

        {/* Staff KYC Decision Controls */}
        <div className="space-y-3 rounded-lg border border-border bg-surface-inner p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            KYC Verification Decision
          </p>

          <textarea
            rows={3}
            value={kycNotes}
            onChange={(e) => setKycNotes(e.target.value)}
            placeholder="Enter KYC verification notes (e.g. National ID and utility bill verified)..."
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isSubmitting || currentKyc === "VERIFIED"}
              onClick={() => handleVerify("VERIFIED")}
              className="rounded-lg bg-btn-primary px-3 py-2 text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Approve KYC"}
            </button>
            <button
              type="button"
              disabled={isSubmitting || currentKyc === "REJECTED"}
              onClick={() => handleVerify("REJECTED")}
              className="rounded-lg border border-border bg-status-danger-bg px-3 py-2 text-xs font-semibold text-status-danger transition-colors hover:opacity-90 disabled:opacity-50"
            >
              Reject KYC
            </button>
          </div>

          {currentKyc !== "PENDING" ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleVerify("PENDING")}
              className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
            >
              Reset to Pending Review
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function StaffVerificationInspectorCard({
  selectedCustomerSummary,
}: StaffVerificationInspectorCardProps) {
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
          Select any customer from the verification queue to inspect their
          identity profile and approve or reject KYC.
        </p>
      </div>
    );
  }

  const customer = detailResponse?.data?.customer ?? selectedCustomerSummary;

  return (
    <VerificationInspectorBody
      key={selectedCustomerSummary.id}
      customer={customer}
      accountsCount={selectedCustomerSummary.accountsCount}
      isFetchingDetail={isFetching}
    />
  );
}
