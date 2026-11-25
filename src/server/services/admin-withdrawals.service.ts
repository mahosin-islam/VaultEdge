// ============================================================================
// VaultEdge — Admin Withdrawal Request Management Service
// Lists/filters withdrawal requests, views details, validates available balance,
// minimum balance floor, and account status, and atomically debits the customer
// account and credits the internal bank treasury account on approval.
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
  ensureSystemSettings,
  ensureSystemTreasuryAccount,
  formatDecimal,
  generateTransactionReferenceId,
} from "@/server/utils/banking";
import type {
  AdminRequestListQueryInput,
  AdminReviewRequestInput,
} from "@/server/validators/admin.schema";

function serializeWithdrawalRequest(
  req: Prisma.WithdrawalRequestGetPayload<{
    include: {
      account: {
        select: {
          id: true;
          accountNumber: true;
          accountTitle: true;
          accountType: true;
          status: true;
          currency: true;
          balance: true;
          minBalanceRequired: true;
        };
      };
      customer: {
        select: {
          id: true;
          firstName: true;
          lastName: true;
          email: true;
          status: true;
          customerProfile: {
            select: { customerCode: true; phone: true; kycStatus: true };
          };
        };
      };
      reviewedBy: {
        select: {
          id: true;
          firstName: true;
          lastName: true;
          email: true;
          role: true;
        };
      };
      transaction: {
        select: {
          id: true;
          referenceId: true;
          status: true;
          executedAt: true;
        };
      };
    };
  }>
) {
  return {
    id: req.id,
    requestReference: req.requestReference,
    amount: formatDecimal(req.amount),
    description: req.description,
    status: req.status,
    reviewNote: req.reviewNote,
    requestedAt: req.requestedAt.toISOString(),
    reviewedAt: req.reviewedAt ? req.reviewedAt.toISOString() : null,
    account: {
      id: req.account.id,
      accountNumber: req.account.accountNumber,
      accountTitle: req.account.accountTitle,
      accountType: req.account.accountType,
      status: req.account.status,
      currency: req.account.currency,
      balance: formatDecimal(req.account.balance),
      minBalanceRequired: req.account.minBalanceRequired
        ? formatDecimal(req.account.minBalanceRequired)
        : null,
    },
    customer: {
      id: req.customer.id,
      fullName: `${req.customer.firstName} ${req.customer.lastName}`.trim(),
      email: req.customer.email,
      status: req.customer.status,
      customerCode: req.customer.customerProfile?.customerCode ?? null,
      phone: req.customer.customerProfile?.phone ?? null,
      kycStatus: req.customer.customerProfile?.kycStatus ?? null,
    },
    reviewedBy: req.reviewedBy
      ? {
          id: req.reviewedBy.id,
          fullName: `${req.reviewedBy.firstName} ${req.reviewedBy.lastName}`.trim(),
          email: req.reviewedBy.email,
          role: req.reviewedBy.role,
        }
      : null,
    transaction: req.transaction
      ? {
          id: req.transaction.id,
          referenceId: req.transaction.referenceId,
          status: req.transaction.status,
          executedAt: req.transaction.executedAt.toISOString(),
        }
      : null,
  };
}

const WITHDRAWAL_INCLUDE = {
  account: {
    select: {
      id: true,
      accountNumber: true,
      accountTitle: true,
      accountType: true,
      status: true,
      currency: true,
      balance: true,
      minBalanceRequired: true,
    },
  },
  customer: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      status: true,
      customerProfile: {
        select: { customerCode: true, phone: true, kycStatus: true },
      },
    },
  },
  reviewedBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  },
  transaction: {
    select: {
      id: true,
      referenceId: true,
      status: true,
      executedAt: true,
    },
  },
} as const;

