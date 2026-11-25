// ============================================================================
// VaultEdge — Admin Loan Management Service
// Lists/filters loan applications, views complete application + customer +
// staff notes + repayment schedule + repayment history, and atomically
// approves (generating schedule + disbursing funds via LOAN_DISBURSEMENT
// transaction & double-entry ledger) or rejects applications.
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
  AdminLoanDecisionInput,
  AdminLoanListQueryInput,
} from "@/server/validators/admin.schema";

const LOAN_LIST_INCLUDE = {
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
  disbursementAccount: {
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
  reviewedByStaff: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  },
  decidedByAdmin: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  },
  disbursementTransaction: {
    select: {
      id: true,
      referenceId: true,
      status: true,
      executedAt: true,
    },
  },
  _count: {
    select: {
      notes: true,
      repaymentSchedules: true,
      repayments: true,
    },
  },
} as const;

export async function listLoansForAdmin(query: AdminLoanListQueryInput) {
  const skip = (query.page - 1) * query.limit;

  const where: Prisma.LoanApplicationWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.loanType ? { loanType: query.loanType } : {}),
    ...(query.customerId ? { customerId: query.customerId } : {}),
    ...(query.search
      ? {
          OR: [
            {
              loanReference: {
                contains: query.search,
                mode: "insensitive",
              },
            },
            { description: { contains: query.search, mode: "insensitive" } },
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
          createdAt: {
            ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
            ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
          },
        }
      : {}),
  };

  const [
    total,
    loans,
    totalLoans,
    pendingReviewCount,
    activeCount,
    rejectedCount,
    portfolioAgg,
  ] = await Promise.all([
    prisma.loanApplication.count({ where }),
    prisma.loanApplication.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { createdAt: "desc" },
      include: LOAN_LIST_INCLUDE,
    }),
    prisma.loanApplication.count(),
    prisma.loanApplication.count({
      where: { status: { in: ["PENDING", "UNDER_REVIEW"] } },
    }),
    prisma.loanApplication.count({
      where: { status: { in: ["APPROVED", "ACTIVE"] } },
    }),
    prisma.loanApplication.count({ where: { status: "REJECTED" } }),
    prisma.loanApplication.aggregate({
      where: { status: { in: ["APPROVED", "ACTIVE", "COMPLETED"] } },
      _sum: { approvedAmount: true, remainingBalance: true },
    }),
  ]);

  return {
    loans: loans.map((loan) => ({
      id: loan.id,
      loanReference: loan.loanReference,
      loanType: loan.loanType,
      requestedAmount: formatDecimal(loan.requestedAmount),
      approvedAmount: loan.approvedAmount
        ? formatDecimal(loan.approvedAmount)
        : null,
      interestRate: formatDecimal(loan.interestRate),
      durationMonths: loan.durationMonths,
      monthlyIncome: formatDecimal(loan.monthlyIncome),
      employmentStatus: loan.employmentStatus,
      description: loan.description,
      status: loan.status,
      totalPayableAmount: loan.totalPayableAmount
        ? formatDecimal(loan.totalPayableAmount)
        : null,
      monthlyInstallment: loan.monthlyInstallment
        ? formatDecimal(loan.monthlyInstallment)
        : null,
      totalRepaidAmount: formatDecimal(loan.totalRepaidAmount),
      remainingBalance: formatDecimal(loan.remainingBalance),
      rejectionReason: loan.rejectionReason,
      forwardedForApprovalAt: loan.forwardedForApprovalAt
        ? loan.forwardedForApprovalAt.toISOString()
        : null,
      decidedAt: loan.decidedAt ? loan.decidedAt.toISOString() : null,
      disbursedAt: loan.disbursedAt ? loan.disbursedAt.toISOString() : null,
      completedAt: loan.completedAt ? loan.completedAt.toISOString() : null,
      createdAt: loan.createdAt.toISOString(),
      customer: {
        id: loan.customer.id,
        fullName: `${loan.customer.firstName} ${loan.customer.lastName}`.trim(),
        email: loan.customer.email,
        status: loan.customer.status,
        customerCode: loan.customer.customerProfile?.customerCode ?? null,
        phone: loan.customer.customerProfile?.phone ?? null,
        kycStatus: loan.customer.customerProfile?.kycStatus ?? null,
      },
      disbursementAccount: {
        id: loan.disbursementAccount.id,
        accountNumber: loan.disbursementAccount.accountNumber,
        accountTitle: loan.disbursementAccount.accountTitle,
        accountType: loan.disbursementAccount.accountType,
        status: loan.disbursementAccount.status,
        currency: loan.disbursementAccount.currency,
        balance: formatDecimal(loan.disbursementAccount.balance),
      },
      reviewedByStaff: loan.reviewedByStaff
        ? {
            id: loan.reviewedByStaff.id,
            fullName: `${loan.reviewedByStaff.firstName} ${loan.reviewedByStaff.lastName}`.trim(),
            email: loan.reviewedByStaff.email,
          }
        : null,
      decidedByAdmin: loan.decidedByAdmin
        ? {
            id: loan.decidedByAdmin.id,
            fullName: `${loan.decidedByAdmin.firstName} ${loan.decidedByAdmin.lastName}`.trim(),
            email: loan.decidedByAdmin.email,
          }
        : null,
      disbursementTransaction: loan.disbursementTransaction
        ? {
            id: loan.disbursementTransaction.id,
            referenceId: loan.disbursementTransaction.referenceId,
            status: loan.disbursementTransaction.status,
            executedAt:
              loan.disbursementTransaction.executedAt.toISOString(),
          }
        : null,
      notesCount: loan._count.notes,
      installmentsCount: loan._count.repaymentSchedules,
      repaymentsCount: loan._count.repayments,
    })),
    summaryCounts: {
      totalLoans,
      pendingReviewCount,
      activeCount,
      rejectedCount,
      totalDisbursedPortfolio: formatDecimal(
        portfolioAgg._sum.approvedAmount ?? 0
      ),
      totalRemainingBalance: formatDecimal(
        portfolioAgg._sum.remainingBalance ?? 0
      ),
    },
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function getLoanDetailsForAdmin(loanId: string) {
  const loan = await prisma.loanApplication.findFirst({
    where: {
      OR: [{ id: loanId }, { loanReference: loanId }],
    },
    include: {
      ...LOAN_LIST_INCLUDE,
      notes: {
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      },
      repaymentSchedules: {
        orderBy: { installmentNumber: "asc" },
      },
      repayments: {
        orderBy: { paidAt: "desc" },
        include: {
          transaction: {
            select: {
              id: true,
              referenceId: true,
              status: true,
              executedAt: true,
            },
          },
          paidFromAccount: {
            select: {
              id: true,
              accountNumber: true,
              accountTitle: true,
            },
          },
        },
      },
    },
  });

  if (!loan) {
    throw new NotFoundError("Loan application not found.");
  }

  return {
    loan: {
      id: loan.id,
      loanReference: loan.loanReference,
      loanType: loan.loanType,
      requestedAmount: formatDecimal(loan.requestedAmount),
      approvedAmount: loan.approvedAmount
        ? formatDecimal(loan.approvedAmount)
        : null,
      interestRate: formatDecimal(loan.interestRate),
      durationMonths: loan.durationMonths,
      monthlyIncome: formatDecimal(loan.monthlyIncome),
      employmentStatus: loan.employmentStatus,
      description: loan.description,
      status: loan.status,
      totalPayableAmount: loan.totalPayableAmount
        ? formatDecimal(loan.totalPayableAmount)
        : null,
      monthlyInstallment: loan.monthlyInstallment
        ? formatDecimal(loan.monthlyInstallment)
        : null,
      totalRepaidAmount: formatDecimal(loan.totalRepaidAmount),
      remainingBalance: formatDecimal(loan.remainingBalance),
      rejectionReason: loan.rejectionReason,
      forwardedForApprovalAt: loan.forwardedForApprovalAt
        ? loan.forwardedForApprovalAt.toISOString()
        : null,
      decidedAt: loan.decidedAt ? loan.decidedAt.toISOString() : null,
      disbursedAt: loan.disbursedAt ? loan.disbursedAt.toISOString() : null,
      completedAt: loan.completedAt ? loan.completedAt.toISOString() : null,
      createdAt: loan.createdAt.toISOString(),
      updatedAt: loan.updatedAt.toISOString(),
      customer: {
        id: loan.customer.id,
        fullName: `${loan.customer.firstName} ${loan.customer.lastName}`.trim(),
        email: loan.customer.email,
        status: loan.customer.status,
        customerCode: loan.customer.customerProfile?.customerCode ?? null,
        phone: loan.customer.customerProfile?.phone ?? null,
        kycStatus: loan.customer.customerProfile?.kycStatus ?? null,
      },
      disbursementAccount: {
        id: loan.disbursementAccount.id,
        accountNumber: loan.disbursementAccount.accountNumber,
        accountTitle: loan.disbursementAccount.accountTitle,
        accountType: loan.disbursementAccount.accountType,
        status: loan.disbursementAccount.status,
        currency: loan.disbursementAccount.currency,
        balance: formatDecimal(loan.disbursementAccount.balance),
      },
      reviewedByStaff: loan.reviewedByStaff
        ? {
            id: loan.reviewedByStaff.id,
            fullName: `${loan.reviewedByStaff.firstName} ${loan.reviewedByStaff.lastName}`.trim(),
            email: loan.reviewedByStaff.email,
          }
        : null,
      decidedByAdmin: loan.decidedByAdmin
        ? {
            id: loan.decidedByAdmin.id,
            fullName: `${loan.decidedByAdmin.firstName} ${loan.decidedByAdmin.lastName}`.trim(),
            email: loan.decidedByAdmin.email,
          }
        : null,
      disbursementTransaction: loan.disbursementTransaction
        ? {
            id: loan.disbursementTransaction.id,
            referenceId: loan.disbursementTransaction.referenceId,
            status: loan.disbursementTransaction.status,
            executedAt:
              loan.disbursementTransaction.executedAt.toISOString(),
          }
        : null,
      notes: loan.notes.map((n) => ({
        id: n.id,
        note: n.note,
        isInternal: n.isInternal,
        createdAt: n.createdAt.toISOString(),
        author: {
          id: n.author.id,
          fullName: `${n.author.firstName} ${n.author.lastName}`.trim(),
          email: n.author.email,
          role: n.author.role,
        },
      })),
      repaymentSchedule: loan.repaymentSchedules.map((s) => ({
        id: s.id,
        installmentNumber: s.installmentNumber,
        dueDate: s.dueDate.toISOString(),
        principalAmount: formatDecimal(s.principalAmount),
        interestAmount: formatDecimal(s.interestAmount),
        totalInstallment: formatDecimal(s.totalInstallment),
        paidAmount: formatDecimal(s.paidAmount),
        status: s.status,
        paidAt: s.paidAt ? s.paidAt.toISOString() : null,
      })),
      repayments: loan.repayments.map((r) => ({
        id: r.id,
        scheduleId: r.scheduleId,
        amountPaid: formatDecimal(r.amountPaid),
        principalComponent: formatDecimal(r.principalComponent),
        interestComponent: formatDecimal(r.interestComponent),
        remainingBalanceAfter: formatDecimal(r.remainingBalanceAfter),
        paidAt: r.paidAt.toISOString(),
        paidFromAccount: r.paidFromAccount,
        transaction: {
          id: r.transaction.id,
          referenceId: r.transaction.referenceId,
          status: r.transaction.status,
          executedAt: r.transaction.executedAt.toISOString(),
        },
      })),
    },
  };
}

/**
 * Generates an exact Decimal installment breakdown across `durationMonths`
 * so the sum of all principal installments equals `approvedPrincipal` and the
 * sum of all interest installments equals `totalInterest` to the exact cent.
 */
function buildInstallmentBreakdown(params: {
  approvedPrincipal: Prisma.Decimal;
  annualInterestRate: Prisma.Decimal;
  durationMonths: number;
  startDate: Date;
}) {
  const { approvedPrincipal, annualInterestRate, durationMonths, startDate } =
    params;

  // Total simple annualized interest over durationMonths: P * (R / 100) * (months / 12)
  const rawTotalInterest = approvedPrincipal
    .mul(annualInterestRate)
    .div(new Prisma.Decimal(100))
    .mul(new Prisma.Decimal(durationMonths))
    .div(new Prisma.Decimal(12));

  const totalInterest = new Prisma.Decimal(rawTotalInterest.toFixed(2));
  const totalPayable = approvedPrincipal.plus(totalInterest);

  const basePrincipalPerMonth = new Prisma.Decimal(
    approvedPrincipal.div(new Prisma.Decimal(durationMonths)).toFixed(2)
  );
  const baseInterestPerMonth = new Prisma.Decimal(
    totalInterest.div(new Prisma.Decimal(durationMonths)).toFixed(2)
  );

  let accumulatedPrincipal = new Prisma.Decimal("0.00");
  let accumulatedInterest = new Prisma.Decimal("0.00");

  const installments: Array<{
    installmentNumber: number;
    dueDate: Date;
    principalAmount: Prisma.Decimal;
    interestAmount: Prisma.Decimal;
    totalInstallment: Prisma.Decimal;
  }> = [];

  for (let i = 1; i <= durationMonths; i++) {
    const isLast = i === durationMonths;
    const principalAmount = isLast
      ? approvedPrincipal.minus(accumulatedPrincipal)
      : basePrincipalPerMonth;
    const interestAmount = isLast
      ? totalInterest.minus(accumulatedInterest)
      : baseInterestPerMonth;

    accumulatedPrincipal = accumulatedPrincipal.plus(principalAmount);
    accumulatedInterest = accumulatedInterest.plus(interestAmount);

    const dueDate = new Date(startDate.getTime());
    dueDate.setUTCMonth(dueDate.getUTCMonth() + i);

    installments.push({
      installmentNumber: i,
      dueDate,
      principalAmount,
      interestAmount,
      totalInstallment: principalAmount.plus(interestAmount),
    });
  }

  const firstMonthInstallment =
    installments[0]?.totalInstallment ?? totalPayable;

  return {
    totalInterest,
    totalPayable,
    monthlyInstallment: firstMonthInstallment,
    installments,
  };
}

export async function decideLoanApplicationForAdmin(params: {
  adminId: string;
  ipAddress: string | null;
  loanId: string;
  input: AdminLoanDecisionInput;
}) {
  const updatedId = await prisma.$transaction(async (tx) => {
    const loan = await tx.loanApplication.findFirst({
      where: {
        OR: [{ id: params.loanId }, { loanReference: params.loanId }],
      },
      include: {
        customer: true,
        disbursementAccount: true,
      },
    });

    if (!loan) {
      throw new NotFoundError("Loan application not found.");
    }

    if (
      loan.status !== "PENDING" &&
      loan.status !== "UNDER_REVIEW"
    ) {
      throw new InvalidStatusTransitionError(
        `Loan application ${loan.loanReference} cannot be decided because its current status is ${loan.status}.`
      );
    }

    if (loan.disbursementTransactionId !== null) {
      throw new InvalidStatusTransitionError(
        `Loan application ${loan.loanReference} has already been disbursed.`
      );
    }

    const now = new Date();

    if (params.input.decision === "REJECT") {
      const reason =
        params.input.rejectionReason ??
        params.input.note ??
        "Loan application rejected by Admin.";

      const claim = await tx.loanApplication.updateMany({
        where: {
          id: loan.id,
          status: { in: ["PENDING", "UNDER_REVIEW"] },
        },
        data: {
          status: "REJECTED",
          decidedByAdminId: params.adminId,
          rejectionReason: reason,
          decidedAt: now,
        },
      });

      if (claim.count !== 1) {
        throw new InvalidStatusTransitionError(
          "Loan application was already processed by a concurrent operation."
        );
      }

      if (params.input.note) {
        await tx.loanNote.create({
          data: {
            loanApplicationId: loan.id,
            authorId: params.adminId,
            note: `Admin Rejection Decision: ${params.input.note}`,
            isInternal: true,
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: loan.customerId,
          type: "LOAN_REJECTED",
          title: `Loan Application Rejected (${loan.loanReference})`,
          message: `Your ${loan.loanType.toLowerCase()} loan application (${
            loan.loanReference
          }) for $${formatDecimal(
            loan.requestedAmount
          )} was not approved. Reason: ${reason}`,
          referenceId: loan.loanReference,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: params.adminId,
          actorRole: "ADMIN",
          action: "LOAN_APPLICATION_REJECTED",
          entityType: "LoanApplication",
          entityId: loan.id,
          ipAddress: params.ipAddress,
          metadata: {
            loanReference: loan.loanReference,
            requestedAmount: formatDecimal(loan.requestedAmount),
            rejectionReason: reason,
          },
        },
      });

      return loan.id;
    }

    // APPROVE & DISBURSE flow
    if (loan.customer.status !== "ACTIVE") {
      throw new BusinessRuleError(
        `Cannot approve or disburse a loan for a customer whose status is ${loan.customer.status}.`
      );
    }

    const targetAccount = await tx.bankAccount.findUnique({
      where: { id: loan.disbursementAccountId },
    });

    if (!targetAccount || targetAccount.isSystemAccount) {
      throw new NotFoundError("Disbursement bank account not found.");
    }

    if (targetAccount.userId !== loan.customerId) {
      throw new BusinessRuleError(
        "Disbursement bank account does not belong to the loan applicant."
      );
    }

    if (targetAccount.status !== "ACTIVE") {
      throw new BusinessRuleError(
        `Cannot disburse loan into account ${targetAccount.accountNumber} because its status is ${targetAccount.status}.`
      );
    }

    const approvedPrincipal =
      params.input.approvedAmount !== undefined
        ? new Prisma.Decimal(params.input.approvedAmount.toFixed(2))
        : loan.requestedAmount;

    if (approvedPrincipal.lte(0)) {
      throw new BusinessRuleError(
        "Approved loan principal must be greater than zero."
      );
    }

    const annualInterestRate =
      params.input.interestRate !== undefined
        ? new Prisma.Decimal(params.input.interestRate.toFixed(2))
        : loan.interestRate;

    const schedulePlan = buildInstallmentBreakdown({
      approvedPrincipal,
      annualInterestRate,
      durationMonths: loan.durationMonths,
      startDate: now,
    });

    // Atomic conditional transition claim to prevent duplicate approvals/disbursements
    const claim = await tx.loanApplication.updateMany({
      where: {
        id: loan.id,
        status: { in: ["PENDING", "UNDER_REVIEW"] },
        disbursementTransactionId: null,
      },
      data: {
        status: "ACTIVE",
        decidedByAdminId: params.adminId,
        approvedAmount: approvedPrincipal,
        interestRate: annualInterestRate,
        totalPayableAmount: schedulePlan.totalPayable,
        monthlyInstallment: schedulePlan.monthlyInstallment,
        totalRepaidAmount: new Prisma.Decimal("0.00"),
        remainingBalance: schedulePlan.totalPayable,
        decidedAt: now,
        disbursedAt: now,
      },
    });

    if (claim.count !== 1) {
      throw new InvalidStatusTransitionError(
        "Loan application was already processed by a concurrent operation."
      );
    }

    // Disburse funds from Internal Bank Treasury into Customer Disbursement Account
    const treasury = await ensureSystemTreasuryAccount(tx);
    const treasuryBefore = treasury.balance;
    const treasuryAfter = treasuryBefore.minus(approvedPrincipal);

    const customerBefore = targetAccount.balance;
    const customerAfter = customerBefore.plus(approvedPrincipal);

    await tx.bankAccount.update({
      where: { id: treasury.id },
      data: { balance: treasuryAfter },
    });

    await tx.bankAccount.update({
      where: { id: targetAccount.id },
      data: { balance: customerAfter },
    });

    const txRef = generateTransactionReferenceId("TXN");
    const disbursementTx = await tx.transaction.create({
      data: {
        referenceId: txRef,
        idempotencyKey: `LOAN-DISBURSEMENT-${loan.id}`,
        senderAccountId: treasury.id,
        receiverAccountId: targetAccount.id,
        initiatedById: params.adminId,
        type: "LOAN_DISBURSEMENT",
        status: "COMPLETED",
        amount: approvedPrincipal,
        fee: new Prisma.Decimal("0.00"),
        totalAmount: approvedPrincipal,
        description: `Approved ${loan.loanType} Loan Disbursement (${loan.loanReference})`,
      },
    });

    await tx.ledgerEntry.createMany({
      data: [
        {
          transactionId: disbursementTx.id,
          accountId: treasury.id,
          direction: "DEBIT",
          entryCategory: "PRINCIPAL",
          amount: approvedPrincipal,
          balanceBefore: treasuryBefore,
          balanceAfter: treasuryAfter,
          description: `Treasury loan disbursement for ${loan.loanReference}`,
        },
        {
          transactionId: disbursementTx.id,
          accountId: targetAccount.id,
          direction: "CREDIT",
          entryCategory: "PRINCIPAL",
          amount: approvedPrincipal,
          balanceBefore: customerBefore,
          balanceAfter: customerAfter,
          description: `Loan disbursement credit (${loan.loanReference})`,
        },
      ],
    });

    await tx.loanApplication.update({
      where: { id: loan.id },
      data: {
        disbursementTransactionId: disbursementTx.id,
      },
    });

    await tx.loanRepaymentSchedule.createMany({
      data: schedulePlan.installments.map((inst) => ({
        loanApplicationId: loan.id,
        installmentNumber: inst.installmentNumber,
        dueDate: inst.dueDate,
        principalAmount: inst.principalAmount,
        interestAmount: inst.interestAmount,
        totalInstallment: inst.totalInstallment,
        paidAmount: new Prisma.Decimal("0.00"),
        status: "PENDING",
      })),
    });

    if (params.input.note) {
      await tx.loanNote.create({
        data: {
          loanApplicationId: loan.id,
          authorId: params.adminId,
          note: `Admin Approval & Disbursement Note: ${params.input.note}`,
          isInternal: true,
        },
      });
    }

    await tx.notification.create({
      data: {
        userId: loan.customerId,
        type: "LOAN_APPROVED",
        title: `Loan Approved & Disbursed: +$${formatDecimal(
          approvedPrincipal
        )}`,
        message: `Your ${loan.loanType.toLowerCase()} loan application (${
          loan.loanReference
        }) has been approved and $${formatDecimal(
          approvedPrincipal
        )} has been disbursed to account ${
          targetAccount.accountNumber
        }. Transaction Reference: ${disbursementTx.referenceId}.`,
        referenceId: loan.loanReference,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: params.adminId,
        actorRole: "ADMIN",
        action: "LOAN_APPLICATION_APPROVED_AND_DISBURSED",
        entityType: "LoanApplication",
        entityId: loan.id,
        ipAddress: params.ipAddress,
        metadata: {
          loanReference: loan.loanReference,
          disbursementTransactionReferenceId: disbursementTx.referenceId,
          disbursementAccountNumber: targetAccount.accountNumber,
          approvedAmount: formatDecimal(approvedPrincipal),
          interestRate: formatDecimal(annualInterestRate),
          durationMonths: loan.durationMonths,
          totalPayableAmount: formatDecimal(schedulePlan.totalPayable),
          monthlyInstallment: formatDecimal(schedulePlan.monthlyInstallment),
        },
      },
    });

    return loan.id;
  });

  return getLoanDetailsForAdmin(updatedId);
}
