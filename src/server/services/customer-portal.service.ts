// ============================================================================
// VaultEdge — Customer Loans, Repayments, Notifications & Profile Service
// ============================================================================

import { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { toSafeUserDTO } from "@/server/auth/mappers";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import {
  AuthorizationError,
  BusinessRuleError,
  ConflictError,
  InsufficientBalanceError,
  InvalidStatusTransitionError,
  NotFoundError,
} from "@/server/errors/app-error";
import { verifyCustomerTransactionPin } from "@/server/services/customer-banking.service";
import {
  buildPaginationMeta,
  ensureSystemSettings,
  ensureSystemTreasuryAccount,
  formatDecimal,
  generateTransactionReferenceId,
} from "@/server/utils/banking";
import type {
  CustomerApplyLoanInput,
  CustomerConfigurePinInput,
  CustomerLoanListQueryInput,
  CustomerNotificationListQueryInput,
  CustomerRepayLoanInput,
  CustomerUpdateProfileInput,
} from "@/server/validators/customer.schema";

// ============================================================================
// Module 7 & 8: Loan Applications, Schedule & Repayment Execution
// ============================================================================
export async function applyForLoanByCustomer(params: {
  customerId: string;
  ipAddress: string | null;
  input: CustomerApplyLoanInput;
}) {
  const { input } = params;

  if (input.idempotencyKey) {
    const existing = await prisma.loanApplication.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: {
        disbursementAccount: {
          select: { id: true, accountNumber: true, accountTitle: true },
        },
      },
    });
    if (existing) {
      if (existing.customerId !== params.customerId) {
        throw new ConflictError("Idempotency key conflict.");
      }
      return {
        loan: {
          id: existing.id,
          loanReference: existing.loanReference,
          loanType: existing.loanType,
          requestedAmount: formatDecimal(existing.requestedAmount),
          interestRate: formatDecimal(existing.interestRate),
          durationMonths: existing.durationMonths,
          status: existing.status,
          createdAt: existing.createdAt.toISOString(),
          disbursementAccount: existing.disbursementAccount,
        },
      };
    }
  }

  const requestedDec = new Prisma.Decimal(input.requestedAmount.toFixed(2));

  const created = await prisma.$transaction(async (tx) => {
    const account = await tx.bankAccount.findFirst({
      where: {
        id: input.disbursementAccountId,
        isSystemAccount: false,
      },
    });

    if (!account) {
      throw new NotFoundError("Disbursement bank account not found.");
    }
    if (account.userId !== params.customerId) {
      throw new AuthorizationError(
        "Access denied. You do not own the selected disbursement account."
      );
    }
    if (account.status !== "ACTIVE") {
      throw new BusinessRuleError(
        `Disbursement account ${account.accountNumber} is ${account.status} and cannot receive loan disbursements.`
      );
    }

    const user = await tx.user.findUniqueOrThrow({
      where: { id: params.customerId },
      include: { customerProfile: true },
    });

    const settings = await ensureSystemSettings(tx);
    const loanReference = generateTransactionReferenceId("LN");

    const monthlyIncomeDec =
      input.monthlyIncome !== undefined
        ? new Prisma.Decimal(input.monthlyIncome.toFixed(2))
        : user.customerProfile?.monthlyIncome ?? new Prisma.Decimal("0.00");

    const employmentStatus =
      input.employmentStatus ??
      user.customerProfile?.employmentStatus ??
      "EMPLOYED";

    const loan = await tx.loanApplication.create({
      data: {
        loanReference,
        idempotencyKey: input.idempotencyKey ?? null,
        customerId: params.customerId,
        disbursementAccountId: account.id,
        loanType: input.loanType,
        requestedAmount: requestedDec,
        interestRate: settings.defaultLoanInterestRate,
        durationMonths: input.durationMonths,
        monthlyIncome: monthlyIncomeDec,
        employmentStatus,
        description: input.description,
        status: "PENDING",
      },
      include: {
        disbursementAccount: {
          select: { id: true, accountNumber: true, accountTitle: true },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: params.customerId,
        actorRole: "CUSTOMER",
        action: "LOAN_APPLICATION_SUBMITTED",
        entityType: "LoanApplication",
        entityId: loan.id,
        ipAddress: params.ipAddress,
        metadata: {
          loanReference,
          loanType: loan.loanType,
          requestedAmount: formatDecimal(requestedDec),
          durationMonths: loan.durationMonths,
        },
      },
    });

    return loan;
  });

  return {
    loan: {
      id: created.id,
      loanReference: created.loanReference,
      loanType: created.loanType,
      requestedAmount: formatDecimal(created.requestedAmount),
      interestRate: formatDecimal(created.interestRate),
      durationMonths: created.durationMonths,
      status: created.status,
      createdAt: created.createdAt.toISOString(),
      disbursementAccount: created.disbursementAccount,
    },
  };
}

