// ============================================================================
// VaultEdge — Customer Core Banking Service
// Handles Customer Overview & Analytics, Account Management, Atomic Fund
// Transfers (with Transaction PIN + Lockout + Idempotency + Limits + Fees),
// Deposit/Withdrawal Requests, Transaction History, and Statements (JSON/CSV/PDF).
// ============================================================================

import { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { verifyPassword } from "@/server/auth/password";
import {
  AuthorizationError,
  BusinessRuleError,
  ConflictError,
  InsufficientBalanceError,
  NotFoundError,
  RateLimitError,
} from "@/server/errors/app-error";
import {
  buildPaginationMeta,
  ensureSystemSettings,
  ensureSystemTreasuryAccount,
  formatDecimal,
  generateTransactionReferenceId,
} from "@/server/utils/banking";
import { generateAccountStatementPdf } from "@/server/utils/pdf-statement";
import type {
  CustomerAccountTransactionsQueryInput,
  CustomerDepositRequestInput,
  CustomerOverviewQueryInput,
  CustomerRequestListQueryInput,
  CustomerStatementQueryInput,
  CustomerTransactionListQueryInput,
  CustomerTransferInput,
  CustomerWithdrawalRequestInput,
} from "@/server/validators/customer.schema";

const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCKOUT_MINUTES = 15;

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

/**
 * Verifies the customer's transaction PIN against `User.transactionPinHash`
 * with 5-attempt lockout protection (`pinFailedAttempts`, `pinLockedUntil`).
 */
export async function verifyCustomerTransactionPin(
  customerId: string,
  plainPin: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      transactionPinHash: true,
      pinFailedAttempts: true,
      pinLockedUntil: true,
    },
  });

  if (!user) {
    throw new NotFoundError("Customer user not found.");
  }

  if (!user.transactionPinHash) {
    throw new BusinessRuleError(
      "Transaction PIN is not configured. Please set a Transaction PIN in Security Settings before executing transfers or repayments."
    );
  }

  const now = new Date();
  if (user.pinLockedUntil && user.pinLockedUntil > now) {
    const remainingMinutes = Math.ceil(
      (user.pinLockedUntil.getTime() - now.getTime()) / 60_000
    );
    throw new RateLimitError(
      `Transaction PIN is temporarily locked due to multiple failed attempts. Try again in ${remainingMinutes} minute(s).`
    );
  }

  const isMatch = await verifyPassword(plainPin, user.transactionPinHash);
  if (!isMatch) {
    const nextAttempts = user.pinFailedAttempts + 1;
    const shouldLock = nextAttempts >= MAX_PIN_ATTEMPTS;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        pinFailedAttempts: shouldLock ? 0 : nextAttempts,
        pinLockedUntil: shouldLock
          ? new Date(now.getTime() + PIN_LOCKOUT_MINUTES * 60_000)
          : null,
      },
    });

    if (shouldLock) {
      throw new RateLimitError(
        `Invalid Transaction PIN. Your PIN has been locked for ${PIN_LOCKOUT_MINUTES} minutes.`
      );
    }

    throw new BusinessRuleError(
      `Invalid Transaction PIN. ${MAX_PIN_ATTEMPTS - nextAttempts} attempt(s) remaining.`
    );
  }

  if (user.pinFailedAttempts > 0 || user.pinLockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { pinFailedAttempts: 0, pinLockedUntil: null },
    });
  }
}

async function assertOwnedAccount(
  customerId: string,
  accountId: string,
  db: Prisma.TransactionClient | typeof prisma = prisma
) {
  const account = await db.bankAccount.findFirst({
    where: {
      id: accountId,
      isSystemAccount: false,
    },
  });

  if (!account) {
    throw new NotFoundError("Bank account not found.");
  }

  if (account.userId !== customerId) {
    throw new AuthorizationError(
      "Access denied. You do not own this bank account."
    );
  }

  return account;
}

