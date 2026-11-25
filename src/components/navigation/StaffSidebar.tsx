"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  STAFF_SIDEBAR_NAV_ITEMS,
  type StaffNavIconKey,
} from "@/config/staff-navigation";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setStaffMobileSidebarOpen } from "@/features/staff/staffSlice";
import { useLogoutMutation } from "@/features/auth/authApi";

function StaffNavIcon({ icon }: { icon: StaffNavIconKey }) {
  switch (icon) {
    case "overview":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <rect width="7" height="7" x="3" y="3" rx="1.5" />
          <rect width="7" height="7" x="14" y="3" rx="1.5" />
          <rect width="7" height="7" x="14" y="14" rx="1.5" />
          <rect width="7" height="7" x="3" y="14" rx="1.5" />
        </svg>
      );
    case "customers":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" x2="19" y1="8" y2="14" />
          <line x1="22" x2="16" y1="11" y2="11" />
        </svg>
      );
    case "accounts":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
      );
    case "verification":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "transactions":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="m17 2 4 4-4 4" />
          <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
          <path d="m7 22-4-4 4-4" />
          <path d="M21 13v1a4 4 0 0 1-4 4H3" />
        </svg>
      );
    case "suspicious":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "loans":
    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" x2="8" y1="13" y2="13" />
          <line x1="16" x2="8" y1="17" y2="17" />
        </svg>
      );
  }
}

export function StaffSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const mobileOpen = useAppSelector(
    (state) => state.staff?.mobileSidebarOpen ?? false
  );
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const closeMobile = () => dispatch(setStaffMobileSidebarOpen(false));

  const handleSignOut = async () => {
    try {
      await logout().unwrap();
    } catch {
      // Redirect even if session already expired
    } finally {
      closeMobile();
      router.replace("/login");
      router.refresh();
    }
  };

  const sidebarBody = (
    <div className="flex h-full flex-col border-r border-border bg-background px-3.5 py-5">
      {/* Brand Header */}
      <div className="px-2 pb-5">
        <Link
          href="/"
          onClick={closeMobile}
          className="flex items-center gap-2.5 text-text-primary transition-opacity hover:opacity-90"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent-border bg-accent-subtle text-accent">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M3 21h18M4 18h16M6 18V9m4 9V9m4 9V9m4 9V9M3 9l9-6 9 6" />
            </svg>
          </span>
          <div>
            <span className="block font-serif text-base font-bold tracking-tight text-text-primary">
              Vault<span className="text-accent">Edge</span>
            </span>
            <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted">
              BANK STAFF // OPS DESK
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Staff sidebar navigation" className="flex-1 space-y-1">
        {STAFF_SIDEBAR_NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobile}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-btn-primary text-btn-primary-text shadow-sm"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              }`}
            >
              <StaffNavIcon icon={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Status & Sign Out */}
      <div className="mt-4 space-y-2.5 border-t border-border-subtle pt-4">

              <button
          type="button"
          disabled={isLoggingOut}
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-status-danger transition-colors hover:bg-status-danger-bg disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
          <span>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
        </button>

        <div className="rounded-lg border border-border bg-surface px-3 py-2.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 font-medium text-text-primary">
              <span className="h-2 w-2 rounded-full bg-status-success" />
              Ops Desk Active
            </span>
            <span className="font-mono text-[10px] text-accent">STAFF</span>
          </div>
          <p className="mt-1 text-[10px] text-text-muted">
            Zero-Trust RBAC Enforced
          </p>
        </div>


     
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 lg:block">
        {sidebarBody}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={closeMobile}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64">
            {sidebarBody}
          </aside>
        </div>
      ) : null}
    </>
  );
}
