// ============================================================================
// VaultEdge — Bank Staff Sidebar Navigation Configuration
// Strictly aligned with docs/ARCHITECTURE.md (§4.3)
// ============================================================================

export type StaffNavIconKey =
  | "overview"
  | "customers"
  | "accounts"
  | "verification"
  | "transactions"
  | "suspicious"
  | "loans";

export interface StaffNavItem {
  label: string;
  href: string;
  icon: StaffNavIconKey;
}

export const STAFF_SIDEBAR_NAV_ITEMS: readonly StaffNavItem[] = [
  { label: "Staff Overview", href: "/staff/overview", icon: "overview" },
  {
    label: "Customer Registration",
    href: "/staff/customers",
    icon: "customers",
  },
  { label: "Account Management", href: "/staff/accounts", icon: "accounts" },
  {
    label: "Customer Verification",
    href: "/staff/verification",
    icon: "verification",
  },
  {
    label: "Transaction Review",
    href: "/staff/transactions",
    icon: "transactions",
  },
  {
    label: "Suspicious Transactions",
    href: "/staff/suspicious-transactions",
    icon: "suspicious",
  },
  {
    label: "Loan Application Review",
    href: "/staff/loan-applications",
    icon: "loans",
  },
] as const;
