// ============================================================================
// VaultEdge — Admin Customer Management Service
// Lists, searches, views details/accounts/transactions, activates/deactivates,
// and blocks suspicious customers with full AuditLog & session revocation.
// ============================================================================

import { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { toSafeUserDTO } from "@/server/auth/mappers";
import {
  BusinessRuleError,
  NotFoundError,
} from "@/server/errors/app-error";
import { buildPaginationMeta, formatDecimal } from "@/server/utils/banking";
import type {
  AdminCustomerListQueryInput,
  AdminTransactionListQueryInput,
  AdminUpdateCustomerStatusInput,
} from "@/server/validators/admin.schema";

export async function listCustomersForAdmin(
  query: AdminCustomerListQueryInput
) {
  const skip = (query.page - 1) * query.limit;

  const where: Prisma.UserWhereInput = {
    role: "CUSTOMER",
    ...(query.status ? { status: query.status } : {}),
    ...(query.kycStatus
      ? {
          customerProfile: {
            kycStatus: query.kycStatus,
          },
        }
      : {}),
    ...(query.search
      ? {
          OR: [
            { email: { contains: query.search, mode: "insensitive" } },
            { firstName: { contains: query.search, mode: "insensitive" } },
            { lastName: { contains: query.search, mode: "insensitive" } },
            {
              customerProfile: {
                customerCode: { contains: query.search, mode: "insensitive" },
              },
            },
            {
              customerProfile: {
                phone: { contains: query.search, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
  };

  const [total, users, totalAllCustomers, activeAllCustomers, blockedAllCustomers] =
    await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: "desc" },
        include: {
          customerProfile: true,
          ownedAccounts: {
            where: { isSystemAccount: false },
            select: {
              id: true,
              accountNumber: true,
              accountTitle: true,
              accountType: true,
              status: true,
              balance: true,
              currency: true,
            },
          },
        },
      }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.user.count({ where: { role: "CUSTOMER", status: "ACTIVE" } }),
      prisma.user.count({
        where: {
          role: "CUSTOMER",
          OR: [
            { status: "BLOCKED" },
            { status: "DEACTIVATED" },
            { customerProfile: { kycStatus: "REJECTED" } },
          ],
        },
      }),
    ]);

  const customers = users.map((u) => {
    const safeUser = toSafeUserDTO(u);
    const totalBalance = u.ownedAccounts.reduce(
      (sum, acc) => sum.plus(acc.balance),
      new Prisma.Decimal(0)
    );

    return {
      ...safeUser,
      accountsCount: u.ownedAccounts.length,
      totalBalance: formatDecimal(totalBalance),
      accounts: u.ownedAccounts.map((acc) => ({
        id: acc.id,
        accountNumber: acc.accountNumber,
        accountTitle: acc.accountTitle,
        accountType: acc.accountType,
        status: acc.status,
        currency: acc.currency,
        balance: formatDecimal(acc.balance),
      })),
    };
  });

  return {
    customers,
    summaryCounts: {
      totalCustomers: totalAllCustomers,
      activeCustomers: activeAllCustomers,
      flaggedOrBlockedCustomers: blockedAllCustomers,
    },
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function getCustomerDetailsForAdmin(customerId: string) {
  const [user, auditLogs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: customerId },
      include: {
        customerProfile: true,
        ownedAccounts: {
          where: { isSystemAccount: false },
          orderBy: { createdAt: "desc" },
        },
        customerLoanApplications: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        submittedDepositRequests: {
          orderBy: { requestedAt: "desc" },
          take: 10,
        },
        submittedWithdrawalRequests: {
          orderBy: { requestedAt: "desc" },
          take: 10,
        },
      },
    }),
    prisma.auditLog.findMany({
      where: {
        OR: [{ entityId: customerId }, { actorId: customerId }],
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  if (!user || user.role !== "CUSTOMER") {
    throw new NotFoundError("Customer record not found.");
  }

  const safeUser = toSafeUserDTO(user);
  const totalBalance = user.ownedAccounts.reduce(
    (sum, acc) => sum.plus(acc.balance),
    new Prisma.Decimal(0)
  );

  return {
    customer: safeUser,
    financialSummary: {
      totalAccounts: user.ownedAccounts.length,
      totalBalance: formatDecimal(totalBalance),
      activeLoansCount: user.customerLoanApplications.filter(
        (l) => l.status === "ACTIVE" || l.status === "APPROVED"
      ).length,
    },
    accounts: user.ownedAccounts.map((acc) => ({
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
    })),
    recentLoans: user.customerLoanApplications.map((loan) => ({
      id: loan.id,
      loanReference: loan.loanReference,
      loanType: loan.loanType,
      requestedAmount: formatDecimal(loan.requestedAmount),
      approvedAmount: loan.approvedAmount
        ? formatDecimal(loan.approvedAmount)
        : null,
      remainingBalance: formatDecimal(loan.remainingBalance),
      status: loan.status,
      createdAt: loan.createdAt.toISOString(),
    })),
    recentDeposits: user.submittedDepositRequests.map((dep) => ({
      id: dep.id,
      requestReference: dep.requestReference,
      amount: formatDecimal(dep.amount),
      status: dep.status,
      requestedAt: dep.requestedAt.toISOString(),
    })),
    recentWithdrawals: user.submittedWithdrawalRequests.map((wdr) => ({
      id: wdr.id,
      requestReference: wdr.requestReference,
      amount: formatDecimal(wdr.amount),
      status: wdr.status,
      requestedAt: wdr.requestedAt.toISOString(),
    })),
    securityAuditLogs: auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt.toISOString(),
    })),
  };
}

export async function updateCustomerStatusForAdmin(params: {
  adminId: string;
  ipAddress: string | null;
  customerId: string;
  input: AdminUpdateCustomerStatusInput;
}) {
  const updated = await prisma.$transaction(async (tx) => {
    const target = await tx.user.findUnique({
      where: { id: params.customerId },
      include: { customerProfile: true },
    });

    if (!target || target.role !== "CUSTOMER") {
      throw new NotFoundError("Customer record not found.");
    }

    if (
      params.input.status === "BLOCKED" &&
      (!params.input.reason || params.input.reason.trim().length < 3)
    ) {
      throw new BusinessRuleError(
        "A reason is required when blocking a suspicious customer account."
      );
    }

    const previousStatus = target.status;

    const updatedUser = await tx.user.update({
      where: { id: target.id },
      data: {
        status: params.input.status,
        ...(params.input.kycStatus && target.customerProfile
          ? {
              customerProfile: {
                update: {
                  kycStatus: params.input.kycStatus,
                  verifiedById: params.adminId,
                  verifiedAt:
                    params.input.kycStatus === "VERIFIED" ? new Date() : null,
                  ...(params.input.reason
                    ? { kycNotes: params.input.reason }
                    : {}),
                },
              },
            }
          : {}),
      },
      include: { customerProfile: true },
    });

    // If customer is DEACTIVATED or BLOCKED, immediately revoke all active JWT refresh tokens
    if (
      params.input.status === "BLOCKED" ||
      params.input.status === "DEACTIVATED"
    ) {
      await tx.refreshToken.updateMany({
        where: { userId: target.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    // If customer is BLOCKED, also block their owned accounts for safety
    if (params.input.status === "BLOCKED") {
      await tx.bankAccount.updateMany({
        where: {
          userId: target.id,
          isSystemAccount: false,
          status: { not: "BLOCKED" },
        },
        data: {
          status: "BLOCKED",
          frozenReason:
            params.input.reason ?? "Blocked by Admin due to suspicious activity.",
          frozenAt: new Date(),
        },
      });
    }

    await tx.notification.create({
      data: {
        userId: target.id,
        type: "ACCOUNT_STATUS_CHANGED",
        title: `Customer Profile Status Updated: ${params.input.status}`,
        message: params.input.reason
          ? `Your customer profile status has been set to ${params.input.status}. Note: ${params.input.reason}`
          : `Your customer profile status has been updated to ${params.input.status}.`,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: params.adminId,
        actorRole: "ADMIN",
        action:
          params.input.status === "BLOCKED"
            ? "CUSTOMER_BLOCKED"
            : params.input.status === "DEACTIVATED"
              ? "CUSTOMER_DEACTIVATED"
              : "CUSTOMER_ACTIVATED",
        entityType: "User",
        entityId: target.id,
        ipAddress: params.ipAddress,
        metadata: {
          previousStatus,
          newStatus: params.input.status,
          kycStatus: params.input.kycStatus ?? target.customerProfile?.kycStatus,
          reason: params.input.reason ?? null,
        },
      },
    });

    return updatedUser;
  });

  return {
    customer: toSafeUserDTO(updated),
  };
}

export async function getCustomerTransactionsForAdmin(
  customerId: string,
  query: AdminTransactionListQueryInput
) {
  const customer = await prisma.user.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      role: true,
      ownedAccounts: {
        where: { isSystemAccount: false },
        select: { id: true },
      },
    },
  });

  if (!customer || customer.role !== "CUSTOMER") {
    throw new NotFoundError("Customer record not found.");
  }

  const accountIds = customer.ownedAccounts.map((a) => a.id);
  const skip = (query.page - 1) * query.limit;

  const where: Prisma.TransactionWhereInput = {
    OR: [
      { senderAccountId: { in: accountIds } },
      { receiverAccountId: { in: accountIds } },
      { initiatedById: customerId },
    ],
    ...(query.type ? { type: query.type } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.referenceId
      ? { referenceId: { contains: query.referenceId, mode: "insensitive" } }
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

  const [total, transactions] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { executedAt: "desc" },
      include: {
        senderAccount: {
          select: {
            id: true,
            accountNumber: true,
            accountTitle: true,
            accountType: true,
            isSystemAccount: true,
          },
        },
        receiverAccount: {
          select: {
            id: true,
            accountNumber: true,
            accountTitle: true,
            accountType: true,
            isSystemAccount: true,
          },
        },
      },
    }),
  ]);

  return {
    transactions: transactions.map((t) => ({
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
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}
