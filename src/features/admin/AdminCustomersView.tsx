"use client";

import { useState } from "react";
import { useGetAdminCustomersQuery } from "@/features/admin/adminApi";
import { AdminCustomerInspectorCard } from "@/features/admin/AdminCustomerInspectorCard";
import { AdminEnrollEntityModal } from "@/features/admin/AdminEnrollEntityModal";
import type {
  AdminCustomerListItemDTO,
  AdminCustomerSummaryCountsDTO,
} from "@/types/admin.types";
import type { PaginationMeta } from "@/types/api.types";
import { formatCountCompact, formatCurrencyFull } from "@/utils/formatters";
import type { KycVerificationStatus, UserStatus } from "@prisma/client";

interface AdminCustomersViewProps {
  initialCustomers: AdminCustomerListItemDTO[];
  initialSummaryCounts: AdminCustomerSummaryCountsDTO;
  initialMeta: PaginationMeta;
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "CU";
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? "CU").toUpperCase();
  return `${parts[0]?.charAt(0) ?? "C"}${
    parts[parts.length - 1]?.charAt(0) ?? "U"
  }`.toUpperCase();
}

function getTierSubtitle(customer: AdminCustomerListItemDTO): string {
  const hasBusiness = customer.accounts.some(
    (a) => a.accountType === "BUSINESS"
  );
  if (hasBusiness) {
    return "Corporate Institutional";
  }
  const totalBal = Number(customer.totalBalance) || 0;
  if (totalBal >= 25000 || customer.accountsCount >= 2) {
    return "Obsidian Private";
  }
  return "Personal Standard";
}

function getTierCodePrefix(customer: AdminCustomerListItemDTO): string {
  const hasBusiness = customer.accounts.some(
    (a) => a.accountType === "BUSINESS"
  );
  if (hasBusiness) return "CR";
  const totalBal = Number(customer.totalBalance) || 0;
  if (totalBal >= 25000 || customer.accountsCount >= 2) return "OB";
  return "PS";
}

