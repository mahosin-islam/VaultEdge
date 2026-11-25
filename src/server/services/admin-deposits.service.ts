// ============================================================================
// VaultEdge — Admin Deposit Request Management Service
// Lists/filters deposit requests, views details, and atomically approves or
// rejects pending requests with balanced double-entry postings against the
// internal bank treasury account and duplicate-approval protection.
// ============================================================================

import { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import {
  BusinessRuleError,
  InvalidStatusTransitionError,
  NotFoundError,
} from "@/server/errors/app-error";
import {
  buildPaginationMeta,
  ensureSystemTreasuryAccount,
  formatDecimal,
  generateTransactionReferenceId,
} from "@/server/utils/banking";
import type {
  AdminRequestListQueryInput,
  AdminReviewRequestInput,
} from "@/server/validators/admin.schema";

function serializeDepositRequest(
  req: Prisma.DepositRequestGetPayload<{
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

const DEPOSIT_INCLUDE = {
  account: {
    select: {
      id: true,
      accountNumber: true,
      accountTitle: true,
      accountType: true,
      status: true,
      currency: true,
      balance: true,
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

export async function listDepositRequestsForAdmin(
  query: AdminRequestListQueryInput
) {
  const skip = (query.page - 1) * query.limit;

  const where: Prisma.DepositRequestWhereInput = {
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
      prisma.depositRequest.count({ where }),
      prisma.depositRequest.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { requestedAt: "desc" },
        include: DEPOSIT_INCLUDE,
      }),
      prisma.depositRequest.count(),
      prisma.depositRequest.count({ where: { status: "PENDING" } }),
      prisma.depositRequest.count({ where: { status: "APPROVED" } }),
      prisma.depositRequest.count({ where: { status: "REJECTED" } }),
      prisma.depositRequest.aggregate({
        where: { status: "APPROVED" },
        _sum: { amount: true },
      }),
    ]);

  return {
    depositRequests: requests.map(serializeDepositRequest),
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

export async function getDepositRequestDetailsForAdmin(depositId: string) {
  const req = await prisma.depositRequest.findFirst({
    where: {
      OR: [{ id: depositId }, { requestReference: depositId }],
    },
    include: DEPOSIT_INCLUDE,
  });

  if (!req) {
    throw new NotFoundError("Deposit request not found.");
  }

  return {
    depositRequest: serializeDepositRequest(req),
  };
}

export async function reviewDepositRequestForAdmin(params: {
  adminId: string;
  actorRole?: "ADMIN" | "STAFF";
  ipAddress: string | null;
  depositId: string;
  input: AdminReviewRequestInput;
}) {
  // Support both ADMIN and STAFF reviewers cleanly
  const actorRole = params.actorRole ?? "ADMIN";
  const updatedId = await prisma.$transaction(async (tx) => {
    const req = await tx.depositRequest.findFirst({
      where: {
        OR: [
          { id: params.depositId },
          { requestReference: params.depositId },
        ],
      },
      include: {
        account: true,
        customer: true,
      },
    });

    if (!req) {
      throw new NotFoundError("Deposit request not found.");
    }

    if (req.customerId === params.adminId) {
      throw new BusinessRuleError(
        "Reviewers are prohibited from reviewing their own deposit requests."
      );
    }

    if (req.status !== "PENDING" || req.transactionId !== null) {
      throw new InvalidStatusTransitionError(
        `Deposit request ${req.requestReference} has already been ${req.status.toLowerCase()}.`
      );
    }

    if (params.input.decision === "REJECT") {
      await tx.depositRequest.update({
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
          type: "DEPOSIT_REJECTED",
          title: `Deposit Request Rejected (${req.requestReference})`,
          message: `Your deposit request of $${formatDecimal(
            req.amount
          )} for account ${req.account.accountNumber} was rejected.${
            params.input.reviewNote ? ` Note: ${params.input.reviewNote}` : ""
          }`,
          referenceId: req.requestReference,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: params.adminId,
          actorRole,
          action: "DEPOSIT_REQUEST_REJECTED",
          entityType: "DepositRequest",
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

    // APPROVE flow — verify account & customer are active
    if (req.customer.status !== "ACTIVE") {
      throw new BusinessRuleError(
        `Cannot approve deposit for a customer whose status is ${req.customer.status}.`
      );
    }

    if (req.account.status !== "ACTIVE") {
      throw new BusinessRuleError(
        `Cannot credit deposit into account ${req.account.accountNumber} because its status is ${req.account.status}.`
      );
    }

    // Atomic conditional transition guard against concurrent approvals
    const claimResult = await tx.depositRequest.updateMany({
      where: {
        id: req.id,
        status: "PENDING",
        transactionId: null,
      },
      data: {
        status: "APPROVED",
        reviewedById: params.adminId,
        reviewNote:
          params.input.reviewNote ?? "Approved and credited by Admin.",
        reviewedAt: new Date(),
      },
    });

    if (claimResult.count !== 1) {
      throw new InvalidStatusTransitionError(
        "Deposit request was already processed by a concurrent operation."
      );
    }

    const treasury = await ensureSystemTreasuryAccount(tx);
    const currentAccount = await tx.bankAccount.findUnique({
      where: { id: req.accountId },
    });

    if (!currentAccount) {
      throw new NotFoundError("Target bank account not found.");
    }

    const treasuryBefore = treasury.balance;
    const treasuryAfter = treasuryBefore.minus(req.amount);

    const customerBefore = currentAccount.balance;
    const customerAfter = customerBefore.plus(req.amount);

    await tx.bankAccount.update({
      where: { id: treasury.id },
      data: { balance: treasuryAfter },
    });

    await tx.bankAccount.update({
      where: { id: currentAccount.id },
      data: { balance: customerAfter },
    });

    const referenceId = generateTransactionReferenceId("TXN");
    const depositTx = await tx.transaction.create({
      data: {
        referenceId,
        idempotencyKey: `DEP-APPROVAL-${req.id}`,
        senderAccountId: treasury.id,
        receiverAccountId: currentAccount.id,
        initiatedById: params.adminId,
        type: "DEPOSIT",
        status: "COMPLETED",
        amount: req.amount,
        fee: new Prisma.Decimal("0.00"),
        totalAmount: req.amount,
        description:
          req.description ??
          `Approved customer deposit (${req.requestReference})`,
      },
    });

    await tx.ledgerEntry.createMany({
      data: [
        {
          transactionId: depositTx.id,
          accountId: treasury.id,
          direction: "DEBIT",
          entryCategory: "PRINCIPAL",
          amount: req.amount,
          balanceBefore: treasuryBefore,
          balanceAfter: treasuryAfter,
          description: `Treasury funding for deposit ${req.requestReference}`,
        },
        {
          transactionId: depositTx.id,
          accountId: currentAccount.id,
          direction: "CREDIT",
          entryCategory: "PRINCIPAL",
          amount: req.amount,
          balanceBefore: customerBefore,
          balanceAfter: customerAfter,
          description: `Customer deposit credit (${req.requestReference})`,
        },
      ],
    });

    await tx.depositRequest.update({
      where: { id: req.id },
      data: {
        transactionId: depositTx.id,
      },
    });

    await tx.notification.create({
      data: {
        userId: req.customerId,
        type: "DEPOSIT_APPROVED",
        title: `Deposit Approved: +$${formatDecimal(req.amount)}`,
        message: `Your deposit request (${req.requestReference}) of $${formatDecimal(
          req.amount
        )} has been approved and credited to account ${
          currentAccount.accountNumber
        }. Transaction Reference: ${depositTx.referenceId}.`,
        referenceId: depositTx.referenceId,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: params.adminId,
        actorRole,
        action: "DEPOSIT_REQUEST_APPROVED",
        entityType: "DepositRequest",
        entityId: req.id,
        ipAddress: params.ipAddress,
        metadata: {
          requestReference: req.requestReference,
          transactionReferenceId: depositTx.referenceId,
          accountNumber: currentAccount.accountNumber,
          amount: formatDecimal(req.amount),
          balanceBefore: formatDecimal(customerBefore),
          balanceAfter: formatDecimal(customerAfter),
        },
      },
    });

    return req.id;
  });

  return getDepositRequestDetailsForAdmin(updatedId);
}
