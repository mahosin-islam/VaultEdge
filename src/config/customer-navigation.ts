// ============================================================================
// VaultEdge — Customer Portal Sidebar Navigation Configuration
// Strictly aligned with src/app/(customer)/customer/* routes
// ============================================================================

export type CustomerNavIconKey =
  | "overview"
  | "accounts"
  | "transfers"
  | "deposits"
  | "withdrawals"
  | "transactions"
  | "loans"
  | "statements"
  | "notifications"
  | "profile";

export interface CustomerNavItem {
  label: string;
  href: string;
  icon: CustomerNavIconKey;
}

export const CUSTOMER_SIDEBAR_NAV_ITEMS: readonly CustomerNavItem[] = [
  { label: "Customer Overview", href: "/customer/overview", icon: "overview" },
  { label: "My Accounts", href: "/customer/accounts", icon: "accounts" },
  { label: "Fund Transfer", href: "/customer/transfers", icon: "transfers" },
  {
    label: "Deposit Request",
    href: "/customer/deposit-requests",
    icon: "deposits",
  },
  {
    label: "Withdrawal Request",
    href: "/customer/withdrawal-requests",
    icon: "withdrawals",
  },
  {
    label: "Transaction History",
    href: "/customer/transactions",
    icon: "transactions",
  },
  { label: "Loan Management", href: "/customer/loans", icon: "loans" },
  {
    label: "Account Statements",
    href: "/customer/statements",
    icon: "statements",
  },
  {
    label: "Notifications",
    href: "/customer/notifications",
    icon: "notifications",
  },
  {
    label: "Profile & Security",
    href: "/customer/profile-security",
    icon: "profile",
  },
] as const;
