"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CUSTOMER_SIDEBAR_NAV_ITEMS,
  type CustomerNavIconKey,
} from "@/config/customer-navigation";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setCustomerMobileSidebarOpen } from "@/features/customer/customerSlice";
import { useLogoutMutation } from "@/features/auth/authApi";

function CustomerNavIcon({ icon }: { icon: CustomerNavIconKey }) {
  const cls = "h-4 w-4 shrink-0";
  switch (icon) {
    case "overview":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
          <rect width="7" height="7" x="3" y="3" rx="1.5" />
          <rect width="7" height="7" x="14" y="3" rx="1.5" />
          <rect width="7" height="7" x="14" y="14" rx="1.5" />
          <rect width="7" height="7" x="3" y="14" rx="1.5" />
        </svg>
      );
    case "accounts":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
      );
    case "transfers":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
          <path d="m17 2 4 4-4 4" />
          <path d="M3 6h18" />
          <path d="m7 22-4-4 4-4" />
          <path d="M21 18H3" />
        </svg>
      );
    case "deposits":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
          <path d="M12 5v14" />
          <path d="m19 12-7 7-7-7" />
        </svg>
      );
    case "withdrawals":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
          <path d="M12 19V5" />
          <path d="m5 12 7-7 7 7" />
        </svg>
      );
    case "transactions":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
        </svg>
      );
    case "loans":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
          <path d="M3 21h18" />
          <path d="M3 10h18" />
          <path d="M5 6l7-3 7 3" />
          <path d="M4 10v11" />
          <path d="M20 10v11" />
          <path d="M8 14v3" />
          <path d="M12 14v3" />
          <path d="M16 14v3" />
        </svg>
      );
    case "statements":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M12 18v-6" />
          <path d="m9 15 3 3 3-3" />
        </svg>
      );
    case "notifications":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      );
    case "profile":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
          <circle cx="12" cy="10" r="2.5" />
          <path d="M8.5 16.5a4.5 4.5 0 0 1 7 0" />
        </svg>
      );
  }
}

export function CustomerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const mobileOpen = useAppSelector(
    (state) => state.customer?.mobileSidebarOpen ?? false
  );
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const closeMobile = () => dispatch(setCustomerMobileSidebarOpen(false));

  const handleSignOut = async () => {
    try {
      await logout().unwrap();
    } catch {
      // Redirect even if session already expired
    } finally {
      closeMobile();
      router.push("/login");
      router.refresh();
    }
  };

  const sidebarBody = (
    <div className="flex h-full flex-col border-r border-border-subtle bg-background-secondary px-3.5 py-4">
      {/* Brand Header */}
      <div className="mb-4 flex items-center justify-between px-2">
        <Link
          href="/customer"
          onClick={closeMobile}
          className="flex items-center gap-2.5"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent-border bg-accent-subtle text-accent">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4.5 w-4.5"
              aria-hidden="true"
            >
              <path d="M12 2 3 6v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V6l-9-4Z" />
              <path d="M9 12h6" />
              <path d="M12 9v6" />
            </svg>
          </span>
          <div>
            <span className="block font-serif text-base font-bold tracking-tight text-text-primary">
              Vault<span className="text-accent">Edge</span>
            </span>
            <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted">
              CUSTOMER PORTAL
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Customer sidebar navigation" className="flex-1 space-y-1 overflow-y-auto">
        {CUSTOMER_SIDEBAR_NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobile}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${isActive
                  ? "bg-accent-subtle text-accent border border-accent-border font-semibold"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-transparent"
                }`}
            >
              <CustomerNavIcon icon={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Security Badge & Sign Out */}
      <div className="mt-4 space-y-2.5 border-t border-border-subtle pt-4">
        <div className="rounded-lg border border-border bg-surface px-3 py-2 text-[10px] text-text-muted">
          <div className="flex items-center gap-1.5 font-medium text-text-secondary">
            <span className="h-2 w-2 rounded-full bg-status-success" />
            <span>256-Bit Encrypted • Ledger Live</span>
          </div>
        </div>

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
          <span>{isLoggingOut ? "Signing Out..." : "Lock & Sign Out"}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 lg:block">
        {sidebarBody}
      </aside>

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
