// ============================================================================
// VaultEdge — Admin Portal Navigation Configuration
// Matches the 9 canonical Admin routes in docs/ARCHITECTURE.md (§4.2).
// ============================================================================

export type AdminNavIconKey =
  | "overview"
  | "customers"
  | "accounts"
  | "transactions"
  | "deposits"
  | "withdrawals"
  | "loans"
  | "analytics"
  | "settings";

export interface AdminNavItemConfig {
  label: string;
  href: string;
  icon: AdminNavIconKey;
}

export const ADMIN_SIDEBAR_NAV_ITEMS: readonly AdminNavItemConfig[] = [
  { label: "Overview", href: "/admin/overview", icon: "overview" },
  { label: "Customers", href: "/admin/customers", icon: "customers" },
  { label: "Bank Accounts", href: "/admin/accounts", icon: "accounts" },
  { label: "Transactions", href: "/admin/transactions", icon: "transactions" },
  { label: "Deposits", href: "/admin/deposits", icon: "deposits" },
  { label: "Withdrawals", href: "/admin/withdrawals", icon: "withdrawals" },
  { label: "Loans", href: "/admin/loans", icon: "loans" },
  { label: "Analytics", href: "/admin/analytics", icon: "analytics" },
  { label: "Settings", href: "/admin/settings", icon: "settings" },
] as const;
