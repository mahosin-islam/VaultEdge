import type { ReactNode } from "react";
import { CustomerSidebar } from "@/components/navigation/CustomerSidebar";
import { CustomerTopbar } from "@/components/navigation/CustomerTopbar";
import type { SafeUserDTO } from "@/types/auth.types";

interface CustomerDashboardShellProps {
  user: SafeUserDTO;
  children: ReactNode;
}

export function CustomerDashboardShell({
  user,
  children,
}: CustomerDashboardShellProps) {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <CustomerSidebar />
      <div className="flex min-h-screen flex-col lg:pl-60">
        <CustomerTopbar user={user} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
          <div className="mx-auto max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
