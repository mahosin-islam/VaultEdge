// ============================================================================
// VaultEdge — Admin Overview & Analytics Service
// Computes real database-driven KPIs, recent activity, and time-series /
// distribution charts required by docs/REQUIREMENTS.md (§2.1 & §3.6).
// ============================================================================

import { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { formatDecimal } from "@/server/utils/banking";
import type { AdminOverviewQueryInput } from "@/server/validators/admin.schema";

interface MonthBucket {
  monthKey: string; // YYYY-MM
  label: string; // e.g., "Nov 2026"
  transactionCount: number;
  transactionVolume: Prisma.Decimal;
  depositVolume: Prisma.Decimal;
  withdrawalVolume: Prisma.Decimal;
  transferVolume: Prisma.Decimal;
  loanDisbursementVolume: Prisma.Decimal;
  loanRepaymentVolume: Prisma.Decimal;
  newCustomersCount: number;
  newAccountsCount: number;
}

const MONTH_SHORT_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function buildTrailingMonthBuckets(monthsCount: number, endRefDate: Date) {
  const buckets: MonthBucket[] = [];
  const bucketMap = new Map<string, MonthBucket>();

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(
      Date.UTC(endRefDate.getUTCFullYear(), endRefDate.getUTCMonth() - i, 1)
    );
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const monthKey = `${y}-${String(m + 1).padStart(2, "0")}`;
    const label = `${MONTH_SHORT_NAMES[m]} ${y}`;

    const bucket: MonthBucket = {
      monthKey,
      label,
      transactionCount: 0,
      transactionVolume: new Prisma.Decimal("0.00"),
      depositVolume: new Prisma.Decimal("0.00"),
      withdrawalVolume: new Prisma.Decimal("0.00"),
      transferVolume: new Prisma.Decimal("0.00"),
      loanDisbursementVolume: new Prisma.Decimal("0.00"),
      loanRepaymentVolume: new Prisma.Decimal("0.00"),
      newCustomersCount: 0,
      newAccountsCount: 0,
    };

    buckets.push(bucket);
    bucketMap.set(monthKey, bucket);
  }

  return { buckets, bucketMap };
}

function getMonthKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function getAdminAnalyticsReport(query: AdminOverviewQueryInput) {
  const endRef = query.endDate ? new Date(query.endDate) : new Date();
  const { buckets, bucketMap } = buildTrailingMonthBuckets(
    query.months,
    endRef
  );

  const earliestBucketDate = new Date(
    Date.UTC(
      endRef.getUTCFullYear(),
      endRef.getUTCMonth() - (query.months - 1),
      1
    )
  );

  const rangeStart = query.startDate
    ? new Date(query.startDate)
    : earliestBucketDate;

  const txDateFilter: Prisma.DateTimeFilter = {
    gte: rangeStart,
    ...(query.endDate ? { lte: endRef } : {}),
  };

  const [
    totalCustomers,
    activeCustomers,
    blockedCustomers,
    totalBankAccounts,
    accountBalanceAgg,
    depositSumAgg,
    withdrawalSumAgg,
    totalTransactions,
    flaggedTransactionsCount,
    pendingDepositsCount,
    pendingWithdrawalsCount,
    pendingLoanApplicationsCount,
    accountTypeGroups,
    accountStatusGroups,
    loanStatusGroups,
    loanTypeGroups,
    transactionsInWindow,
    customersInWindow,
    accountsInWindow,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "CUSTOMER", status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "CUSTOMER", status: "BLOCKED" } }),
    prisma.bankAccount.count({ where: { isSystemAccount: false } }),
    prisma.bankAccount.aggregate({
      where: { isSystemAccount: false },
      _sum: { balance: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "DEPOSIT", status: "COMPLETED" },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "WITHDRAWAL", status: "COMPLETED" },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { isFlagged: true } }),
    prisma.depositRequest.count({ where: { status: "PENDING" } }),
    prisma.withdrawalRequest.count({ where: { status: "PENDING" } }),
    prisma.loanApplication.count({
      where: { status: { in: ["PENDING", "UNDER_REVIEW"] } },
    }),
    prisma.bankAccount.groupBy({
      by: ["accountType"],
      where: { isSystemAccount: false },
      _count: { _all: true },
      _sum: { balance: true },
    }),
    prisma.bankAccount.groupBy({
      by: ["status"],
      where: { isSystemAccount: false },
      _count: { _all: true },
    }),
    prisma.loanApplication.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { requestedAmount: true, approvedAmount: true, remainingBalance: true },
    }),
    prisma.loanApplication.groupBy({
      by: ["loanType"],
      _count: { _all: true },
      _sum: { requestedAmount: true },
    }),
    prisma.transaction.findMany({
      where: {
        status: "COMPLETED",
        executedAt: txDateFilter,
      },
      select: {
        type: true,
        amount: true,
        executedAt: true,
      },
    }),
    prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        createdAt: txDateFilter,
      },
      select: { createdAt: true },
    }),
    prisma.bankAccount.findMany({
      where: {
        isSystemAccount: false,
        createdAt: txDateFilter,
      },
      select: { createdAt: true },
    }),
  ]);

  for (const tx of transactionsInWindow) {
    const key = getMonthKey(tx.executedAt);
    const bucket = bucketMap.get(key);
    if (!bucket) continue;

    bucket.transactionCount += 1;
    bucket.transactionVolume = bucket.transactionVolume.plus(tx.amount);

    if (tx.type === "DEPOSIT") {
      bucket.depositVolume = bucket.depositVolume.plus(tx.amount);
    } else if (tx.type === "WITHDRAWAL") {
      bucket.withdrawalVolume = bucket.withdrawalVolume.plus(tx.amount);
    } else if (tx.type === "FUND_TRANSFER") {
      bucket.transferVolume = bucket.transferVolume.plus(tx.amount);
    } else if (tx.type === "LOAN_DISBURSEMENT") {
      bucket.loanDisbursementVolume = bucket.loanDisbursementVolume.plus(
        tx.amount
      );
    } else if (tx.type === "LOAN_REPAYMENT") {
      bucket.loanRepaymentVolume = bucket.loanRepaymentVolume.plus(tx.amount);
    }
  }

  for (const c of customersInWindow) {
    const bucket = bucketMap.get(getMonthKey(c.createdAt));
    if (bucket) bucket.newCustomersCount += 1;
  }

  for (const a of accountsInWindow) {
    const bucket = bucketMap.get(getMonthKey(a.createdAt));
    if (bucket) bucket.newAccountsCount += 1;
  }

  return {
    kpis: {
      totalRegisteredCustomers: totalCustomers,
      activeCustomers,
      blockedCustomers,
      totalBankAccounts,
      totalBankBalance: formatDecimal(accountBalanceAgg._sum.balance),
      totalDeposits: formatDecimal(depositSumAgg._sum.amount),
      totalDepositsCount: depositSumAgg._count._all,
      totalWithdrawals: formatDecimal(withdrawalSumAgg._sum.amount),
      totalWithdrawalsCount: withdrawalSumAgg._count._all,
      totalTransactions,
      flaggedTransactionsCount,
      pendingDepositRequests: pendingDepositsCount,
      pendingWithdrawalRequests: pendingWithdrawalsCount,
      pendingLoanApplications: pendingLoanApplicationsCount,
    },
    charts: {
      // 1. Monthly Transaction Volume
      monthlyTransactionVolume: buckets.map((b) => ({
        month: b.label,
        monthKey: b.monthKey,
        transactionCount: b.transactionCount,
        totalVolume: formatDecimal(b.transactionVolume),
      })),
      // 2. Deposit vs Withdrawal
      depositVsWithdrawal: buckets.map((b) => ({
        month: b.label,
        monthKey: b.monthKey,
        deposits: formatDecimal(b.depositVolume),
        withdrawals: formatDecimal(b.withdrawalVolume),
      })),
      // 3. Account Distribution
      accountDistribution: accountTypeGroups.map((g) => ({
        accountType: g.accountType,
        count: g._count._all,
        totalBalance: formatDecimal(g._sum.balance),
      })),
      accountStatusDistribution: accountStatusGroups.map((g) => ({
        status: g.status,
        count: g._count._all,
      })),
      // 4. Loan Approval Statistics
      loanApprovalStatistics: loanStatusGroups.map((g) => ({
        status: g.status,
        count: g._count._all,
        totalRequestedAmount: formatDecimal(g._sum.requestedAmount),
        totalApprovedAmount: formatDecimal(g._sum.approvedAmount),
        totalRemainingBalance: formatDecimal(g._sum.remainingBalance),
      })),
      loanTypeDistribution: loanTypeGroups.map((g) => ({
        loanType: g.loanType,
        count: g._count._all,
        totalRequestedAmount: formatDecimal(g._sum.requestedAmount),
      })),
      // 5. Monthly Banking Activity
      monthlyBankingActivity: buckets.map((b) => ({
        month: b.label,
        monthKey: b.monthKey,
        transfersVolume: formatDecimal(b.transferVolume),
        loanDisbursementsVolume: formatDecimal(b.loanDisbursementVolume),
        loanRepaymentsVolume: formatDecimal(b.loanRepaymentVolume),
        newCustomers: b.newCustomersCount,
        newAccounts: b.newAccountsCount,
      })),
    },
  };
}

