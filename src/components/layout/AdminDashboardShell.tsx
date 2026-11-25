import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/navigation/AdminSidebar";
import { AdminTopbar } from "@/components/navigation/AdminTopbar";
import type { SafeUserDTO } from "@/types/auth.types";

interface AdminDashboardShellProps {
  user: SafeUserDTO;
  children: ReactNode;
}

export function AdminDashboardShell({
  user,
  children,
}: AdminDashboardShellProps) {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <AdminSidebar />
      <div className="flex min-h-screen flex-col lg:pl-60">
        <AdminTopbar user={user} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
          <div className="mx-auto max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