export async function listCustomerLoans(
  customerId: string,
  query: CustomerLoanListQueryInput
) {
  const skip = (query.page - 1) * query.limit;
  const where: Prisma.LoanApplicationWhereInput = {
    customerId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.loanType ? { loanType: query.loanType } : {}),
  };

  const [total, loans] = await Promise.all([
    prisma.loanApplication.count({ where }),
    prisma.loanApplication.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { createdAt: "desc" },
      include: {
        disbursementAccount: {
          select: { id: true, accountNumber: true, accountTitle: true },
        },
      },
    }),
  ]);

  return {
    loans: loans.map((l) => ({
      id: l.id,
      loanReference: l.loanReference,
      loanType: l.loanType,
      requestedAmount: formatDecimal(l.requestedAmount),
      approvedAmount: l.approvedAmount ? formatDecimal(l.approvedAmount) : null,
      interestRate: formatDecimal(l.interestRate),
      durationMonths: l.durationMonths,
      status: l.status,
      totalPayableAmount: l.totalPayableAmount
        ? formatDecimal(l.totalPayableAmount)
        : null,
      monthlyInstallment: l.monthlyInstallment
        ? formatDecimal(l.monthlyInstallment)
        : null,
      totalRepaidAmount: formatDecimal(l.totalRepaidAmount),
      remainingBalance: formatDecimal(l.remainingBalance),
      rejectionReason: l.rejectionReason,
      disbursedAt: l.disbursedAt ? l.disbursedAt.toISOString() : null,
      createdAt: l.createdAt.toISOString(),
      disbursementAccount: l.disbursementAccount,
    })),
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function getCustomerLoanDetails(
  customerId: string,
  loanId: string
) {
  const loan = await prisma.loanApplication.findFirst({
    where: {
      OR: [{ id: loanId }, { loanReference: loanId }],
    },
    include: {
      disbursementAccount: {
        select: { id: true, accountNumber: true, accountTitle: true },
      },
      disbursementTransaction: {
        select: { id: true, referenceId: true, executedAt: true },
      },
      notes: {
        where: { isInternal: false },
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: { firstName: true, lastName: true, role: true },
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
            select: { id: true, referenceId: true, executedAt: true },
          },
          paidFromAccount: {
            select: { id: true, accountNumber: true, accountTitle: true },
          },
        },
      },
    },
  });

  if (!loan) {
    throw new NotFoundError("Loan application not found.");
  }

  if (loan.customerId !== customerId) {
    throw new AuthorizationError(
      "Access denied. You do not own this loan application."
    );
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
      decidedAt: loan.decidedAt ? loan.decidedAt.toISOString() : null,
      disbursedAt: loan.disbursedAt ? loan.disbursedAt.toISOString() : null,
      completedAt: loan.completedAt ? loan.completedAt.toISOString() : null,
      createdAt: loan.createdAt.toISOString(),
      disbursementAccount: loan.disbursementAccount,
      disbursementTransaction: loan.disbursementTransaction
        ? {
            id: loan.disbursementTransaction.id,
            referenceId: loan.disbursementTransaction.referenceId,
            executedAt: loan.disbursementTransaction.executedAt.toISOString(),
          }
        : null,
      notes: loan.notes.map((n) => ({
        id: n.id,
        note: n.note,
        createdAt: n.createdAt.toISOString(),
        authorName: `${n.author.firstName} ${n.author.lastName}`.trim(),
        authorRole: n.author.role,
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
          executedAt: r.transaction.executedAt.toISOString(),
        },
      })),
    },
  };
}

