// ============================================================================
// VaultEdge — Admin Domain Zod Validation Schemas
// Covers all 9 Admin Modules (Overview, Customers, Accounts, Transactions,
// Deposits, Withdrawals, Loans, Analytics, and System Settings).
// ============================================================================

import { z } from "zod";

// Shared query helpers
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const dateRangeQuerySchema = z.object({
  startDate: z
    .string()
    .trim()
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: "startDate must be a valid ISO date string.",
    })
    .optional(),
  endDate: z
    .string()
    .trim()
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: "endDate must be a valid ISO date string.",
    })
    .optional(),
});

// ----------------------------------------------------------------------------
// 1. Admin Overview & Analytics Schemas
// ----------------------------------------------------------------------------
export const adminOverviewQuerySchema = dateRangeQuerySchema.extend({
  months: z.coerce.number().int().min(1).max(24).default(6),
});

export type AdminOverviewQueryInput = z.infer<typeof adminOverviewQuerySchema>;

// ----------------------------------------------------------------------------
// 2. Customer Management Schemas
// ----------------------------------------------------------------------------
export const adminCustomerListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(120).optional(),
  status: z.enum(["ACTIVE", "DEACTIVATED", "BLOCKED"]).optional(),
  kycStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional(),
});

export type AdminCustomerListQueryInput = z.infer<
  typeof adminCustomerListQuerySchema
>;

export const adminUpdateCustomerStatusSchema = z
  .object({
    status: z.enum(["ACTIVE", "DEACTIVATED", "BLOCKED"], {
      message: "status must be ACTIVE, DEACTIVATED, or BLOCKED.",
    }),
    reason: z
      .string()
      .trim()
      .min(3, "Please provide a reason (at least 3 characters).")
      .max(500, "Reason cannot exceed 500 characters.")
      .optional(),
    kycStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional(),
  })
  .strict();

export type AdminUpdateCustomerStatusInput = z.infer<
  typeof adminUpdateCustomerStatusSchema
>;

// ----------------------------------------------------------------------------
// 3. Bank Account Management Schemas
// ----------------------------------------------------------------------------
export const adminAccountListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(120).optional(),
  accountType: z.enum(["SAVINGS", "CURRENT", "BUSINESS"]).optional(),
  status: z.enum(["ACTIVE", "FROZEN", "INACTIVE", "BLOCKED"]).optional(),
  userId: z.string().trim().optional(),
});

export type AdminAccountListQueryInput = z.infer<
  typeof adminAccountListQuerySchema
>;

const decimalAmountString = z
  .union([z.number(), z.string()])
  .transform((val) => Number(val))
  .refine((num) => Number.isFinite(num) && num >= 0, {
    message: "Monetary value must be a valid non-negative number.",
  });

const positiveDecimalAmount = z
  .union([z.number(), z.string()])
  .transform((val) => Number(val))
  .refine((num) => Number.isFinite(num) && num > 0, {
    message: "Amount must be greater than zero.",
  });

export const adminCreateAccountSchema = z
  .object({
    userId: z
      .string({ message: "Customer userId is required." })
      .trim()
      .min(1, "Customer userId is required."),
    accountType: z.enum(["SAVINGS", "CURRENT", "BUSINESS"], {
      message: "accountType must be SAVINGS, CURRENT, or BUSINESS.",
    }),
    accountTitle: z
      .string()
      .trim()
      .min(2, "Account title must be at least 2 characters.")
      .max(120, "Account title cannot exceed 120 characters.")
      .optional(),
    currency: z.string().trim().toUpperCase().length(3).default("USD"),
    initialDeposit: decimalAmountString.default(0),
    dailyTransferLimit: positiveDecimalAmount.nullable().optional(),
    maxSingleTransactionLimit: positiveDecimalAmount.nullable().optional(),
    minBalanceRequired: decimalAmountString.nullable().optional(),
  })
  .strict();

export type AdminCreateAccountInput = z.infer<typeof adminCreateAccountSchema>;

