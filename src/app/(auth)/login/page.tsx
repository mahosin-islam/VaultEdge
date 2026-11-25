import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/LoginForm";
import { getServerSessionUser } from "@/server/auth/session";
import { getDashboardRouteForRole } from "@/config/routes";

export const metadata: Metadata = {
  title: "Sign In — VaultEdge Digital Banking",
  description:
    "Securely sign in to access your unified VaultEdge digital banking accounts, execute real-time fund transfers, and monitor financial activities.",
};

const GATEWAY_PROTOCOLS = [
  {
    code: "PROTOCOL 01",
    description:
      "Session-level token management & automatic timeout protection.",
  },
  {
    code: "PROTOCOL 02",
    description: "Dual-authorized validation workflow for all fund movements.",
  },
  {
    code: "PROTOCOL 03",
    description: "Tamper-evident ledger logging on every interaction.",
  },
] as const;

export default async function LoginPage() {
  const existingUser = await getServerSessionUser();
  if (existingUser) {
    redirect(getDashboardRouteForRole(existingUser.role));
  }

  return (
    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-12">
      {/* Left Column: Zero-Trust Welcome & Institutional Gateway Terminal */}
      <div className="lg:col-span-7">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-border bg-accent-subtle px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
            <span
              className="h-1.5 w-1.5 rounded-full bg-accent"
              aria-hidden="true"
            />
            <span>ZERO-TRUST AUTHENTICATION</span>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
            NODE ID: 0x88F2-NY-CORE
          </span>
        </div>

        <h1 className="mt-5 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl lg:text-[2.85rem] lg:leading-[1.15]">
          Welcome Back to{" "}
          <span className="text-accent underline decoration-accent-border decoration-2 underline-offset-8">
            VaultEdge
          </span>
        </h1>

        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
          Securely sign in to access your unified digital banking accounts,
          execute real-time fund transfers, track financial activities, and
          review active facilities.
        </p>

        {/* Institutional Gateway Terminal Card (Matches Stitch Screenshot 2) */}
        <div className="mt-8 rounded-2xl border border-border bg-surface p-6 ve-elevated-shadow">
          {/* Terminal Header */}
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded border border-accent-border bg-accent-subtle text-xs text-accent">
                ▤
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-text-primary">
                INSTITUTIONAL GATEWAY TERMINAL
              </span>
            </div>
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-border-strong" />
              <span className="h-2 w-2 rounded-full bg-border-strong" />
              <span className="h-2 w-2 rounded-full bg-accent" />
            </div>
          </div>

          {/* Active TLS Status Pill */}
          <div className="mt-5">
            <div className="inline-flex items-center gap-2 rounded-md border border-status-info-border bg-status-info-bg px-3 py-1.5 font-mono text-[11px] font-semibold text-status-info">
              <span
                className="h-2 w-2 rounded-full bg-status-info"
                aria-hidden="true"
              />
              <span>TLS 1.3 Active • 256-Bit Cryptographic Session</span>
            </div>
          </div>

          {/* 3 Protocol Cards */}
          <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            {GATEWAY_PROTOCOLS.map((protocol) => (
              <div
                key={protocol.code}
                className="rounded-xl border border-border-subtle bg-surface-inner p-4"
              >
                <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-accent">
                  ✦ {protocol.code}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                  {protocol.description}
                </p>
              </div>
            ))}
          </div>

          {/* Terminal Footer Bar */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-4 font-mono text-[11px] text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="text-accent">🛡️</span>
              <span>Zero-Trust Architecture v4.9</span>
            </span>
            <span>
              LATENCY:{" "}
              <strong className="font-semibold text-status-success">
                12ms
              </strong>
            </span>
          </div>
        </div>

        {/* Bottom Footnote */}
        <div className="mt-6 flex items-center gap-2 text-xs text-text-muted">
          <span className="text-accent">✓</span>
          <span>
            Simulated institutional digital banking infrastructure. FDIC-insured
            equivalent asset separation protocols.
          </span>
        </div>
      </div>

      {/* Right Column: Sign In Card */}
      <div className="lg:col-span-5">
        <LoginForm />
      </div>
    </div>
  );
}
