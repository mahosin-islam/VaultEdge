// ============================================================================
// VaultEdge — Admin Bank Account Management Service
// Creates customer bank accounts (with optional atomic initial deposit via
// internal treasury), lists/filters accounts, updates info, freezes/unfreezes,
// and configures per-account transaction limits.
// ============================================================================

import { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import {
  BusinessRuleError,
  NotFoundError,
} from "@/server/errors/app-error";
import {
  buildPaginationMeta,
  ensureSystemSettings,
  ensureSystemTreasuryAccount,
  formatDecimal,
  generateTransactionReferenceId,
  generateUniqueAccountNumber,
} from "@/server/utils/banking";
import type {
  AdminAccountListQueryInput,
  AdminCreateAccountInput,
  AdminUpdateAccountInput,
  AdminUpdateAccountLimitsInput,
  AdminUpdateAccountStatusInput,
} from "@/server/validators/admin.schema";

function serializeBankAccount(
  acc: Prisma.BankAccountGetPayload<{
    include: {
      user: {
        select: {
          id: true;
          email: true;
          firstName: true;
          lastName: true;
          status: true;
          customerProfile: {
            select: { customerCode: true; phone: true; kycStatus: true };
          };
        };
      };
    };
  }>
) {
  return {
    id: acc.id,
    accountNumber: acc.accountNumber,
    accountTitle: acc.accountTitle,
    accountType: acc.accountType,
    status: acc.status,
    currency: acc.currency,
    balance: formatDecimal(acc.balance),
    dailyTransferLimit: acc.dailyTransferLimit
      ? formatDecimal(acc.dailyTransferLimit)
      : null,
    maxSingleTransactionLimit: acc.maxSingleTransactionLimit
      ? formatDecimal(acc.maxSingleTransactionLimit)
      : null,
    minBalanceRequired: acc.minBalanceRequired
      ? formatDecimal(acc.minBalanceRequired)
      : null,
    frozenReason: acc.frozenReason,
    frozenAt: acc.frozenAt ? acc.frozenAt.toISOString() : null,
    createdAt: acc.createdAt.toISOString(),
    updatedAt: acc.updatedAt.toISOString(),
    owner: acc.user
      ? {
          id: acc.user.id,
          email: acc.user.email,
          fullName: `${acc.user.firstName} ${acc.user.lastName}`.trim(),
          status: acc.user.status,
          customerCode: acc.user.customerProfile?.customerCode ?? null,
          phone: acc.user.customerProfile?.phone ?? null,
          kycStatus: acc.user.customerProfile?.kycStatus ?? null,
        }
      : null,
  };
}

export async function listBankAccountsForAdmin(
  query: AdminAccountListQueryInput
) {
  const skip = (query.page - 1) * query.limit;

  const where: Prisma.BankAccountWhereInput = {
    isSystemAccount: false,
    ...(query.accountType ? { accountType: query.accountType } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.userId ? { userId: query.userId } : {}),
    ...(query.search
      ? {
          OR: [
            {
              accountNumber: {
                contains: query.search,
                mode: "insensitive",
              },
            },
            {
              accountTitle: {
                contains: query.search,
                mode: "insensitive",
              },
            },
            {
              user: {
                email: { contains: query.search, mode: "insensitive" },
              },
            },
            {
              user: {
                firstName: { contains: query.search, mode: "insensitive" },
              },
            },
            {
              user: {
                lastName: { contains: query.search, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
  };

  const [
    total,
    accounts,
    totalAllAccounts,
    activeAllAccounts,
    frozenAllAccounts,
    totalLiquidityAgg,
  ] = await Promise.all([
    prisma.bankAccount.count({ where }),
    prisma.bankAccount.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            customerProfile: {
              select: { customerCode: true, phone: true, kycStatus: true },
            },
          },
        },
      },
    }),
    prisma.bankAccount.count({ where: { isSystemAccount: false } }),
    prisma.bankAccount.count({
      where: { isSystemAccount: false, status: "ACTIVE" },
    }),
    prisma.bankAccount.count({
      where: {
        isSystemAccount: false,
        status: { in: ["FROZEN", "BLOCKED"] },
      },
    }),
    prisma.bankAccount.aggregate({
      where: { isSystemAccount: false },
      _sum: { balance: true },
    }),
  ]);

  return {
    accounts: accounts.map(serializeBankAccount),
    summaryCounts: {
      totalAccounts: totalAllAccounts,
      activeAccounts: activeAllAccounts,
      frozenOrBlockedAccounts: frozenAllAccounts,
      totalLiquidity: formatDecimal(totalLiquidityAgg._sum.balance),
    },
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function createBankAccountForCustomer(params: {
  actorId: string;
  actorRole: "ADMIN" | "STAFF";
  ipAddress: string | null;
  input: AdminCreateAccountInput;
}) {
  const created = await prisma.$transaction(async (tx) => {
    const customer = await tx.user.findUnique({
      where: { id: params.input.userId },
      include: { customerProfile: true },
    });

    if (!customer || customer.role !== "CUSTOMER") {
      throw new NotFoundError("Target customer user not found.");
    }

    if (customer.status !== "ACTIVE") {
      throw new BusinessRuleError(
        `Cannot open a bank account for a customer whose status is ${customer.status}.`
      );
    }

    const accountNumber = await generateUniqueAccountNumber(
      tx,
      params.input.accountType
    );

    const accountTitle =
      params.input.accountTitle ??
      `${customer.firstName} ${customer.lastName} — ${params.input.accountType}`;

    const initialDepositDec = new Prisma.Decimal(
      params.input.initialDeposit.toFixed(2)
    );

    const newAccount = await tx.bankAccount.create({
      data: {
        userId: customer.id,
        createdById: params.actorId,
        accountNumber,
        accountTitle,
        accountType: params.input.accountType,
        status: "ACTIVE",
        isSystemAccount: false,
        currency: params.input.currency,
        balance: initialDepositDec,
        dailyTransferLimit:
          params.input.dailyTransferLimit !== undefined &&
          params.input.dailyTransferLimit !== null
            ? new Prisma.Decimal(params.input.dailyTransferLimit.toFixed(2))
            : null,
        maxSingleTransactionLimit:
          params.input.maxSingleTransactionLimit !== undefined &&
          params.input.maxSingleTransactionLimit !== null
            ? new Prisma.Decimal(
                params.input.maxSingleTransactionLimit.toFixed(2)
              )
            : null,
        minBalanceRequired:
          params.input.minBalanceRequired !== undefined &&
          params.input.minBalanceRequired !== null
            ? new Prisma.Decimal(params.input.minBalanceRequired.toFixed(2))
            : null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            customerProfile: {
              select: { customerCode: true, phone: true, kycStatus: true },
            },
          },
        },
      },
    });

    // If initialDeposit > 0, record a balanced double-entry DEPOSIT transaction
    if (initialDepositDec.greaterThan(0)) {
      const treasury = await ensureSystemTreasuryAccount(tx);
      const treasuryBefore = treasury.balance;
      const treasuryAfter = treasuryBefore.minus(initialDepositDec);

      await tx.bankAccount.update({
        where: { id: treasury.id },
        data: { balance: treasuryAfter },
      });

      const referenceId = generateTransactionReferenceId("TXN");
      const depositTx = await tx.transaction.create({
        data: {
          referenceId,
          senderAccountId: treasury.id,
          receiverAccountId: newAccount.id,
          initiatedById: params.actorId,
          type: "DEPOSIT",
          status: "COMPLETED",
          amount: initialDepositDec,
          fee: new Prisma.Decimal("0.00"),
          totalAmount: initialDepositDec,
          description: `Initial account opening deposit for ${accountNumber}`,
        },
      });

      await tx.ledgerEntry.createMany({
        data: [
          {
            transactionId: depositTx.id,
            accountId: treasury.id,
            direction: "DEBIT",
            entryCategory: "PRINCIPAL",
            amount: initialDepositDec,
            balanceBefore: treasuryBefore,
            balanceAfter: treasuryAfter,
            description: `Initial deposit funding for account ${accountNumber}`,
          },
          {
            transactionId: depositTx.id,
            accountId: newAccount.id,
            direction: "CREDIT",
            entryCategory: "PRINCIPAL",
            amount: initialDepositDec,
            balanceBefore: new Prisma.Decimal("0.00"),
            balanceAfter: initialDepositDec,
            description: `Initial account opening credit`,
          },
        ],
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: params.actorId,
        actorRole: params.actorRole,
        action: "BANK_ACCOUNT_CREATED",
        entityType: "BankAccount",
        entityId: newAccount.id,
        ipAddress: params.ipAddress,
        metadata: {
          accountNumber: newAccount.accountNumber,
          accountType: newAccount.accountType,
          customerId: customer.id,
          initialDeposit: formatDecimal(initialDepositDec),
        },
      },
    });

    return newAccount;
  });

  return {
    account: serializeBankAccount(created),
  };
}

export async function getBankAccountDetailsForAdmin(accountId: string) {
  const [account, settings] = await Promise.all([
    prisma.bankAccount.findUnique({
      where: { id: accountId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            customerProfile: {
              select: { customerCode: true, phone: true, kycStatus: true },
            },
          },
        },
        ledgerEntries: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            transaction: {
              select: {
                id: true,
                referenceId: true,
                type: true,
                status: true,
                executedAt: true,
              },
            },
          },
        },
      },
    }),
    prisma.$transaction((tx) => ensureSystemSettings(tx)),
  ]);

  if (!account || account.isSystemAccount) {
    throw new NotFoundError("Bank account not found.");
  }

  return {
    account: serializeBankAccount(account),
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
    recentLedgerEntries: account.ledgerEntries.map((entry) => ({
      id: entry.id,
      transactionId: entry.transactionId,
      referenceId: entry.transaction.referenceId,
      transactionType: entry.transaction.type,
      transactionStatus: entry.transaction.status,
      direction: entry.direction,
      entryCategory: entry.entryCategory,
      amount: formatDecimal(entry.amount),
      balanceBefore: formatDecimal(entry.balanceBefore),
      balanceAfter: formatDecimal(entry.balanceAfter),
      description: entry.description,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}

export async function updateBankAccountForAdmin(params: {
  adminId: string;
  ipAddress: string | null;
  accountId: string;
  input: AdminUpdateAccountInput;
}) {
  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.bankAccount.findUnique({
      where: { id: params.accountId },
    });

    if (!existing || existing.isSystemAccount) {
      throw new NotFoundError("Bank account not found.");
    }

    const nextDaily =
      params.input.dailyTransferLimit !== undefined
        ? params.input.dailyTransferLimit !== null
          ? new Prisma.Decimal(params.input.dailyTransferLimit.toFixed(2))
          : null
        : existing.dailyTransferLimit;

    const nextMaxSingle =
      params.input.maxSingleTransactionLimit !== undefined
        ? params.input.maxSingleTransactionLimit !== null
          ? new Prisma.Decimal(
              params.input.maxSingleTransactionLimit.toFixed(2)
            )
          : null
        : existing.maxSingleTransactionLimit;

    if (
      nextDaily !== null &&
      nextMaxSingle !== null &&
      nextDaily.lessThan(nextMaxSingle)
    ) {
      throw new BusinessRuleError(
        "dailyTransferLimit cannot be less than maxSingleTransactionLimit."
      );
    }

    const nextStatus = params.input.status ?? existing.status;
    const isFreezing =
      nextStatus === "FROZEN" || nextStatus === "BLOCKED";

    const saved = await tx.bankAccount.update({
      where: { id: existing.id },
      data: {
        ...(params.input.accountTitle
          ? { accountTitle: params.input.accountTitle }
          : {}),
        ...(params.input.accountType
          ? { accountType: params.input.accountType }
          : {}),
        status: nextStatus,
        frozenReason: isFreezing
          ? params.input.frozenReason ??
            existing.frozenReason ??
            `Set to ${nextStatus} by Admin.`
          : nextStatus === "ACTIVE"
            ? null
            : existing.frozenReason,
        frozenAt: isFreezing
          ? existing.frozenAt ?? new Date()
          : nextStatus === "ACTIVE"
            ? null
            : existing.frozenAt,
        dailyTransferLimit: nextDaily,
        maxSingleTransactionLimit: nextMaxSingle,
        minBalanceRequired:
          params.input.minBalanceRequired !== undefined
            ? params.input.minBalanceRequired !== null
              ? new Prisma.Decimal(params.input.minBalanceRequired.toFixed(2))
              : null
            : existing.minBalanceRequired,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            customerProfile: {
              select: { customerCode: true, phone: true, kycStatus: true },
            },
          },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: params.adminId,
        actorRole: "ADMIN",
        action: "BANK_ACCOUNT_UPDATED",
        entityType: "BankAccount",
        entityId: saved.id,
        ipAddress: params.ipAddress,
        metadata: {
          accountNumber: saved.accountNumber,
          previousStatus: existing.status,
          newStatus: saved.status,
        },
      },
    });

    return saved;
  });

  return {
    account: serializeBankAccount(updated),
  };
}

