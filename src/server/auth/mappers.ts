// ============================================================================
// VaultEdge — Safe User Serializer & Authentication Helper Utilities
// Strictly strips passwordHash, transactionPinHash, twoFactorSecret, etc.
// ============================================================================

import type { CustomerProfile, User } from "@prisma/client";
import type { SafeCustomerProfileDTO, SafeUserDTO } from "@/types/auth.types";

export type UserWithProfile = User & {
  customerProfile: CustomerProfile | null;
};

export function toSafeCustomerProfileDTO(
  profile: CustomerProfile | null
): SafeCustomerProfileDTO | null {
  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    customerCode: profile.customerCode,
    phone: profile.phone,
    dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString() : null,
    addressLine1: profile.addressLine1,
    city: profile.city,
    state: profile.state,
    postalCode: profile.postalCode,
    country: profile.country,
    employmentStatus: profile.employmentStatus,
    monthlyIncome: profile.monthlyIncome.toFixed(2),
    kycStatus: profile.kycStatus,
    verifiedAt: profile.verifiedAt ? profile.verifiedAt.toISOString() : null,
  };
}

export function toSafeUserDTO(user: UserWithProfile): SafeUserDTO {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    role: user.role,
    status: user.status,
    hasTransactionPin: Boolean(user.transactionPinHash),
    twoFactorEnabled: user.twoFactorEnabled,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    customerProfile: toSafeCustomerProfileDTO(user.customerProfile),
  };
}

export function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0] ?? "Customer", lastName: "Account" };
  }
  const firstName = parts[0] ?? "Customer";
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}
