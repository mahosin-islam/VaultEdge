// ============================================================================
// VaultEdge — Customer Portal TypeScript Contracts
// Strictly aligned with GET /api/v1/customer/overview & GET /api/v1/notifications
// ============================================================================

export type CustomerAccountType =
  | "SAVINGS"
  | "CURRENT"
  | "BUSINESS"
  | "INTERNAL_TREASURY";
export type CustomerAccountStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "FROZEN"
  | "BLOCKED"
  | "CLOSED";
export type CustomerLoanStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "ACTIVE"
  | "COMPLETED"
  | "REJECTED"
  | "CLOSED"
  | "DEFAULTED";

export interface CustomerOverviewKpisDTO {
  totalAccountBalance: string;
  totalDeposits: string;
  totalDepositsCount: number;
  totalWithdrawals: string;
  totalWithdrawalsCount: number;
  activeLoansCount: number;
  accountsCount: number;
}

export interface CustomerOverviewAccountDTO {
  id: string;
  accountNumber: string;
  accountTitle: string;
  accountType: CustomerAccountType;
  status: CustomerAccountStatus;
  currency: string;
  balance: string;
}

export interface CustomerOverviewLoanDTO {
  id: string;
  loanReference: string;
  loanType: string;
  approvedAmount: string | null;
  remainingBalance: string;
  monthlyInstallment: string | null;
  status: CustomerLoanStatus;
}

export interface CustomerTransactionAccountRefDTO {
  id: string;
  accountNumber: string;
  accountTitle: string;
}

export interface CustomerOverviewTransactionDTO {
  id: string;
  referenceId: string;
  type: string;
  status: string;
  amount: string;
  fee: string;
  totalAmount: string;
  description: string | null;
  executedAt: string;
  senderAccount: CustomerTransactionAccountRefDTO | null;
  receiverAccount: CustomerTransactionAccountRefDTO | null;
}

export interface CustomerMonthlyMetricDTO {
  month: string;
  monthKey: string;
  amount: string;
}

export interface CustomerTransactionDistributionDTO {
  type: string;
  count: number;
  totalAmount: string;
}

export interface CustomerOverviewChartsDTO {
  monthlySpending: CustomerMonthlyMetricDTO[];
  monthlyDepositHistory: CustomerMonthlyMetricDTO[];
  transactionDistribution: CustomerTransactionDistributionDTO[];
}

export interface CustomerOverviewDashboardDTO {
  kpis: CustomerOverviewKpisDTO;
  accounts: CustomerOverviewAccountDTO[];
  activeLoans: CustomerOverviewLoanDTO[];
  recentTransactions: CustomerOverviewTransactionDTO[];
  charts: CustomerOverviewChartsDTO;
}

export interface CustomerOverviewQueryArgs {
  accountId?: string;
  months?: number;
}