export async function repayCustomerLoan(params: {
  customerId: string;
  ipAddress: string | null;
  loanId: string;
  input: CustomerRepayLoanInput;
}) {
  const { input } = params;

  if (input.idempotencyKey) {
    const existing = await prisma.transaction.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { loanRepayment: true },
    });
    if (existing) {
      if (existing.initiatedById !== params.customerId) {
        throw new ConflictError("Idempotency key conflict.");
      }
      return {
        repayment: {
          transactionReference: existing.referenceId,
          amountPaid: formatDecimal(existing.amount),
          remainingBalanceAfter: existing.loanRepayment
            ? formatDecimal(existing.loanRepayment.remainingBalanceAfter)
            : "0.00",
          executedAt: existing.executedAt.toISOString(),
        },
      };
    }
  }

  await verifyCustomerTransactionPin(params.customerId, input.transactionPin);

  const result = await prisma.$transaction(async (tx) => {
    const loan = await tx.loanApplication.findFirst({
      where: {
        OR: [{ id: params.loanId }, { loanReference: params.loanId }],
      },
      include: {
        repaymentSchedules: {
          orderBy: { installmentNumber: "asc" },
        },
      },
    });

    if (!loan) {
      throw new NotFoundError("Loan application not found.");
    }

    if (loan.customerId !== params.customerId) {
      throw new AuthorizationError(
        "Access denied. You do not own this loan."
      );
    }

    if (loan.status !== "ACTIVE" && loan.status !== "APPROVED") {
      throw new InvalidStatusTransitionError(
        `Cannot repay a loan with status ${loan.status}.`
      );
    }

    if (loan.remainingBalance.lessThanOrEqualTo(0)) {
      throw new BusinessRuleError("This loan has already been fully repaid.");
    }

    const account = await tx.bankAccount.findFirst({
      where: {
        id: input.paidFromAccountId,
        isSystemAccount: false,
      },
    });

    if (!account) {
      throw new NotFoundError("Source bank account not found.");
    }
    if (account.userId !== params.customerId) {
      throw new AuthorizationError(
        "Access denied. You do not own the source bank account."
      );
    }
    if (account.status !== "ACTIVE") {
      throw new BusinessRuleError(
        `Source account ${account.accountNumber} is ${account.status} and cannot execute repayments.`
      );
    }

    const targetSchedule = input.scheduleId
      ? loan.repaymentSchedules.find((s) => s.id === input.scheduleId)
      : loan.repaymentSchedules.find(
          (s) =>
            s.status === "PENDING" ||
            s.status === "PARTIALLY_PAID" ||
            s.status === "OVERDUE"
        );

    if (input.scheduleId && !targetSchedule) {
      throw new NotFoundError("Specified repayment schedule installment not found.");
    }
    if (targetSchedule && targetSchedule.status === "PAID") {
      throw new BusinessRuleError("This installment has already been paid.");
    }

    const defaultDue = targetSchedule
      ? targetSchedule.totalInstallment.sub(targetSchedule.paidAmount)
      : loan.remainingBalance;

    const payAmountDec = input.amount
      ? new Prisma.Decimal(input.amount.toFixed(2))
      : defaultDue;

    if (payAmountDec.greaterThan(loan.remainingBalance)) {
      throw new BusinessRuleError(
        `Repayment amount cannot exceed remaining loan balance of ${formatDecimal(loan.remainingBalance)}.`
      );
    }

    const settings = await ensureSystemSettings(tx);
    const minBalance =
      account.minBalanceRequired ?? settings.defaultMinAccountBalance;

    if (account.balance.sub(payAmountDec).lessThan(minBalance)) {
      throw new InsufficientBalanceError(
        `Insufficient available balance. Minimum balance of ${formatDecimal(minBalance)} must remain.`
      );
    }

    const debitClaim = await tx.bankAccount.updateMany({
      where: {
        id: account.id,
        status: "ACTIVE",
        balance: { gte: payAmountDec },
      },
      data: {
        balance: { decrement: payAmountDec },
      },
    });

    if (debitClaim.count !== 1) {
      throw new InsufficientBalanceError(
        "Insufficient available balance or account state changed concurrently."
      );
    }

    const updatedAccount = await tx.bankAccount.findUniqueOrThrow({
      where: { id: account.id },
    });

    const treasury = await ensureSystemTreasuryAccount(tx);
    const updatedTreasury = await tx.bankAccount.update({
      where: { id: treasury.id },
      data: { balance: { increment: payAmountDec } },
    });

    const now = new Date();
    const referenceId = generateTransactionReferenceId("LRP");

    const transaction = await tx.transaction.create({
      data: {
        referenceId,
        idempotencyKey: input.idempotencyKey ?? null,
        type: "LOAN_REPAYMENT",
        status: "COMPLETED",
        senderAccountId: account.id,
        receiverAccountId: treasury.id,
        initiatedById: params.customerId,
        amount: payAmountDec,
        fee: new Prisma.Decimal("0.00"),
        totalAmount: payAmountDec,
        description: `Loan repayment for ${loan.loanReference}`,
        executedAt: now,
      },
    });

    await tx.ledgerEntry.createMany({
      data: [
        {
          transactionId: transaction.id,
          accountId: account.id,
          direction: "DEBIT",
          entryCategory: "PRINCIPAL",
          amount: payAmountDec,
          balanceBefore: account.balance,
          balanceAfter: updatedAccount.balance,
          description: `Loan repayment ${loan.loanReference}`,
        },
        {
          transactionId: transaction.id,
          accountId: treasury.id,
          direction: "CREDIT",
          entryCategory: "PRINCIPAL",
          amount: payAmountDec,
          balanceBefore: treasury.balance,
          balanceAfter: updatedTreasury.balance,
          description: `Loan repayment received (${loan.loanReference})`,
        },
      ],
    });

    // Apply payment to schedule installments sequentially
    let remainingToApply = payAmountDec;
    let principalComponent = new Prisma.Decimal("0.00");
    let interestComponent = new Prisma.Decimal("0.00");

    const pendingSchedules = targetSchedule
      ? [
          targetSchedule,
          ...loan.repaymentSchedules.filter(
            (s) =>
              s.id !== targetSchedule.id &&
              (s.status === "PENDING" ||
                s.status === "PARTIALLY_PAID" ||
                s.status === "OVERDUE")
          ),
        ]
      : loan.repaymentSchedules.filter(
          (s) =>
            s.status === "PENDING" ||
            s.status === "PARTIALLY_PAID" ||
            s.status === "OVERDUE"
        );

    for (const sched of pendingSchedules) {
      if (remainingToApply.lessThanOrEqualTo(0)) break;

      const schedOwed = sched.totalInstallment.sub(sched.paidAmount);
      if (schedOwed.lessThanOrEqualTo(0)) continue;

      const applied = remainingToApply.lessThan(schedOwed)
        ? remainingToApply
        : schedOwed;
      const newPaid = sched.paidAmount.add(applied);
      const isPaid = newPaid.greaterThanOrEqualTo(sched.totalInstallment);

      // Proportional principal/interest split
      const ratio = applied.div(sched.totalInstallment);
      const interestPart = sched.interestAmount
        .mul(ratio)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
      const principalPart = applied.sub(interestPart);

      principalComponent = principalComponent.add(principalPart);
      interestComponent = interestComponent.add(interestPart);

      await tx.loanRepaymentSchedule.update({
        where: { id: sched.id },
        data: {
          paidAmount: newPaid,
          status: isPaid ? "PAID" : "PARTIALLY_PAID",
          ...(isPaid ? { paidAt: now } : {}),
        },
      });

      remainingToApply = remainingToApply.sub(applied);
    }

    const nextTotalRepaid = loan.totalRepaidAmount.add(payAmountDec);
    const nextRemaining = loan.remainingBalance.sub(payAmountDec);
    const isCompleted = nextRemaining.lessThanOrEqualTo(0);

    await tx.loanApplication.update({
      where: { id: loan.id },
      data: {
        totalRepaidAmount: nextTotalRepaid,
        remainingBalance: isCompleted ? new Prisma.Decimal("0.00") : nextRemaining,
        status: isCompleted ? "COMPLETED" : "ACTIVE",
        ...(isCompleted ? { completedAt: now } : {}),
      },
    });

    await tx.loanRepayment.create({
      data: {
        loanApplicationId: loan.id,
        scheduleId: targetSchedule?.id ?? null,
        transactionId: transaction.id,
        paidFromAccountId: account.id,
        amountPaid: payAmountDec,
        principalComponent,
        interestComponent,
        remainingBalanceAfter: isCompleted
          ? new Prisma.Decimal("0.00")
          : nextRemaining,
        paidAt: now,
      },
    });

    await tx.notification.create({
      data: {
        userId: params.customerId,
        type: "TRANSFER_COMPLETED",
        title: isCompleted
          ? `Loan ${loan.loanReference} Fully Repaid`
          : `Loan Repayment ${referenceId} Processed`,
        message: `Paid ${formatDecimal(payAmountDec)} toward ${loan.loanReference}. Remaining balance: ${formatDecimal(
          isCompleted ? 0 : nextRemaining
        )}.`,
        referenceId,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: params.customerId,
        actorRole: "CUSTOMER",
        action: "CUSTOMER_LOAN_REPAYMENT_EXECUTED",
        entityType: "LoanApplication",
        entityId: loan.id,
        ipAddress: params.ipAddress,
        metadata: {
          loanReference: loan.loanReference,
          transactionReference: referenceId,
          amountPaid: formatDecimal(payAmountDec),
          remainingBalanceAfter: formatDecimal(
            isCompleted ? 0 : nextRemaining
          ),
          loanCompleted: isCompleted,
        },
      },
    });

    return {
      transactionReference: referenceId,
      loanReference: loan.loanReference,
      amountPaid: formatDecimal(payAmountDec),
      remainingBalanceAfter: formatDecimal(isCompleted ? 0 : nextRemaining),
      loanStatus: isCompleted ? "COMPLETED" : "ACTIVE",
      executedAt: now.toISOString(),
    };
  });

  return { repayment: result };
}

