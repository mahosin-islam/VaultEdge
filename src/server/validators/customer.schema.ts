// ============================================================================
// VaultEdge — Customer API Request Validation Schemas (Zod)
// ============================================================================

import { z } from "zod";
import {
  dateRangeQuerySchema,
  paginationQuerySchema,
} from "@/server/validators/admin.schema";

const positiveAmount = z.coerce
  .number({ message: "Amount must be a valid number." })
  .refine((val) => Number.isFinite(val) && val > 0, {
    message: "Amount must be greater than zero.",
  })
  .refine((val) => val <= 100_000_000, {
    message: "Amount exceeds maximum allowed limit.",
  });

const transactionPinField = z
  .string({ message: "Transaction PIN is required." })
  .trim()
  .regex(/^\d{4,6}$/, "Transaction PIN must be 4 to 6 digits.");

export const customerOverviewQuerySchema = dateRangeQuerySchema.extend({
  months: z.coerce.number().int().min(1).max(24).default(6),
  accountId: z.string().trim().optional(),
});

export type CustomerOverviewQueryInput = z.infer<
  typeof customerOverviewQuerySchema
>;

export const customerAccountTransactionsQuerySchema = paginationQuerySchema
  .merge(dateRangeQuerySchema)
  .extend({
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
  });

export type CustomerAccountTransactionsQueryInput = z.infer<
  typeof customerAccountTransactionsQuerySchema
>;

export const customerTransferSchema = z
  .object({
    senderAccountId: z
      .string({ message: "Sender account ID is required." })
      .trim()
      .min(1, "Sender account ID is required."),
    recipientAccountNumber: z
      .string({ message: "Recipient account number is required." })
      .trim()
      .min(6, "Recipient account number must be at least 6 characters.")
      .max(32, "Recipient account number cannot exceed 32 characters."),
    amount: positiveAmount,
    description: z
      .string()
      .trim()
      .max(250, "Description cannot exceed 250 characters.")
      .optional(),
    transactionPin: transactionPinField,
    idempotencyKey: z.string().trim().min(8).max(120).optional(),
  })
  .strict();

export type CustomerTransferInput = z.infer<typeof customerTransferSchema>;

export const customerDepositRequestSchema = z
  .object({
    accountId: z
      .string({ message: "Account ID is required." })
      .trim()
      .min(1, "Account ID is required."),
    amount: positiveAmount,
    description: z
      .string()
      .trim()
      .max(250, "Description cannot exceed 250 characters.")
      .optional(),
    idempotencyKey: z.string().trim().min(8).max(120).optional(),
  })
  .strict();

export type CustomerDepositRequestInput = z.infer<
  typeof customerDepositRequestSchema
>;

export const customerWithdrawalRequestSchema = z
  .object({
    accountId: z
      .string({ message: "Account ID is required." })
      .trim()
      .min(1, "Account ID is required."),
    amount: positiveAmount,
    description: z
      .string()
      .trim()
      .max(250, "Description cannot exceed 250 characters.")
      .optional(),
    idempotencyKey: z.string().trim().min(8).max(120).optional(),
  })
  .strict();

export type CustomerWithdrawalRequestInput = z.infer<
  typeof customerWithdrawalRequestSchema
>;

export const customerRequestListQuerySchema = paginationQuerySchema
  .merge(dateRangeQuerySchema)
  .extend({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    accountId: z.string().trim().optional(),
  });

export type CustomerRequestListQueryInput = z.infer<
  typeof customerRequestListQuerySchema
>;

export const customerTransactionListQuerySchema = paginationQuerySchema
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
    accountId: z.string().trim().optional(),
  });

export type CustomerTransactionListQueryInput = z.infer<
  typeof customerTransactionListQuerySchema
>;

