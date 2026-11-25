"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ADMIN_SIDEBAR_NAV_ITEMS,
  type AdminNavIconKey,
} from "@/config/admin-navigation";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setAdminMobileSidebarOpen } from "@/features/admin/adminSlice";
import { useLogoutMutation } from "@/features/auth/authApi";

function AdminNavIcon({ icon }: { icon: AdminNavIconKey }) {
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
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
          <path d="M17 2.1l4 4-4 4" />
          <path d="M3 12.2v-2a4 4 0 0 1 4-4h14" />
          <path d="M7 21.9l-4-4 4-4" />
          <path d="M21 11.8v2a4 4 0 0 1-4 4H3" />
        </svg>
      );
    case "deposits":
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
          <path d="M12 3v14" />
          <path d="m7 12 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
      );
    case "withdrawals":
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
          <path d="M12 21V7" />
          <path d="m7 12 5-5 5 5" />
          <path d="M5 3h14" />
        </svg>
      );
    case "loans":
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
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case "analytics":
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
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      );
    case "settings":
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
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </svg>
      );
  }
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const mobileOpen = useAppSelector(
    (state) => state.admin?.mobileSidebarOpen ?? false
  );
  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();

  const closeMobile = () => dispatch(setAdminMobileSidebarOpen(false));

  const handleSignOut = async () => {
    try {
      await logoutMutation().unwrap();
    } finally {
      closeMobile();
      router.push("/login");
      router.refresh();
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-background-secondary border-r border-border-subtle px-4 py-6">
      {/* Top: Brand Header + ADMIN PANEL // ROOT badge + Nav Items */}
      <div>
        <div className="px-2">
          <Link
            href="/"
            onClick={closeMobile}
            className="inline-flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-accent-border bg-accent-subtle text-accent">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M3 21h18" />
                <path d="M3 10h18" />
                <path d="M5 6l7-3 7 3" />
                <path d="M4 10v11" />
                <path d="M20 10v11" />
                <path d="M8 14v3" />
                <path d="M12 14v3" />
                <path d="M16 14v3" />
              </svg>
            </span>
            <span className="text-lg font-bold tracking-tight text-text-primary">
              Vault<span className="text-accent">Edge</span>
            </span>
          </Link>

          <div className="mt-3 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest">
            <span className="rounded border border-accent-border bg-accent-subtle px-1.5 py-0.5 text-accent">
              ADMIN PANEL
            </span>
            <span className="text-text-muted">{"// ROOT"}</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav
          aria-label="Admin Portal Sidebar Navigation"
          className="mt-6 space-y-1.5"
        >
          {ADMIN_SIDEBAR_NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${isActive
                    ? "bg-btn-primary text-btn-primary-text shadow-sm"
                    : "text-text-secondary hover:bg-surface hover:text-text-primary"
                  }`}
              >
                <AdminNavIcon icon={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Visible Sign Out Button & Ledger Synced Status Card */}
      <div className="mt-8 space-y-3">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-status-danger-border bg-status-danger-bg px-3.5 py-2.5 text-xs font-semibold text-status-danger transition-colors hover:bg-status-danger hover:text-background focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
          <span>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
        </button>

        <div className="rounded-xl border border-border-subtle bg-surface-inner p-3.5 font-mono text-[11px]">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 font-semibold text-text-primary">
              <span
                className="h-2 w-2 rounded-full bg-status-info"
                aria-hidden="true"
              />
              <span>Ledger Synced</span>
            </span>
            <span className="font-bold text-text-primary">100%</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-text-muted">
            <span>Zero-Trust Protocol</span>
            <span className="text-accent">🛡️</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Permanent Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-60 lg:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile / Tablet Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-background-glass backdrop-blur-xs"
            onClick={closeMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 flex w-64 flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