export const adminUpdateAccountSchema = z
  .object({
    accountTitle: z
      .string()
      .trim()
      .min(2, "Account title must be at least 2 characters.")
      .max(120, "Account title cannot exceed 120 characters.")
      .optional(),
    accountType: z.enum(["SAVINGS", "CURRENT", "BUSINESS"]).optional(),
    status: z.enum(["ACTIVE", "FROZEN", "INACTIVE", "BLOCKED"]).optional(),
    frozenReason: z.string().trim().max(500).nullable().optional(),
    dailyTransferLimit: positiveDecimalAmount.nullable().optional(),
    maxSingleTransactionLimit: positiveDecimalAmount.nullable().optional(),
    minBalanceRequired: decimalAmountString.nullable().optional(),
  })
  .strict();

export type AdminUpdateAccountInput = z.infer<typeof adminUpdateAccountSchema>;

export const adminUpdateAccountStatusSchema = z
  .object({
    status: z.enum(["ACTIVE", "FROZEN", "INACTIVE", "BLOCKED"], {
      message: "status must be ACTIVE, FROZEN, INACTIVE, or BLOCKED.",
    }),
    reason: z
      .string()
      .trim()
      .min(3, "Reason must be at least 3 characters.")
      .max(500, "Reason cannot exceed 500 characters.")
      .optional(),
  })
  .strict();

export type AdminUpdateAccountStatusInput = z.infer<
  typeof adminUpdateAccountStatusSchema
>;

