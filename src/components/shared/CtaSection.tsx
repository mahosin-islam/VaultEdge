import Link from "next/link";

export function CtaSection() {
  return (
    <section
      aria-labelledby="cta-heading"
      className="border-b border-border-subtle py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="ve-cta-surface rounded-3xl border border-border bg-surface px-6 py-14 text-center sm:px-12 sm:py-16 lg:py-20 ve-elevated-shadow">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-border bg-accent-subtle px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            <span>✦</span>
            <span>Join VaultEdge</span>
          </div>

          <h2
            id="cta-heading"
            className="mx-auto mt-5 max-w-2xl text-3xl font-bold tracking-tight text-text-primary sm:text-4xl lg:text-[2.65rem] lg:leading-tight"
          >
            Take Control of Your Financial World.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base">
            Bring your banking activities together with our modern digital
            banking experience engineered for precision, speed, and
            institutional-grade safety.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-btn-primary px-7 text-sm font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span>Get Started</span>
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-btn-secondary-border bg-btn-secondary px-7 text-sm font-semibold text-btn-secondary-text transition-colors hover:border-accent hover:bg-btn-secondary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Sign In
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-6 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="text-accent">✓</span>
              <span>Multi-Role Protected</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-accent">✓</span>
              <span>Instant Ledger Reconciliation</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
