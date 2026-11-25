// ============================================================================
// VaultEdge — Admin Transaction Management Service
// Lists/filters transactions, searches by referenceId, views complete ledger
// postings and suspicious flags, resolves flags, and performs atomic
// double-entry transaction reversals without ever mutating historical amounts.
// ============================================================================

import { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import {
  BusinessRuleError,
  InsufficientBalanceError,
  InvalidStatusTransitionError,
  NotFoundError,
} from "@/server/errors/app-error";
import {
  buildPaginationMeta,
  formatDecimal,
  generateTransactionReferenceId,
} from "@/server/utils/banking";
import type {
  AdminReviewTransactionInput,
  AdminTransactionListQueryInput,
} from "@/server/validators/admin.schema";

export async function listTransactionsForAdmin(
  query: AdminTransactionListQueryInput
) {
  const skip = (query.page - 1) * query.limit;

  const where: Prisma.TransactionWhereInput = {
    ...(query.type ? { type: query.type } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.isFlagged !== undefined ? { isFlagged: query.isFlagged } : {}),
    ...(query.referenceId
      ? {
          referenceId: {
            contains: query.referenceId,
            mode: "insensitive",
          },
        }
      : {}),
    ...(query.accountId
      ? {
          OR: [
            { senderAccountId: query.accountId },
            { receiverAccountId: query.accountId },
          ],
        }
      : {}),
    ...(query.customerId
      ? {
          OR: [
            { senderAccount: { userId: query.customerId } },
            { receiverAccount: { userId: query.customerId } },
            { initiatedById: query.customerId },
          ],
        }
      : {}),
    ...(query.search
      ? {
          OR: [
            { referenceId: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
            {
              senderAccount: {
                accountNumber: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
            },
            {
              receiverAccount: {
                accountNumber: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
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

  const [total, transactions, totalAll, completedCount, flaggedCount, pendingOrFailedCount, volumeAgg] =
    await Promise.all([
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
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          receiverAccount: {
            select: {
              id: true,
              accountNumber: true,
              accountTitle: true,
              accountType: true,
              isSystemAccount: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          initiatedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          suspiciousFlags: {
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      prisma.transaction.count(),
      prisma.transaction.count({ where: { status: "COMPLETED" } }),
      prisma.transaction.count({ where: { isFlagged: true } }),
      prisma.transaction.count({ where: { status: { in: ["PENDING", "FAILED"] } } }),
      prisma.transaction.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
    ]);

  return {
    transactions: transactions.map((tx) => ({
      id: tx.id,
      referenceId: tx.referenceId,
      type: tx.type,
      status: tx.status,
      amount: formatDecimal(tx.amount),
      fee: formatDecimal(tx.fee),
      totalAmount: formatDecimal(tx.totalAmount),
      description: tx.description,
      failureReason: tx.failureReason,
      isFlagged: tx.isFlagged,
      reversedTransactionId: tx.reversedTransactionId,
      executedAt: tx.executedAt.toISOString(),
      createdAt: tx.createdAt.toISOString(),
      senderAccount: tx.senderAccount
        ? {
            id: tx.senderAccount.id,
            accountNumber: tx.senderAccount.accountNumber,
            accountTitle: tx.senderAccount.accountTitle,
            accountType: tx.senderAccount.accountType,
            isSystemAccount: tx.senderAccount.isSystemAccount,
            ownerName: tx.senderAccount.user
              ? `${tx.senderAccount.user.firstName} ${tx.senderAccount.user.lastName}`.trim()
              : null,
          }
        : null,
      receiverAccount: tx.receiverAccount
        ? {
            id: tx.receiverAccount.id,
            accountNumber: tx.receiverAccount.accountNumber,
            accountTitle: tx.receiverAccount.accountTitle,
            accountType: tx.receiverAccount.accountType,
            isSystemAccount: tx.receiverAccount.isSystemAccount,
            ownerName: tx.receiverAccount.user
              ? `${tx.receiverAccount.user.firstName} ${tx.receiverAccount.user.lastName}`.trim()
              : null,
          }
        : null,
      initiatedBy: {
        id: tx.initiatedBy.id,
        fullName: `${tx.initiatedBy.firstName} ${tx.initiatedBy.lastName}`.trim(),
        email: tx.initiatedBy.email,
        role: tx.initiatedBy.role,
      },
      suspiciousFlagsCount: tx.suspiciousFlags.length,
      openFlagsCount: tx.suspiciousFlags.filter(
        (f) => f.status === "OPEN" || f.status === "UNDER_REVIEW"
      ).length,
    })),
    summaryCounts: {
      totalTransactions: totalAll,
      completedTransactions: completedCount,
      flaggedTransactions: flaggedCount,
      pendingOrFailedTransactions: pendingOrFailedCount,
      totalCompletedVolume: formatDecimal(volumeAgg._sum.amount ?? 0),
    },
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function getTransactionDetailsForAdmin(transactionId: string) {
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
          accountType: true,
          status: true,
          isSystemAccount: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      receiverAccount: {
        select: {
          id: true,
          accountNumber: true,
          accountTitle: true,
          accountType: true,
          status: true,
          isSystemAccount: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      initiatedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
      ledgerEntries: {
        orderBy: { createdAt: "asc" },
        include: {
          account: {
            select: {
              id: true,
              accountNumber: true,
              accountTitle: true,
              accountType: true,
              isSystemAccount: true,
            },
          },
        },
      },
      suspiciousFlags: {
        orderBy: { createdAt: "desc" },
        include: {
          flaggedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          resolvedByAdmin: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      reversedTransaction: {
        select: {
          id: true,
          referenceId: true,
          status: true,
          executedAt: true,
        },
      },
      reversalTransaction: {
        select: {
          id: true,
          referenceId: true,
          status: true,
          executedAt: true,
        },
      },
    },
  });

  if (!tx) {
    throw new NotFoundError("Transaction record not found.");
  }

  return {
    transaction: {
      id: tx.id,
      referenceId: tx.referenceId,
      idempotencyKey: tx.idempotencyKey,
      type: tx.type,
      status: tx.status,
      amount: formatDecimal(tx.amount),
      fee: formatDecimal(tx.fee),
      totalAmount: formatDecimal(tx.totalAmount),
      description: tx.description,
      failureReason: tx.failureReason,
      isFlagged: tx.isFlagged,
      executedAt: tx.executedAt.toISOString(),
      createdAt: tx.createdAt.toISOString(),
      senderAccount: tx.senderAccount,
      receiverAccount: tx.receiverAccount,
      initiatedBy: {
        id: tx.initiatedBy.id,
        fullName: `${tx.initiatedBy.firstName} ${tx.initiatedBy.lastName}`.trim(),
        email: tx.initiatedBy.email,
        role: tx.initiatedBy.role,
      },
      reversedTransaction: tx.reversedTransaction,
      reversalTransaction: tx.reversalTransaction,
      ledgerEntries: tx.ledgerEntries.map((entry) => ({
        id: entry.id,
        accountId: entry.accountId,
        accountNumber: entry.account.accountNumber,
        accountTitle: entry.account.accountTitle,
        isSystemAccount: entry.account.isSystemAccount,
        direction: entry.direction,
        entryCategory: entry.entryCategory,
        amount: formatDecimal(entry.amount),
        balanceBefore: formatDecimal(entry.balanceBefore),
        balanceAfter: formatDecimal(entry.balanceAfter),
        description: entry.description,
        createdAt: entry.createdAt.toISOString(),
      })),
      suspiciousFlags: tx.suspiciousFlags.map((flag) => ({
        id: flag.id,
        source: flag.source,
        ruleCode: flag.ruleCode,
        reason: flag.reason,
        status: flag.status,
        resolutionNote: flag.resolutionNote,
        createdAt: flag.createdAt.toISOString(),
        resolvedAt: flag.resolvedAt ? flag.resolvedAt.toISOString() : null,
        flaggedBy: flag.flaggedBy
          ? {
              id: flag.flaggedBy.id,
              fullName: `${flag.flaggedBy.firstName} ${flag.flaggedBy.lastName}`.trim(),
              role: flag.flaggedBy.role,
            }
          : null,
        resolvedByAdmin: flag.resolvedByAdmin
          ? {
              id: flag.resolvedByAdmin.id,
              fullName: `${flag.resolvedByAdmin.firstName} ${flag.resolvedByAdmin.lastName}`.trim(),
            }
          : null,
      })),
    },
  };
}

export async function reviewTransactionForAdmin(params: {
  adminId: string;
  ipAddress: string | null;
  transactionId: string;
  input: AdminReviewTransactionInput;
}) {
  await prisma.$transaction(async (tx) => {
    const targetTx = await tx.transaction.findFirst({
      where: {
        OR: [
          { id: params.transactionId },
          { referenceId: params.transactionId },
        ],
      },
      include: {
        senderAccount: true,
        receiverAccount: true,
        reversalTransaction: true,
        suspiciousFlags: true,
      },
    });

    if (!targetTx) {
      throw new NotFoundError("Transaction record not found.");
    }

    if (params.input.action === "FLAG_SUSPICIOUS") {
      await tx.transaction.update({
        where: { id: targetTx.id },
        data: { isFlagged: true },
      });

      const createdFlag = await tx.suspiciousTransactionFlag.create({
        data: {
          transactionId: targetTx.id,
          flaggedById: params.adminId,
          source: "STAFF_MANUAL",
          reason: params.input.note,
          status: "UNDER_REVIEW",
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: params.adminId,
          actorRole: "ADMIN",
          action: "TRANSACTION_FLAGGED_BY_ADMIN",
          entityType: "Transaction",
          entityId: targetTx.id,
          ipAddress: params.ipAddress,
          metadata: {
            referenceId: targetTx.referenceId,
            flagId: createdFlag.id,
            note: params.input.note,
          },
        },
      });

      return;
    }

    if (
      params.input.action === "RESOLVE_FLAG_SAFE" ||
      params.input.action === "CONFIRM_SUSPICIOUS"
    ) {
      const nextFlagStatus =
        params.input.action === "RESOLVE_FLAG_SAFE"
          ? "RESOLVED_SAFE"
          : "CONFIRMED_SUSPICIOUS";

      if (params.input.flagId) {
        const flag = targetTx.suspiciousFlags.find(
          (f) => f.id === params.input.flagId
        );
        if (!flag) {
          throw new NotFoundError(
            "Specified suspicious transaction flag not found on this transaction."
          );
        }

        await tx.suspiciousTransactionFlag.update({
          where: { id: flag.id },
          data: {
            status: nextFlagStatus,
            resolvedByAdminId: params.adminId,
            resolutionNote: params.input.note,
            resolvedAt: new Date(),
          },
        });
      } else {
        await tx.suspiciousTransactionFlag.updateMany({
          where: {
            transactionId: targetTx.id,
            status: { in: ["OPEN", "UNDER_REVIEW"] },
          },
          data: {
            status: nextFlagStatus,
            resolvedByAdminId: params.adminId,
            resolutionNote: params.input.note,
            resolvedAt: new Date(),
          },
        });
      }

      const remainingOpenFlags = await tx.suspiciousTransactionFlag.count({
        where: {
          transactionId: targetTx.id,
          status: { in: ["OPEN", "UNDER_REVIEW", "CONFIRMED_SUSPICIOUS"] },
        },
      });

      await tx.transaction.update({
        where: { id: targetTx.id },
        data: {
          isFlagged: remainingOpenFlags > 0,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: params.adminId,
          actorRole: "ADMIN",
          action:
            nextFlagStatus === "RESOLVED_SAFE"
              ? "TRANSACTION_FLAG_RESOLVED_SAFE"
              : "TRANSACTION_FLAG_CONFIRMED_SUSPICIOUS",
          entityType: "Transaction",
          entityId: targetTx.id,
          ipAddress: params.ipAddress,
          metadata: {
            referenceId: targetTx.referenceId,
            flagStatus: nextFlagStatus,
            note: params.input.note,
          },
        },
      });

      return;
    }

    if (params.input.action === "REVERSE_TRANSACTION") {
      if (targetTx.status === "REVERSED" || targetTx.reversalTransaction) {
        throw new InvalidStatusTransitionError(
          "This transaction has already been reversed."
        );
      }

      if (targetTx.status !== "COMPLETED") {
        throw new InvalidStatusTransitionError(
          `Only COMPLETED transactions can be reversed (current status: ${targetTx.status}).`
        );
      }

      if (
        targetTx.type === "LOAN_DISBURSEMENT" ||
        targetTx.type === "LOAN_REPAYMENT"
      ) {
        throw new BusinessRuleError(
          `Loan transactions (${targetTx.type}) must be managed through the Loan lifecycle module rather than direct reversal.`
        );
      }

      if (!targetTx.senderAccount || !targetTx.receiverAccount) {
        throw new BusinessRuleError(
          "Cannot reverse a transaction that does not have both sender and receiver accounts."
        );
      }

      // Lock/read latest sender and receiver balances inside transaction
      const [originalSender, originalReceiver] = await Promise.all([
        tx.bankAccount.findUnique({ where: { id: targetTx.senderAccount.id } }),
        tx.bankAccount.findUnique({
          where: { id: targetTx.receiverAccount.id },
        }),
      ]);

      if (!originalSender || !originalReceiver) {
        throw new NotFoundError(
          "Counterparty accounts for reversal were not found."
        );
      }

      // To reverse: debit originalReceiver by targetTx.amount and credit originalSender by targetTx.totalAmount
      if (
        !originalReceiver.isSystemAccount &&
        originalReceiver.balance.lessThan(targetTx.amount)
      ) {
        throw new InsufficientBalanceError(
          "Recipient account does not hold sufficient balance to execute an atomic transaction reversal."
        );
      }

      const receiverBefore = originalReceiver.balance;
      const receiverAfter = receiverBefore.minus(targetTx.amount);

      const senderBefore = originalSender.balance;
      const senderAfter = senderBefore.plus(targetTx.totalAmount);

      await tx.bankAccount.update({
        where: { id: originalReceiver.id },
        data: { balance: receiverAfter },
      });

      await tx.bankAccount.update({
        where: { id: originalSender.id },
        data: { balance: senderAfter },
      });

      await tx.transaction.update({
        where: { id: targetTx.id },
        data: {
          status: "REVERSED",
        },
      });

      const reversalReferenceId = generateTransactionReferenceId("REV");
      const reversalTx = await tx.transaction.create({
        data: {
          referenceId: reversalReferenceId,
          senderAccountId: originalReceiver.id,
          receiverAccountId: originalSender.id,
          initiatedById: params.adminId,
          reversedTransactionId: targetTx.id,
          type: targetTx.type,
          status: "COMPLETED",
          amount: targetTx.amount,
          fee: new Prisma.Decimal("0.00"),
          totalAmount: targetTx.totalAmount,
          description: `Compensating reversal of ${targetTx.referenceId}: ${params.input.note}`,
        },
      });

      await tx.ledgerEntry.createMany({
        data: [
          {
            transactionId: reversalTx.id,
            accountId: originalReceiver.id,
            direction: "DEBIT",
            entryCategory: "REVERSAL",
            amount: targetTx.amount,
            balanceBefore: receiverBefore,
            balanceAfter: receiverAfter,
            description: `Reversal debit for ${targetTx.referenceId}`,
          },
          {
            transactionId: reversalTx.id,
            accountId: originalSender.id,
            direction: "CREDIT",
            entryCategory: "REVERSAL",
            amount: targetTx.totalAmount,
            balanceBefore: senderBefore,
            balanceAfter: senderAfter,
            description: `Reversal credit for ${targetTx.referenceId}`,
          },
        ],
      });

      await tx.auditLog.create({
        data: {
          actorId: params.adminId,
          actorRole: "ADMIN",
          action: "TRANSACTION_REVERSED",
          entityType: "Transaction",
          entityId: targetTx.id,
          ipAddress: params.ipAddress,
          metadata: {
            originalReferenceId: targetTx.referenceId,
            reversalReferenceId: reversalTx.referenceId,
            amount: formatDecimal(targetTx.amount),
            note: params.input.note,
          },
        },
      });
    }
  });

  return getTransactionDetailsForAdmin(params.transactionId);
}
