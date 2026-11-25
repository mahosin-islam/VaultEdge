// ============================================================================
// VaultEdge — Authentication Zod Validation Schemas
// Public registration strictly forbids client-submitted role elevation.
// ============================================================================

import { z } from "zod";

export const registerSchema = z
  .object({
    fullName: z
      .string({ message: "Full name is required." })
      .trim()
      .min(2, "Full name must be at least 2 characters.")
      .max(100, "Full name cannot exceed 100 characters."),
    email: z
      .string({ message: "Email is required." })
      .trim()
      .toLowerCase()
      .email("Please enter a valid email address.")
      .max(160, "Email cannot exceed 160 characters."),
    password: z
      .string({ message: "Password is required." })
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password cannot exceed 72 characters.")
      .regex(
        /[A-Z]/,
        "Password must contain at least one uppercase letter."
      )
      .regex(
        /[a-z]/,
        "Password must contain at least one lowercase letter."
      )
      .regex(/[0-9]/, "Password must contain at least one number.")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character."
      ),
    confirmPassword: z
      .string({ message: "Confirm password is required." })
      .min(1, "Please confirm your password."),
    phone: z
      .string()
      .trim()
      .regex(
        /^\+?[0-9\-\s()]{7,20}$/,
        "Please provide a valid phone number."
      )
      .optional(),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z
  .object({
    email: z
      .string({ message: "Email is required." })
      .trim()
      .toLowerCase()
      .email("Please enter a valid email address."),
    password: z
      .string({ message: "Password is required." })
      .min(1, "Password is required."),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().trim().min(1).optional(),
  })
  .strict();

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
