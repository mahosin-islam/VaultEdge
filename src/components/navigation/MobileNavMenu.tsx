"use client";

import { useState } from "react";
import Link from "next/link";

export interface NavItem {
  label: string;
  href: string;
}

interface MobileNavMenuProps {
  items: readonly NavItem[];
  dashboardHref?: string | null;
  userRole?: string | null;
}

export function MobileNavMenu({
  items,
  dashboardHref = null,
  userRole = null,
}: MobileNavMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-text-primary transition-colors hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {open ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <line x1="4" x2="20" y1="7" y2="7" />
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="17" y2="17" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-b border-border bg-background-elevated px-6 py-5 ve-card-shadow">
          <nav aria-label="Mobile Primary Navigation" className="flex flex-col gap-3">
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface hover:text-accent"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mt-4 flex flex-col gap-2.5 border-t border-border pt-4 sm:flex-row">
            {dashboardHref ? (
              <Link
                href={dashboardHref}
                onClick={() => setOpen(false)}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-btn-primary px-4 text-sm font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover"
              >
                <span>Dashboard</span>
                {userRole && (
                  <span className="rounded bg-background/20 px-1.5 py-0.5 font-mono text-[10px] uppercase">
                    {userRole}
                  </span>
                )}
                <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-btn-secondary-border bg-btn-secondary px-4 text-sm font-semibold text-btn-secondary-text transition-colors hover:bg-btn-secondary-hover"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-btn-primary px-4 text-sm font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover"
                >
                  <span>Get Started</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
