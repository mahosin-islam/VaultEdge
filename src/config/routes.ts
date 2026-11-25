// ============================================================================
// VaultEdge — Canonical Role-Based Dashboard Route Mapping
// ============================================================================

import type { UserRole } from "@prisma/client";

export const ROLE_DASHBOARD_ROUTES: Record<UserRole, string> = {
  ADMIN: "/admin/overview",
  STAFF: "/staff/overview",
  CUSTOMER: "/customer/overview",
} as const;

export function getDashboardRouteForRole(role: UserRole): string {
  return ROLE_DASHBOARD_ROUTES[role] ?? "/customer/overview";
}
