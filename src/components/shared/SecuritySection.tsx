interface SecurityFeature {
  title: string;
  description: string;
  icon: "auth" | "rbac" | "pin" | "server" | "transfer" | "history";
}

const SECURITY_FEATURES: readonly SecurityFeature[] = [
  {
    title: "Secure Authentication",
    description:
      "Hardened JWT session management with encrypted credentials, strict session validation, and zero client-exposed secrets.",
    icon: "auth",
  },
  {
    title: "Role-Based Access Control (RBAC)",
    description:
      "Granular permission enforcement isolating Admin, Bank Staff, and Customer capabilities at the API and route middleware layers.",
    icon: "rbac",
  },
  {
    title: "Transaction PIN Verification",
    description:
      "Mandatory server-verified cryptographic PIN challenge required prior to executing any outbound fund transfer operation.",
    icon: "pin",
  },
  {
    title: "Server-Side Validation",
    description:
      "Zero client trust architecture: balances, account ownership, status flags, and transaction limits are verified directly on the server.",
    icon: "server",
  },
  {
    title: "Protected Transfer Operations",
    description:
      "Atomic database transaction execution guarantees money is never deducted from a sender without crediting the recipient.",
    icon: "transfer",
  },
  {
    title: "Transaction History Preservation",
    description:
      "Tamper-evident ledger records preserve every credit, debit, fee, and status transition with unique transaction reference IDs.",
    icon: "history",
  },
] as const;

function SecurityIcon({ type }: { type: SecurityFeature["icon"] }) {
  switch (type) {
    case "auth":
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
          <circle cx="7.5" cy="15.5" r="5.5" />
          <path d="m21 2-9.6 9.6" />
          <path d="m15.5 7.5 3 3L22 7l-3-3" />
        </svg>
      );
    case "rbac":
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
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "pin":
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
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    case "server":
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
          <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
          <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
          <line x1="6" x2="6.01" y1="6" y2="6" />
          <line x1="6" x2="6.01" y1="18" y2="18" />
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
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "history":
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
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M12 7v5l4 2" />
        </svg>
      );
  }
}

export function SecuritySection() {
  return (
    <section
      id="security"
      aria-labelledby="security-heading"
      className="border-b border-border-subtle py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-border bg-accent-subtle px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
            <span>🛡️</span>
            <span>Zero-Trust Defense</span>
          </div>
          <h2
            id="security-heading"
            className="mt-4 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl"
          >
            Your Financial Security Matters.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary sm:text-base">
            Architected with strict financial validation rules, multi-layer
            authorization safeguards, and guaranteed atomic ledger integrity.
          </p>
        </div>

        {/* 6-Card Grid (3x2 on desktop) */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SECURITY_FEATURES.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent-border hover:bg-surface-hover ve-card-shadow"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-accent-border bg-accent-subtle text-accent">
                <SecurityIcon type={item.icon} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-text-primary">
                {item.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
