// ============================================================================
// VaultEdge — Admin Overview & Analytics TypeScript Contracts
// Matches the exact response payload of GET /api/v1/admin/overview
// ============================================================================

import type {
  AccountStatus,
  AccountType,
  KycVerificationStatus,
  LoanStatus,
  LoanType,
  RequestStatus,
  TransactionStatus,
  TransactionType,
  UserRole,
  UserStatus,
} from "@prisma/client";
import type { SafeUserDTO } from "@/types/auth.types";

export interface AdminOverviewKpisDTO {
  totalRegisteredCustomers: number;
  activeCustomers: number;
  blockedCustomers: number;
  totalBankAccounts: number;
  totalBankBalance: string;
  totalDeposits: string;
  totalDepositsCount: number;
  totalWithdrawals: string;
  totalWithdrawalsCount: number;
  totalTransactions: number;
  flaggedTransactionsCount: number;
  pendingDepositRequests: number;
  pendingWithdrawalRequests: number;
  pendingLoanApplications: number;
}

export interface MonthlyTransactionVolumePoint {
  month: string;
  monthKey: string;
  transactionCount: number;
  totalVolume: string;
}

export interface DepositVsWithdrawalPoint {
  month: string;
  monthKey: string;
  deposits: string;
  withdrawals: string;
}

export interface AccountDistributionPoint {
  accountType: AccountType;
  count: number;
  totalBalance: string;
}

export interface AccountStatusDistributionPoint {
  status: AccountStatus;
  count: number;
}

export interface LoanApprovalStatPoint {
  status: LoanStatus;
  count: number;
  totalRequestedAmount: string;
  totalApprovedAmount: string;
  totalRemainingBalance: string;
}

export interface LoanTypeDistributionPoint {
  loanType: LoanType;
  count: number;
  totalRequestedAmount: string;
}

export interface MonthlyBankingActivityPoint {
  month: string;
  monthKey: string;
  transfersVolume: string;
  loanDisbursementsVolume: string;
  loanRepaymentsVolume: string;
  newCustomers: number;
  newAccounts: number;
}

export interface AdminActionQueueItemDTO {
  id: string;
  entityId: string;
  category: "WITHDRAWAL" | "DEPOSIT" | "LOAN" | "SUSPICIOUS_FLAG";
  referenceCode: string;
  title: string;
  subtitle: string;
  metaNote: string;
  amount: string;
  severity: "WARNING" | "INFO" | "DANGER";
  targetAccountId: string | null;
  createdAt: string;
}

export interface AdminRecentTransactionDTO {
  id: string;
  referenceId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  fee: string;
  totalAmount: string;
  description: string | null;
  isFlagged: boolean;
  senderAccount: {
    id: string;
    accountNumber: string;
    accountTitle: string;
    isSystemAccount: boolean;
  } | null;
  receiverAccount: {
    id: string;
    accountNumber: string;
    accountTitle: string;
    isSystemAccount: boolean;
  } | null;
  executedAt: string;
}

export interface AdminRecentActivityDTO {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorRole: UserRole | null;
  actorName: string;
  createdAt: string;
}

export type AdminAnalyticsReportDTO = Pick<
  AdminOverviewDashboardDTO,
  "kpis" | "charts"
>;

export interface AdminOverviewDashboardDTO {
  kpis: AdminOverviewKpisDTO;
  charts: {
    monthlyTransactionVolume: MonthlyTransactionVolumePoint[];
    depositVsWithdrawal: DepositVsWithdrawalPoint[];
    accountDistribution: AccountDistributionPoint[];
    accountStatusDistribution: AccountStatusDistributionPoint[];
    loanApprovalStatistics: LoanApprovalStatPoint[];
    loanTypeDistribution: LoanTypeDistributionPoint[];
    monthlyBankingActivity: MonthlyBankingActivityPoint[];
  };
  actionQueue: AdminActionQueueItemDTO[];
  recentTransactions: AdminRecentTransactionDTO[];
  recentActivity: AdminRecentActivityDTO[];
}

// ============================================================================
// Admin Customer Directory & KYC Management DTOs
// ============================================================================

export interface AdminCustomerAccountBriefDTO {
  id: string;
  accountNumber: string;
  accountTitle: string;
  accountType: AccountType;
  status: AccountStatus;
  currency: string;
  balance: string;
}

export interface AdminCustomerListItemDTO extends SafeUserDTO {
  accountsCount: number;
  totalBalance: string;
  accounts: AdminCustomerAccountBriefDTO[];
}

export interface AdminCustomerSummaryCountsDTO {
  totalCustomers: number;
  activeCustomers: number;
  flaggedOrBlockedCustomers: number;
}