export async function updateBankAccountStatusForAdmin(params: {
  adminId: string;
  ipAddress: string | null;
  accountId: string;
  input: AdminUpdateAccountStatusInput;
}) {
  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.bankAccount.findUnique({
      where: { id: params.accountId },
    });

    if (!existing || existing.isSystemAccount) {
      throw new NotFoundError("Bank account not found.");
    }

    const isFrozenOrBlocked =
      params.input.status === "FROZEN" || params.input.status === "BLOCKED";

    if (
      isFrozenOrBlocked &&
      (!params.input.reason || params.input.reason.trim().length < 3)
    ) {
      throw new BusinessRuleError(
        `A reason is required when setting an account status to ${params.input.status}.`
      );
    }

    const saved = await tx.bankAccount.update({
      where: { id: existing.id },
      data: {
        status: params.input.status,
        frozenReason: isFrozenOrBlocked
          ? params.input.reason ?? `Account set to ${params.input.status}`
          : null,
        frozenAt: isFrozenOrBlocked ? new Date() : null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            customerProfile: {
              select: { customerCode: true, phone: true, kycStatus: true },
            },
          },
        },
      },
    });

    if (saved.userId) {
      await tx.notification.create({
        data: {
          userId: saved.userId,
          type: "ACCOUNT_STATUS_CHANGED",
          title: `Account ${saved.accountNumber} Status: ${saved.status}`,
          message: params.input.reason
            ? `Your bank account (${saved.accountNumber}) status was updated to ${saved.status}. Reason: ${params.input.reason}`
            : `Your bank account (${saved.accountNumber}) status is now ${saved.status}.`,
          referenceId: saved.accountNumber,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: params.adminId,
        actorRole: "ADMIN",
        action:
          params.input.status === "FROZEN"
            ? "ACCOUNT_FROZEN"
            : params.input.status === "ACTIVE" && existing.status === "FROZEN"
              ? "ACCOUNT_UNFROZEN"
              : `ACCOUNT_STATUS_${params.input.status}`,
        entityType: "BankAccount",
        entityId: saved.id,
        ipAddress: params.ipAddress,
        metadata: {
          accountNumber: saved.accountNumber,
          previousStatus: existing.status,
          newStatus: saved.status,
          reason: params.input.reason ?? null,
        },
      },
    });

    return saved;
  });

  return {
    account: serializeBankAccount(updated),
  };
}

