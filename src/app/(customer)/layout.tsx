import type { ReactNode } from "react";
import { requireServerRole } from "@/server/auth/session";
import { CustomerDashboardShell } from "@/components/layout/CustomerDashboardShell";

interface CustomerLayoutProps {
  children: ReactNode;
}

export default async function CustomerGroupLayout({
  children,
}: CustomerLayoutProps) {
  const user = await requireServerRole(["CUSTOMER"]);
  return <CustomerDashboardShell user={user}>{children}</CustomerDashboardShell>;
}
