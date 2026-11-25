import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function AuthTopbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-background-glass backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo & Back to Home */}
        <div className="flex items-center gap-6 sm:gap-8">
          <Link
            href="/"
            aria-label="VaultEdge Digital Banking - Home"
            className="group inline-flex items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-accent-border bg-accent-subtle text-accent transition-transform group-hover:scale-[1.03]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
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
            <span className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight text-text-primary">
                VAULT<span className="text-accent">EDGE</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                DIGITAL BANKING
              </span>
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-accent focus:outline-none focus-visible:text-accent"
          >
            <span aria-hidden="true">←</span>
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Right: 256-BIT TLS Badge & Theme Toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 font-mono text-[11px] font-medium tracking-wider text-text-secondary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5 text-accent"
              aria-hidden="true"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>256-BIT TLS SECURED</span>
            <span
              className="h-1.5 w-1.5 rounded-full bg-status-success"
              aria-hidden="true"
            />
          </div>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