export const customerApplyLoanSchema = z
  .object({
    disbursementAccountId: z
      .string({ message: "Disbursement account ID is required." })
      .trim()
      .min(1, "Disbursement account ID is required."),
    loanType: z.enum(["PERSONAL", "BUSINESS", "EDUCATION", "HOME", "AUTO"], {
      message:
        "loanType must be PERSONAL, BUSINESS, EDUCATION, HOME, or AUTO.",
    }),
    requestedAmount: positiveAmount,
    durationMonths: z.coerce
      .number({ message: "Duration months is required." })
      .int("Duration months must be a whole number.")
      .min(1, "Loan duration must be at least 1 month.")
      .max(360, "Loan duration cannot exceed 360 months."),
    monthlyIncome: z.coerce
      .number({ message: "Monthly income is required." })
      .min(0, "Monthly income cannot be negative.")
      .max(100_000_000)
      .optional(),
    employmentStatus: z
      .enum([
        "EMPLOYED",
        "SELF_EMPLOYED",
        "BUSINESS_OWNER",
        "STUDENT",
        "RETIRED",
        "UNEMPLOYED",
      ])
      .optional(),
    description: z
      .string({ message: "Loan purpose description is required." })
      .trim()
      .min(10, "Description must be at least 10 characters.")
      .max(1000, "Description cannot exceed 1000 characters."),
    idempotencyKey: z.string().trim().min(8).max(120).optional(),
  })
  .strict();

export type CustomerApplyLoanInput = z.infer<typeof customerApplyLoanSchema>;

export const customerLoanListQuerySchema = paginationQuerySchema.extend({
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
    .enum(["PERSONAL", "BUSINESS", "EDUCATION", "HOME", "AUTO"])
    .optional(),
});

export type CustomerLoanListQueryInput = z.infer<
  typeof customerLoanListQuerySchema
>;

export const customerRepayLoanSchema = z
  .object({
    paidFromAccountId: z
      .string({ message: "Source account ID is required." })
      .trim()
      .min(1, "Source account ID is required."),
    amount: positiveAmount.optional(),
    scheduleId: z.string().trim().min(1).optional(),
    transactionPin: transactionPinField,
    idempotencyKey: z.string().trim().min(8).max(120).optional(),
  })
  .strict();

export type CustomerRepayLoanInput = z.infer<typeof customerRepayLoanSchema>;

export const customerStatementQuerySchema = dateRangeQuerySchema.extend({
  accountId: z
    .string({ message: "accountId query parameter is required." })
    .trim()
    .min(1, "accountId query parameter is required."),
  format: z.enum(["json", "csv", "pdf"]).default("json"),
});

export type CustomerStatementQueryInput = z.infer<
  typeof customerStatementQuerySchema
>;

export const customerNotificationListQuerySchema = paginationQuerySchema.extend({
  unreadOnly: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
});

export type CustomerNotificationListQueryInput = z.infer<
  typeof customerNotificationListQuerySchema
>;

export const customerUpdateProfileSchema = z
  .object({
    firstName: z.string().trim().min(2).max(60).optional(),
    lastName: z.string().trim().min(2).max(60).optional(),
    phone: z.string().trim().min(7).max(24).optional(),
    dateOfBirth: z
      .string()
      .trim()
      .refine((val) => !Number.isNaN(Date.parse(val)), {
        message: "dateOfBirth must be a valid ISO date string.",
      })
      .optional(),
    addressLine1: z.string().trim().max(200).optional(),
    city: z.string().trim().max(80).optional(),
    state: z.string().trim().max(80).optional(),
    postalCode: z.string().trim().max(24).optional(),
    country: z.string().trim().max(80).optional(),
    employmentStatus: z
      .enum([
        "EMPLOYED",
        "SELF_EMPLOYED",
        "BUSINESS_OWNER",
        "STUDENT",
        "RETIRED",
        "UNEMPLOYED",
      ])
      .optional(),
    monthlyIncome: z.coerce.number().min(0).max(100_000_000).optional(),
  })
  .strict();

export type CustomerUpdateProfileInput = z.infer<
  typeof customerUpdateProfileSchema
>;

export const customerConfigurePinSchema = z
  .object({
    currentPassword: z.string().min(1).optional(),
    currentPin: transactionPinField.optional(),
    newPin: transactionPinField,
    confirmPin: transactionPinField,
  })
  .strict()
  .refine((data) => data.newPin === data.confirmPin, {
    message: "New PIN and confirmation PIN do not match.",
    path: ["confirmPin"],
  });

export type CustomerConfigurePinInput = z.infer<
  typeof customerConfigurePinSchema
>;
