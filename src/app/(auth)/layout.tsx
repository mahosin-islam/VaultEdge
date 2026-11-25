import type { ReactNode } from "react";
import { AuthTopbar } from "@/components/navigation/AuthTopbar";
import { LandingFooter } from "@/components/layout/LandingFooter";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <AuthTopbar />
      <main className="ve-hero-backdrop flex-1 flex items-center py-10 sm:py-14 lg:py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
