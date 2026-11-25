// ============================================================================
// VaultEdge — Bank Staff Operational Service
// Implements Staff-specific workflows (overview, customer registration, KYC
// verification, suspicious transaction flagging, and loan review/forwarding)
// while reusing shared Admin/Banking query & account-creation services.
// ============================================================================

import { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { toSafeUserDTO } from "@/server/auth/mappers";
import { generateCryptoId, hashPassword } from "@/server/auth/password";
import {
  AuthorizationError,
  BusinessRuleError,
  ConflictError,
  InvalidStatusTransitionError,
  NotFoundError,
} from "@/server/errors/app-error";
import { buildPaginationMeta, formatDecimal } from "@/server/utils/banking";
import type {
  StaffFlagTransactionInput,
  StaffLoanReviewInput,
  StaffRegisterCustomerInput,
  StaffSuspiciousListQueryInput,
  StaffVerifyCustomerInput,
} from "@/server/validators/staff.schema";

function buildStaffCustomerCode(): string {
  const year = new Date().getUTCFullYear();
  const suffix = generateCryptoId(4).toUpperCase();
  return `CUS-${year}-${suffix}`;
}

/**
 * 1. Staff Overview Dashboard
 * Returns real-time operational KPIs and recent queues for Bank Staff.
 */
export async function getStaffOverviewDashboard() {
  const [
    totalCustomers,
    pendingKycCount,
    verifiedKycCount,
    totalBankAccounts,
    pendingTransactionsCount,
    flaggedTransactionsCount,
    openSuspiciousFlagsCount,
    pendingLoansCount,
    underReviewLoansCount,
    recentPendingCustomers,
    recentFlaggedTransactions,
    recentLoanQueue,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.customerProfile.count({ where: { kycStatus: "PENDING" } }),
    prisma.customerProfile.count({ where: { kycStatus: "VERIFIED" } }),
    prisma.bankAccount.count({ where: { isSystemAccount: false } }),
    prisma.transaction.count({ where: { status: "PENDING" } }),
    prisma.transaction.count({ where: { isFlagged: true } }),
    prisma.suspiciousTransactionFlag.count({
      where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
    }),
    prisma.loanApplication.count({ where: { status: "PENDING" } }),
    prisma.loanApplication.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.customerProfile.findMany({
      where: { kycStatus: "PENDING" },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
          },
        },
      },
    }),
    prisma.suspiciousTransactionFlag.findMany({
      where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        transaction: {
          select: {
            id: true,
            referenceId: true,
            type: true,
            status: true,
            amount: true,
            executedAt: true,
          },
        },
      },
    }),
    prisma.loanApplication.findMany({
      where: { status: { in: ["PENDING", "UNDER_REVIEW"] } },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    kpis: {
      totalCustomers,
      pendingKycVerifications: pendingKycCount,
      verifiedCustomers: verifiedKycCount,
      totalBankAccounts,
      pendingTransactions: pendingTransactionsCount,
      flaggedTransactions: flaggedTransactionsCount,
      openSuspiciousFlags: openSuspiciousFlagsCount,
      pendingLoanApplications: pendingLoansCount,
      underReviewLoanApplications: underReviewLoansCount,
    },
    queues: {
      pendingVerifications: recentPendingCustomers.map((p) => ({
        userId: p.user.id,
        customerCode: p.customerCode,
        fullName: `${p.user.firstName} ${p.user.lastName}`.trim(),
        email: p.user.email,
        userStatus: p.user.status,
        kycStatus: p.kycStatus,
        createdAt: p.createdAt.toISOString(),
      })),
      openSuspiciousFlags: recentFlaggedTransactions.map((f) => ({
        flagId: f.id,
        source: f.source,
        status: f.status,
        reason: f.reason,
        createdAt: f.createdAt.toISOString(),
        transaction: {
          id: f.transaction.id,
          referenceId: f.transaction.referenceId,
          type: f.transaction.type,
          status: f.transaction.status,
          amount: formatDecimal(f.transaction.amount),
          executedAt: f.transaction.executedAt.toISOString(),
        },
      })),
      loanQueue: recentLoanQueue.map((l) => ({
        id: l.id,
        loanReference: l.loanReference,
        loanType: l.loanType,
        requestedAmount: formatDecimal(l.requestedAmount),
        status: l.status,
        customerName: `${l.customer.firstName} ${l.customer.lastName}`.trim(),
        customerEmail: l.customer.email,
        createdAt: l.createdAt.toISOString(),
      })),
    },
  };
}