// ============================================================================
// Module 1: Customer Overview & Analytics
// ============================================================================
export async function getCustomerOverviewDashboard(
  customerId: string,
  query: CustomerOverviewQueryInput
) {
  const accounts = await prisma.bankAccount.findMany({
    where: { userId: customerId, isSystemAccount: false },
    orderBy: { createdAt: "asc" },
  });

  if (query.accountId) {
    const owns = accounts.some((a) => a.id === query.accountId);
    if (!owns) {
      throw new AuthorizationError(
        "Access denied. You do not own the requested account."
      );
    }
  }

  const scopedAccountIds = query.accountId
    ? [query.accountId]
    : accounts.map((a) => a.id);

  const totalBalanceDec = accounts
    .filter((a) => !query.accountId || a.id === query.accountId)
    .reduce((sum, a) => sum.add(a.balance), new Prisma.Decimal("0.00"));

  const endRef = query.endDate ? new Date(query.endDate) : new Date();
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

  const accountScopeWhere: Prisma.TransactionWhereInput =
    scopedAccountIds.length > 0
      ? {
          OR: [
            { senderAccountId: { in: scopedAccountIds } },
            { receiverAccountId: { in: scopedAccountIds } },
          ],
        }
      : { id: "__none__" };

  const [
    depositAgg,
    withdrawalAgg,
    recentTransactions,
    activeLoans,
    windowTransactions,
    txTypeGroups,
  ] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        type: "DEPOSIT",
        status: "COMPLETED",
        receiverAccountId: {
          in: scopedAccountIds.length > 0 ? scopedAccountIds : ["__none__"],
        },
      },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.transaction.aggregate({
      where: {
        type: "WITHDRAWAL",
        status: "COMPLETED",
        senderAccountId: {
          in: scopedAccountIds.length > 0 ? scopedAccountIds : ["__none__"],
        },
      },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.transaction.findMany({
      where: accountScopeWhere,
      take: 8,
      orderBy: { executedAt: "desc" },
      include: {
        senderAccount: {
          select: { id: true, accountNumber: true, accountTitle: true },
        },
        receiverAccount: {
          select: { id: true, accountNumber: true, accountTitle: true },
        },
      },
    }),
    prisma.loanApplication.findMany({
      where: {
        customerId,
        status: { in: ["APPROVED", "ACTIVE"] },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        loanReference: true,
        loanType: true,
        approvedAmount: true,
        remainingBalance: true,
        monthlyInstallment: true,
        status: true,
      },
    }),
    prisma.transaction.findMany({
      where: {
        ...accountScopeWhere,
        status: "COMPLETED",
        executedAt: {
          gte: rangeStart,
          ...(query.endDate ? { lte: endRef } : {}),
        },
      },
      select: {
        type: true,
        amount: true,
        fee: true,
        senderAccountId: true,
        receiverAccountId: true,
        executedAt: true,
      },
    }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: {
        ...accountScopeWhere,
        status: "COMPLETED",
      },
      _count: { _all: true },
      _sum: { amount: true },
    }),
  ]);

  // Build monthly spending & deposit history buckets
  const buckets = new Map<
    string,
    {
      month: string;
      monthKey: string;
      spending: Prisma.Decimal;
      deposits: Prisma.Decimal;
    }
  >();

  for (let i = query.months - 1; i >= 0; i--) {
    const d = new Date(
      Date.UTC(endRef.getUTCFullYear(), endRef.getUTCMonth() - i, 1)
    );
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const monthKey = `${y}-${String(m + 1).padStart(2, "0")}`;
    buckets.set(monthKey, {
      month: `${MONTH_SHORT_NAMES[m]} ${y}`,
      monthKey,
      spending: new Prisma.Decimal("0.00"),
      deposits: new Prisma.Decimal("0.00"),
    });
  }

  const ownedIdSet = new Set(scopedAccountIds);
  for (const tx of windowTransactions) {
    const d = tx.executedAt;
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(key);
    if (!bucket) continue;

    if (
      tx.type === "DEPOSIT" &&
      tx.receiverAccountId &&
      ownedIdSet.has(tx.receiverAccountId)
    ) {
      bucket.deposits = bucket.deposits.add(tx.amount);
    }

    if (tx.senderAccountId && ownedIdSet.has(tx.senderAccountId)) {
      const isInternalOwnTransfer =
        tx.type === "FUND_TRANSFER" &&
        tx.receiverAccountId &&
        ownedIdSet.has(tx.receiverAccountId);
      if (!isInternalOwnTransfer) {
        bucket.spending = bucket.spending.add(tx.amount).add(tx.fee);
      }
    }
  }

  const bucketArr = Array.from(buckets.values());

  return {
    kpis: {
      totalAccountBalance: formatDecimal(totalBalanceDec),
      totalDeposits: formatDecimal(depositAgg._sum.amount),
      totalDepositsCount: depositAgg._count._all,
      totalWithdrawals: formatDecimal(withdrawalAgg._sum.amount),
      totalWithdrawalsCount: withdrawalAgg._count._all,
      activeLoansCount: activeLoans.length,
      accountsCount: accounts.length,
    },
    accounts: accounts.map((a) => ({
      id: a.id,
      accountNumber: a.accountNumber,
      accountTitle: a.accountTitle,
      accountType: a.accountType,
      status: a.status,
      currency: a.currency,
      balance: formatDecimal(a.balance),
    })),
    activeLoans: activeLoans.map((l) => ({
      id: l.id,
      loanReference: l.loanReference,
      loanType: l.loanType,
      approvedAmount: l.approvedAmount ? formatDecimal(l.approvedAmount) : null,
      remainingBalance: formatDecimal(l.remainingBalance),
      monthlyInstallment: l.monthlyInstallment
        ? formatDecimal(l.monthlyInstallment)
        : null,
      status: l.status,
    })),
    recentTransactions: recentTransactions.map((tx) => ({
      id: tx.id,
      referenceId: tx.referenceId,
      type: tx.type,
      status: tx.status,
      amount: formatDecimal(tx.amount),
      fee: formatDecimal(tx.fee),
      totalAmount: formatDecimal(tx.totalAmount),
      description: tx.description,
      executedAt: tx.executedAt.toISOString(),
      senderAccount: tx.senderAccount,
      receiverAccount: tx.receiverAccount,
    })),
    charts: {
      monthlySpending: bucketArr.map((b) => ({
        month: b.month,
        monthKey: b.monthKey,
        amount: formatDecimal(b.spending),
      })),
      monthlyDepositHistory: bucketArr.map((b) => ({
        month: b.month,
        monthKey: b.monthKey,
        amount: formatDecimal(b.deposits),
      })),
      transactionDistribution: txTypeGroups.map((g) => ({
        type: g.type,
        count: g._count._all,
        totalAmount: formatDecimal(g._sum.amount),
      })),
    },
  };
}