export async function getAdminOverviewDashboard(
  query: AdminOverviewQueryInput
) {
  const [
    analytics,
    recentTransactions,
    recentAuditLogs,
    pendingLoans,
    pendingWithdrawals,
    pendingDeposits,
    openFlags,
  ] = await Promise.all([
    getAdminAnalyticsReport(query),
    prisma.transaction.findMany({
      take: 8,
      orderBy: { executedAt: "desc" },
      include: {
        senderAccount: {
          select: {
            id: true,
            accountNumber: true,
            accountTitle: true,
            isSystemAccount: true,
          },
        },
        receiverAccount: {
          select: {
            id: true,
            accountNumber: true,
            accountTitle: true,
            isSystemAccount: true,
          },
        },
      },
    }),
    prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    }),
    prisma.loanApplication.findMany({
      where: { status: { in: ["PENDING", "UNDER_REVIEW"] } },
      take: 3,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        disbursementAccount: {
          select: {
            id: true,
            accountNumber: true,
            accountType: true,
          },
        },
      },
    }),
    prisma.withdrawalRequest.findMany({
      where: { status: "PENDING" },
      take: 2,
      orderBy: { requestedAt: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        account: {
          select: {
            id: true,
            accountNumber: true,
            accountTitle: true,
          },
        },
      },
    }),
    prisma.depositRequest.findMany({
      where: { status: "PENDING" },
      take: 2,
      orderBy: { requestedAt: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        account: {
          select: {
            id: true,
            accountNumber: true,
            accountTitle: true,
          },
        },
      },
    }),
    prisma.suspiciousTransactionFlag.findMany({
      where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
      take: 2,
      orderBy: { createdAt: "desc" },
      include: {
        transaction: {
          select: {
            id: true,
            referenceId: true,
            amount: true,
            type: true,
            senderAccount: {
              select: {
                id: true,
                accountNumber: true,
                accountTitle: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const actionQueueItems: Array<{
    id: string;
    entityId: string;
    category: "WITHDRAWAL" | "DEPOSIT" | "LOAN" | "SUSPICIOUS_FLAG";
    referenceCode: string;
    title: string;
    subtitle: string;
    metaNote: string;
    amount: string;
    severity: "WARNING" | "INFO" | "DANGER";
    targetAccountId: string | null;
    createdAt: string;
  }> = [];

  for (const w of pendingWithdrawals) {
    actionQueueItems.push({
      id: `wdr-${w.id}`,
      entityId: w.id,
      category: "WITHDRAWAL",
      referenceCode: `#${w.requestReference}`,
      title: "High-Value Outbound Withdrawal",
      subtitle: `${w.customer.firstName} ${w.customer.lastName} • Account #${w.account.accountNumber}`,
      metaNote: w.description ?? "Awaiting secondary admin authorization",
      amount: formatDecimal(w.amount),
      severity: "WARNING",
      targetAccountId: w.account.id,
      createdAt: w.requestedAt.toISOString(),
    });
  }

  for (const d of pendingDeposits) {
    actionQueueItems.push({
      id: `dep-${d.id}`,
      entityId: d.id,
      category: "DEPOSIT",
      referenceCode: `#${d.requestReference}`,
      title: "Inbound Deposit Settlement",
      subtitle: `${d.customer.firstName} ${d.customer.lastName} • Account #${d.account.accountNumber}`,
      metaNote: d.description ?? "Awaiting treasury credit confirmation",
      amount: formatDecimal(d.amount),
      severity: "WARNING",
      targetAccountId: d.account.id,
      createdAt: d.requestedAt.toISOString(),
    });
  }

  for (const l of pendingLoans) {
    actionQueueItems.push({
      id: `loan-${l.id}`,
      entityId: l.id,
      category: "LOAN",
      referenceCode: `#${l.loanReference}`,
      title: `${l.loanType} Credit Facility`,
      subtitle: `${l.customer.firstName} ${l.customer.lastName} • ${l.durationMonths}mo @ ${formatDecimal(
        l.interestRate
      )}%`,
      metaNote: `Target Account: #${l.disbursementAccount.accountNumber}`,
      amount: formatDecimal(l.requestedAmount),
      severity: "INFO",
      targetAccountId: l.disbursementAccount.id,
      createdAt: l.createdAt.toISOString(),
    });
  }

  for (const f of openFlags) {
    actionQueueItems.push({
      id: `flag-${f.id}`,
      entityId: f.transaction.id,
      category: "SUSPICIOUS_FLAG",
      referenceCode: `#${f.transaction.referenceId}`,
      title: f.ruleCode ?? "Velocity / Anomaly Flagged",
      subtitle: f.transaction.senderAccount
        ? `Account #${f.transaction.senderAccount.accountNumber} (${f.transaction.senderAccount.accountTitle})`
        : `Transaction ${f.transaction.type}`,
      metaNote: f.reason,
      amount: formatDecimal(f.transaction.amount),
      severity: "DANGER",
      targetAccountId: f.transaction.senderAccount?.id ?? null,
      createdAt: f.createdAt.toISOString(),
    });
  }

  return {
    ...analytics,
    actionQueue: actionQueueItems.slice(0, 5),
    recentTransactions: recentTransactions.map((t) => ({
      id: t.id,
      referenceId: t.referenceId,
      type: t.type,
      status: t.status,
      amount: formatDecimal(t.amount),
      fee: formatDecimal(t.fee),
      totalAmount: formatDecimal(t.totalAmount),
      description: t.description,
      isFlagged: t.isFlagged,
      senderAccount: t.senderAccount,
      receiverAccount: t.receiverAccount,
      executedAt: t.executedAt.toISOString(),
    })),
    recentActivity: recentAuditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      actorRole: log.actorRole,
      actorName: log.actor
        ? `${log.actor.firstName} ${log.actor.lastName}`.trim()
        : "System",
      createdAt: log.createdAt.toISOString(),
    })),
  };
}