export function AdminCustomersView({
  initialCustomers,
  initialSummaryCounts,
  initialMeta,
}: AdminCustomersViewProps) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "ALL">("ALL");
  const [kycFilter, setKycFilter] = useState<KycVerificationStatus | "ALL">(
    "ALL"
  );
  const [tierFilter, setTierFilter] = useState<
    "ALL" | "PERSONAL" | "OBSIDIAN" | "CORPORATE"
  >("ALL");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    initialCustomers[0]?.id ?? null
  );
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);

  const {
    data: queryResponse,
    isFetching,
    refetch,
  } = useGetAdminCustomersQuery({
    page,
    limit: 8,
    ...(searchInput.trim() ? { search: searchInput.trim() } : {}),
    ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
    ...(kycFilter !== "ALL" ? { kycStatus: kycFilter } : {}),
  });

  const rawCustomers = queryResponse?.data?.customers ?? initialCustomers;
  const summaryCounts =
    queryResponse?.data?.summaryCounts ?? initialSummaryCounts;
  const meta =
    (queryResponse?.meta as unknown as PaginationMeta | undefined) ??
    initialMeta;

  // Apply client-side Tier refinement if selected
  const displayedCustomers =
    tierFilter === "ALL"
      ? rawCustomers
      : rawCustomers.filter((c) => {
          const tierLabel = getTierSubtitle(c);
          if (tierFilter === "CORPORATE")
            return tierLabel === "Corporate Institutional";
          if (tierFilter === "OBSIDIAN")
            return tierLabel === "Obsidian Private";
          return tierLabel === "Personal Standard";
        });

  const activeCustomer =
    displayedCustomers.find((c) => c.id === selectedCustomerId) ??
    displayedCustomers[0] ??
    rawCustomers[0] ??
    null;

  const handleExportCsv = () => {
    const headers = [
      "Customer Code",
      "Full Name",
      "Email",
      "Status",
      "KYC Status",
      "Accounts Count",
      "Total Balance (USD)",
    ];
    const rows = displayedCustomers.map((c) => [
      c.customerProfile?.customerCode ?? c.id,
      `"${c.fullName.replace(/"/g, '""')}"`,
      c.email,
      c.status,
      c.customerProfile?.kycStatus ?? "PENDING",
      String(c.accountsCount),
      c.totalBalance,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "vaultedge-customer-registry-audit.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Header Bar (Matches Stitch Screenshot) */}
      <div className="flex flex-col justify-between gap-4 border-b border-border-subtle pb-5 lg:flex-row lg:items-end">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
            PORTFOLIO CORE / CUSTOMER REGISTRY &amp; COMPLIANCE
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            Customer Directory &amp; KYC Management
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-text-secondary sm:text-sm">
            Manage verified personal, business, and enterprise account holders
            and audit their account privileges.
          </p>
        </div>

        {/* Right KPI Pills & + Enroll Entity CTA */}
        <div className="flex flex-col items-start gap-2.5 sm:items-end">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 font-semibold text-text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-text-secondary" />
              <span>
                TOTAL {formatCountCompact(summaryCounts.totalCustomers)}
              </span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-status-info-border bg-status-info-bg px-3 py-1 font-semibold text-status-info">
              <span className="h-1.5 w-1.5 rounded-full bg-status-info" />
              <span>
                ACTIVE {formatCountCompact(summaryCounts.activeCustomers)}
              </span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-status-danger-border bg-status-danger-bg px-3 py-1 font-semibold text-status-danger">
              <span className="h-1.5 w-1.5 rounded-full bg-status-danger" />
              <span>
                FLAGGED{" "}
                {formatCountCompact(summaryCounts.flaggedOrBlockedCustomers)}
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setEnrollModalOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-btn-primary px-4 text-xs font-bold text-btn-primary-text transition-colors hover:bg-btn-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span>👤+</span>
            <span>Enroll Entity</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Toolbar Card (Matches Stitch Screenshot) */}
      <div className="rounded-2xl border border-border bg-surface p-4 ve-card-shadow">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          {/* Left: Search Input */}
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder="Search by Customer Name, Email, Code, or Phone..."
              aria-label="Search customers by name, email, code, or phone"
              className="h-10 w-full rounded-xl border border-input-border bg-input-bg pl-10 pr-4 text-xs text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
            />
          </div>

          {/* Right: Status Filter + Tier Filter + KYC Attributes + Audit Export */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Dropdown */}
            <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface-inner px-3 font-mono text-xs text-text-secondary">
              <span className="text-[10px] uppercase tracking-wider text-text-muted">
                STATUS:
              </span>
              <select
                aria-label="Filter customers by account status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as UserStatus | "ALL");
                  setPage(1);
                }}
                className="bg-transparent font-semibold text-text-primary focus:outline-none"
              >
                <option value="ALL" className="bg-surface text-text-primary">
                  All Statuses
                </option>
                <option value="ACTIVE" className="bg-surface text-text-primary">
                  Active Sovereign
                </option>
                <option
                  value="DEACTIVATED"
                  className="bg-surface text-text-primary"
                >
                  Escalation / Suspended
                </option>
                <option
                  value="BLOCKED"
                  className="bg-surface text-text-primary"
                >
                  FATF Sanction Block
                </option>
              </select>
            </label>

            {/* Tier Dropdown */}
            <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface-inner px-3 font-mono text-xs text-text-secondary">
              <span className="text-[10px] uppercase tracking-wider text-text-muted">
                TIER:
              </span>
              <select
                aria-label="Filter customers by banking tier"
                value={tierFilter}
                onChange={(e) =>
                  setTierFilter(
                    e.target.value as
                      | "ALL"
                      | "PERSONAL"
                      | "OBSIDIAN"
                      | "CORPORATE"
                  )
                }
                className="bg-transparent font-semibold text-text-primary focus:outline-none"
              >
                <option value="ALL" className="bg-surface text-text-primary">
                  All Tiers (Personal / Obsidian / Corp)
                </option>
                <option
                  value="OBSIDIAN"
                  className="bg-surface text-text-primary"
                >
                  Obsidian Private
                </option>
                <option
                  value="CORPORATE"
                  className="bg-surface text-text-primary"
                >
                  Corporate Institutional
                </option>
                <option
                  value="PERSONAL"
                  className="bg-surface text-text-primary"
                >
                  Personal Standard
                </option>
              </select>
            </label>

            {/* KYC Attributes Filter Pill */}
            <label className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-btn-secondary-border bg-btn-secondary px-3 font-mono text-xs font-semibold text-btn-secondary-text transition-colors hover:border-accent">
              <span>☷</span>
              <select
                aria-label="Filter customers by KYC verification status"
                value={kycFilter}
                onChange={(e) => {
                  setKycFilter(
                    e.target.value as KycVerificationStatus | "ALL"
                  );
                  setPage(1);
                }}
                className="bg-transparent focus:outline-none"
              >
                <option value="ALL" className="bg-surface text-text-primary">
                  Attributes (All KYC)
                </option>
                <option
                  value="VERIFIED"
                  className="bg-surface text-text-primary"
                >
                  KYC: Verified
                </option>
                <option
                  value="PENDING"
                  className="bg-surface text-text-primary"
                >
                  KYC: Pending
                </option>
                <option
                  value="REJECTED"
                  className="bg-surface text-text-primary"
                >
                  KYC: Rejected
                </option>
              </select>
            </label>

            {/* Audit Export Button */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-btn-secondary-border bg-btn-secondary px-3.5 font-mono text-xs font-semibold text-btn-secondary-text transition-colors hover:border-accent hover:bg-btn-secondary-hover"
            >
              <span>⇩</span>
              <span>Audit Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Split Grid: Active Ledger Accounts Directory (Left 7 cols) + Live Inspector (Right 5 cols) */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left Column: Active Ledger Accounts Table Card */}
        <section
          aria-labelledby="customer-directory-table-heading"
          className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 lg:col-span-7 ve-card-shadow"
        >
          <div>
            {/* Table Card Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-accent-border bg-accent-subtle text-accent">
                  🗂️
                </span>
                <div>
                  <h2
                    id="customer-directory-table-heading"
                    className="text-sm font-bold text-text-primary sm:text-base"
                  >
                    Active Ledger Accounts
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="rounded-md border border-border-subtle bg-surface-inner px-2.5 py-1 text-text-secondary">
                  Displaying {displayedCustomers.length} of{" "}
                  {formatCountCompact(meta.total)}
                </span>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="inline-flex items-center gap-1.5 text-status-info hover:text-accent"
                >
                  <span className="h-2 w-2 rounded-full bg-status-info" />
                  <span>{isFetching ? "Syncing..." : "Live Sync 0.4s"}</span>
                </button>
              </div>
            </div>

            {/* Directory Table */}
            {displayedCustomers.length === 0 ? (
              <div className="mt-6 rounded-xl border border-border-subtle bg-surface-inner p-10 text-center">
                <p className="text-sm font-semibold text-text-primary">
                  No Matching Customer Entities Found
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  Adjust your search query or status/tier filters to view
                  registered customers.
                </p>
              </div>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle font-mono text-[10px] uppercase tracking-wider text-text-muted">
                      <th className="py-3 pr-3">CUSTOMER ID</th>
                      <th className="py-3 px-3">NAME &amp; IDENTITY</th>
                      <th className="py-3 px-3">EMAIL ADDRESS</th>
                      <th className="py-3 pl-3 text-right">ACTIVE ACCOUNTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle text-xs">
                    {displayedCustomers.map((customer) => {
                      const isSelected = activeCustomer?.id === customer.id;
                      const customerCode =
                        customer.customerProfile?.customerCode ??
                        `CUST-${customer.id.slice(-5).toUpperCase()}`;
                      const shortNum = customerCode
                        .replace(/^CUS(T)?-\d{4}-/, "")
                        .slice(0, 6);
                      const tierPrefix = getTierCodePrefix(customer);
                      const tierSubtitle = getTierSubtitle(customer);

                      const accountTypesList = Array.from(
                        new Set(customer.accounts.map((a) => a.accountType))
                      );

                      return (
                        <tr
                          key={customer.id}
                          onClick={() => setSelectedCustomerId(customer.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-surface-hover"
                              : "hover:bg-surface-inner"
                          }`}
                        >
                          {/* 1. Customer ID & Initials Avatar */}
                          <td className="py-4 pr-3 align-middle">
                            <div className="flex items-center gap-3">
                              <span
                                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border font-mono text-xs font-bold transition-colors ${
                                  isSelected
                                    ? "border-accent bg-btn-primary text-btn-primary-text"
                                    : "border-border bg-surface-inner text-text-secondary"
                                }`}
                              >
                                {getInitials(customer.fullName)}
                              </span>
                              <div className="font-mono leading-tight">
                                <p className="text-[11px] font-bold text-accent">
                                  CUST-{shortNum}
                                </p>
                                <p className="mt-0.5 text-[10px] text-text-muted">
                                  {tierPrefix}-{customer.id.slice(-4).toUpperCase()}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* 2. Name & Identity Tier */}
                          <td className="py-4 px-3 align-middle">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                  customer.status === "ACTIVE"
                                    ? "bg-status-info"
                                    : customer.status === "DEACTIVATED"
                                      ? "bg-accent"
                                      : "bg-status-danger"
                                }`}
                                title={`Status: ${customer.status}`}
                              />
                              <p className="font-bold text-text-primary">
                                {customer.fullName}
                              </p>
                            </div>
                            <p className="mt-0.5 pl-3.5 font-mono text-[11px] text-text-muted">
                              {tierSubtitle}
                            </p>
                          </td>

                          {/* 3. Email Address */}
                          <td className="py-4 px-3 align-middle font-mono text-[11px] text-text-secondary">
                            <span className="block max-w-[200px] truncate">
                              {customer.email}
                            </span>
                          </td>

                          {/* 4. Active Accounts Summary */}
                          <td className="py-4 pl-3 align-middle text-right">
                            <p className="font-bold text-text-primary">
                              {customer.accountsCount}{" "}
                              {customer.accountsCount === 1
                                ? "Account"
                                : "Accounts"}
                            </p>
                            <p className="mt-0.5 font-mono text-[10px] text-text-muted">
                              {accountTypesList.length > 0
                                ? accountTypesList
                                    .map((t) =>
                                      t === "SAVINGS"
                                        ? "Savings"
                                        : t === "CURRENT"
                                          ? "Current"
                                          : "Business"
                                    )
                                    .join(" • ")
                                : formatCurrencyFull(customer.totalBalance)}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bottom Legend & Pagination Controls (Matches Stitch Screenshot) */}
          <div className="mt-6 flex flex-col justify-between gap-4 border-t border-border-subtle pt-4 sm:flex-row sm:items-center">
            {/* Status Legend */}
            <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] text-text-secondary">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-status-info" />
                <span>Active Sovereign</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span>Escalation / Suspended</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-status-danger" />
                <span>FATF Sanction Block</span>
              </span>
            </div>

            {/* Pagination Buttons */}
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <button
                type="button"
                disabled={!meta.hasPrevPage || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-surface-inner px-2.5 text-[11px] font-semibold text-text-secondary transition-colors hover:border-accent hover:text-text-primary disabled:opacity-45"
              >
                Prev
              </button>

              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-btn-primary px-2.5 text-[11px] font-bold text-btn-primary-text">
                {meta.page}
              </span>

              {meta.totalPages > 1 && (
                <span className="px-1.5 text-[11px] text-text-muted">
                  of {meta.totalPages}
                </span>
              )}

              <button
                type="button"
                disabled={!meta.hasNextPage || isFetching}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-surface-inner px-2.5 text-[11px] font-semibold text-text-secondary transition-colors hover:border-accent hover:text-text-primary disabled:opacity-45"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Live Customer Inspector Panel (5 cols) */}
        <div className="lg:col-span-5">
          <AdminCustomerInspectorCard
            selectedCustomerSummary={activeCustomer}
            onOpenProvisionAccount={() => setEnrollModalOpen(true)}
          />
        </div>
      </div>

      {/* Enroll Entity / Provision Customer Bank Account Modal */}
      {enrollModalOpen ? (
        <AdminEnrollEntityModal
          key={activeCustomer?.id ?? "new"}
          open={enrollModalOpen}
          onClose={() => setEnrollModalOpen(false)}
          customers={rawCustomers}
          defaultSelectedCustomerId={activeCustomer?.id ?? null}
        />
      ) : null}
    </div>
  );
}
