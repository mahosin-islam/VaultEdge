import type { ReactNode } from "react";
import { requireServerRole } from "@/server/auth/session";
import { StaffDashboardShell } from "@/components/layout/StaffDashboardShell";

interface StaffLayoutProps {
  children: ReactNode;
}

export default async function StaffGroupLayout({ children }: StaffLayoutProps) {
  const user = await requireServerRole(["STAFF"]);
  return <StaffDashboardShell user={user}>{children}</StaffDashboardShell>;
}