export const adminUpdateAccountLimitsSchema = z
  .object({
    dailyTransferLimit: positiveDecimalAmount.nullable().optional(),
    maxSingleTransactionLimit: positiveDecimalAmount.nullable().optional(),
    minBalanceRequired: decimalAmountString.nullable().optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.dailyTransferLimit !== undefined ||
      data.maxSingleTransactionLimit !== undefined ||
      data.minBalanceRequired !== undefined,
    {
      message:
        "At least one limit field (dailyTransferLimit, maxSingleTransactionLimit, or minBalanceRequired) must be provided.",
    }
  )
  .refine(
    (data) => {
      if (
        typeof data.dailyTransferLimit === "number" &&
        typeof data.maxSingleTransactionLimit === "number"
      ) {
        return data.dailyTransferLimit >= data.maxSingleTransactionLimit;
      }
      return true;
    },
    {
      message:
        "dailyTransferLimit must be greater than or equal to maxSingleTransactionLimit.",
      path: ["dailyTransferLimit"],
    }
  );

export type AdminUpdateAccountLimitsInput = z.infer<
  typeof adminUpdateAccountLimitsSchema
>;

// ----------------------------------------------------------------------------
// 4. Transaction Management Schemas
// ----------------------------------------------------------------------------
export const adminTransactionListQuerySchema = paginationQuerySchema
  .merge(dateRangeQuerySchema)
  .extend({
    search: z.string().trim().max(120).optional(),
    referenceId: z.string().trim().max(64).optional(),
    type: z
      .enum([
        "DEPOSIT",
        "WITHDRAWAL",
        "FUND_TRANSFER",
        "LOAN_DISBURSEMENT",
        "LOAN_REPAYMENT",
      ])
      .optional(),
    status: z
      .enum(["PENDING", "COMPLETED", "FAILED", "REVERSED"])
      .optional(),
    isFlagged: z
      .enum(["true", "false"])
      .transform((val) => val === "true")
      .optional(),
    accountId: z.string().trim().optional(),
    customerId: z.string().trim().optional(),
  });

export type AdminTransactionListQueryInput = z.infer<
  typeof adminTransactionListQuerySchema
>;

export const adminReviewTransactionSchema = z
  .object({
    action: z.enum(
      [
        "RESOLVE_FLAG_SAFE",
        "CONFIRM_SUSPICIOUS",
        "FLAG_SUSPICIOUS",
        "REVERSE_TRANSACTION",
      ],
      {
        message:
          "action must be RESOLVE_FLAG_SAFE, CONFIRM_SUSPICIOUS, FLAG_SUSPICIOUS, or REVERSE_TRANSACTION.",
      }
    ),
    note: z
      .string({ message: "A review note/reason is required." })
      .trim()
      .min(3, "Review note must be at least 3 characters.")
      .max(500, "Review note cannot exceed 500 characters."),
    flagId: z.string().trim().optional(),
  })
  .strict();

export type AdminReviewTransactionInput = z.infer<
  typeof adminReviewTransactionSchema
>;

// ----------------------------------------------------------------------------
// 5 & 6. Deposit & Withdrawal Management Schemas
// ----------------------------------------------------------------------------
export const adminRequestListQuerySchema = paginationQuerySchema
  .merge(dateRangeQuerySchema)
  .extend({
    search: z.string().trim().max(120).optional(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    customerId: z.string().trim().optional(),
    accountId: z.string().trim().optional(),
  });

export type AdminRequestListQueryInput = z.infer<
  typeof adminRequestListQuerySchema
>;

export const adminReviewRequestSchema = z
  .object({
    decision: z.enum(["APPROVE", "REJECT"], {
      message: "decision must be APPROVE or REJECT.",
    }),
    reviewNote: z
      .string()
      .trim()
      .min(2, "Review note must be at least 2 characters.")
      .max(500, "Review note cannot exceed 500 characters.")
      .optional(),
  })
  .strict();

export type AdminReviewRequestInput = z.infer<typeof adminReviewRequestSchema>;

// ----------------------------------------------------------------------------
// 7. Loan Management Schemas
// ----------------------------------------------------------------------------
export const adminLoanListQuerySchema = paginationQuerySchema
  .merge(dateRangeQuerySchema)
  .extend({
    search: z.string().trim().max(120).optional(),
    status: z
      .enum([
        "PENDING",
        "UNDER_REVIEW",
        "APPROVED",
        "REJECTED",
        "ACTIVE",
        "COMPLETED",
      ])
      .optional(),
    loanType: z
      .enum(["PERSONAL", "HOME", "AUTO", "BUSINESS", "EDUCATION"])
      .optional(),
    customerId: z.string().trim().optional(),
  });

export type AdminLoanListQueryInput = z.infer<typeof adminLoanListQuerySchema>;

export const adminLoanDecisionSchema = z
  .object({
    decision: z.enum(["APPROVE", "REJECT"], {
      message: "decision must be APPROVE or REJECT.",
    }),
    approvedAmount: positiveDecimalAmount.optional(),
    interestRate: z
      .union([z.number(), z.string()])
      .transform((val) => Number(val))
      .refine((num) => Number.isFinite(num) && num >= 0 && num <= 100, {
        message: "interestRate must be between 0 and 100.",
      })
      .optional(),
    note: z.string().trim().max(500).optional(),
    rejectionReason: z.string().trim().max(500).optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.decision === "REJECT") {
        return Boolean(
          (data.rejectionReason && data.rejectionReason.trim().length >= 3) ||
            (data.note && data.note.trim().length >= 3)
        );
      }
      return true;
    },
    {
      message:
        "A rejectionReason (at least 3 characters) is required when rejecting a loan application.",
      path: ["rejectionReason"],
    }
  );

export type AdminLoanDecisionInput = z.infer<typeof adminLoanDecisionSchema>;

// ----------------------------------------------------------------------------
// 9. System Settings Schema
// ----------------------------------------------------------------------------
export const adminUpdateSettingsSchema = z
  .object({
    defaultDailyTransferLimit: positiveDecimalAmount.optional(),
    defaultMaxSingleTransfer: positiveDecimalAmount.optional(),
    defaultMinAccountBalance: decimalAmountString.optional(),
    transferFeeFlat: decimalAmountString.optional(),
    suspiciousAmountThreshold: positiveDecimalAmount.optional(),
    defaultLoanInterestRate: z
      .union([z.number(), z.string()])
      .transform((val) => Number(val))
      .refine((num) => Number.isFinite(num) && num >= 0 && num <= 100, {
        message: "defaultLoanInterestRate must be between 0 and 100.",
      })
      .optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.defaultDailyTransferLimit !== undefined ||
      data.defaultMaxSingleTransfer !== undefined ||
      data.defaultMinAccountBalance !== undefined ||
      data.transferFeeFlat !== undefined ||
      data.suspiciousAmountThreshold !== undefined ||
      data.defaultLoanInterestRate !== undefined,
    {
      message: "At least one system setting field must be provided to update.",
    }
  )
  .refine(
    (data) => {
      if (
        typeof data.defaultDailyTransferLimit === "number" &&
        typeof data.defaultMaxSingleTransfer === "number"
      ) {
        return (
          data.defaultDailyTransferLimit >= data.defaultMaxSingleTransfer
        );
      }
      return true;
    },
    {
      message:
        "defaultDailyTransferLimit must be greater than or equal to defaultMaxSingleTransfer.",
      path: ["defaultDailyTransferLimit"],
    }
  );

export type AdminUpdateSettingsInput = z.infer<
  typeof adminUpdateSettingsSchema
>;