export async function updateBankAccountLimitsForAdmin(params: {
  adminId: string;
  ipAddress: string | null;
  accountId: string;
  input: AdminUpdateAccountLimitsInput;
}) {
  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.bankAccount.findUnique({
      where: { id: params.accountId },
    });

    if (!existing || existing.isSystemAccount) {
      throw new NotFoundError("Bank account not found.");
    }

    const nextDaily =
      params.input.dailyTransferLimit !== undefined
        ? params.input.dailyTransferLimit !== null
          ? new Prisma.Decimal(params.input.dailyTransferLimit.toFixed(2))
          : null
        : existing.dailyTransferLimit;

    const nextMaxSingle =
      params.input.maxSingleTransactionLimit !== undefined
        ? params.input.maxSingleTransactionLimit !== null
          ? new Prisma.Decimal(
              params.input.maxSingleTransactionLimit.toFixed(2)
            )
          : null
        : existing.maxSingleTransactionLimit;

    if (
      nextDaily !== null &&
      nextMaxSingle !== null &&
      nextDaily.lessThan(nextMaxSingle)
    ) {
      throw new BusinessRuleError(
        "dailyTransferLimit cannot be less than maxSingleTransactionLimit."
      );
    }

    const nextMinBalance =
      params.input.minBalanceRequired !== undefined
        ? params.input.minBalanceRequired !== null
          ? new Prisma.Decimal(params.input.minBalanceRequired.toFixed(2))
          : null
        : existing.minBalanceRequired;

    const saved = await tx.bankAccount.update({
      where: { id: existing.id },
      data: {
        dailyTransferLimit: nextDaily,
        maxSingleTransactionLimit: nextMaxSingle,
        minBalanceRequired: nextMinBalance,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            customerProfile: {
              select: { customerCode: true, phone: true, kycStatus: true },
            },
          },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: params.adminId,
        actorRole: "ADMIN",
        action: "ACCOUNT_LIMITS_UPDATED",
        entityType: "BankAccount",
        entityId: saved.id,
        ipAddress: params.ipAddress,
        metadata: {
          accountNumber: saved.accountNumber,
          dailyTransferLimit: saved.dailyTransferLimit
            ? formatDecimal(saved.dailyTransferLimit)
            : null,
          maxSingleTransactionLimit: saved.maxSingleTransactionLimit
            ? formatDecimal(saved.maxSingleTransactionLimit)
            : null,
          minBalanceRequired: saved.minBalanceRequired
            ? formatDecimal(saved.minBalanceRequired)
            : null,
        },
      },
    });

    return saved;
  });

  return {
    account: serializeBankAccount(updated),
  };
}
