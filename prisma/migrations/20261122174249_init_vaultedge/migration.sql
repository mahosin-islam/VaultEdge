-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DEACTIVATED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "KycVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('EMPLOYED', 'SELF_EMPLOYED', 'BUSINESS_OWNER', 'STUDENT', 'RETIRED', 'UNEMPLOYED');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('SAVINGS', 'CURRENT', 'BUSINESS', 'INTERNAL_TREASURY');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'FROZEN', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'FUND_TRANSFER', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('PERSONAL', 'HOME', 'AUTO', 'BUSINESS', 'EDUCATION');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "LedgerEntryCategory" AS ENUM ('PRINCIPAL', 'FEE', 'INTEREST', 'REVERSAL');

-- CreateEnum
CREATE TYPE "FlagSource" AS ENUM ('STAFF_MANUAL', 'SYSTEM_RULE');

-- CreateEnum
CREATE TYPE "FlagStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED_SAFE', 'CONFIRMED_SUSPICIOUS');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MONEY_RECEIVED', 'TRANSFER_COMPLETED', 'DEPOSIT_APPROVED', 'DEPOSIT_REJECTED', 'WITHDRAWAL_APPROVED', 'WITHDRAWAL_REJECTED', 'LOAN_APPROVED', 'LOAN_REJECTED', 'ACCOUNT_STATUS_CHANGED', 'SECURITY_ALERT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "transactionPinHash" TEXT,
    "pinFailedAttempts" INTEGER NOT NULL DEFAULT 0,
    "pinLockedUntil" TIMESTAMP(3),
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verifiedById" TEXT,
    "customerCode" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "addressLine1" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "nationalIdNumber" TEXT,
    "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT 'EMPLOYED',
    "monthlyIncome" DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    "kycStatus" "KycVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "kycNotes" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "createdById" TEXT,
    "accountNumber" TEXT NOT NULL,
    "accountTitle" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "isSystemAccount" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "balance" DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    "dailyTransferLimit" DECIMAL(18,2),
    "maxSingleTransactionLimit" DECIMAL(18,2),
    "minBalanceRequired" DECIMAL(18,2),
    "frozenReason" TEXT,
    "frozenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "senderAccountId" TEXT,
    "receiverAccountId" TEXT,
    "initiatedById" TEXT NOT NULL,
    "reversedTransactionId" TEXT,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(18,2) NOT NULL,
    "fee" DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "description" TEXT,
    "failureReason" TEXT,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "entryCategory" "LedgerEntryCategory" NOT NULL DEFAULT 'PRINCIPAL',
    "amount" DECIMAL(18,2) NOT NULL,
    "balanceBefore" DECIMAL(18,2) NOT NULL,
    "balanceAfter" DECIMAL(18,2) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositRequest" (
    "id" TEXT NOT NULL,
    "requestReference" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "accountId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "reviewedById" TEXT,
    "transactionId" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "description" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "DepositRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WithdrawalRequest" (
    "id" TEXT NOT NULL,
    "requestReference" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "accountId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "reviewedById" TEXT,
    "transactionId" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "description" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "WithdrawalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanApplication" (
    "id" TEXT NOT NULL,
    "loanReference" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "customerId" TEXT NOT NULL,
    "disbursementAccountId" TEXT NOT NULL,
    "reviewedByStaffId" TEXT,
    "decidedByAdminId" TEXT,
    "disbursementTransactionId" TEXT,
    "loanType" "LoanType" NOT NULL,
    "requestedAmount" DECIMAL(18,2) NOT NULL,
    "approvedAmount" DECIMAL(18,2),
    "interestRate" DECIMAL(5,2) NOT NULL DEFAULT 8.50,
    "durationMonths" INTEGER NOT NULL,
    "monthlyIncome" DECIMAL(18,2) NOT NULL,
    "employmentStatus" "EmploymentStatus" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'PENDING',
    "totalPayableAmount" DECIMAL(18,2),
    "monthlyInstallment" DECIMAL(18,2),
    "totalRepaidAmount" DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    "remainingBalance" DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    "rejectionReason" TEXT,
    "forwardedForApprovalAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "disbursedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanNote" (
    "id" TEXT NOT NULL,
    "loanApplicationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanRepaymentSchedule" (
    "id" TEXT NOT NULL,
    "loanApplicationId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "principalAmount" DECIMAL(18,2) NOT NULL,
    "interestAmount" DECIMAL(18,2) NOT NULL,
    "totalInstallment" DECIMAL(18,2) NOT NULL,
    "paidAmount" DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    "status" "InstallmentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "LoanRepaymentSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanRepayment" (
    "id" TEXT NOT NULL,
    "loanApplicationId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "transactionId" TEXT NOT NULL,
    "paidFromAccountId" TEXT NOT NULL,
    "amountPaid" DECIMAL(18,2) NOT NULL,
    "principalComponent" DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    "interestComponent" DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    "remainingBalanceAfter" DECIMAL(18,2) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanRepayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuspiciousTransactionFlag" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "flaggedById" TEXT,
    "resolvedByAdminId" TEXT,
    "source" "FlagSource" NOT NULL,
    "ruleCode" TEXT,
    "reason" TEXT NOT NULL,
    "status" "FlagStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SuspiciousTransactionFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "referenceId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "updatedByAdminId" TEXT,
    "defaultDailyTransferLimit" DECIMAL(18,2) NOT NULL DEFAULT 25000.00,
    "defaultMaxSingleTransfer" DECIMAL(18,2) NOT NULL DEFAULT 10000.00,
    "defaultMinAccountBalance" DECIMAL(18,2) NOT NULL DEFAULT 100.00,
    "transferFeeFlat" DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    "suspiciousAmountThreshold" DECIMAL(18,2) NOT NULL DEFAULT 15000.00,
    "defaultLoanInterestRate" DECIMAL(5,2) NOT NULL DEFAULT 8.50,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" "UserRole",
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_expiresAt_idx" ON "RefreshToken"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_userId_key" ON "CustomerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_customerCode_key" ON "CustomerProfile"("customerCode");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_phone_key" ON "CustomerProfile"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_nationalIdNumber_key" ON "CustomerProfile"("nationalIdNumber");

-- CreateIndex
CREATE INDEX "CustomerProfile_kycStatus_createdAt_idx" ON "CustomerProfile"("kycStatus", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_accountNumber_key" ON "BankAccount"("accountNumber");

-- CreateIndex
CREATE INDEX "BankAccount_userId_status_idx" ON "BankAccount"("userId", "status");

-- CreateIndex
CREATE INDEX "BankAccount_accountType_status_idx" ON "BankAccount"("accountType", "status");

-- CreateIndex
CREATE INDEX "BankAccount_isSystemAccount_idx" ON "BankAccount"("isSystemAccount");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_referenceId_key" ON "Transaction"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_idempotencyKey_key" ON "Transaction"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_reversedTransactionId_key" ON "Transaction"("reversedTransactionId");

-- CreateIndex
CREATE INDEX "Transaction_senderAccountId_executedAt_idx" ON "Transaction"("senderAccountId", "executedAt" DESC);

-- CreateIndex
CREATE INDEX "Transaction_receiverAccountId_executedAt_idx" ON "Transaction"("receiverAccountId", "executedAt" DESC);

-- CreateIndex
CREATE INDEX "Transaction_type_status_executedAt_idx" ON "Transaction"("type", "status", "executedAt" DESC);

-- CreateIndex
CREATE INDEX "Transaction_isFlagged_executedAt_idx" ON "Transaction"("isFlagged", "executedAt" DESC);

-- CreateIndex
CREATE INDEX "LedgerEntry_accountId_createdAt_idx" ON "LedgerEntry"("accountId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_transactionId_accountId_direction_entryCategory_key" ON "LedgerEntry"("transactionId", "accountId", "direction", "entryCategory");

-- CreateIndex
CREATE UNIQUE INDEX "DepositRequest_requestReference_key" ON "DepositRequest"("requestReference");

-- CreateIndex
CREATE UNIQUE INDEX "DepositRequest_idempotencyKey_key" ON "DepositRequest"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "DepositRequest_transactionId_key" ON "DepositRequest"("transactionId");

-- CreateIndex
CREATE INDEX "DepositRequest_status_requestedAt_idx" ON "DepositRequest"("status", "requestedAt" DESC);

-- CreateIndex
CREATE INDEX "DepositRequest_customerId_requestedAt_idx" ON "DepositRequest"("customerId", "requestedAt" DESC);

-- CreateIndex
CREATE INDEX "DepositRequest_accountId_status_idx" ON "DepositRequest"("accountId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawalRequest_requestReference_key" ON "WithdrawalRequest"("requestReference");

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawalRequest_idempotencyKey_key" ON "WithdrawalRequest"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawalRequest_transactionId_key" ON "WithdrawalRequest"("transactionId");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_status_requestedAt_idx" ON "WithdrawalRequest"("status", "requestedAt" DESC);

-- CreateIndex
CREATE INDEX "WithdrawalRequest_customerId_requestedAt_idx" ON "WithdrawalRequest"("customerId", "requestedAt" DESC);

-- CreateIndex
CREATE INDEX "WithdrawalRequest_accountId_status_idx" ON "WithdrawalRequest"("accountId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LoanApplication_loanReference_key" ON "LoanApplication"("loanReference");

-- CreateIndex
CREATE UNIQUE INDEX "LoanApplication_idempotencyKey_key" ON "LoanApplication"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "LoanApplication_disbursementTransactionId_key" ON "LoanApplication"("disbursementTransactionId");

-- CreateIndex
CREATE INDEX "LoanApplication_status_createdAt_idx" ON "LoanApplication"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "LoanApplication_customerId_status_idx" ON "LoanApplication"("customerId", "status");

-- CreateIndex
CREATE INDEX "LoanNote_loanApplicationId_createdAt_idx" ON "LoanNote"("loanApplicationId", "createdAt" ASC);

-- CreateIndex
CREATE INDEX "LoanRepaymentSchedule_loanApplicationId_status_dueDate_idx" ON "LoanRepaymentSchedule"("loanApplicationId", "status", "dueDate" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LoanRepaymentSchedule_loanApplicationId_installmentNumber_key" ON "LoanRepaymentSchedule"("loanApplicationId", "installmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LoanRepayment_transactionId_key" ON "LoanRepayment"("transactionId");

-- CreateIndex
CREATE INDEX "LoanRepayment_loanApplicationId_paidAt_idx" ON "LoanRepayment"("loanApplicationId", "paidAt" DESC);

-- CreateIndex
CREATE INDEX "LoanRepayment_scheduleId_idx" ON "LoanRepayment"("scheduleId");

-- CreateIndex
CREATE INDEX "SuspiciousTransactionFlag_status_createdAt_idx" ON "SuspiciousTransactionFlag"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SuspiciousTransactionFlag_transactionId_idx" ON "SuspiciousTransactionFlag"("transactionId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProfile" ADD CONSTRAINT "CustomerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProfile" ADD CONSTRAINT "CustomerProfile_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_senderAccountId_fkey" FOREIGN KEY ("senderAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_receiverAccountId_fkey" FOREIGN KEY ("receiverAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_reversedTransactionId_fkey" FOREIGN KEY ("reversedTransactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositRequest" ADD CONSTRAINT "DepositRequest_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositRequest" ADD CONSTRAINT "DepositRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositRequest" ADD CONSTRAINT "DepositRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositRequest" ADD CONSTRAINT "DepositRequest_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanApplication" ADD CONSTRAINT "LoanApplication_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanApplication" ADD CONSTRAINT "LoanApplication_disbursementAccountId_fkey" FOREIGN KEY ("disbursementAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanApplication" ADD CONSTRAINT "LoanApplication_reviewedByStaffId_fkey" FOREIGN KEY ("reviewedByStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanApplication" ADD CONSTRAINT "LoanApplication_decidedByAdminId_fkey" FOREIGN KEY ("decidedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanApplication" ADD CONSTRAINT "LoanApplication_disbursementTransactionId_fkey" FOREIGN KEY ("disbursementTransactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanNote" ADD CONSTRAINT "LoanNote_loanApplicationId_fkey" FOREIGN KEY ("loanApplicationId") REFERENCES "LoanApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanNote" ADD CONSTRAINT "LoanNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanRepaymentSchedule" ADD CONSTRAINT "LoanRepaymentSchedule_loanApplicationId_fkey" FOREIGN KEY ("loanApplicationId") REFERENCES "LoanApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanRepayment" ADD CONSTRAINT "LoanRepayment_loanApplicationId_fkey" FOREIGN KEY ("loanApplicationId") REFERENCES "LoanApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanRepayment" ADD CONSTRAINT "LoanRepayment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "LoanRepaymentSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanRepayment" ADD CONSTRAINT "LoanRepayment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanRepayment" ADD CONSTRAINT "LoanRepayment_paidFromAccountId_fkey" FOREIGN KEY ("paidFromAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuspiciousTransactionFlag" ADD CONSTRAINT "SuspiciousTransactionFlag_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuspiciousTransactionFlag" ADD CONSTRAINT "SuspiciousTransactionFlag_flaggedById_fkey" FOREIGN KEY ("flaggedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuspiciousTransactionFlag" ADD CONSTRAINT "SuspiciousTransactionFlag_resolvedByAdminId_fkey" FOREIGN KEY ("resolvedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemSetting" ADD CONSTRAINT "SystemSetting_updatedByAdminId_fkey" FOREIGN KEY ("updatedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
