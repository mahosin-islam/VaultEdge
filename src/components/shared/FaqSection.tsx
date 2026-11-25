import { FaqAccordion, type FaqItem } from "@/components/shared/FaqAccordion";

const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: "What is VaultEdge?",
    answer:
      "VaultEdge is an advanced digital banking management platform designed to unify account management, atomic intra-bank fund transfers, deposit and withdrawal workflows, loan lifecycle tracking, and real-time financial analytics across Customer, Bank Staff, and Admin portals.",
  },
  {
    question: "How do I create an account?",
    answer:
      "Click 'Get Started' to register your profile, or visit a Bank Staff desk for assisted customer onboarding and KYC verification. Once verified, you can immediately access your personalized banking dashboard.",
  },
  {
    question: "Can I manage multiple bank accounts?",
    answer:
      "Yes. VaultEdge supports Savings, Current, and Business accounts under a single customer profile. You can switch between active accounts instantaneously from your dashboard and transfer funds between your own accounts.",
  },
  {
    question: "How are fund transfers secured?",
    answer:
      "Every transfer is protected by server-side balance verification, account status checks, configurable transaction limits, mandatory Transaction PIN validation, and atomic database execution so funds are never deducted without crediting the recipient.",
  },
  {
    question: "How do I apply for a loan?",
    answer:
      "From your Customer Portal, submit a loan application with your requested amount, duration, income, and purpose. Bank Staff review and annotate the application before forwarding it to an Admin for final approval and automatic ledger disbursement.",
  },
  {
    question: "How are deposits and withdrawals processed?",
    answer:
      "Customers submit deposit or withdrawal requests specifying the target account, amount, and description. Requests enter a structured Pending state and are processed into your account balance upon Admin or Staff verification.",
  },
] as const;

export function FaqSection() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="border-b border-border-subtle py-20 lg:py-24"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Centered Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-border bg-accent-subtle px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            <span>Clarifications</span>
          </div>
          <h2
            id="faq-heading"
            className="mt-4 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl"
          >
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary sm:text-base">
            Everything you need to know about the VaultEdge digital banking
            platform and how our ecosystem operates.
          </p>
        </div>

        {/* Interactive Accordion */}
        <div className="mt-12">
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </div>
    </section>
  );
}
