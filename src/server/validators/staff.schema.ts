// ============================================================================
// VaultEdge — Bank Staff API Request Validation Schemas (Zod)
// Reuses shared Admin/Banking query schemas where appropriate and adds
// Staff-specific onboarding, KYC verification, flagging, and loan review rules.
// ============================================================================

import { z } from "zod";
import { paginationQuerySchema } from "@/server/validators/admin.schema";

export const staffRegisterCustomerSchema = z
  .object({
    firstName: z
      .string({ message: "First name is required." })
      .trim()
      .min(2, "First name must be at least 2 characters.")
      .max(60, "First name cannot exceed 60 characters."),
    lastName: z
      .string({ message: "Last name is required." })
      .trim()
      .min(2, "Last name must be at least 2 characters.")
      .max(60, "Last name cannot exceed 60 characters."),
    email: z
      .string({ message: "Email is required." })
      .trim()
      .toLowerCase()
      .email("Please enter a valid email address."),
    password: z
      .string({ message: "Temporary password is required." })
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password cannot exceed 128 characters."),
    phone: z
      .string({ message: "Phone number is required." })
      .trim()
      .min(7, "Phone number must be at least 7 characters.")
      .max(24, "Phone number cannot exceed 24 characters."),
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
    nationalIdNumber: z.string().trim().min(4).max(60).optional(),
    employmentStatus: z
      .enum(["EMPLOYED", "SELF_EMPLOYED", "BUSINESS_OWNER", "STUDENT", "RETIRED", "UNEMPLOYED"])
      .optional(),
    monthlyIncome: z.coerce
      .number()
      .min(0, "Monthly income cannot be negative.")
      .max(100_000_000)
      .optional(),
  })
  .strict();

export type StaffRegisterCustomerInput = z.infer<
  typeof staffRegisterCustomerSchema
>;

export const staffVerifyCustomerSchema = z
  .object({
    kycStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"], {
      message: "kycStatus must be PENDING, VERIFIED, or REJECTED.",
    }),
    kycNotes: z
      .string()
      .trim()
      .max(500, "KYC notes cannot exceed 500 characters.")
      .optional(),
  })
  .strict();

export type StaffVerifyCustomerInput = z.infer<
  typeof staffVerifyCustomerSchema
>;

export const staffFlagTransactionSchema = z
  .object({
    reason: z
      .string({ message: "A flag reason is required." })
      .trim()
      .min(5, "Reason must be at least 5 characters.")
      .max(500, "Reason cannot exceed 500 characters."),
    ruleCode: z.string().trim().max(64).optional(),
  })
  .strict();

export type StaffFlagTransactionInput = z.infer<
  typeof staffFlagTransactionSchema
>;

export const staffSuspiciousListQuerySchema = paginationQuerySchema.extend({
  status: z
    .enum(["OPEN", "UNDER_REVIEW", "CONFIRMED_SUSPICIOUS", "RESOLVED_SAFE"])
    .optional(),
  search: z.string().trim().max(120).optional(),
});

export type StaffSuspiciousListQueryInput = z.infer<
  typeof staffSuspiciousListQuerySchema
>;

export const staffLoanReviewSchema = z
  .object({
    action: z.enum(["ADD_NOTE", "FORWARD_FOR_APPROVAL"], {
      message: "action must be ADD_NOTE or FORWARD_FOR_APPROVAL.",
    }),
    note: z
      .string({ message: "Review note is required." })
      .trim()
      .min(3, "Review note must be at least 3 characters.")
      .max(1000, "Review note cannot exceed 1000 characters."),
    isInternal: z.boolean().default(true),
  })
  .strict();

export type StaffLoanReviewInput = z.infer<typeof staffLoanReviewSchema>;