export async function listWithdrawalRequestsForAdmin(
  query: AdminRequestListQueryInput
) {
  const skip = (query.page - 1) * query.limit;

  const where: Prisma.WithdrawalRequestWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.customerId ? { customerId: query.customerId } : {}),
    ...(query.accountId ? { accountId: query.accountId } : {}),
    ...(query.search
      ? {
          OR: [
            {
              requestReference: {
                contains: query.search,
                mode: "insensitive",
              },
            },
            { description: { contains: query.search, mode: "insensitive" } },
            {
              account: {
                accountNumber: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
            },
            {
              customer: {
                email: { contains: query.search, mode: "insensitive" },
              },
            },
            {
              customer: {
                firstName: { contains: query.search, mode: "insensitive" },
              },
            },
            {
              customer: {
                lastName: { contains: query.search, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
    ...(query.startDate || query.endDate
      ? {
          requestedAt: {
            ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
            ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
          },
        }
      : {}),
  };

  const [total, requests, totalAll, pendingCount, approvedCount, rejectedCount, approvedAgg] =
    await Promise.all([
      prisma.withdrawalRequest.count({ where }),
      prisma.withdrawalRequest.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { requestedAt: "desc" },
        include: WITHDRAWAL_INCLUDE,
      }),
      prisma.withdrawalRequest.count(),
      prisma.withdrawalRequest.count({ where: { status: "PENDING" } }),
      prisma.withdrawalRequest.count({ where: { status: "APPROVED" } }),
      prisma.withdrawalRequest.count({ where: { status: "REJECTED" } }),
      prisma.withdrawalRequest.aggregate({
        where: { status: "APPROVED" },
        _sum: { amount: true },
      }),
    ]);

  return {
    withdrawalRequests: requests.map(serializeWithdrawalRequest),
    summaryCounts: {
      totalRequests: totalAll,
      pendingCount,
      approvedCount,
      rejectedCount,
      totalApprovedVolume: formatDecimal(approvedAgg._sum.amount ?? 0),
    },
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function getWithdrawalRequestDetailsForAdmin(
  withdrawalId: string
) {
  const req = await prisma.withdrawalRequest.findFirst({
    where: {
      OR: [{ id: withdrawalId }, { requestReference: withdrawalId }],
    },
    include: WITHDRAWAL_INCLUDE,
  });

  if (!req) {
    throw new NotFoundError("Withdrawal request not found.");
  }

  return {
    withdrawalRequest: serializeWithdrawalRequest(req),
  };
}

export async function reviewWithdrawalRequestForAdmin(params: {
  adminId: string;
  actorRole?: "ADMIN" | "STAFF";
  ipAddress: string | null;
  withdrawalId: string;
  input: AdminReviewRequestInput;
}) {
  // Support both ADMIN and STAFF reviewers cleanly
  const actorRole = params.actorRole ?? "ADMIN";
  const updatedId = await prisma.$transaction(async (tx) => {
    const req = await tx.withdrawalRequest.findFirst({
      where: {
        OR: [
          { id: params.withdrawalId },
          { requestReference: params.withdrawalId },
        ],
      },
      include: {
        account: true,
        customer: true,
      },
    });

    if (!req) {
      throw new NotFoundError("Withdrawal request not found.");
    }

    if (req.customerId === params.adminId) {
      throw new BusinessRuleError(
        "Reviewers are prohibited from reviewing their own withdrawal requests."
      );
    }

    if (req.status !== "PENDING" || req.transactionId !== null) {
      throw new InvalidStatusTransitionError(
        `Withdrawal request ${req.requestReference} has already been ${req.status.toLowerCase()}.`
      );
    }

    if (params.input.decision === "REJECT") {
      await tx.withdrawalRequest.update({
        where: { id: req.id },
        data: {
          status: "REJECTED",
          reviewedById: params.adminId,
          reviewNote:
            params.input.reviewNote ?? "Rejected by Bank Administration.",
          reviewedAt: new Date(),
        },
      });

      await tx.notification.create({
        data: {
          userId: req.customerId,
          type: "WITHDRAWAL_REJECTED",
          title: `Withdrawal Request Rejected (${req.requestReference})`,
          message: `Your withdrawal request of $${formatDecimal(
            req.amount
          )} from account ${req.account.accountNumber} was rejected.${
            params.input.reviewNote ? ` Note: ${params.input.reviewNote}` : ""
          }`,
          referenceId: req.requestReference,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: params.adminId,
          actorRole,
          action: "WITHDRAWAL_REQUEST_REJECTED",
          entityType: "WithdrawalRequest",
          entityId: req.id,
          ipAddress: params.ipAddress,
          metadata: {
            requestReference: req.requestReference,
            amount: formatDecimal(req.amount),
            accountNumber: req.account.accountNumber,
            reviewNote: params.input.reviewNote ?? null,
          },
        },
      });

      return req.id;
    }

    // APPROVE flow — verify customer & account status and balance rules
    if (req.customer.status !== "ACTIVE") {
      throw new BusinessRuleError(
        `Cannot approve withdrawal for a customer whose status is ${req.customer.status}.`
      );
    }

    const currentAccount = await tx.bankAccount.findUnique({
      where: { id: req.accountId },
    });

    if (!currentAccount) {
      throw new NotFoundError("Source bank account not found.");
    }

    if (currentAccount.status !== "ACTIVE") {
      throw new BusinessRuleError(
        `Cannot debit withdrawal from account ${currentAccount.accountNumber} because its status is ${currentAccount.status}.`
      );
    }

    const settings = await ensureSystemSettings(tx);
    const effectiveMinBalance =
      currentAccount.minBalanceRequired ?? settings.defaultMinAccountBalance;
    const effectiveMaxSingle =
      currentAccount.maxSingleTransactionLimit ??
      settings.defaultMaxSingleTransfer;

    if (req.amount.greaterThan(effectiveMaxSingle)) {
      throw new BusinessRuleError(
        `Withdrawal amount ($${formatDecimal(
          req.amount
        )}) exceeds the account's maximum single transaction limit ($${formatDecimal(
          effectiveMaxSingle
        )}).`
      );
    }

    if (currentAccount.balance.lessThan(req.amount)) {
      throw new InsufficientBalanceError(
        `Insufficient account balance ($${formatDecimal(
          currentAccount.balance
        )}) to approve withdrawal of $${formatDecimal(req.amount)}.`
      );
    }

    const projectedAfter = currentAccount.balance.minus(req.amount);
    if (projectedAfter.lessThan(effectiveMinBalance)) {
      throw new InsufficientBalanceError(
        `Approving this withdrawal would bring account ${
          currentAccount.accountNumber
        } below the required minimum balance of $${formatDecimal(
          effectiveMinBalance
        )} (available: $${formatDecimal(currentAccount.balance)}).`
      );
    }

    // Atomic conditional claim on WithdrawalRequest + conditional balance guard
    const claimResult = await tx.withdrawalRequest.updateMany({
      where: {
        id: req.id,
        status: "PENDING",
        transactionId: null,
      },
      data: {
        status: "APPROVED",
        reviewedById: params.adminId,
        reviewNote:
          params.input.reviewNote ?? "Approved and disbursed by Admin.",
        reviewedAt: new Date(),
      },
    });

    if (claimResult.count !== 1) {
      throw new InvalidStatusTransitionError(
        "Withdrawal request was already processed by a concurrent operation."
      );
    }

    // Conditional atomic balance debit to prevent concurrent withdrawal overdraft race conditions
    const minRequiredBeforeDebit = req.amount.plus(effectiveMinBalance);
    const debitGuard = await tx.bankAccount.updateMany({
      where: {
        id: currentAccount.id,
        status: "ACTIVE",
        balance: { gte: minRequiredBeforeDebit },
      },
      data: {
        balance: { decrement: req.amount },
      },
    });

    if (debitGuard.count !== 1) {
      throw new InsufficientBalanceError(
        "Concurrent balance modification detected: insufficient remaining balance to complete withdrawal safely."
      );
    }

    const treasury = await ensureSystemTreasuryAccount(tx);
    const treasuryBefore = treasury.balance;
    const treasuryAfter = treasuryBefore.plus(req.amount);

    await tx.bankAccount.update({
      where: { id: treasury.id },
      data: { balance: treasuryAfter },
    });

    const customerBefore = currentAccount.balance;
    const customerAfter = customerBefore.minus(req.amount);

    const referenceId = generateTransactionReferenceId("TXN");
    const withdrawalTx = await tx.transaction.create({
      data: {
        referenceId,
        idempotencyKey: `WDR-APPROVAL-${req.id}`,
        senderAccountId: currentAccount.id,
        receiverAccountId: treasury.id,
        initiatedById: params.adminId,
        type: "WITHDRAWAL",
        status: "COMPLETED",
        amount: req.amount,
        fee: new Prisma.Decimal("0.00"),
        totalAmount: req.amount,
        description:
          req.description ??
          `Approved customer withdrawal (${req.requestReference})`,
      },
    });

    await tx.ledgerEntry.createMany({
      data: [
        {
          transactionId: withdrawalTx.id,
          accountId: currentAccount.id,
          direction: "DEBIT",
          entryCategory: "PRINCIPAL",
          amount: req.amount,
          balanceBefore: customerBefore,
          balanceAfter: customerAfter,
          description: `Customer withdrawal debit (${req.requestReference})`,
        },
        {
          transactionId: withdrawalTx.id,
          accountId: treasury.id,
          direction: "CREDIT",
          entryCategory: "PRINCIPAL",
          amount: req.amount,
          balanceBefore: treasuryBefore,
          balanceAfter: treasuryAfter,
          description: `Treasury settlement for withdrawal ${req.requestReference}`,
        },
      ],
    });

    await tx.withdrawalRequest.update({
      where: { id: req.id },
      data: {
        transactionId: withdrawalTx.id,
      },
    });

    await tx.notification.create({
      data: {
        userId: req.customerId,
        type: "WITHDRAWAL_APPROVED",
        title: `Withdrawal Approved: -$${formatDecimal(req.amount)}`,
        message: `Your withdrawal request (${req.requestReference}) of $${formatDecimal(
          req.amount
        )} from account ${
          currentAccount.accountNumber
        } has been approved. Transaction Reference: ${withdrawalTx.referenceId}.`,
        referenceId: withdrawalTx.referenceId,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: params.adminId,
        actorRole,
        action: "WITHDRAWAL_REQUEST_APPROVED",
        entityType: "WithdrawalRequest",
        entityId: req.id,
        ipAddress: params.ipAddress,
        metadata: {
          requestReference: req.requestReference,
          transactionReferenceId: withdrawalTx.referenceId,
          accountNumber: currentAccount.accountNumber,
          amount: formatDecimal(req.amount),
          balanceBefore: formatDecimal(customerBefore),
          balanceAfter: formatDecimal(customerAfter),
        },
      },
    });

    return req.id;
  });

  return getWithdrawalRequestDetailsForAdmin(updatedId);
}