export interface AdminCustomerListResponseDTO {
  customers: AdminCustomerListItemDTO[];
  summaryCounts: AdminCustomerSummaryCountsDTO;
}

export interface AdminCustomerAccountDetailDTO {
  id: string;
  accountNumber: string;
  accountTitle: string;
  accountType: AccountType;
  status: AccountStatus;
  currency: string;
  balance: string;
  dailyTransferLimit: string | null;
  maxSingleTransactionLimit: string | null;
  minBalanceRequired: string | null;
  frozenReason: string | null;
  frozenAt: string | null;
  createdAt: string;
}

export interface AdminCustomerDetailResponseDTO {
  customer: SafeUserDTO;
  financialSummary: {
    totalAccounts: number;
    totalBalance: string;
    activeLoansCount: number;
  };
  accounts: AdminCustomerAccountDetailDTO[];
  recentLoans: Array<{
    id: string;
    loanReference: string;
    loanType: LoanType;
    requestedAmount: string;
    approvedAmount: string | null;
    remainingBalance: string;
    status: LoanStatus;
    createdAt: string;
  }>;
  recentDeposits: Array<{
    id: string;
    requestReference: string;
    amount: string;
    status: RequestStatus;
    requestedAt: string;
  }>;
  recentWithdrawals: Array<{
    id: string;
    requestReference: string;
    amount: string;
    status: RequestStatus;
    requestedAt: string;
  }>;
  securityAuditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    ipAddress: string | null;
    createdAt: string;
  }>;
}

export interface AdminCustomerTransactionsResponseDTO {
  transactions: AdminRecentTransactionDTO[];
}

export interface AdminCustomersQueryArgs {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus;
  kycStatus?: KycVerificationStatus;
}

// ============================================================================
// Admin Bank Account Management DTOs
// ============================================================================

export interface AdminBankAccountOwnerDTO {
  id: string;
  email: string;
  fullName: string;
  status: UserStatus;
  customerCode: string | null;
  phone: string | null;
  kycStatus: KycVerificationStatus | null;
}

export interface AdminBankAccountListItemDTO {
  id: string;
  accountNumber: string;
  accountTitle: string;
  accountType: AccountType;
  status: AccountStatus;
  currency: string;
  balance: string;
  dailyTransferLimit: string | null;
  maxSingleTransactionLimit: string | null;
  minBalanceRequired: string | null;
  frozenReason: string | null;
  frozenAt: string | null;
  createdAt: string;
  updatedAt: string;
  owner: AdminBankAccountOwnerDTO | null;
}

export interface AdminBankAccountSummaryCountsDTO {
  totalAccounts: number;
  activeAccounts: number;
  frozenOrBlockedAccounts: number;
  totalLiquidity: string;
}

export interface AdminBankAccountListResponseDTO {
  accounts: AdminBankAccountListItemDTO[];
  summaryCounts: AdminBankAccountSummaryCountsDTO;
}

export interface AdminAccountLedgerEntryDTO {
  id: string;
  transactionId: string;
  referenceId: string;
  transactionType: TransactionType;
  transactionStatus: TransactionStatus;
  direction: "DEBIT" | "CREDIT";
  entryCategory: "PRINCIPAL" | "FEE" | "INTEREST" | "REVERSAL";
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  description: string | null;
  createdAt: string;
}

export interface AdminBankAccountDetailResponseDTO {
  account: AdminBankAccountListItemDTO;
  effectiveLimits: {
    dailyTransferLimit: string;
    maxSingleTransactionLimit: string;
    minBalanceRequired: string;
  };
  recentLedgerEntries: AdminAccountLedgerEntryDTO[];
}

export interface AdminAccountsQueryArgs {
  page?: number;
  limit?: number;
  search?: string;
  accountType?: "SAVINGS" | "CURRENT" | "BUSINESS";
  status?: AccountStatus;
  userId?: string;
}

// ============================================================================
// Admin Transaction Management DTOs
// ============================================================================

export interface AdminTransactionAccountRefDTO {
  id: string;
  accountNumber: string;
  accountTitle: string;
  accountType: AccountType;
  isSystemAccount: boolean;
  ownerName: string | null;
}

