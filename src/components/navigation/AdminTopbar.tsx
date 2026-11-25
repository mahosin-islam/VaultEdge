"use client";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  setAdminSearchQuery,
  toggleAdminMobileSidebar,
} from "@/features/admin/adminSlice";
import type { SafeUserDTO } from "@/types/auth.types";

interface AdminTopbarProps {
  user: SafeUserDTO;
}

export function AdminTopbar({ user }: AdminTopbarProps) {
  const dispatch = useAppDispatch();
  const searchQuery = useAppSelector(
    (state) => state.admin?.searchQuery ?? ""
  );

  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-background-glass backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Drawer Button + Breadcrumb + Node Pill */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => dispatch(toggleAdminMobileSidebar())}
            aria-label="Toggle admin sidebar navigation"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-primary transition-colors hover:border-accent hover:text-accent lg:hidden"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <line x1="4" x2="20" y1="7" y2="7" />
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="17" y2="17" />
            </svg>
          </button>

          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="font-medium text-text-secondary">
              VaultEdge Core
            </span>
            <span className="text-text-muted">/</span>
            <span className="font-semibold text-accent">Admin Console</span>
          </div>

          <span className="hidden xl:inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-text-muted">
            <span>▤</span>
            <span>0x88F2-NY-CORE</span>
          </span>
        </div>

        {/* Center/Right: Search Input + 256-Bit TLS Badge + Bell + ThemeToggle + User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Search Input */}
          <div className="relative hidden md:block">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => dispatch(setAdminSearchQuery(e.target.value))}
              placeholder="Search accounts..."
              aria-label="Search accounts or transactions"
              className="h-9 w-48 lg:w-60 rounded-lg border border-border bg-surface pl-8 pr-11 text-xs text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
            />
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
              <kbd className="rounded border border-border-subtle bg-surface-inner px-1.5 py-0.5 font-mono text-[9px] text-text-muted">
                ⌘K
              </kbd>
            </span>
          </div>

          {/* 256-Bit TLS Badge */}
          <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-status-info-border bg-status-info-bg px-3 py-1 font-mono text-[10px] font-semibold text-status-info">
            <span>🛡️</span>
            <span>256-Bit TLS</span>
          </span>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Admin Profile Pill */}
          <div className="flex items-center gap-2.5 border-l border-border-subtle pl-2.5 sm:pl-3.5">
            <div className="hidden sm:flex flex-col text-right leading-tight">
              <span className="text-xs font-semibold text-text-primary">
                {user.fullName}
              </span>
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-accent">
                ADMIN ROOT
              </span>
            </div>

            <div
              aria-label={`Signed in as ${user.fullName}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent-border bg-btn-primary font-mono text-xs font-bold text-btn-primary-text"
            >
              {user.firstName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