/**
 * 2. Customer Registration by Staff
 * Creates a CUSTOMER user + CustomerProfile + AuditLog atomically.
 */
export async function registerCustomerByStaff(params: {
  staffId: string;
  ipAddress: string | null;
  input: StaffRegisterCustomerInput;
}) {
  const { input } = params;

  const [existingEmail, existingPhone, existingNationalId] = await Promise.all([
    prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    }),
    prisma.customerProfile.findUnique({
      where: { phone: input.phone },
      select: { id: true },
    }),
    input.nationalIdNumber
      ? prisma.customerProfile.findUnique({
          where: { nationalIdNumber: input.nationalIdNumber },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  if (existingEmail) {
    throw new ConflictError("A user with this email address already exists.");
  }
  if (existingPhone) {
    throw new ConflictError("A customer with this phone number already exists.");
  }
  if (existingNationalId) {
    throw new ConflictError(
      "A customer with this National ID number already exists."
    );
  }

  const passwordHash = await hashPassword(input.password);
  const customerCode = buildStaffCustomerCode();

  const createdUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: "CUSTOMER",
        status: "ACTIVE",
        customerProfile: {
          create: {
            customerCode,
            phone: input.phone,
            dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
            addressLine1: input.addressLine1 ?? null,
            city: input.city ?? null,
            state: input.state ?? null,
            postalCode: input.postalCode ?? null,
            country: input.country ?? null,
            nationalIdNumber: input.nationalIdNumber ?? null,
            employmentStatus: input.employmentStatus ?? "EMPLOYED",
            monthlyIncome: new Prisma.Decimal(
              (input.monthlyIncome ?? 0).toFixed(2)
            ),
            kycStatus: "PENDING",
          },
        },
      },
      include: { customerProfile: true },
    });

    await tx.auditLog.create({
      data: {
        actorId: params.staffId,
        actorRole: "STAFF",
        action: "CUSTOMER_REGISTERED_BY_STAFF",
        entityType: "User",
        entityId: user.id,
        ipAddress: params.ipAddress,
        metadata: {
          email: user.email,
          customerCode,
        },
      },
    });

    return user;
  });

  return {
    customer: toSafeUserDTO(createdUser),
  };
}

/**
 * 4. Customer KYC Verification by Staff
 */
export async function verifyCustomerKycByStaff(params: {
  staffId: string;
  ipAddress: string | null;
  customerId: string;
  input: StaffVerifyCustomerInput;
}) {
  const updated = await prisma.$transaction(async (tx) => {
    const targetUser = await tx.user.findUnique({
      where: { id: params.customerId },
      include: { customerProfile: true },
    });

    if (!targetUser || targetUser.role !== "CUSTOMER") {
      throw new NotFoundError("Customer record not found.");
    }

    if (!targetUser.customerProfile) {
      throw new BusinessRuleError(
        "Customer profile is missing and cannot be verified."
      );
    }

    const previousKycStatus = targetUser.customerProfile.kycStatus;

    await tx.customerProfile.update({
      where: { userId: targetUser.id },
      data: {
        kycStatus: params.input.kycStatus,
        kycNotes: params.input.kycNotes ?? targetUser.customerProfile.kycNotes,
        verifiedById: params.staffId,
        verifiedAt:
          params.input.kycStatus === "VERIFIED" ? new Date() : null,
      },
    });

    await tx.notification.create({
      data: {
        userId: targetUser.id,
        type: "ACCOUNT_STATUS_CHANGED",
        title: `KYC Verification ${params.input.kycStatus}`,
        message:
          params.input.kycStatus === "VERIFIED"
            ? "Your identity verification (KYC) has been approved by bank staff."
            : params.input.kycStatus === "REJECTED"
              ? `Your identity verification (KYC) was rejected. ${params.input.kycNotes ?? ""}`.trim()
              : "Your identity verification (KYC) status has been set to pending review.",
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: params.staffId,
        actorRole: "STAFF",
        action: "CUSTOMER_KYC_UPDATED_BY_STAFF",
        entityType: "CustomerProfile",
        entityId: targetUser.customerProfile.id,
        ipAddress: params.ipAddress,
        metadata: {
          customerId: targetUser.id,
          previousKycStatus,
          newKycStatus: params.input.kycStatus,
          kycNotes: params.input.kycNotes ?? null,
        },
      },
    });

    return tx.user.findUniqueOrThrow({
      where: { id: targetUser.id },
      include: { customerProfile: true },
    });
  });

  return {
    customer: toSafeUserDTO(updated),
  };
}

