"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CUSTOMER_SIDEBAR_NAV_ITEMS } from "@/config/customer-navigation";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  setCustomerSearchQuery,
  toggleCustomerMobileSidebar,
} from "@/features/customer/customerSlice";
import { useGetCustomerNotificationsQuery } from "@/features/customer/customerApi";
import type { SafeUserDTO } from "@/types/auth.types";

interface CustomerTopbarProps {
  user: SafeUserDTO;
}

export function CustomerTopbar({ user }: CustomerTopbarProps) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const searchQuery = useAppSelector(
    (state) => state.customer?.searchQuery ?? ""
  );
  const { data: notifRes } = useGetCustomerNotificationsQuery({ limit: 4 });
  const unreadCount = notifRes?.data?.unreadCount ?? 0;

  const activeNav = CUSTOMER_SIDEBAR_NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  const pageTitle = activeNav?.label ?? "Dashboard";

  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() ||
    "CU";

  const kycLabel =
    user.customerProfile?.kycStatus === "VERIFIED"
      ? "Verified Customer"
      : `KYC ${user.customerProfile?.kycStatus ?? "PENDING"}`;

  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-background-glass backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Drawer Button + Breadcrumb + Live Session */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => dispatch(toggleCustomerMobileSidebar())}
            aria-label="Toggle customer sidebar navigation"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-primary transition-colors hover:border-accent hover:text-accent lg:hidden"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <line x1="4" x2="20" y1="7" y2="7" />
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="17" y2="17" />
            </svg>
          </button>

          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="font-medium text-text-secondary">
              Customer Portal
            </span>
            <span className="text-text-muted">/</span>
            <span className="font-semibold text-text-primary">{pageTitle}</span>
            <span className="hidden items-center gap-1.5 rounded-full border border-accent-border bg-accent-subtle px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-accent sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
              LIVE SESSION
            </span>
          </div>
        </div>

        {/* Right: Search + ThemeToggle + Notifications Bell + User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="relative hidden md:block">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => dispatch(setCustomerSearchQuery(e.target.value))}
              placeholder="Search transactions, accounts..."
              className="w-52 rounded-lg border border-border bg-surface py-1.5 pl-8 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none lg:w-64"
            />
          </div>

          <ThemeToggle />

          <Link
            href="/customer/notifications"
            aria-label="Notifications"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary transition-colors hover:border-accent hover:text-accent"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-btn-primary px-1 font-mono text-[9px] font-bold text-btn-primary-text">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Link>

          <Link
            href="/customer/profile-security"
            className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 transition-colors hover:border-accent"
          >
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold leading-tight text-text-primary">
                {user.fullName}
              </p>
              <p className="font-mono text-[10px] tracking-wider text-text-muted">
                {kycLabel}
              </p>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-accent-border bg-accent-subtle font-mono text-[11px] font-bold text-accent">
              {initials}
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
