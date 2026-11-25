import type { ReactNode } from "react";
import { StaffSidebar } from "@/components/navigation/StaffSidebar";
import { StaffTopbar } from "@/components/navigation/StaffTopbar";
import type { SafeUserDTO } from "@/types/auth.types";

interface StaffDashboardShellProps {
  user: SafeUserDTO;
  children: ReactNode;
}

export function StaffDashboardShell({
  user,
  children,
}: StaffDashboardShellProps) {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <StaffSidebar />
      <div className="flex min-h-screen flex-col lg:pl-60">
        <StaffTopbar user={user} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
          <div className="mx-auto max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