export interface CustomerNotificationDTO {
  id: string;
  title: string;
  message: string;
  type: string;
  referenceId?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface CustomerNotificationsResponseDTO {
  notifications: CustomerNotificationDTO[];
  unreadCount: number;
}

export interface CustomerAccountLimitsDTO {
  dailyTransferLimit: string;
  maxSingleTransactionLimit: string;
  minBalanceRequired: string;
}

export interface CustomerAccountDetailDTO {
  id: string;
  accountNumber: string;
  accountTitle: string;
  accountType: CustomerAccountType;
  status: CustomerAccountStatus;
  currency: string;
  balance: string;
  effectiveLimits: CustomerAccountLimitsDTO;
  frozenReason: string | null;
  frozenAt?: string | null;
  createdAt: string;
}

export interface CustomerAccountsListResponseDTO {
  accounts: CustomerAccountDetailDTO[];
}

export interface CustomerAccountDetailResponseDTO {
  account: CustomerAccountDetailDTO;
}

export interface CustomerAccountTransactionItemDTO extends CustomerOverviewTransactionDTO {
  direction: "INBOUND" | "OUTBOUND";
}

export interface CustomerAccountTransactionsResponseDTO {
  transactions: CustomerAccountTransactionItemDTO[];
}

export interface CustomerAccountTransactionsQueryArgs {
  accountId: string;
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface CustomerTransferPayload {
  senderAccountId: string;
  recipientAccountNumber: string;
  amount: number;
  description?: string;
  transactionPin: string;
  idempotencyKey?: string;
}

export interface CustomerTransferResponseDTO {
  transaction: CustomerOverviewTransactionDTO;
}

export type CustomerRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface CustomerDepositRequestDTO {
  id: string;
  requestReference: string;
  amount: string;
  description: string | null;
  status: CustomerRequestStatus;
  reviewNote: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  account: CustomerTransactionAccountRefDTO;
  transaction: {
    id: string;
    referenceId: string;
    executedAt: string;
  } | null;
}

export interface CustomerDepositRequestsListResponseDTO {
  depositRequests: CustomerDepositRequestDTO[];
}

export interface CustomerDepositRequestDetailResponseDTO {
  depositRequest: CustomerDepositRequestDTO;
}

export interface CustomerDepositRequestPayload {
  accountId: string;
  amount: number;
  description?: string;
  idempotencyKey?: string;
}

export interface CustomerRequestListQueryArgs {
  page?: number;
  limit?: number;
  status?: CustomerRequestStatus;
  accountId?: string;
}

export interface CustomerWithdrawalRequestDTO {
  id: string;
  requestReference: string;
  amount: string;
  description: string | null;
  status: CustomerRequestStatus;
  reviewNote?: string | null;
  requestedAt: string;
  reviewedAt?: string | null;
  account: CustomerTransactionAccountRefDTO;
  transaction?: {
    id: string;
    referenceId: string;
    executedAt: string;
  } | null;
}

export interface CustomerWithdrawalRequestsListResponseDTO {
  withdrawalRequests: CustomerWithdrawalRequestDTO[];
}

export interface CustomerWithdrawalRequestDetailResponseDTO {
  withdrawalRequest: CustomerWithdrawalRequestDTO;
}

export interface CustomerWithdrawalRequestPayload {
  accountId: string;
  amount: number;
  description?: string;
  idempotencyKey?: string;
}

export interface CustomerTransactionsListQueryArgs {
  page?: number;
  limit?: number;
  accountId?: string;
  type?: string;
  status?: string;
  search?: string;
  referenceId?: string;
  startDate?: string;
  endDate?: string;
}

export interface CustomerTransactionsListResponseDTO {
  transactions: CustomerOverviewTransactionDTO[];
}

export interface CustomerLedgerEntryDTO {
  id: string;
  accountNumber: string;
  accountTitle: string;
  direction: string;
  entryCategory: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  createdAt: string;
}

export interface CustomerTransactionDetailDTO extends CustomerOverviewTransactionDTO {
  failureReason: string | null;
  ledgerEntries: CustomerLedgerEntryDTO[];
}

export interface CustomerTransactionDetailResponseDTO {
  transaction: CustomerTransactionDetailDTO;
}

export type CustomerLoanType =
  | "PERSONAL"
  | "BUSINESS"
  | "EDUCATION"
  | "HOME"
  | "AUTO";

export type CustomerEmploymentStatus =
  | "EMPLOYED"
  | "SELF_EMPLOYED"
  | "BUSINESS_OWNER"
  | "STUDENT"
  | "RETIRED"
  | "UNEMPLOYED";

export interface CustomerLoanListItemDTO {
  id: string;
  loanReference: string;
  loanType: CustomerLoanType | string;
  requestedAmount: string;
  approvedAmount: string | null;
  interestRate: string;
  durationMonths: number;
  status: CustomerLoanStatus;
  totalPayableAmount: string | null;
  monthlyInstallment: string | null;
  totalRepaidAmount: string;
  remainingBalance: string;
  rejectionReason: string | null;
  disbursedAt: string | null;
  createdAt: string;
  disbursementAccount: CustomerTransactionAccountRefDTO;
}

export interface CustomerLoanScheduleItemDTO {
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

export interface CustomerLoanRepaymentItemDTO {
  id: string;
  scheduleId: string | null;
  amountPaid: string;
  principalComponent: string;
  interestComponent: string;
  remainingBalanceAfter: string;
  paidAt: string;
  paidFromAccount: CustomerTransactionAccountRefDTO;
  transaction: {
    id: string;
    referenceId: string;
    executedAt: string;
  };
}

export interface CustomerLoanDetailDTO extends CustomerLoanListItemDTO {
  monthlyIncome: string;
  employmentStatus: string;
  description: string;
  decidedAt: string | null;
  completedAt: string | null;
  disbursementTransaction: {
    id: string;
    referenceId: string;
    executedAt: string;
  } | null;
  notes: Array<{
    id: string;
    note: string;
    createdAt: string;
    authorName: string;
    authorRole: string;
  }>;
  repaymentSchedule: CustomerLoanScheduleItemDTO[];
  repayments: CustomerLoanRepaymentItemDTO[];
}

export interface CustomerLoansListResponseDTO {
  loans: CustomerLoanListItemDTO[];
}

export interface CustomerLoanDetailResponseDTO {
  loan: CustomerLoanDetailDTO;
}

export interface CustomerLoansQueryArgs {
  page?: number;
  limit?: number;
  status?: string;
  loanType?: string;
}

export interface CustomerApplyLoanPayload {
  disbursementAccountId: string;
  loanType: CustomerLoanType;
  requestedAmount: number;
  durationMonths: number;
  monthlyIncome?: number;
  employmentStatus?: CustomerEmploymentStatus;
  description: string;
  idempotencyKey?: string;
}

export interface CustomerRepayLoanPayload {
  loanId: string;
  paidFromAccountId: string;
  amount?: number;
  scheduleId?: string;
  transactionPin: string;
  idempotencyKey?: string;
}

export interface CustomerStatementEntryDTO {
  id: string;
  date: string;
  referenceId: string;
  type: string;
  status: string;
  direction: string;
  entryCategory: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  description: string;
}

export interface CustomerStatementDTO {
  account: {
    id: string;
    accountNumber: string;
    accountTitle: string;
    accountType: CustomerAccountType;
    currency: string;
    currentBalance: string;
  };
  periodLabel: string;
  entries: CustomerStatementEntryDTO[];
}

export interface CustomerStatementResponseDTO {
  statement: CustomerStatementDTO;
}

export interface CustomerStatementQueryArgs {
  accountId: string;
  startDate?: string;
  endDate?: string;
}

export interface CustomerUpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  employmentStatus?: CustomerEmploymentStatus;
  monthlyIncome?: number;
}

export interface CustomerConfigurePinPayload {
  currentPassword?: string;
  currentPin?: string;
  newPin: string;
  confirmPin: string;
  isUpdate?: boolean;
}
