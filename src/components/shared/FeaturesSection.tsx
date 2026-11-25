interface FeatureCardData {
  title: string;
  description: string;
  footerTag: string;
  icon: "account" | "transfer" | "deposit" | "loan" | "transaction";
}

const TOP_FEATURES: readonly FeatureCardData[] = [
  {
    title: "Bank Account Management",
    description:
      "Manage multiple account profiles effortlessly across dedicated balances, supporting Savings, Current, and Business accounts with clear status controls.",
    footerTag: "Savings • Current • Business Accounts",
    icon: "account",
  },
  {
    title: "Fund Transfers",
    description:
      "Transfer money between your own accounts or directly to another customer within the bank, enforced with verified PIN safeguards and instant settlement receipts.",
    footerTag: "Zero-Latency Atomic Verification",
    icon: "transfer",
  },
  {
    title: "Deposits & Withdrawals",
    description:
      "Submit balanced deposit and withdrawal requests with structured review workflows, enabling transparent reconciliation across all channels.",
    footerTag: "Staff & Admin Verified Approval Flow",
    icon: "deposit",
  },
] as const;

function FeatureIcon({ type }: { type: FeatureCardData["icon"] }) {
  switch (type) {
    case "account":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
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
      );
    case "transfer":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M7 17 17 7" />
          <path d="M7 7h10v10" />
        </svg>
      );
    case "deposit":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
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
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case "transaction":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
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

export function FeaturesSection() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="border-b border-border-subtle py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-border bg-accent-subtle px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
            <span>●</span>
            <span>Core Capabilities</span>
          </div>
          <h2
            id="features-heading"
            className="mt-4 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl"
          >
            Everything You Need to Manage Your Banking.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary sm:text-base">
            A unified digital platform built for modern financial precision and
            effortless clarity.
          </p>
        </div>

        {/* Row 1: 3 Equal Feature Cards */}
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TOP_FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-7 transition-colors hover:border-accent-border hover:bg-surface-hover ve-card-shadow"
            >
              <div>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-accent-border bg-accent-subtle text-accent">
                  <FeatureIcon type={feature.icon} />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-text-primary">
                  {feature.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-text-secondary">
                  {feature.description}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 border-t border-border-subtle pt-4 text-xs font-semibold text-accent">
                <span>✦</span>
                <span>{feature.footerTag}</span>
              </div>
            </article>
          ))}
        </div>

        {/* Row 2: 2-Column Span Loan Management + 1-Column Transaction Transparency */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Loan Management (2 Columns on Desktop) */}
          <article className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-7 transition-colors hover:border-accent-border hover:bg-surface-hover lg:col-span-2 ve-card-shadow">
            <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-12">
              <div className="md:col-span-7">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-accent-border bg-accent-subtle text-accent">
                  <FeatureIcon type="loan" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-text-primary">
                  Loan Management
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-text-secondary">
                  Apply for structured credit facilities, track application
                  status from staff verification to admin approval, inspect
                  automated repayment schedules, and monitor remaining loan
                  balances in real time.
                </p>
              </div>

              {/* Embedded Active Loan Facility Mini-Widget */}
              <div className="md:col-span-5">
                <div className="rounded-xl border border-border bg-surface-inner p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                      Active Facility
                    </span>
                    <span className="rounded bg-status-success-bg px-2 py-0.5 text-[10px] font-semibold text-status-success">
                      Disbursed
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-xl font-bold text-text-primary">
                    $45,000.00
                  </p>
                  <p className="mt-0.5 text-[11px] text-accent">
                    Commercial Expansion Loan • 24 Months
                  </p>
                  <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-surface">
                    <div className="h-full w-2/3 rounded-full bg-accent" />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-text-muted">
                    <span>66% Repaid</span>
                    <span>Remaining: $15,300.00</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border-subtle pt-4 text-xs font-semibold text-accent">
              <span>✦ Instant Schedule Calculation</span>
              <span>•</span>
              <span>✦ Direct Disbursement Ledger Entry</span>
            </div>
          </article>

          {/* Transaction Transparency (1 Column) */}
          <article className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-7 transition-colors hover:border-accent-border hover:bg-surface-hover ve-card-shadow">
            <div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-accent-border bg-accent-subtle text-accent">
                <FeatureIcon type="transaction" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-text-primary">
                Transaction Transparency
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-text-secondary">
                Access complete immutable ledgers with instant ID search, date
                and type filtering, downloadable transaction receipts, and
                account statements in PDF or CSV.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 border-t border-border-subtle pt-4 text-xs font-semibold text-accent">
              <span>✦</span>
              <span>Immutable Audit Trail & PDF Receipts</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
