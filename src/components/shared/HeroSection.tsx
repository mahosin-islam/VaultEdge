import Link from "next/link";

interface QuickHighlightItem {
  title: string;
  description: string;
  icon: "accounts" | "shield" | "activity" | "loan";
}

const QUICK_HIGHLIGHTS: readonly QuickHighlightItem[] = [
  {
    title: "Multiple Account Management",
    description:
      "Unify and reconcile your Savings, Current, and Business accounts in a single console with seamless instant account switching.",
    icon: "accounts",
  },
  {
    title: "Secure Fund Transfers",
    description:
      "Perform intra-bank transfers with dynamic server-side balance checks, PIN authentication, atomic settlement guarantees, and instant receipts.",
    icon: "shield",
  },
  {
    title: "Financial Activity Tracking",
    description:
      "Track historical credits and debits, searchable audit trails, analytic breakdowns, and exportable high-resolution statements.",
    icon: "activity",
  },
  {
    title: "Loan Management",
    description:
      "Transparent credit application workflows, automated EMI schedules, full payoff tracking, and rapid decision pipelines.",
    icon: "loan",
  },
] as const;

const RECENT_HERO_TRANSACTIONS = [
  {
    id: "TXN-89412",
    title: "Direct Wire Credit",
    meta: "Today, 14:22 • Completed",
    amount: "+$14,500.00",
    positive: true,
  },
  {
    id: "TXN-89398",
    title: "Internal Settlement",
    meta: "Yesterday, 18:05 • Completed",
    amount: "-$2,840.00",
    positive: false,
  },
  {
    id: "TXN-89354",
    title: "Automated Loan Disbursement",
    meta: "Oct 19, 09:15 • Completed",
    amount: "+$8,200.00",
    positive: true,
  },
] as const;

function HighlightIcon({ type }: { type: QuickHighlightItem["icon"] }) {
  switch (type) {
    case "accounts":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <rect width="18" height="14" x="3" y="5" rx="2" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
      );
    case "shield":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "activity":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      );
    case "loan":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
  }
}

