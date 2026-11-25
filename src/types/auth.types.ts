// ============================================================================
// VaultEdge — Authentication & User Safe Profile Contracts
// Never includes passwordHash, transactionPinHash, twoFactorSecret, or tokenHash.
// ============================================================================

import type {
  EmploymentStatus,
  KycVerificationStatus,
  UserRole,
  UserStatus,
} from "@prisma/client";

export interface SafeCustomerProfileDTO {
  id: string;
  customerCode: string;
  phone: string;
  dateOfBirth: string | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  employmentStatus: EmploymentStatus;
  monthlyIncome: string;
  kycStatus: KycVerificationStatus;
  verifiedAt: string | null;
}

export interface SafeUserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  hasTransactionPin: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  customerProfile: SafeCustomerProfileDTO | null;
}

export interface JwtAccessPayload {
  sub: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  tokenType: "access";
}

export interface JwtRefreshPayload {
  sub: string;
  jti: string;
  role: UserRole;
  tokenType: "refresh";
}

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
  accessMaxAgeSeconds: number;
  refreshMaxAgeSeconds: number;
}

export interface AuthSessionResponseDTO {
  user: SafeUserDTO;
  tokens: {
    accessToken: string;
    refreshToken: string;
    tokenType: "Bearer";
    accessExpiresIn: string;
    refreshExpiresIn: string;
  };
}