// ============================================================================
// Module 10: Customer Notifications
// ============================================================================
export async function listCustomerNotifications(
  customerId: string,
  query: CustomerNotificationListQueryInput
) {
  const skip = (query.page - 1) * query.limit;
  const where: Prisma.NotificationWhereInput = {
    userId: customerId,
    ...(query.unreadOnly ? { isRead: false } : {}),
  };

  const [total, unreadCount, items] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: customerId, isRead: false } }),
    prisma.notification.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    notifications: items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      referenceId: n.referenceId,
      isRead: n.isRead,
      readAt: n.readAt ? n.readAt.toISOString() : null,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function getCustomerNotificationDetails(
  customerId: string,
  notificationId: string
) {
  const item = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!item) {
    throw new NotFoundError("Notification not found.");
  }
  if (item.userId !== customerId) {
    throw new AuthorizationError("Access denied to this notification.");
  }

  return {
    notification: {
      id: item.id,
      type: item.type,
      title: item.title,
      message: item.message,
      referenceId: item.referenceId,
      isRead: item.isRead,
      readAt: item.readAt ? item.readAt.toISOString() : null,
      createdAt: item.createdAt.toISOString(),
    },
  };
}

export async function markCustomerNotificationRead(
  customerId: string,
  notificationId: string
) {
  const item = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!item) {
    throw new NotFoundError("Notification not found.");
  }
  if (item.userId !== customerId) {
    throw new AuthorizationError("Access denied to this notification.");
  }

  const updated = item.isRead
    ? item
    : await prisma.notification.update({
        where: { id: item.id },
        data: { isRead: true, readAt: new Date() },
      });

  return {
    notification: {
      id: updated.id,
      isRead: updated.isRead,
      readAt: updated.readAt ? updated.readAt.toISOString() : null,
    },
  };
}

