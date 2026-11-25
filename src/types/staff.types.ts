// ============================================================================
// VaultEdge — Bank Staff TypeScript Contracts
// Matches GET /api/v1/staff/overview response payload
// ============================================================================

import type {
  FlagSource,
  FlagStatus,
  KycVerificationStatus,
  LoanStatus,
  LoanType,
  TransactionStatus,
  TransactionType,
  UserStatus,
} from "@prisma/client";

export interface StaffOverviewKpisDTO {
  totalCustomers: number;
  pendingKycVerifications: number;
  verifiedCustomers: number;
  totalBankAccounts: number;
  pendingTransactions: number;
  flaggedTransactions: number;
  openSuspiciousFlags: number;
  pendingLoanApplications: number;
  underReviewLoanApplications: number;
}

export interface StaffPendingVerificationItemDTO {
  userId: string;
  customerCode: string;
  fullName: string;
  email: string;
  userStatus: UserStatus;
  kycStatus: KycVerificationStatus;
  createdAt: string;
}

export interface StaffOpenSuspiciousFlagItemDTO {
  flagId: string;
  source: FlagSource;
  status: FlagStatus;
  reason: string;
  createdAt: string;
  transaction: {
    id: string;
    referenceId: string;
    type: TransactionType;
    status: TransactionStatus;
    amount: string;
    executedAt: string;
  };
}

export interface StaffLoanQueueItemDTO {
  id: string;
  loanReference: string;
  loanType: LoanType;
  requestedAmount: string;
  status: LoanStatus;
  customerName: string;
  customerEmail: string;
  createdAt: string;
}

export interface StaffOverviewDashboardDTO {
  kpis: StaffOverviewKpisDTO;
  queues: {
    pendingVerifications: StaffPendingVerificationItemDTO[];
    openSuspiciousFlags: StaffOpenSuspiciousFlagItemDTO[];
    loanQueue: StaffLoanQueueItemDTO[];
  };
}

export interface StaffRegisterCustomerPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  nationalIdNumber?: string;
  employmentStatus?:
    | "EMPLOYED"
    | "SELF_EMPLOYED"
    | "BUSINESS_OWNER"
    | "STUDENT"
    | "RETIRED"
    | "UNEMPLOYED";
  monthlyIncome?: number;
}

export interface StaffCreateAccountPayload {
  userId: string;
  accountType: "SAVINGS" | "CURRENT" | "BUSINESS";
  accountTitle?: string;
  currency?: string;
  initialDeposit?: number;
  dailyTransferLimit?: number | null;
  maxSingleTransactionLimit?: number | null;
  minBalanceRequired?: number | null;
}

export interface StaffVerifyCustomerPayload {
  customerId: string;
  kycStatus: KycVerificationStatus;
  kycNotes?: string;
}

export interface StaffFlagTransactionPayload {
  transactionId: string;
  reason: string;
  ruleCode?: string;
}

export interface StaffSuspiciousFlagItemDTO {
  id: string;
  source: FlagSource;
  ruleCode: string | null;
  reason: string;
  status: FlagStatus;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  flaggedBy: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
  resolvedByAdmin: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  transaction: {
    id: string;
    referenceId: string;
    type: TransactionType;
    status: TransactionStatus;
    amount: string;
    fee: string;
    totalAmount: string;
    executedAt: string;
    senderAccount: {
      id: string;
      accountNumber: string;
      accountTitle: string;
    } | null;
    receiverAccount: {
      id: string;
      accountNumber: string;
      accountTitle: string;
    } | null;
  };
}

export interface StaffSuspiciousListResponseDTO {
  suspiciousFlags: StaffSuspiciousFlagItemDTO[];
}

export interface StaffSuspiciousQueryArgs {
  page?: number;
  limit?: number;
  status?: FlagStatus;
  search?: string;
}

export interface StaffReviewLoanPayload {
  loanId: string;
  action: "ADD_NOTE" | "FORWARD_FOR_APPROVAL";
  note: string;
  isInternal?: boolean;
}
