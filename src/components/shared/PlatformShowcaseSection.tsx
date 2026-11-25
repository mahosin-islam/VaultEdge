export function PlatformShowcaseSection() {
  return (
    <section
      id="about"
      aria-labelledby="showcase-heading"
      className="border-b border-border-subtle py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Centered Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-border bg-accent-subtle px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            <span>Role-Based Architecture</span>
          </div>
          <h2
            id="showcase-heading"
            className="mt-4 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl"
          >
            One Platform. Three Powerful Experiences.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary sm:text-base">
            Tailored operational workspaces engineered specifically for every
            stakeholder in the banking ecosystem.
          </p>
        </div>

        {/* 3 Role Portal Preview Cards */}
        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Card 1: Admin Command Center */}
          <article className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent-border ve-card-shadow">
            <div>
              <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  <h3 className="text-sm font-semibold text-text-primary">
                    Admin Command Center
                  </h3>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  ROLE: SYSTEM_ADMIN
                </span>
              </div>

              {/* Inner Console Widget */}
              <div className="mt-5 rounded-xl border border-border-subtle bg-surface-inner p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  Total Bank Liquidity Pool
                </p>
                <p className="mt-1 font-mono text-2xl font-bold text-accent">
                  $18,450,210.00
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[11px]">
                  <span className="text-text-secondary">
                    Active Accounts: 4,218
                  </span>
                  <span className="font-semibold text-status-success">
                    ▲ +12.4%
                  </span>
                </div>

                <div className="mt-4 space-y-2 border-t border-border-subtle pt-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">
                      Pending Loan Decisions
                    </span>
                    <span className="rounded border border-accent-border bg-accent-subtle px-2 py-0.5 font-mono text-[10px] font-semibold text-accent">
                      08 REVIEW
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">
                      Customer KYC Status
                    </span>
                    <span className="rounded border border-status-info-border bg-status-info-bg px-2 py-0.5 font-mono text-[10px] font-semibold text-status-info">
                      99.4% VERIFIED
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">
                      System Limit Enforcement
                    </span>
                    <span className="font-mono text-[10px] font-semibold text-status-success">
                      ENFORCED
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-5 text-xs leading-relaxed text-text-secondary">
              Full platform analytics, customer activation, account freeze &amp;
              limit controls, and final loan approval &amp; disbursement
              authority.
            </p>
          </article>

          {/* Card 2: Bank Staff Portal */}
          <article className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent-border ve-card-shadow">
            <div>
              <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-status-info" />
                  <h3 className="text-sm font-semibold text-text-primary">
                    Bank Staff Portal
                  </h3>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  ROLE: BANK_STAFF
                </span>
              </div>

              {/* Inner Console Widget */}
              <div className="mt-5 rounded-xl border border-border-subtle bg-surface-inner p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Active Queue Operations
                  </p>
                  <span className="h-2 w-2 rounded-full bg-accent" />
                </div>
                <p className="mt-1 font-mono text-2xl font-bold text-text-primary">
                  23 Actions Logged
                </p>
                <p className="mt-0.5 text-[11px] text-text-secondary">
                  04 pending customer verifications
                </p>

                <div className="mt-4 space-y-2 border-t border-border-subtle pt-3">
                  <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold text-text-primary">
                        Deposit #DEP-4920
                      </p>
                      <p className="text-[10px] text-text-muted">
                        Customer ID • Verified KYC
                      </p>
                    </div>
                    <span className="rounded bg-btn-primary px-2 py-0.5 text-[10px] font-bold text-btn-primary-text">
                      REVIEW
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold text-text-primary">
                        Loan File #LN-1108
                      </p>
                      <p className="text-[10px] text-text-muted">
                        Note Attached • Forwarded
                      </p>
                    </div>
                    <span className="rounded border border-status-info-border bg-status-info-bg px-2 py-0.5 text-[10px] font-semibold text-status-info">
                      NOTED
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-5 text-xs leading-relaxed text-text-secondary">
              Streamlined operational desk for customer registration, KYC
              verification, transaction monitoring, suspicious activity
              flagging, and loan review notes.
            </p>
          </article>

          {/* Card 3: Customer Portal */}
          <article className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent-border ve-card-shadow">
            <div>
              <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-status-success" />
                  <h3 className="text-sm font-semibold text-text-primary">
                    Customer Portal
                  </h3>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  ROLE: RETAIL_CLIENT
                </span>
              </div>

              {/* Inner Console Widget */}
              <div className="mt-5 rounded-xl border border-border-subtle bg-surface-inner p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  Active Account View
                </p>
                <p className="mt-1 font-mono text-2xl font-bold text-text-primary">
                  $64,920.00
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded border border-accent-border bg-accent-subtle px-2 py-0.5 text-[10px] font-semibold text-accent">
                    SAVINGS •••4821
                  </span>
                  <span className="text-[10px] text-text-muted">
                    Instant Switch Ready
                  </span>
                </div>

                <div className="mt-4 border-t border-border-subtle pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Quick Execution
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-center">
                      <p className="text-xs font-semibold text-accent">↗</p>
                      <p className="mt-0.5 text-[11px] font-medium text-text-primary">
                        Fund Transfer
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-center">
                      <p className="text-xs font-semibold text-accent">⇩</p>
                      <p className="mt-0.5 text-[11px] font-medium text-text-primary">
                        Statement PDF
                      </p>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-text-muted">
                    <span>Transaction PIN Guard</span>
                    <span className="font-mono text-status-success">
                      ● ACTIVE (4-DIGIT)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-5 text-xs leading-relaxed text-text-secondary">
              Effortless personal banking with multi-account switching,
              PIN-secured transfers, deposit/withdrawal requests, loan tracking,
              and PDF statements.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
