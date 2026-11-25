"use client";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  setStaffSearchQuery,
  toggleStaffMobileSidebar,
} from "@/features/staff/staffSlice";
import type { SafeUserDTO } from "@/types/auth.types";

interface StaffTopbarProps {
  user: SafeUserDTO;
}

export function StaffTopbar({ user }: StaffTopbarProps) {
  const dispatch = useAppDispatch();
  const searchQuery = useAppSelector(
    (state) => state.staff?.searchQuery ?? ""
  );

  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() ||
    "ST";

  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-background-glass backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Drawer Button + Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => dispatch(toggleStaffMobileSidebar())}
            aria-label="Toggle staff sidebar navigation"
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
            <span className="font-semibold text-accent">Staff Console</span>
          </div>
        </div>

        {/* Center/Right: Search + ThemeToggle + User Badge */}
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => dispatch(setStaffSearchQuery(e.target.value))}
              placeholder="Filter operational queues..."
              className="w-56 rounded-lg border border-border bg-surface py-1.5 pl-8 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none lg:w-64"
            />
          </div>

          <ThemeToggle />

          <div className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-2.5 py-1.5">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold leading-tight text-text-primary">
                {user.fullName}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
                BANK STAFF
              </p>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-accent-border bg-accent-subtle font-mono text-[11px] font-bold text-accent">
              {initials}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
