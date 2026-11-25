import type { ReactNode } from "react";
import { requireServerRole } from "@/server/auth/session";
import { AdminDashboardShell } from "@/components/layout/AdminDashboardShell";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminGroupLayout({ children }: AdminLayoutProps) {
  const user = await requireServerRole(["ADMIN"]);
  return <AdminDashboardShell user={user}>{children}</AdminDashboardShell>;
}
