interface WorkflowStep {
  stepNumber: string;
  title: string;
  description: string;
}

const WORKFLOW_STEPS: readonly WorkflowStep[] = [
  {
    stepNumber: "01",
    title: "Create Your Account",
    description:
      "Register with verified identity parameters or onboard through bank staff verification with multi-factor security protections.",
  },
  {
    stepNumber: "02",
    title: "Manage Your Bank Accounts",
    description:
      "Open dedicated Savings, Current, or Business accounts and switch seamlessly across balances from a unified console.",
  },
  {
    stepNumber: "03",
    title: "Transfer & Manage Money",
    description:
      "Execute intra-bank transfers, submit deposit or withdrawal requests, and apply for structured loan facilities with PIN safeguards.",
  },
  {
    stepNumber: "04",
    title: "Track Your Activities",
    description:
      "Monitor real-time analytics, filter full transaction ledgers, download official PDF receipts, and export account statements.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="border-b border-border-subtle py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Centered Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-border bg-accent-subtle px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            <span>Simple Workflow</span>
          </div>
          <h2
            id="how-it-works-heading"
            className="mt-4 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl"
          >
            How VaultEdge Works
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary sm:text-base">
            Four streamlined steps from account onboarding to complete
            institutional control.
          </p>
        </div>

        {/* 4 Step Cards */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW_STEPS.map((step) => (
            <div
              key={step.stepNumber}
              className="group relative flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent-border hover:bg-surface-hover ve-card-shadow"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold tracking-widest text-accent">
                    {step.stepNumber}
                  </span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-inner text-xs font-semibold text-text-secondary transition-colors group-hover:border-accent-border group-hover:text-accent">
                    ✦
                  </span>
                </div>
                <h3 className="mt-6 text-base font-semibold text-text-primary">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-xs leading-relaxed text-text-secondary">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