export function HeroSection() {
  return (
    <section
      id="home"
      aria-labelledby="hero-heading"
      className="ve-hero-backdrop relative overflow-hidden border-b border-border-subtle pt-12 pb-20 lg:pt-16 lg:pb-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Hero Two-Column Layout */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Left Column: Brand Value Proposition */}
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-border bg-accent-subtle px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
              <span>Next-Gen Digital Banking</span>
            </div>

            <h1
              id="hero-heading"
              className="mt-6 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-[3.35rem] lg:leading-[1.12]"
            >
              Bank Smarter.
              <span className="block text-accent">Manage Your</span>
              <span className="block">Financial Future.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
              Experience a smarter way to manage your accounts, transfer funds,
              track transactions, and stay in control of your financial
              activities — all in one secure platform.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-btn-primary px-6 text-sm font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span>Get Started</span>
                <span aria-hidden="true">→</span>
              </Link>
              <a
                href="#features"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-btn-secondary-border bg-btn-secondary px-6 text-sm font-semibold text-btn-secondary-text transition-colors hover:border-accent hover:bg-btn-secondary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Explore Features
              </a>
            </div>

            {/* Trust Footnote */}
            <div className="mt-8 flex items-start gap-2.5 border-t border-border-subtle pt-5 text-xs text-text-muted">
              <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-accent">
                ✓
              </span>
              <p>
                Engineered with enterprise-grade multi-role verification, atomic
                ledger accuracy, and real-time balance validation.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Executive Portfolio Preview Card */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 ve-elevated-shadow">
              {/* Top Console Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-accent-border bg-accent-subtle text-accent">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="M12 2 4 5.5v6.2c0 5.3 3.4 9.9 8 11.3 4.6-1.4 8-6 8-11.3V5.5L12 2Z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                      VaultEdge Console
                    </p>
                    <p className="text-sm font-semibold text-text-primary">
                      Executive Holdings
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-status-success-border bg-status-success-bg px-3 py-1 text-[11px] font-medium text-status-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
                  <span>Active • Multi-Account</span>
                </span>
              </div>

              {/* Balances Row */}
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border-subtle bg-surface-inner p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                      Total Balance
                    </span>
                    <span className="rounded bg-status-success-bg px-1.5 py-0.5 text-[10px] font-semibold text-status-success">
                      +4.8%
                    </span>
                  </div>
                  <p className="mt-1.5 font-mono text-2xl font-bold tracking-tight text-text-primary">
                    $128,450.00
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                      Savings •••4821
                    </span>
                    <span className="rounded border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                      Current •••9014
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-border-subtle bg-surface-inner p-4">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                    Available Liquid
                  </span>
                  <p className="mt-1.5 font-mono text-2xl font-bold tracking-tight text-accent">
                    $94,220.50
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded border border-accent-border bg-accent-subtle px-2 py-0.5 text-[10px] font-semibold text-accent">
                      Transfers
                    </span>
                    <span className="rounded border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                      Deposits
                    </span>
                    <span className="rounded border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                      Statements
                    </span>
                  </div>
                </div>
              </div>

              {/* Virtual Banking Card Visual */}
              <div className="mt-4 rounded-xl border border-border bg-background-secondary p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold tracking-tight text-text-primary">
                      Vault<span className="text-accent">Edge</span>
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                      Commercial Tier
                    </span>
                  </div>
                  <span className="rounded-full border border-accent-border bg-accent-subtle px-2.5 py-0.5 text-[10px] font-semibold text-accent">
                    ● VERIFIED
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="h-6 w-9 rounded border border-accent-border bg-accent-subtle" />
                  <span className="text-xs text-text-muted">)))</span>
                </div>

                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="font-mono text-xs tracking-[0.22em] text-text-secondary">
                      ••••  ••••  ••••  4829
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-text-muted">
                      Primary Treasury Account
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-text-muted">
                      EXP
                    </p>
                    <p className="font-mono text-xs font-semibold text-text-primary">
                      08/29
                    </p>
                  </div>
                </div>
              </div>

              {/* Monthly Inflow / Outflow Mini Stats */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border-subtle bg-surface-inner p-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Monthly Inflow
                  </p>
                  <p className="mt-1 font-mono text-sm font-bold text-status-success">
                    +$32,480.00
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface">
                    <div className="h-full w-3/4 rounded-full bg-accent" />
                  </div>
                </div>
                <div className="rounded-xl border border-border-subtle bg-surface-inner p-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Monthly Outflow
                  </p>
                  <p className="mt-1 font-mono text-sm font-bold text-text-primary">
                    -$14,120.00
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface">
                    <div className="h-full w-2/5 rounded-full bg-text-secondary" />
                  </div>
                </div>
              </div>

              {/* Live Settlement Stream */}
              <div className="mt-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                  Live Settlement Stream
                </p>
                <div className="mt-2.5 divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface-inner">
                  {RECENT_HERO_TRANSACTIONS.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between px-3.5 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface text-xs font-semibold text-accent">
                          {tx.positive ? "↙" : "↗"}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-text-primary">
                            {tx.title}
                          </p>
                          <p className="text-[10px] text-text-muted">
                            {tx.meta}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-mono text-xs font-semibold ${
                          tx.positive
                            ? "text-status-success"
                            : "text-text-primary"
                        }`}
                      >
                        {tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Card Core Pillars Bar beneath Hero */}
        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {QUICK_HIGHLIGHTS.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent-border hover:bg-surface-hover ve-card-shadow"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-accent-border bg-accent-subtle text-accent">
                <HighlightIcon type={item.icon} />
              </span>
              <h2 className="mt-4 text-base font-semibold text-text-primary">
                {item.title}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
