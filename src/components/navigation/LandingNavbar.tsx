import Link from "next/link";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { MobileNavMenu, type NavItem } from "@/components/navigation/MobileNavMenu";
import { getServerSessionUser } from "@/server/auth/session";
import { getDashboardRouteForRole } from "@/config/routes";

const LANDING_NAV_ITEMS: readonly NavItem[] = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Security", href: "#security" },
  { label: "About", href: "#about" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
] as const;

export async function LandingNavbar() {
  const currentUser = await getServerSessionUser();
  const dashboardHref = currentUser
    ? getDashboardRouteForRole(currentUser.role)
    : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-background-glass backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo -> scrolls to #home */}
        <BrandLogo href="#home" />

        {/* Desktop Anchor Navigation */}
        <nav
          aria-label="Primary Landing Navigation"
          className="hidden lg:flex lg:items-center lg:gap-7"
        >
          {LANDING_NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-text-secondary transition-colors hover:text-accent focus:outline-none focus-visible:text-accent"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Auth Actions / Role-Aware Dashboard Link & Theme Toggle */}
        <div className="flex items-center gap-3">
          {dashboardHref && currentUser ? (
            <Link
              href={dashboardHref}
              className="hidden sm:inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-btn-primary px-4 text-sm font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span>Dashboard</span>
              <span className="rounded bg-background/15 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider">
                {currentUser.role}
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex h-10 items-center justify-center rounded-lg px-3.5 text-sm font-semibold text-text-primary transition-colors hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-btn-primary px-4 text-sm font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span>Get Started</span>
                <span aria-hidden="true">→</span>
              </Link>
            </>
          )}

          <ThemeToggle />

          <MobileNavMenu
            items={LANDING_NAV_ITEMS}
            dashboardHref={dashboardHref}
            userRole={currentUser?.role ?? null}
          />
        </div>
      </div>
    </header>
  );
}
