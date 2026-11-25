import { BrandLogo } from "@/components/shared/BrandLogo";

const PRODUCT_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Account Management", href: "#features" },
  { label: "Fund Transfers", href: "#features" },
  { label: "Loan Management", href: "#features" },
] as const;

const COMPANY_LINKS = [
  { label: "About", href: "#about" },
  { label: "Security", href: "#security" },
  { label: "Contact", href: "#contact" },
] as const;

const RESOURCE_LINKS = [
  { label: "FAQ", href: "#faq" },
  { label: "Privacy Policy", href: "#security" },
  { label: "Terms & Conditions", href: "#security" },
] as const;

export function LandingFooter() {
  return (
    <footer
      id="contact"
      aria-label="Site Footer"
      className="bg-background-secondary pt-14 pb-10 text-text-secondary"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 pb-12 md:grid-cols-12">
          {/* Brand Column */}
          <div className="md:col-span-5">
            <BrandLogo href="#home" />
            <p className="mt-4 max-w-sm text-xs leading-relaxed text-text-secondary">
              Next-generation digital banking system built for institutional
              clarity, multi-account management, atomic fund transfers, and
              role-verified financial safety.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-md border border-accent-border bg-accent-subtle px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-accent">
              <span>TIER-1 BANKING ARCHITECTURE</span>
            </div>
          </div>

          {/* Product Column */}
          <div className="md:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              Product
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-text-secondary transition-colors hover:text-accent"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div className="md:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              Company
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-text-secondary transition-colors hover:text-accent"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Column */}
          <div className="md:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              Resources
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-text-secondary transition-colors hover:text-accent"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border-subtle pt-6 text-[11px] text-text-muted sm:flex-row">
          <p>
            © 2026 VaultEdge Digital Banking System. All rights reserved.
            Simulated fintech banking environment.
          </p>
          <div className="inline-flex items-center gap-2 font-mono text-[11px] text-text-secondary">
            <span className="h-2 w-2 rounded-full bg-status-success" />
            <span>Status: All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