// ============================================================================
// Module 2: Customer Account Management
// ============================================================================
export async function listCustomerAccounts(customerId: string) {
  const accounts = await prisma.bankAccount.findMany({
    where: { userId: customerId, isSystemAccount: false },
    orderBy: { createdAt: "asc" },
  });

  const settings = await prisma.$transaction((tx) => ensureSystemSettings(tx));

  return {
    accounts: accounts.map((acc) => ({
      id: acc.id,
      accountNumber: acc.accountNumber,
      accountTitle: acc.accountTitle,
      accountType: acc.accountType,
      status: acc.status,
      currency: acc.currency,
      balance: formatDecimal(acc.balance),
      effectiveLimits: {
        dailyTransferLimit: formatDecimal(
          acc.dailyTransferLimit ?? settings.defaultDailyTransferLimit
        ),
        maxSingleTransactionLimit: formatDecimal(
          acc.maxSingleTransactionLimit ?? settings.defaultMaxSingleTransfer
        ),
        minBalanceRequired: formatDecimal(
          acc.minBalanceRequired ?? settings.defaultMinAccountBalance
        ),
      },
      frozenReason: acc.frozenReason,
      createdAt: acc.createdAt.toISOString(),
    })),
  };
}

export async function getCustomerAccountDetails(
  customerId: string,
  accountId: string
) {
  const account = await assertOwnedAccount(customerId, accountId);
  const settings = await prisma.$transaction((tx) => ensureSystemSettings(tx));

  return {
    account: {
      id: account.id,
      accountNumber: account.accountNumber,
      accountTitle: account.accountTitle,
      accountType: account.accountType,
      status: account.status,
      currency: account.currency,
      balance: formatDecimal(account.balance),
      effectiveLimits: {
        dailyTransferLimit: formatDecimal(
          account.dailyTransferLimit ?? settings.defaultDailyTransferLimit
        ),
        maxSingleTransactionLimit: formatDecimal(
          account.maxSingleTransactionLimit ?? settings.defaultMaxSingleTransfer
        ),
        minBalanceRequired: formatDecimal(
          account.minBalanceRequired ?? settings.defaultMinAccountBalance
        ),
      },
      frozenReason: account.frozenReason,
      frozenAt: account.frozenAt ? account.frozenAt.toISOString() : null,
      createdAt: account.createdAt.toISOString(),
    },
  };
}