/**
 * 6. Suspicious Transactions Queue for Staff
 */
export async function listSuspiciousTransactionsForStaff(
  query: StaffSuspiciousListQueryInput
) {
  const skip = (query.page - 1) * query.limit;

  const where: Prisma.SuspiciousTransactionFlagWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { reason: { contains: query.search, mode: "insensitive" } },
            { ruleCode: { contains: query.search, mode: "insensitive" } },
            {
              transaction: {
                referenceId: { contains: query.search, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
  };

  const [total, flags] = await Promise.all([
    prisma.suspiciousTransactionFlag.count({ where }),
    prisma.suspiciousTransactionFlag.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { createdAt: "desc" },
      include: {
        transaction: {
          include: {
            senderAccount: {
              select: {
                id: true,
                accountNumber: true,
                accountTitle: true,
              },
            },
            receiverAccount: {
              select: {
                id: true,
                accountNumber: true,
                accountTitle: true,
              },
            },
          },
        },
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
    }),
  ]);

  return {
    suspiciousFlags: flags.map((f) => ({
      id: f.id,
      source: f.source,
      ruleCode: f.ruleCode,
      reason: f.reason,
      status: f.status,
      resolutionNote: f.resolutionNote,
      createdAt: f.createdAt.toISOString(),
      resolvedAt: f.resolvedAt ? f.resolvedAt.toISOString() : null,
      flaggedBy: f.flaggedBy
        ? {
            id: f.flaggedBy.id,
            fullName: `${f.flaggedBy.firstName} ${f.flaggedBy.lastName}`.trim(),
            email: f.flaggedBy.email,
            role: f.flaggedBy.role,
          }
        : null,
      resolvedByAdmin: f.resolvedByAdmin
        ? {
            id: f.resolvedByAdmin.id,
            fullName: `${f.resolvedByAdmin.firstName} ${f.resolvedByAdmin.lastName}`.trim(),
            email: f.resolvedByAdmin.email,
          }
        : null,
      transaction: {
        id: f.transaction.id,
        referenceId: f.transaction.referenceId,
        type: f.transaction.type,
        status: f.transaction.status,
        amount: formatDecimal(f.transaction.amount),
        fee: formatDecimal(f.transaction.fee),
        totalAmount: formatDecimal(f.transaction.totalAmount),
        executedAt: f.transaction.executedAt.toISOString(),
        senderAccount: f.transaction.senderAccount,
        receiverAccount: f.transaction.receiverAccount,
      },
    })),
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

/**
 * 5 & 6. Flag a Suspicious Transaction for Admin Review
 */
export async function flagTransactionByStaff(params: {
  staffId: string;
  ipAddress: string | null;
  transactionId: string;
  input: StaffFlagTransactionInput;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const targetTx = await tx.transaction.findFirst({
      where: {
        OR: [
          { id: params.transactionId },
          { referenceId: params.transactionId },
        ],
      },
    });

    if (!targetTx) {
      throw new NotFoundError("Transaction record not found.");
    }

    const flag = await tx.suspiciousTransactionFlag.create({
      data: {
        transactionId: targetTx.id,
        flaggedById: params.staffId,
        source: "STAFF_MANUAL",
        ruleCode: params.input.ruleCode ?? "STAFF_MANUAL_REVIEW",
        reason: params.input.reason,
        status: "OPEN",
      },
    });

    if (!targetTx.isFlagged) {
      await tx.transaction.update({
        where: { id: targetTx.id },
        data: { isFlagged: true },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: params.staffId,
        actorRole: "STAFF",
        action: "TRANSACTION_FLAGGED_BY_STAFF",
        entityType: "Transaction",
        entityId: targetTx.id,
        ipAddress: params.ipAddress,
        metadata: {
          referenceId: targetTx.referenceId,
          flagId: flag.id,
          reason: params.input.reason,
          ruleCode: flag.ruleCode,
        },
      },
    });

    return {
      flag: {
        id: flag.id,
        transactionId: flag.transactionId,
        referenceId: targetTx.referenceId,
        source: flag.source,
        ruleCode: flag.ruleCode,
        reason: flag.reason,
        status: flag.status,
        createdAt: flag.createdAt.toISOString(),
      },
    };
  });

  return result;
}

/**
 * 7. Loan Application Review & Forwarding by Staff
 * Strict business rules:
 * - Staff CANNOT approve or reject loans.
 * - Staff CANNOT review or forward their own loan application.
 */
export async function reviewLoanApplicationByStaff(params: {
  staffId: string;
  ipAddress: string | null;
  loanId: string;
  input: StaffLoanReviewInput;
}) {
  const updatedLoan = await prisma.$transaction(async (tx) => {
    const loan = await tx.loanApplication.findFirst({
      where: {
        OR: [{ id: params.loanId }, { loanReference: params.loanId }],
      },
    });

    if (!loan) {
      throw new NotFoundError("Loan application not found.");
    }

    if (loan.customerId === params.staffId) {
      throw new AuthorizationError(
        "Bank staff are prohibited from reviewing or forwarding their own loan applications."
      );
    }

    if (loan.status !== "PENDING" && loan.status !== "UNDER_REVIEW") {
      throw new InvalidStatusTransitionError(
        `Cannot review loan application in ${loan.status} status.`
      );
    }

    const note = await tx.loanNote.create({
      data: {
        loanApplicationId: loan.id,
        authorId: params.staffId,
        note: params.input.note,
        isInternal: params.input.isInternal,
      },
    });

    const isForward = params.input.action === "FORWARD_FOR_APPROVAL";

    const updated = await tx.loanApplication.update({
      where: { id: loan.id },
      data: {
        reviewedByStaffId: params.staffId,
        status: "UNDER_REVIEW",
        ...(isForward && !loan.forwardedForApprovalAt
          ? { forwardedForApprovalAt: new Date() }
          : {}),
      },
    });

    if (isForward) {
      await tx.notification.create({
        data: {
          userId: loan.customerId,
          type: "SECURITY_ALERT",
          title: `Loan Application ${loan.loanReference} Under Admin Review`,
          message:
            "Your loan application has been reviewed by bank staff and forwarded for final administrative approval.",
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: params.staffId,
        actorRole: "STAFF",
        action: isForward
          ? "LOAN_FORWARDED_FOR_APPROVAL_BY_STAFF"
          : "LOAN_NOTE_ADDED_BY_STAFF",
        entityType: "LoanApplication",
        entityId: loan.id,
        ipAddress: params.ipAddress,
        metadata: {
          loanReference: loan.loanReference,
          noteId: note.id,
          action: params.input.action,
          isInternal: params.input.isInternal,
        },
      },
    });

    return {
      loanId: updated.id,
      loanReference: updated.loanReference,
      status: updated.status,
      reviewedByStaffId: updated.reviewedByStaffId,
      forwardedForApprovalAt: updated.forwardedForApprovalAt
        ? updated.forwardedForApprovalAt.toISOString()
        : null,
      note: {
        id: note.id,
        note: note.note,
        isInternal: note.isInternal,
        createdAt: note.createdAt.toISOString(),
      },
    };
  });

  return updatedLoan;
}