export async function markAllCustomerNotificationsRead(customerId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId: customerId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  return {
    markedCount: result.count,
  };
}

// ============================================================================
// Module 11: Customer Profile & Transaction PIN Security
// ============================================================================
export async function getCustomerProfile(customerId: string) {
  const user = await prisma.user.findUnique({
    where: { id: customerId },
    include: { customerProfile: true },
  });
  if (!user) {
    throw new NotFoundError("Customer profile not found.");
  }

  return {
    profile: toSafeUserDTO(user),
  };
}

export async function updateCustomerProfile(params: {
  customerId: string;
  ipAddress: string | null;
  input: CustomerUpdateProfileInput;
}) {
  const { input } = params;

  if (input.phone) {
    const phoneConflict = await prisma.customerProfile.findFirst({
      where: {
        phone: input.phone,
        userId: { not: params.customerId },
      },
      select: { id: true },
    });
    if (phoneConflict) {
      throw new ConflictError("This phone number is already in use.");
    }
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    if (input.firstName !== undefined || input.lastName !== undefined) {
      await tx.user.update({
        where: { id: params.customerId },
        data: {
          ...(input.firstName !== undefined
            ? { firstName: input.firstName }
            : {}),
          ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
        },
      });
    }

    const hasProfileUpdates =
      input.phone !== undefined ||
      input.dateOfBirth !== undefined ||
      input.addressLine1 !== undefined ||
      input.city !== undefined ||
      input.state !== undefined ||
      input.postalCode !== undefined ||
      input.country !== undefined ||
      input.employmentStatus !== undefined ||
      input.monthlyIncome !== undefined;

    if (hasProfileUpdates) {
      await tx.customerProfile.update({
        where: { userId: params.customerId },
        data: {
          ...(input.phone !== undefined ? { phone: input.phone } : {}),
          ...(input.dateOfBirth !== undefined
            ? { dateOfBirth: new Date(input.dateOfBirth) }
            : {}),
          ...(input.addressLine1 !== undefined
            ? { addressLine1: input.addressLine1 }
            : {}),
          ...(input.city !== undefined ? { city: input.city } : {}),
          ...(input.state !== undefined ? { state: input.state } : {}),
          ...(input.postalCode !== undefined
            ? { postalCode: input.postalCode }
            : {}),
          ...(input.country !== undefined ? { country: input.country } : {}),
          ...(input.employmentStatus !== undefined
            ? { employmentStatus: input.employmentStatus }
            : {}),
          ...(input.monthlyIncome !== undefined
            ? {
                monthlyIncome: new Prisma.Decimal(
                  input.monthlyIncome.toFixed(2)
                ),
              }
            : {}),
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: params.customerId,
        actorRole: "CUSTOMER",
        action: "CUSTOMER_PROFILE_UPDATED",
        entityType: "User",
        entityId: params.customerId,
        ipAddress: params.ipAddress,
      },
    });

    return tx.user.findUniqueOrThrow({
      where: { id: params.customerId },
      include: { customerProfile: true },
    });
  });

  return {
    profile: toSafeUserDTO(updatedUser),
  };
}

