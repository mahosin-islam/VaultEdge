import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/features/auth/RegisterForm";
import { getServerSessionUser } from "@/server/auth/session";
import { getDashboardRouteForRole } from "@/config/routes";

export const metadata: Metadata = {
  title: "Create Your Account — VaultEdge Digital Banking",
  description:
    "Start your financial journey with VaultEdge. Open your secure Customer account with multi-account management and zero-latency intra-bank transfers.",
};

const ONBOARDING_HIGHLIGHTS = [
  {
    title: "Instant Customer Onboarding",
    description:
      "Seamless KYC identity and document validation in under 90 seconds",
    icon: "shield",
  },
  {
    title: "Multi-Tier Savings & Current Accounts",
    description:
      "Unify global currency reserves and high-yield vaults in one console",
    icon: "wallet",
  },
  {
    title: "End-to-End Cryptographic Ledger",
    description:
      "Deterministic mathematical proof and immutable state auditing",
    icon: "lock",
  },
] as const;

export default async function RegisterPage() {
  const existingUser = await getServerSessionUser();
  if (existingUser) {
    redirect(getDashboardRouteForRole(existingUser.role));
  }

  return (
    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-12">
      {/* Left Column: Brand Value & Obsidian Tier Virtual Card */}
      <div className="lg:col-span-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent-border bg-accent-subtle px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          <span>PERSONAL BANKING ACCESS</span>
        </div>

        <h1 className="mt-5 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
          Start Your Financial{" "}
          <span className="font-serif italic font-semibold text-accent">
            Journey
          </span>
        </h1>

        <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base">
          Experience modern banking with instant multi-account management, zero
          intra-bank transfer latency, transparent loan schedules, and
          real-time cryptographic audit logs.
        </p>

        {/* Obsidian Tier Virtual Card Visual (Matches Stitch Screenshot 1) */}
        <div className="mt-8 max-w-md rounded-2xl border border-border bg-surface p-6 ve-elevated-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* EMV Gold Chip */}
              <div className="flex h-8 w-11 items-center justify-center rounded-md border border-accent-border bg-accent-subtle">
                <div className="h-5 w-7 rounded-sm border border-accent-border" />
              </div>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-accent-border text-[10px] text-accent">
                )))
              </span>
            </div>
            <span className="text-sm font-bold tracking-wider text-text-primary">
              VAULT<span className="text-accent">EDGE</span>
            </span>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <p className="font-mono text-base font-semibold tracking-[0.22em] text-text-primary sm:text-lg">
              4190 •••• •••• 8831
            </p>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
              OBSIDIAN TIER
            </span>
          </div>

          <div className="mt-7 flex items-end justify-between border-t border-border-subtle pt-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted">
                CARDHOLDER
              </p>
              <p className="mt-0.5 font-mono text-xs font-semibold uppercase tracking-wider text-text-primary">
                NEW CUSTOMER
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted">
                VALID THRU
              </p>
              <p className="mt-0.5 font-mono text-xs font-semibold text-text-primary">
                10/31
              </p>
            </div>
          </div>
        </div>

        {/* 3 Feature Highlight Rows */}
        <div className="mt-7 max-w-lg space-y-3">
          {ONBOARDING_HIGHLIGHTS.map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3.5 transition-colors hover:border-accent-border"
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent-border bg-accent-subtle text-accent">
                {item.icon === "shield" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                )}
                {item.icon === "wallet" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                )}
                {item.icon === "lock" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
              </span>
              <div>
                <h2 className="text-xs font-semibold text-text-primary sm:text-sm">
                  {item.title}
                </h2>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Security Footnote */}
        <div className="mt-6 flex items-center gap-2 font-mono text-xs text-text-muted">
          <span className="text-accent">🛡️</span>
          <span>
            Protected by hardware PIN verification and zero-trust protocol.
          </span>
        </div>
      </div>

      {/* Right Column: Registration Form Card */}
      <div className="lg:col-span-6">
        <RegisterForm />
      </div>
    </div>
  );
}
