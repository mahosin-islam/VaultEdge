import type {
  AccountDistributionPoint,
  LoanApprovalStatPoint,
} from "@/types/admin.types";
import { formatCurrencyCompact } from "@/utils/formatters";

interface AdminDistributionCardsProps {
  accountDistribution: AccountDistributionPoint[];
  loanApprovalStatistics: LoanApprovalStatPoint[];
}

export function AdminDistributionCards({
  accountDistribution,
  loanApprovalStatistics,
}: AdminDistributionCardsProps) {
  // 1. Account Tier Allocation calculations
  const findTier = (type: "SAVINGS" | "CURRENT" | "BUSINESS") =>
    accountDistribution.find((d) => d.accountType === type);

  const savingsItem = findTier("SAVINGS");
  const currentItem = findTier("CURRENT");
  const businessItem = findTier("BUSINESS");

  const savingsBal = Number(savingsItem?.totalBalance ?? 0);
  const currentBal = Number(currentItem?.totalBalance ?? 0);
  const businessBal = Number(businessItem?.totalBalance ?? 0);
  const totalTierBalance = savingsBal + currentBal + businessBal;

  const savingsCount = savingsItem?.count ?? 0;
  const currentCount = currentItem?.count ?? 0;
  const businessCount = businessItem?.count ?? 0;
  const totalTierCount = savingsCount + currentCount + businessCount;

  const computeTierPct = (bal: number, count: number): number => {
    if (totalTierBalance > 0) {
      return Math.round((bal / totalTierBalance) * 100);
    }
    if (totalTierCount > 0) {
      return Math.round((count / totalTierCount) * 100);
    }
    return 0;
  };

  const savingsPct = computeTierPct(savingsBal, savingsCount);
  const currentPct = computeTierPct(currentBal, currentCount);
  const businessPct =
    totalTierBalance > 0 || totalTierCount > 0
      ? Math.max(0, 100 - savingsPct - currentPct)
      : 0;

  // 2. Loan Risk & Approval Velocity calculations
  const sumLoanStatusCount = (statuses: readonly string[]) =>
    loanApprovalStatistics
      .filter((s) => statuses.includes(s.status))
      .reduce((acc, s) => acc + s.count, 0);

  const approvedCount = sumLoanStatusCount([
    "APPROVED",
    "ACTIVE",
    "COMPLETED",
  ]);
  const pendingReviewCount = sumLoanStatusCount(["PENDING", "UNDER_REVIEW"]);
  const rejectedCount = sumLoanStatusCount(["REJECTED"]);
  const totalLoansCount = approvedCount + pendingReviewCount + rejectedCount;

  const approvedPct =
    totalLoansCount > 0
      ? Math.round((approvedCount / totalLoansCount) * 100)
      : 0;
  const reviewPct =
    totalLoansCount > 0
      ? Math.round((pendingReviewCount / totalLoansCount) * 100)
      : 0;
  const rejectedPct =
    totalLoansCount > 0
      ? Math.max(0, 100 - approvedPct - reviewPct)
      : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Card: Account Tier Allocation */}
      <article className="rounded-2xl border border-border bg-surface p-6 ve-card-shadow">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary">
            Account Tier Allocation
          </h2>
          <span className="font-mono text-xs text-text-muted">⊕</span>
        </div>

        {/* Multi-Segment Stacked Bar */}
        <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-surface-inner">
          {totalTierBalance > 0 || totalTierCount > 0 ? (
            <>
              <div
                style={{ width: `${savingsPct}%` }}
                className="bg-accent transition-all duration-300"
                title={`Savings: ${savingsPct}%`}
              />
              <div
                style={{ width: `${currentPct}%` }}
                className="bg-status-info transition-all duration-300"
                title={`Current: ${currentPct}%`}
              />
              <div
                style={{ width: `${businessPct}%` }}
                className="bg-status-success transition-all duration-300"
                title={`Business: ${businessPct}%`}
              />
            </>
          ) : (
            <div className="w-full bg-border" />
          )}
        </div>

        {/* 3 Tier Breakdown Rows */}
        <div className="mt-5 space-y-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-text-secondary">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span>Institutional Savings Vaults</span>
            </span>
            <span className="font-mono font-semibold text-text-primary">
              {savingsPct}% ({formatCurrencyCompact(savingsBal)})
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-text-secondary">
              <span className="h-2 w-2 rounded-full bg-status-info" />
              <span>Corporate Current Operating</span>
            </span>
            <span className="font-mono font-semibold text-text-primary">
              {currentPct}% ({formatCurrencyCompact(currentBal)})
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-text-secondary">
              <span className="h-2 w-2 rounded-full bg-status-success" />
              <span>Business &amp; Prime Treasury</span>
            </span>
            <span className="font-mono font-semibold text-text-primary">
              {businessPct}% ({formatCurrencyCompact(businessBal)})
            </span>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="mt-5 flex items-center justify-between border-t border-border-subtle pt-3.5 font-mono text-[10px] text-text-muted">
          <span>Reserve Depository:</span>
          <span className="font-semibold text-text-secondary">
            100% FDIC &amp; Basel III Tier 1
          </span>
        </div>
      </article>

      {/* Bottom Card: Loan Risk & Approval Velocity */}
      <article className="rounded-2xl border border-border bg-surface p-6 ve-card-shadow">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary">
            Loan Risk &amp; Approval Velocity
          </h2>
          <span className="rounded border border-border bg-surface-inner px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            AUDIT
          </span>
        </div>

        {/* 3 Horizontal Progress Bars */}
        <div className="mt-5 space-y-4">
          {/* 1. Approved / Active */}
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">
                Approved &amp; Active Facilities ({approvedCount})
              </span>
              <span className="font-mono font-bold text-text-primary">
                {approvedPct}%
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-inner">
              <div
                style={{ width: `${approvedPct}%` }}
                className="h-full rounded-full bg-accent transition-all duration-300"
              />
            </div>
          </div>

          {/* 2. Under Direct Underwriting */}
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">
                Under Direct Underwriting ({pendingReviewCount})
              </span>
              <span className="font-mono font-bold text-status-info">
                {reviewPct}%
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-inner">
              <div
                style={{ width: `${reviewPct}%` }}
                className="h-full rounded-full bg-status-info transition-all duration-300"
              />
            </div>
          </div>

          {/* 3. Risk-Adjusted Rejections */}
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">
                Risk-Adjusted Rejections ({rejectedCount})
              </span>
              <span className="font-mono font-bold text-status-danger">
                {rejectedPct}%
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-inner">
              <div
                style={{ width: `${rejectedPct}%` }}
                className="h-full rounded-full bg-status-danger transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="mt-5 flex items-center justify-between border-t border-border-subtle pt-3.5 font-mono text-[10px] text-text-muted">
          <span>Total Dossiers: {totalLoansCount}</span>
          <span>Loss Ratio: 0.00%</span>
        </div>
      </article>
    </div>
  );
}