export async function configureCustomerTransactionPin(params: {
  customerId: string;
  ipAddress: string | null;
  input: CustomerConfigurePinInput;
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.customerId },
    select: {
      id: true,
      passwordHash: true,
      transactionPinHash: true,
    },
  });

  if (!user) {
    throw new NotFoundError("Customer account not found.");
  }

  if (user.transactionPinHash) {
    if (!params.input.currentPin) {
      throw new BusinessRuleError(
        "Current Transaction PIN is required to change your existing PIN."
      );
    }
    await verifyCustomerTransactionPin(
      params.customerId,
      params.input.currentPin
    );
  } else {
    if (!params.input.currentPassword) {
      throw new BusinessRuleError(
        "Account password is required to set your initial Transaction PIN."
      );
    }
    const validPassword = await verifyPassword(
      params.input.currentPassword,
      user.passwordHash
    );
    if (!validPassword) {
      throw new BusinessRuleError("Incorrect account password.");
    }
  }

  const newPinHash = await hashPassword(params.input.newPin);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: params.customerId },
      data: {
        transactionPinHash: newPinHash,
        pinFailedAttempts: 0,
        pinLockedUntil: null,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: params.customerId,
        actorRole: "CUSTOMER",
        action: user.transactionPinHash
          ? "TRANSACTION_PIN_CHANGED"
          : "TRANSACTION_PIN_SET",
        entityType: "User",
        entityId: params.customerId,
        ipAddress: params.ipAddress,
      },
    });
  });

  return {
    hasTransactionPin: true,
  };
}
