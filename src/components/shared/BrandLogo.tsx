export interface BrandLogoProps {
  href?: string;
}

export function BrandLogo({ href = "#home" }: BrandLogoProps) {
  return (
    <a
      href={href}
      aria-label="VaultEdge Digital Banking - Go to top"
      className="group inline-flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
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
          <path d="M12 2 4 5.5v6.2c0 5.3 3.4 9.9 8 11.3 4.6-1.4 8-6 8-11.3V5.5L12 2Z" />
          <path d="m9 11.5 2.2 2.2L15.5 9.5" />
        </svg>
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-base font-bold tracking-tight text-text-primary">
          Vault<span className="text-accent">Edge</span>
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
          Digital Banking
        </span>
      </span>
    </a>
  );
}