export async function listCustomerAccountTransactions(
  customerId: string,
  accountId: string,
  query: CustomerAccountTransactionsQueryInput
) {
  await assertOwnedAccount(customerId, accountId);
  const skip = (query.page - 1) * query.limit;

  const where: Prisma.TransactionWhereInput = {
    OR: [{ senderAccountId: accountId }, { receiverAccountId: accountId }],
    ...(query.type ? { type: query.type } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.startDate || query.endDate
      ? {
          executedAt: {
            ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
            ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
          },
        }
      : {}),
  };

  const [total, txs] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { executedAt: "desc" },
      include: {
        senderAccount: {
          select: { id: true, accountNumber: true, accountTitle: true },
        },
        receiverAccount: {
          select: { id: true, accountNumber: true, accountTitle: true },
        },
      },
    }),
  ]);

  return {
    transactions: txs.map((tx) => ({
      id: tx.id,
      referenceId: tx.referenceId,
      type: tx.type,
      status: tx.status,
      amount: formatDecimal(tx.amount),
      fee: formatDecimal(tx.fee),
      totalAmount: formatDecimal(tx.totalAmount),
      description: tx.description,
      executedAt: tx.executedAt.toISOString(),
      direction: tx.senderAccountId === accountId ? "OUTBOUND" : "INBOUND",
      senderAccount: tx.senderAccount,
      receiverAccount: tx.receiverAccount,
    })),
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

// ============================================================================
// Module 3: Atomic Internal & Intra-Bank Fund Transfer
// ============================================================================
export async function executeCustomerFundTransfer(params: {
  customerId: string;
  ipAddress: string | null;
  input: CustomerTransferInput;
}) {
  const { input } = params;

  // 1. Idempotency check before PIN/mutation
  if (input.idempotencyKey) {
    const existing = await prisma.transaction.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: {
        senderAccount: {
          select: { id: true, accountNumber: true, accountTitle: true },
        },
        receiverAccount: {
          select: { id: true, accountNumber: true, accountTitle: true },
        },
      },
    });
    if (existing) {
      if (existing.initiatedById !== params.customerId) {
        throw new ConflictError("Idempotency key conflict.");
      }
      return {
        transaction: {
          id: existing.id,
          referenceId: existing.referenceId,
          type: existing.type,
          status: existing.status,
          amount: formatDecimal(existing.amount),
          fee: formatDecimal(existing.fee),
          totalAmount: formatDecimal(existing.totalAmount),
          description: existing.description,
          executedAt: existing.executedAt.toISOString(),
          senderAccount: existing.senderAccount,
          receiverAccount: existing.receiverAccount,
        },
      };
    }
  }

  // 2. Verify Transaction PIN with lockout protection
  await verifyCustomerTransactionPin(params.customerId, input.transactionPin);

  const amountDec = new Prisma.Decimal(input.amount.toFixed(2));

  // 3. Atomic Double-Entry Settlement
  const createdTx = await prisma.$transaction(async (tx) => {
    const sender = await assertOwnedAccount(
      params.customerId,
      input.senderAccountId,
      tx
    );

    if (sender.status !== "ACTIVE") {
      throw new BusinessRuleError(
        `Sender account ${sender.accountNumber} is ${sender.status} and cannot send funds.`
      );
    }

    const receiver = await tx.bankAccount.findUnique({
      where: { accountNumber: input.recipientAccountNumber },
    });

    if (!receiver || receiver.isSystemAccount) {
      throw new NotFoundError(
        `Recipient account ${input.recipientAccountNumber} was not found.`
      );
    }

    if (receiver.id === sender.id) {
      throw new BusinessRuleError(
        "Sender and recipient accounts cannot be the same account."
      );
    }

    if (receiver.status !== "ACTIVE") {
      throw new BusinessRuleError(
        `Recipient account ${receiver.accountNumber} is ${receiver.status} and cannot receive funds.`
      );
    }

    const settings = await ensureSystemSettings(tx);
    const feeDec = settings.transferFeeFlat;
    const totalDebitDec = amountDec.add(feeDec);

    const maxSingle =
      sender.maxSingleTransactionLimit ?? settings.defaultMaxSingleTransfer;
    if (amountDec.greaterThan(maxSingle)) {
      throw new BusinessRuleError(
        `Transfer amount exceeds single transaction limit of ${formatDecimal(maxSingle)}.`
      );
    }

    const dailyLimit =
      sender.dailyTransferLimit ?? settings.defaultDailyTransferLimit;
    const startOfDayUtc = new Date();
    startOfDayUtc.setUTCHours(0, 0, 0, 0);

    const todayAgg = await tx.transaction.aggregate({
      where: {
        senderAccountId: sender.id,
        type: { in: ["FUND_TRANSFER", "WITHDRAWAL"] },
        status: "COMPLETED",
        executedAt: { gte: startOfDayUtc },
      },
      _sum: { amount: true },
    });

    const spentToday = todayAgg._sum.amount ?? new Prisma.Decimal("0.00");
    if (spentToday.add(amountDec).greaterThan(dailyLimit)) {
      throw new BusinessRuleError(
        `Transfer exceeds daily transfer limit of ${formatDecimal(dailyLimit)}. Remaining today: ${formatDecimal(
          dailyLimit.sub(spentToday)
        )}.`
      );
    }

    const minBalance =
      sender.minBalanceRequired ?? settings.defaultMinAccountBalance;
    if (sender.balance.sub(totalDebitDec).lessThan(minBalance)) {
      throw new InsufficientBalanceError(
        `Insufficient available balance. Minimum required balance of ${formatDecimal(minBalance)} must be maintained after transfer amount and fee.`
      );
    }

    // Atomic conditional balance debit to prevent concurrent overdrafts
    const debitClaim = await tx.bankAccount.updateMany({
      where: {
        id: sender.id,
        status: "ACTIVE",
        balance: { gte: totalDebitDec },
      },
      data: {
        balance: { decrement: totalDebitDec },
      },
    });

    if (debitClaim.count !== 1) {
      throw new InsufficientBalanceError(
        "Insufficient available balance or account state changed concurrently."
      );
    }

    const updatedSender = await tx.bankAccount.findUniqueOrThrow({
      where: { id: sender.id },
    });

    const updatedReceiver = await tx.bankAccount.update({
      where: { id: receiver.id },
      data: { balance: { increment: amountDec } },
    });

    let treasuryBefore = new Prisma.Decimal("0.00");
    let treasuryAfter = new Prisma.Decimal("0.00");
    let treasuryAccountId: string | null = null;

    if (feeDec.greaterThan(0)) {
      const treasury = await ensureSystemTreasuryAccount(tx);
      treasuryBefore = treasury.balance;
      const updatedTreasury = await tx.bankAccount.update({
        where: { id: treasury.id },
        data: { balance: { increment: feeDec } },
      });
      treasuryAfter = updatedTreasury.balance;
      treasuryAccountId = treasury.id;
    }

    const isSuspicious = amountDec.greaterThanOrEqualTo(
      settings.suspiciousAmountThreshold
    );
    const referenceId = generateTransactionReferenceId("TRF");
    const now = new Date();

    const transaction = await tx.transaction.create({
      data: {
        referenceId,
        idempotencyKey: input.idempotencyKey ?? null,
        type: "FUND_TRANSFER",
        status: "COMPLETED",
        senderAccountId: sender.id,
        receiverAccountId: receiver.id,
        initiatedById: params.customerId,
        amount: amountDec,
        fee: feeDec,
        totalAmount: totalDebitDec,
        description:
          input.description ??
          `Fund transfer to ${receiver.accountNumber}`,
        isFlagged: isSuspicious,
        executedAt: now,
      },
      include: {
        senderAccount: {
          select: { id: true, accountNumber: true, accountTitle: true },
        },
        receiverAccount: {
          select: { id: true, accountNumber: true, accountTitle: true },
        },
      },
    });

    const senderAfterPrincipal = sender.balance.sub(amountDec);
    const ledgerData: Prisma.LedgerEntryCreateManyInput[] = [
      {
        transactionId: transaction.id,
        accountId: sender.id,
        direction: "DEBIT",
        entryCategory: "PRINCIPAL",
        amount: amountDec,
        balanceBefore: sender.balance,
        balanceAfter: senderAfterPrincipal,
        description: `Transfer out to ${receiver.accountNumber}`,
      },
      {
        transactionId: transaction.id,
        accountId: receiver.id,
        direction: "CREDIT",
        entryCategory: "PRINCIPAL",
        amount: amountDec,
        balanceBefore: receiver.balance,
        balanceAfter: updatedReceiver.balance,
        description: `Transfer in from ${sender.accountNumber}`,
      },
    ];

    if (feeDec.greaterThan(0) && treasuryAccountId) {
      ledgerData.push(
        {
          transactionId: transaction.id,
          accountId: sender.id,
          direction: "DEBIT",
          entryCategory: "FEE",
          amount: feeDec,
          balanceBefore: senderAfterPrincipal,
          balanceAfter: updatedSender.balance,
          description: `Transfer fee for ${referenceId}`,
        },
        {
          transactionId: transaction.id,
          accountId: treasuryAccountId,
          direction: "CREDIT",
          entryCategory: "FEE",
          amount: feeDec,
          balanceBefore: treasuryBefore,
          balanceAfter: treasuryAfter,
          description: `Transfer fee revenue from ${referenceId}`,
        }
      );
    }

    await tx.ledgerEntry.createMany({ data: ledgerData });

    if (isSuspicious) {
      await tx.suspiciousTransactionFlag.create({
        data: {
          transactionId: transaction.id,
          source: "SYSTEM_RULE",
          ruleCode: "HIGH_VALUE_THRESHOLD",
          reason: `Transfer amount ${formatDecimal(amountDec)} met or exceeded threshold ${formatDecimal(
            settings.suspiciousAmountThreshold
          )}.`,
          status: "OPEN",
        },
      });
    }

    await tx.notification.create({
      data: {
        userId: params.customerId,
        type: "TRANSFER_COMPLETED",
        title: `Transfer ${referenceId} Completed`,
        message: `You transferred ${formatDecimal(amountDec)} from ${sender.accountNumber} to ${receiver.accountNumber}.`,
        referenceId,
      },
    });

    if (receiver.userId && receiver.userId !== params.customerId) {
      await tx.notification.create({
        data: {
          userId: receiver.userId,
          type: "MONEY_RECEIVED",
          title: `Funds Received (${referenceId})`,
          message: `You received ${formatDecimal(amountDec)} into account ${receiver.accountNumber} from ${sender.accountNumber}.`,
          referenceId,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: params.customerId,
        actorRole: "CUSTOMER",
        action: "CUSTOMER_FUND_TRANSFER_EXECUTED",
        entityType: "Transaction",
        entityId: transaction.id,
        ipAddress: params.ipAddress,
        metadata: {
          referenceId,
          senderAccountNumber: sender.accountNumber,
          receiverAccountNumber: receiver.accountNumber,
          amount: formatDecimal(amountDec),
          fee: formatDecimal(feeDec),
          isFlagged: isSuspicious,
        },
      },
    });

    return transaction;
  });

  return {
    transaction: {
      id: createdTx.id,
      referenceId: createdTx.referenceId,
      type: createdTx.type,
      status: createdTx.status,
      amount: formatDecimal(createdTx.amount),
      fee: formatDecimal(createdTx.fee),
      totalAmount: formatDecimal(createdTx.totalAmount),
      description: createdTx.description,
      executedAt: createdTx.executedAt.toISOString(),
      senderAccount: createdTx.senderAccount,
      receiverAccount: createdTx.receiverAccount,
    },
  };
}