export interface AdminTransactionInitiatorDTO {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface AdminTransactionListItemDTO {
  id: string;
  referenceId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  fee: string;
  totalAmount: string;
  description: string | null;
  failureReason: string | null;
  isFlagged: boolean;
  reversedTransactionId: string | null;
  executedAt: string;
  createdAt: string;
  senderAccount: AdminTransactionAccountRefDTO | null;
  receiverAccount: AdminTransactionAccountRefDTO | null;
  initiatedBy: AdminTransactionInitiatorDTO;
  suspiciousFlagsCount: number;
  openFlagsCount: number;
}

export interface AdminTransactionSummaryCountsDTO {
  totalTransactions: number;
  completedTransactions: number;
  flaggedTransactions: number;
  pendingOrFailedTransactions: number;
  totalCompletedVolume: string;
}

export interface AdminTransactionListResponseDTO {
  transactions: AdminTransactionListItemDTO[];
  summaryCounts: AdminTransactionSummaryCountsDTO;
}

export interface AdminTransactionLedgerPostingDTO {
  id: string;
  accountId: string;
  accountNumber: string;
  accountTitle: string;
  isSystemAccount: boolean;
  direction: "DEBIT" | "CREDIT";
  entryCategory: "PRINCIPAL" | "FEE" | "INTEREST" | "REVERSAL";
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  description: string | null;
  createdAt: string;
}

export interface AdminTransactionFlagDTO {
  id: string;
  source: string;
  ruleCode: string | null;
  reason: string;
  status: string;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  flaggedBy: {
    id: string;
    fullName: string;
    role: UserRole;
  } | null;
  resolvedByAdmin: {
    id: string;
    fullName: string;
  } | null;
}

export interface AdminTransactionDetailAccountDTO {
  id: string;
  accountNumber: string;
  accountTitle: string;
  accountType: AccountType;
  status: AccountStatus;
  isSystemAccount: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface AdminTransactionDetailDTO {
  id: string;
  referenceId: string;
  idempotencyKey: string | null;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  fee: string;
  totalAmount: string;
  description: string | null;
  failureReason: string | null;
  isFlagged: boolean;
  executedAt: string;
  createdAt: string;
  senderAccount: AdminTransactionDetailAccountDTO | null;
  receiverAccount: AdminTransactionDetailAccountDTO | null;
  initiatedBy: AdminTransactionInitiatorDTO;
  reversedTransaction: {
    id: string;
    referenceId: string;
    status: TransactionStatus;
    executedAt: string;
  } | null;
  reversalTransaction: {
    id: string;
    referenceId: string;
    status: TransactionStatus;
    executedAt: string;
  } | null;
  ledgerEntries: AdminTransactionLedgerPostingDTO[];
  suspiciousFlags: AdminTransactionFlagDTO[];
}

export interface AdminTransactionDetailResponseDTO {
  transaction: AdminTransactionDetailDTO;
}

export interface AdminTransactionsQueryArgs {
  page?: number;
  limit?: number;
  search?: string;
  referenceId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  isFlagged?: "true" | "false";
  startDate?: string;
  endDate?: string;
  accountId?: string;
  customerId?: string;
}

export type AdminReviewTransactionAction =
  | "RESOLVE_FLAG_SAFE"
  | "CONFIRM_SUSPICIOUS"
  | "FLAG_SUSPICIOUS"
  | "REVERSE_TRANSACTION";

export interface AdminReviewTransactionPayload {
  transactionId: string;
  action: AdminReviewTransactionAction;
  note: string;
  flagId?: string;
}

// ============================================================================
// Admin Deposit Request Management DTOs
// ============================================================================

export interface AdminDepositRequestItemDTO {
  id: string;
  requestReference: string;
  amount: string;
  description: string | null;
  status: RequestStatus;
  reviewNote: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  account: {
    id: string;
    accountNumber: string;
    accountTitle: string;
    accountType: AccountType;
    status: AccountStatus;
    currency: string;
    balance: string;
  };
  customer: {
    id: string;
    fullName: string;
    email: string;
    status: UserStatus;
    customerCode: string | null;
    phone: string | null;
    kycStatus: KycVerificationStatus | null;
  };
  reviewedBy: {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
  } | null;
  transaction: {
    id: string;
    referenceId: string;
    status: TransactionStatus;
    executedAt: string;
  } | null;
}

export interface AdminDepositSummaryCountsDTO {
  totalRequests: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalApprovedVolume: string;
}

export interface AdminDepositListResponseDTO {
  depositRequests: AdminDepositRequestItemDTO[];
  summaryCounts: AdminDepositSummaryCountsDTO;
}

export interface AdminDepositDetailResponseDTO {
  depositRequest: AdminDepositRequestItemDTO;
}

export interface AdminDepositsQueryArgs {
  page?: number;
  limit?: number;
  search?: string;
  status?: RequestStatus;
  startDate?: string;
  endDate?: string;
  customerId?: string;
  accountId?: string;
}

// ============================================================================
// Admin Withdrawal Request Management DTOs
// ============================================================================

export type AdminWithdrawalRequestItemDTO = AdminDepositRequestItemDTO;

export type AdminWithdrawalSummaryCountsDTO = AdminDepositSummaryCountsDTO;

export interface AdminWithdrawalListResponseDTO {
  withdrawalRequests: AdminWithdrawalRequestItemDTO[];
  summaryCounts: AdminWithdrawalSummaryCountsDTO;
}

export interface AdminWithdrawalDetailResponseDTO {
  withdrawalRequest: AdminWithdrawalRequestItemDTO;
}

export type AdminWithdrawalsQueryArgs = AdminDepositsQueryArgs;

// ============================================================================
// Admin Loan Management DTOs
// ============================================================================

export interface AdminLoanListItemDTO {
  id: string;
  loanReference: string;
  loanType: LoanType;
  requestedAmount: string;
  approvedAmount: string | null;
  interestRate: string;
  durationMonths: number;
  monthlyIncome: string;
  employmentStatus: string;
  description: string | null;
  status: LoanStatus;
  totalPayableAmount: string | null;
  monthlyInstallment: string | null;
  totalRepaidAmount: string;
  remainingBalance: string;
  rejectionReason: string | null;
  forwardedForApprovalAt: string | null;
  decidedAt: string | null;
  disbursedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  customer: {
    id: string;
    fullName: string;
    email: string;
    status: UserStatus;
    customerCode: string | null;
    phone: string | null;
    kycStatus: KycVerificationStatus | null;
  };
  disbursementAccount: {
    id: string;
    accountNumber: string;
    accountTitle: string;
    accountType: AccountType;
    status: AccountStatus;
    currency: string;
    balance: string;
  };
  reviewedByStaff: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  decidedByAdmin: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  disbursementTransaction: {
    id: string;
    referenceId: string;
    status: TransactionStatus;
    executedAt: string;
  } | null;
  notesCount: number;
  installmentsCount: number;
  repaymentsCount: number;
}

export interface AdminLoanSummaryCountsDTO {
  totalLoans: number;
  pendingReviewCount: number;
  activeCount: number;
  rejectedCount: number;
  totalDisbursedPortfolio: string;
  totalRemainingBalance: string;
}

export interface AdminLoanListResponseDTO {
  loans: AdminLoanListItemDTO[];
  summaryCounts: AdminLoanSummaryCountsDTO;
}

export interface AdminLoanNoteDTO {
  id: string;
  note: string;
  isInternal: boolean;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
  };
}

export interface AdminLoanScheduleItemDTO {
  id: string;
  installmentNumber: number;
  dueDate: string;
  principalAmount: string;
  interestAmount: string;
  totalInstallment: string;
  paidAmount: string;
  status: string;
  paidAt: string | null;
}

export interface AdminLoanRepaymentDTO {
  id: string;
  scheduleId: string | null;
  amountPaid: string;
  principalComponent: string;
  interestComponent: string;
  remainingBalanceAfter: string;
  paidAt: string;
  paidFromAccount: {
    id: string;
    accountNumber: string;
    accountTitle: string;
  };
  transaction: {
    id: string;
    referenceId: string;
    status: TransactionStatus;
    executedAt: string;
  };
}

export interface AdminLoanDetailDTO
  extends Omit<
    AdminLoanListItemDTO,
    "notesCount" | "installmentsCount" | "repaymentsCount"
  > {
  updatedAt: string;
  notes: AdminLoanNoteDTO[];
  repaymentSchedule: AdminLoanScheduleItemDTO[];
  repayments: AdminLoanRepaymentDTO[];
}

export interface AdminLoanDetailResponseDTO {
  loan: AdminLoanDetailDTO;
}

export interface AdminLoansQueryArgs {
  page?: number;
  limit?: number;
  search?: string;
  status?: LoanStatus;
  loanType?: LoanType;
  startDate?: string;
  endDate?: string;
  customerId?: string;
}

// ============================================================================
// Admin Bank-Wide Settings DTOs
// ============================================================================

export interface AdminSystemSettingsDTO {
  id: string;
  defaultDailyTransferLimit: string;
  defaultMaxSingleTransfer: string;
  defaultMinAccountBalance: string;
  transferFeeFlat: string;
  suspiciousAmountThreshold: string;
  defaultLoanInterestRate: string;
  updatedByAdminId: string | null;
  updatedAt: string;
}

export interface AdminUpdateSettingsPayload {
  defaultDailyTransferLimit?: number;
  defaultMaxSingleTransfer?: number;
  defaultMinAccountBalance?: number;
  transferFeeFlat?: number;
  suspiciousAmountThreshold?: number;
  defaultLoanInterestRate?: number;
}