// ============================================================================
// Module 4: Deposit Requests
// ============================================================================
export async function createCustomerDepositRequest(params: {
  customerId: string;
  ipAddress: string | null;
  input: CustomerDepositRequestInput;
}) {
  if (params.input.idempotencyKey) {
    const existing = await prisma.depositRequest.findUnique({
      where: { idempotencyKey: params.input.idempotencyKey },
      include: {
        account: {
          select: { id: true, accountNumber: true, accountTitle: true },
        },
      },
    });
    if (existing) {
      if (existing.customerId !== params.customerId) {
        throw new ConflictError("Idempotency key conflict.");
      }
      return {
        depositRequest: {
          id: existing.id,
          requestReference: existing.requestReference,
          amount: formatDecimal(existing.amount),
          description: existing.description,
          status: existing.status,
          requestedAt: existing.requestedAt.toISOString(),
          account: existing.account,
        },
      };
    }
  }

  const amountDec = new Prisma.Decimal(params.input.amount.toFixed(2));

  const created = await prisma.$transaction(async (tx) => {
    const account = await assertOwnedAccount(
      params.customerId,
      params.input.accountId,
      tx
    );

    if (account.status !== "ACTIVE") {
      throw new BusinessRuleError(
        `Account ${account.accountNumber} is ${account.status} and cannot accept deposit requests.`
      );
    }

    const requestReference = generateTransactionReferenceId("DEP");

    const req = await tx.depositRequest.create({
      data: {
        requestReference,
        idempotencyKey: params.input.idempotencyKey ?? null,
        accountId: account.id,
        customerId: params.customerId,
        amount: amountDec,
        description: params.input.description ?? null,
        status: "PENDING",
      },
      include: {
        account: {
          select: { id: true, accountNumber: true, accountTitle: true },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: params.customerId,
        actorRole: "CUSTOMER",
        action: "DEPOSIT_REQUEST_SUBMITTED",
        entityType: "DepositRequest",
        entityId: req.id,
        ipAddress: params.ipAddress,
        metadata: {
          requestReference,
          accountNumber: account.accountNumber,
          amount: formatDecimal(amountDec),
        },
      },
    });

    return req;
  });

  return {
    depositRequest: {
      id: created.id,
      requestReference: created.requestReference,
      amount: formatDecimal(created.amount),
      description: created.description,
      status: created.status,
      requestedAt: created.requestedAt.toISOString(),
      account: created.account,
    },
  };
}

export async function listCustomerDepositRequests(
  customerId: string,
  query: CustomerRequestListQueryInput
) {
  const skip = (query.page - 1) * query.limit;
  const where: Prisma.DepositRequestWhereInput = {
    customerId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.accountId ? { accountId: query.accountId } : {}),
    ...(query.startDate || query.endDate
      ? {
          requestedAt: {
            ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
            ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
          },
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.depositRequest.count({ where }),
    prisma.depositRequest.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { requestedAt: "desc" },
      include: {
        account: {
          select: { id: true, accountNumber: true, accountTitle: true },
        },
        transaction: {
          select: { id: true, referenceId: true, executedAt: true },
        },
      },
    }),
  ]);

  return {
    depositRequests: items.map((d) => ({
      id: d.id,
      requestReference: d.requestReference,
      amount: formatDecimal(d.amount),
      description: d.description,
      status: d.status,
      reviewNote: d.reviewNote,
      requestedAt: d.requestedAt.toISOString(),
      reviewedAt: d.reviewedAt ? d.reviewedAt.toISOString() : null,
      account: d.account,
      transaction: d.transaction
        ? {
            id: d.transaction.id,
            referenceId: d.transaction.referenceId,
            executedAt: d.transaction.executedAt.toISOString(),
          }
        : null,
    })),
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function getCustomerDepositRequestDetails(
  customerId: string,
  depositId: string
) {
  const req = await prisma.depositRequest.findFirst({
    where: {
      OR: [{ id: depositId }, { requestReference: depositId }],
    },
    include: {
      account: {
        select: { id: true, accountNumber: true, accountTitle: true },
      },
      transaction: {
        select: { id: true, referenceId: true, executedAt: true },
      },
    },
  });

  if (!req) {
    throw new NotFoundError("Deposit request not found.");
  }
  if (req.customerId !== customerId) {
    throw new AuthorizationError("Access denied to this deposit request.");
  }

  return {
    depositRequest: {
      id: req.id,
      requestReference: req.requestReference,
      amount: formatDecimal(req.amount),
      description: req.description,
      status: req.status,
      reviewNote: req.reviewNote,
      requestedAt: req.requestedAt.toISOString(),
      reviewedAt: req.reviewedAt ? req.reviewedAt.toISOString() : null,
      account: req.account,
      transaction: req.transaction
        ? {
            id: req.transaction.id,
            referenceId: req.transaction.referenceId,
            executedAt: req.transaction.executedAt.toISOString(),
          }
        : null,
    },
  };
}

// ============================================================================
// Module 5: Withdrawal Requests
// ============================================================================
export async function createCustomerWithdrawalRequest(params: {
  customerId: string;
  ipAddress: string | null;
  input: CustomerWithdrawalRequestInput;
}) {
  if (params.input.idempotencyKey) {
    const existing = await prisma.withdrawalRequest.findUnique({
      where: { idempotencyKey: params.input.idempotencyKey },
      include: {
        account: {
          select: { id: true, accountNumber: true, accountTitle: true },
        },
      },
    });
    if (existing) {
      if (existing.customerId !== params.customerId) {
        throw new ConflictError("Idempotency key conflict.");
      }
      return {
        withdrawalRequest: {
          id: existing.id,
          requestReference: existing.requestReference,
          amount: formatDecimal(existing.amount),
          description: existing.description,
          status: existing.status,
          requestedAt: existing.requestedAt.toISOString(),
          account: existing.account,
        },
      };
    }
  }

  const amountDec = new Prisma.Decimal(params.input.amount.toFixed(2));

  const created = await prisma.$transaction(async (tx) => {
    const account = await assertOwnedAccount(
      params.customerId,
      params.input.accountId,
      tx
    );

    if (account.status !== "ACTIVE") {
      throw new BusinessRuleError(
        `Account ${account.accountNumber} is ${account.status} and cannot submit withdrawal requests.`
      );
    }

    const settings = await ensureSystemSettings(tx);
    const maxSingle =
      account.maxSingleTransactionLimit ?? settings.defaultMaxSingleTransfer;
    if (amountDec.greaterThan(maxSingle)) {
      throw new BusinessRuleError(
        `Withdrawal amount exceeds single transaction limit of ${formatDecimal(maxSingle)}.`
      );
    }

    const minBalance =
      account.minBalanceRequired ?? settings.defaultMinAccountBalance;
    if (account.balance.sub(amountDec).lessThan(minBalance)) {
      throw new InsufficientBalanceError(
        `Insufficient available balance. Minimum balance of ${formatDecimal(minBalance)} must remain.`
      );
    }

    const requestReference = generateTransactionReferenceId("WDR");

    const req = await tx.withdrawalRequest.create({
      data: {
        requestReference,
        idempotencyKey: params.input.idempotencyKey ?? null,
        accountId: account.id,
        customerId: params.customerId,
        amount: amountDec,
        description: params.input.description ?? null,
        status: "PENDING",
      },
      include: {
        account: {
          select: { id: true, accountNumber: true, accountTitle: true },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: params.customerId,
        actorRole: "CUSTOMER",
        action: "WITHDRAWAL_REQUEST_SUBMITTED",
        entityType: "WithdrawalRequest",
        entityId: req.id,
        ipAddress: params.ipAddress,
        metadata: {
          requestReference,
          accountNumber: account.accountNumber,
          amount: formatDecimal(amountDec),
        },
      },
    });

    return req;
  });

  return {
    withdrawalRequest: {
      id: created.id,
      requestReference: created.requestReference,
      amount: formatDecimal(created.amount),
      description: created.description,
      status: created.status,
      requestedAt: created.requestedAt.toISOString(),
      account: created.account,
    },
  };
}

export async function listCustomerWithdrawalRequests(
  customerId: string,
  query: CustomerRequestListQueryInput
) {
  const skip = (query.page - 1) * query.limit;
  const where: Prisma.WithdrawalRequestWhereInput = {
    customerId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.accountId ? { accountId: query.accountId } : {}),
    ...(query.startDate || query.endDate
      ? {
          requestedAt: {
            ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
            ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
          },
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.withdrawalRequest.count({ where }),
    prisma.withdrawalRequest.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { requestedAt: "desc" },
      include: {
        account: {
          select: { id: true, accountNumber: true, accountTitle: true },
        },
        transaction: {
          select: { id: true, referenceId: true, executedAt: true },
        },
      },
    }),
  ]);

  return {
    withdrawalRequests: items.map((w) => ({
      id: w.id,
      requestReference: w.requestReference,
      amount: formatDecimal(w.amount),
      description: w.description,
      status: w.status,
      reviewNote: w.reviewNote,
      requestedAt: w.requestedAt.toISOString(),
      reviewedAt: w.reviewedAt ? w.reviewedAt.toISOString() : null,
      account: w.account,
      transaction: w.transaction
        ? {
            id: w.transaction.id,
            referenceId: w.transaction.referenceId,
            executedAt: w.transaction.executedAt.toISOString(),
          }
        : null,
    })),
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function getCustomerWithdrawalRequestDetails(
  customerId: string,
  withdrawalId: string
) {
  const req = await prisma.withdrawalRequest.findFirst({
    where: {
      OR: [{ id: withdrawalId }, { requestReference: withdrawalId }],
    },
    include: {
      account: {
        select: { id: true, accountNumber: true, accountTitle: true },
      },
      transaction: {
        select: { id: true, referenceId: true, executedAt: true },
      },
    },
  });

  if (!req) {
    throw new NotFoundError("Withdrawal request not found.");
  }
  if (req.customerId !== customerId) {
    throw new AuthorizationError("Access denied to this withdrawal request.");
  }

  return {
    withdrawalRequest: {
      id: req.id,
      requestReference: req.requestReference,
      amount: formatDecimal(req.amount),
      description: req.description,
      status: req.status,
      reviewNote: req.reviewNote,
      requestedAt: req.requestedAt.toISOString(),
      reviewedAt: req.reviewedAt ? req.reviewedAt.toISOString() : null,
      account: req.account,
      transaction: req.transaction
        ? {
            id: req.transaction.id,
            referenceId: req.transaction.referenceId,
            executedAt: req.transaction.executedAt.toISOString(),
          }
        : null,
    },
  };
}

// ============================================================================
// Module 6: Customer Transaction History & Details
// ============================================================================
export async function listCustomerTransactions(
  customerId: string,
  query: CustomerTransactionListQueryInput
) {
  const ownedAccounts = await prisma.bankAccount.findMany({
    where: { userId: customerId, isSystemAccount: false },
    select: { id: true },
  });
  const ownedIds = ownedAccounts.map((a) => a.id);

  if (query.accountId && !ownedIds.includes(query.accountId)) {
    throw new AuthorizationError(
      "Access denied. You do not own the specified account."
    );
  }

  const scopedIds = query.accountId ? [query.accountId] : ownedIds;
  const skip = (query.page - 1) * query.limit;

  const where: Prisma.TransactionWhereInput = {
    ...(scopedIds.length > 0
      ? {
          OR: [
            { senderAccountId: { in: scopedIds } },
            { receiverAccountId: { in: scopedIds } },
          ],
        }
      : { id: "__none__" }),
    ...(query.type ? { type: query.type } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.referenceId
      ? {
          referenceId: {
            contains: query.referenceId,
            mode: "insensitive",
          },
        }
      : {}),
    ...(query.search
      ? {
          AND: [
            {
              OR: [
                {
                  referenceId: { contains: query.search, mode: "insensitive" },
                },
                {
                  description: { contains: query.search, mode: "insensitive" },
                },
              ],
            },
          ],
        }
      : {}),
    ...(query.startDate || query.endDate
      ? {
          executedAt: {
            ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
            ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
          },
        }
      : {}),
  };

  const [total, txs] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { executedAt: "desc" },
      include: {
        senderAccount: {
          select: { id: true, accountNumber: true, accountTitle: true },
        },
        receiverAccount: {
          select: { id: true, accountNumber: true, accountTitle: true },
        },
      },
    }),
  ]);

  return {
    transactions: txs.map((tx) => ({
      id: tx.id,
      referenceId: tx.referenceId,
      type: tx.type,
      status: tx.status,
      amount: formatDecimal(tx.amount),
      fee: formatDecimal(tx.fee),
      totalAmount: formatDecimal(tx.totalAmount),
      description: tx.description,
      executedAt: tx.executedAt.toISOString(),
      senderAccount: tx.senderAccount,
      receiverAccount: tx.receiverAccount,
    })),
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function getCustomerTransactionDetails(
  customerId: string,
  transactionId: string
) {
  const ownedAccounts = await prisma.bankAccount.findMany({
    where: { userId: customerId, isSystemAccount: false },
    select: { id: true },
  });
  const ownedSet = new Set(ownedAccounts.map((a) => a.id));

  const tx = await prisma.transaction.findFirst({
    where: {
      OR: [{ id: transactionId }, { referenceId: transactionId }],
    },
    include: {
      senderAccount: {
        select: {
          id: true,
          accountNumber: true,
          accountTitle: true,
          userId: true,
        },
      },
      receiverAccount: {
        select: {
          id: true,
          accountNumber: true,
          accountTitle: true,
          userId: true,
        },
      },
      ledgerEntries: {
        where: { accountId: { in: Array.from(ownedSet) } },
        orderBy: { createdAt: "asc" },
        include: {
          account: {
            select: { accountNumber: true, accountTitle: true },
          },
        },
      },
    },
  });

  if (!tx) {
    throw new NotFoundError("Transaction record not found.");
  }

  const isOwner =
    (tx.senderAccountId && ownedSet.has(tx.senderAccountId)) ||
    (tx.receiverAccountId && ownedSet.has(tx.receiverAccountId)) ||
    tx.initiatedById === customerId;

  if (!isOwner) {
    throw new AuthorizationError(
      "Access denied. You cannot view another customer's transaction."
    );
  }

  return {
    transaction: {
      id: tx.id,
      referenceId: tx.referenceId,
      type: tx.type,
      status: tx.status,
      amount: formatDecimal(tx.amount),
      fee: formatDecimal(tx.fee),
      totalAmount: formatDecimal(tx.totalAmount),
      description: tx.description,
      failureReason: tx.failureReason,
      executedAt: tx.executedAt.toISOString(),
      senderAccount: tx.senderAccount
        ? {
            id: tx.senderAccount.id,
            accountNumber: tx.senderAccount.accountNumber,
            accountTitle: tx.senderAccount.accountTitle,
          }
        : null,
      receiverAccount: tx.receiverAccount
        ? {
            id: tx.receiverAccount.id,
            accountNumber: tx.receiverAccount.accountNumber,
            accountTitle: tx.receiverAccount.accountTitle,
          }
        : null,
      ledgerEntries: tx.ledgerEntries.map((le) => ({
        id: le.id,
        accountNumber: le.account.accountNumber,
        accountTitle: le.account.accountTitle,
        direction: le.direction,
        entryCategory: le.entryCategory,
        amount: formatDecimal(le.amount),
        balanceBefore: formatDecimal(le.balanceBefore),
        balanceAfter: formatDecimal(le.balanceAfter),
        createdAt: le.createdAt.toISOString(),
      })),
    },
  };
}

// ============================================================================
// Module 9: Account Statements (JSON, CSV, PDF)
// ============================================================================
export async function getCustomerAccountStatement(
  customerId: string,
  query: CustomerStatementQueryInput
) {
  const account = await assertOwnedAccount(customerId, query.accountId);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: customerId },
    select: { firstName: true, lastName: true },
  });

  const where: Prisma.LedgerEntryWhereInput = {
    accountId: account.id,
    ...(query.startDate || query.endDate
      ? {
          createdAt: {
            ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
            ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
          },
        }
      : {}),
  };

  const entries = await prisma.ledgerEntry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      transaction: {
        select: {
          referenceId: true,
          type: true,
          status: true,
          description: true,
        },
      },
    },
  });

  const rows = entries.map((e) => ({
    id: e.id,
    date: e.createdAt.toISOString(),
    referenceId: e.transaction.referenceId,
    type: e.transaction.type,
    status: e.transaction.status,
    direction: e.direction,
    entryCategory: e.entryCategory,
    amount: formatDecimal(e.amount),
    balanceBefore: formatDecimal(e.balanceBefore),
    balanceAfter: formatDecimal(e.balanceAfter),
    description: e.description ?? e.transaction.description ?? "",
  }));

  const periodLabel =
    query.startDate || query.endDate
      ? `${query.startDate?.slice(0, 10) ?? "Beginning"} to ${query.endDate?.slice(0, 10) ?? "Present"}`
      : "All Recorded History";

  if (query.format === "csv") {
    const header = [
      "Date",
      "Reference ID",
      "Type",
      "Category",
      "Direction",
      "Amount",
      "Balance Before",
      "Balance After",
      "Description",
    ];
    const csvLines = [
      header.join(","),
      ...rows.map((r) =>
        [
          r.date,
          r.referenceId,
          r.type,
          r.entryCategory,
          r.direction,
          r.amount,
          r.balanceBefore,
          r.balanceAfter,
          r.description,
        ]
          .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
          .join(",")
      ),
    ];

    return {
      format: "csv" as const,
      filename: `vaultedge-statement-${account.accountNumber}.csv`,
      content: csvLines.join("\n"),
    };
  }

  if (query.format === "pdf") {
    const pdfBuffer = generateAccountStatementPdf({
      accountNumber: account.accountNumber,
      accountTitle: account.accountTitle,
      accountType: account.accountType,
      currency: account.currency,
      holderName: `${user.firstName} ${user.lastName}`.trim(),
      currentBalance: formatDecimal(account.balance),
      periodLabel,
      entries: rows.map((r) => ({
        date: r.date,
        referenceId: r.referenceId,
        type: r.type,
        direction: r.direction,
        amount: r.amount,
        balanceAfter: r.balanceAfter,
      })),
    });

    return {
      format: "pdf" as const,
      filename: `vaultedge-statement-${account.accountNumber}.pdf`,
      buffer: pdfBuffer,
    };
  }

  return {
    format: "json" as const,
    statement: {
      account: {
        id: account.id,
        accountNumber: account.accountNumber,
        accountTitle: account.accountTitle,
        accountType: account.accountType,
        currency: account.currency,
        currentBalance: formatDecimal(account.balance),
      },
      periodLabel,
      entries: rows,
    },
  };
}
