# VaultEdge — API Documentation & Thunder Client Testing Guide

> **Version**: `v1` (`/api/v1`)
> **Base URL (Local Development)**: `http://localhost:3000/api/v1`

---

## Table of Contents
1. [Standardized API Response Format](#1-standardized-api-response-format)
2. [Authentication & Token Handling Strategy](#2-authentication--token-handling-strategy)
3. [Authentication Endpoints (`/api/v1/auth/*`)](#3-authentication-endpoints-apiv1auth)
   - [3.1 `POST /api/v1/auth/register`](#31-post-apiv1authregister)
   - [3.2 `POST /api/v1/auth/login`](#32-post-apiv1authlogin)
   - [3.3 `POST /api/v1/auth/refresh`](#33-post-apiv1authrefresh)
   - [3.4 `POST /api/v1/auth/logout`](#34-post-apiv1authlogout)
   - [3.5 `GET /api/v1/auth/me`](#35-get-apiv1authme)
4. [Server-Side RBAC Guard Architecture](#4-server-side-rbac-guard-architecture)
5. [Thunder Client Manual Testing Guide & Sequence](#5-thunder-client-manual-testing-guide--sequence)

---

## 1. Standardized API Response Format

Every VaultEdge Route Handler returns a consistent JSON envelope (`ApiResponseEnvelope<T>`):

### 1.1 Success Envelope (`200 OK` / `201 Created`)
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

### 1.2 Error Envelope (`400`, `401`, `403`, `404`, `409`, `429`, `500`)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": [
      {
        "field": "email",
        "message": "Please enter a valid email address."
      }
    ]
  }
}
```

### 1.3 Standard Error Codes (`ApiErrorCode`)
| Error Code | HTTP Status | Description |
| :--- | :---: | :--- |
| `VALIDATION_ERROR` | `400` | Invalid JSON or Zod schema validation failure (`details` lists field errors). |
| `AUTHENTICATION_ERROR` | `401` | Invalid credentials, missing access/refresh token, or expired/revoked token. |
| `AUTHORIZATION_ERROR` | `403` | Authenticated user lacks the required role (`ADMIN`, `STAFF`, `CUSTOMER`). |
| `ACCOUNT_STATUS_ERROR` | `403` | User account is `BLOCKED` or `DEACTIVATED`. |
| `NOT_FOUND` | `404` | Target resource does not exist. |
| `CONFLICT_ERROR` | `409` | Unique constraint violation (e.g., duplicate email or phone number). |
| `RATE_LIMIT_EXCEEDED` | `429` | Sliding-window rate limit exceeded on sensitive endpoint. |
| `CONFIGURATION_ERROR` | `500` | Missing or invalid server environment configuration. |
| `INTERNAL_SERVER_ERROR` | `500` | Unhandled server exception (stack traces are never exposed). |

---

## 2. Authentication & Token Handling Strategy

VaultEdge supports **dual-mode token transport** so both web browsers and API clients (Thunder Client / Postman) work seamlessly:

1. **`HttpOnly` Cookies (Automatic in Browsers & Cookie-Enabled Clients)**:
   - `ve_access_token` (`HttpOnly`, `SameSite=Lax`, `Secure` in production, default lifetime `15m`)
   - `ve_refresh_token` (`HttpOnly`, `SameSite=Lax`, `Secure` in production, default lifetime `7d`)
2. **`Authorization: Bearer <token>` Header & JSON Body (Explicit in Thunder Client)**:
   - Protected endpoints accept `Authorization: Bearer <accessToken>`.
   - `/api/v1/auth/refresh` and `/api/v1/auth/logout` accept `{ "refreshToken": "<refreshToken>" }` in the JSON body, `ve_refresh_token` cookie, or `Authorization: Bearer <refreshToken>`.
3. **Database Refresh Token Hashing & Reuse Detection**:
   - Raw refresh tokens are **never** stored in PostgreSQL; only their `SHA-256` digest (`tokenHash`) is persisted in the `RefreshToken` table.
   - Rotating a refresh token immediately sets `revokedAt` on the used token. If a revoked refresh token is ever re-presented, VaultEdge triggers **Reuse Detection** and revokes all active refresh tokens for that user.

---

## 3. Authentication Endpoints (`/api/v1/auth/*`)

### 3.1 `POST /api/v1/auth/register`
- **Purpose**: Public customer registration. Creates a `User` (`role: "CUSTOMER"`, `status: "ACTIVE"`), a linked `CustomerProfile` (`kycStatus: "PENDING"`), an `AuditLog` (`CUSTOMER_REGISTERED`), and an initial `RefreshToken` inside an atomic database transaction.
- **Authentication Required**: No (Public; rate-limited to `15 req / 60s` per IP).
- **Security Rule**: Public registration **strictly forbids** submitting `role` (`ADMIN` or `STAFF`). Because the Zod schema uses `.strict()`, any extra fields (such as `"role": "ADMIN"`) are rejected with `400 VALIDATION_ERROR`.

#### Request Body
```json
{
  "fullName": "Sophia Sterling",
  "email": "sophia.sterling@vaultedge.io",
  "password": "VaultPassword#2026",
  "confirmPassword": "VaultPassword#2026",
  "phone": "+15550192834"
}
```
*(Note: `phone` is optional; if omitted, a unique placeholder phone identifier is assigned until KYC completion).*

#### Successful Response (`201 Created`)
```json
{
  "success": true,
  "message": "Customer account registered successfully.",
  "data": {
    "user": {
      "id": "cm...",
      "email": "sophia.sterling@vaultedge.io",
      "firstName": "Sophia",
      "lastName": "Sterling",
      "fullName": "Sophia Sterling",
      "role": "CUSTOMER",
      "status": "ACTIVE",
      "hasTransactionPin": false,
      "twoFactorEnabled": false,
      "lastLoginAt": "2026-11-22T18:40:00.000Z",
      "createdAt": "2026-11-22T18:40:00.000Z",
      "updatedAt": "2026-11-22T18:40:00.000Z",
      "customerProfile": {
        "id": "cm...",
        "customerCode": "CUS-2026-8F4A9C12",
        "phone": "+15550192834",
        "dateOfBirth": null,
        "addressLine1": null,
        "city": null,
        "state": null,
        "postalCode": null,
        "country": null,
        "employmentStatus": "EMPLOYED",
        "monthlyIncome": "0.00",
        "kycStatus": "PENDING",
        "verifiedAt": null
      }
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "tokenType": "Bearer",
      "accessExpiresIn": "15m",
      "refreshExpiresIn": "7d"
    }
  }
}
```

#### Error Responses
- **`400 Bad Request` (`VALIDATION_ERROR`)**: Weak password, mismatched `confirmPassword`, invalid email, or unexpected extra properties.
- **`409 Conflict` (`CONFLICT_ERROR`)**:
  ```json
  {
    "success": false,
    "error": {
      "code": "CONFLICT_ERROR",
      "message": "An account with this email address already exists."
    }
  }
  ```

---

### 3.2 `POST /api/v1/auth/login`
- **Purpose**: Authenticates an existing user (`ADMIN`, `STAFF`, or `CUSTOMER`) with email and password, verifies active account status, updates `lastLoginAt`, and issues a new JWT access + refresh token pair.
- **Authentication Required**: No (Public; rate-limited to `20 req / 60s` per IP).

#### Request Body
```json
{
  "email": "sophia.sterling@vaultedge.io",
  "password": "VaultPassword#2026"
}
```

#### Successful Response (`200 OK`)
Returns the same `{ user, tokens }` payload structure as `/api/v1/auth/register` and sets `ve_access_token` and `ve_refresh_token` `HttpOnly` cookies.

#### Error Responses
- **`401 Unauthorized` (`AUTHENTICATION_ERROR`)** — Unknown email or wrong password:
  ```json
  {
    "success": false,
    "error": {
      "code": "AUTHENTICATION_ERROR",
      "message": "Invalid email or password."
    }
  }
  ```
- **`403 Forbidden` (`ACCOUNT_STATUS_ERROR`)** — Account is `BLOCKED` or `DEACTIVATED`:
  ```json
  {
    "success": false,
    "error": {
      "code": "ACCOUNT_STATUS_ERROR",
      "message": "Your account has been blocked due to suspicious activity. Please contact bank administration."
    }
  }
  ```

---

### 3.3 `POST /api/v1/auth/refresh`
- **Purpose**: Verifies an active refresh token, checks database expiration and revocation state, revokes the used refresh token, and issues a rotated `{ accessToken, refreshToken }` pair.
- **Authentication Required**: Valid Refresh Token (via `ve_refresh_token` cookie, `{ "refreshToken": "..." }` JSON body, or `Authorization: Bearer <refreshToken>`).

#### Request Body (Optional if `ve_refresh_token` cookie is sent)
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Successful Response (`200 OK`)
Returns `{ user, tokens }` with a newly rotated `accessToken` and `refreshToken`.

#### Error Responses
- **`401 Unauthorized` (`AUTHENTICATION_ERROR`)**: Missing, expired, malformed, or already-revoked refresh token.
- **`403 Forbidden` (`ACCOUNT_STATUS_ERROR`)**: User was blocked or deactivated after the refresh token was issued.

---

### 3.4 `POST /api/v1/auth/logout`
- **Purpose**: Revokes the current refresh token in PostgreSQL (`revokedAt = now()`) and clears both `ve_access_token` and `ve_refresh_token` cookies.
- **Authentication Required**: Refresh Token via cookie, JSON body (`{ "refreshToken": "..." }`), or `Authorization` header (gracefully clears cookies even if already expired).

#### Request Body (Optional if cookie is present)
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Successful Response (`200 OK`)
```json
{
  "success": true,
  "message": "Signed out successfully.",
  "data": {
    "loggedOut": true,
    "tokenRevoked": true
  }
}
```

---

### 3.5 `GET /api/v1/auth/me`
- **Purpose**: Returns the current authenticated user's safe profile (`SafeUserDTO`) verified against PostgreSQL.
- **Authentication Required**: Yes — via `ve_access_token` cookie or `Authorization: Bearer <accessToken>` header.

#### Successful Response (`200 OK`)
```json
{
  "success": true,
  "message": "Current user profile retrieved successfully.",
  "data": {
    "user": {
      "id": "cm...",
      "email": "sophia.sterling@vaultedge.io",
      "firstName": "Sophia",
      "lastName": "Sterling",
      "fullName": "Sophia Sterling",
      "role": "CUSTOMER",
      "status": "ACTIVE",
      "hasTransactionPin": false,
      "twoFactorEnabled": false,
      "lastLoginAt": "2026-11-22T18:40:00.000Z",
      "createdAt": "2026-11-22T18:40:00.000Z",
      "updatedAt": "2026-11-22T18:40:00.000Z",
      "customerProfile": {
        "id": "cm...",
        "customerCode": "CUS-2026-8F4A9C12",
        "phone": "+15550192834",
        "dateOfBirth": null,
        "addressLine1": null,
        "city": null,
        "state": null,
        "postalCode": null,
        "country": null,
        "employmentStatus": "EMPLOYED",
        "monthlyIncome": "0.00",
        "kycStatus": "PENDING",
        "verifiedAt": null
      }
    }
  }
}
```

#### Error Responses
- **`401 Unauthorized` (`AUTHENTICATION_ERROR`)**: Missing, invalid, or expired access token.
- **`403 Forbidden` (`ACCOUNT_STATUS_ERROR`)**: Account has been blocked or deactivated in PostgreSQL.

---

## 4. Server-Side RBAC Guard Architecture

Defined in `src/server/auth/guards.ts` for all current and future Route Handlers:
- `requireAuthenticatedUser(request)` — Validates access token and verifies `User.status === "ACTIVE"` in PostgreSQL.
- `requireRole(request, allowedRoles)` — Verifies `user.role` is in `allowedRoles`, throwing `403 AUTHORIZATION_ERROR` otherwise.
- `requireAdmin(request)` — Allows only `ADMIN`.
- `requireStaffOrAdmin(request)` — Allows `ADMIN` or `STAFF`.
- `requireCustomer(request)` — Allows only `CUSTOMER`.

---

## 5. Thunder Client Manual Testing Guide & Sequence

Follow this step-by-step sequence in **Thunder Client** (VS Code extension) with `npm run dev` running on `http://localhost:3000`:

1. **Step 1 — Register a Customer (`POST http://localhost:3000/api/v1/auth/register`)**:
   - Set **Body -> JSON** to the example payload in §3.1.
   - Click **Send** → Expect **`201 Created`** with `data.user.role === "CUSTOMER"` and `Set-Cookie` headers (`ve_access_token`, `ve_refresh_token`).
2. **Step 2 — Verify Duplicate Registration Rejection (`POST http://localhost:3000/api/v1/auth/register`)**:
   - Send the exact same payload again → Expect **`409 Conflict`** (`CONFLICT_ERROR`).
3. **Step 3 — Verify Validation & Role-Injection Protection (`POST http://localhost:3000/api/v1/auth/register`)**:
   - Send mismatched passwords or add `"role": "ADMIN"` to the JSON body → Expect **`400 Bad Request`** (`VALIDATION_ERROR`).
4. **Step 4 — Login (`POST http://localhost:3000/api/v1/auth/login`)**:
   - Send `{ "email": "sophia.sterling@vaultedge.io", "password": "VaultPassword#2026" }` → Expect **`200 OK`**. Copy `data.tokens.accessToken` and `data.tokens.refreshToken`.
5. **Step 5 — Verify Wrong Password Rejection (`POST http://localhost:3000/api/v1/auth/login`)**:
   - Change password to `"WrongPass#123"` → Expect **`401 Unauthorized`** (`AUTHENTICATION_ERROR`).
6. **Step 6 — Fetch Current User (`GET http://localhost:3000/api/v1/auth/me`)**:
   - Send request (Thunder Client automatically sends cookies, or set `Authorization: Bearer <accessToken>`) → Expect **`200 OK`** with safe user profile (no `passwordHash` or `transactionPinHash`).
7. **Step 7 — Rotate Session Tokens (`POST http://localhost:3000/api/v1/auth/refresh`)**:
   - Send `{ "refreshToken": "<copied_refreshToken_from_Step_4>" }` → Expect **`200 OK`** with a new token pair.
8. **Step 8 — Verify Revoked Refresh Token Reuse Rejection (`POST http://localhost:3000/api/v1/auth/refresh`)**:
   - Re-send the **old** `refreshToken` from Step 4 → Expect **`401 Unauthorized`** (`AUTHENTICATION_ERROR`: *"Refresh token has already been revoked..."*).
9. **Step 9 — Logout (`POST http://localhost:3000/api/v1/auth/logout`)**:
   - Send request → Expect **`200 OK`** with `{ "loggedOut": true }` and cleared cookies.
10. **Step 10 — Verify Unauthorized Access After Logout (`GET http://localhost:3000/api/v1/auth/me`)**:
    - Without a valid Bearer header and after cookies are cleared, send `GET /api/v1/auth/me` → Expect **`401 Unauthorized`**.

---

## 6. Admin Backend Endpoints (`/api/v1/admin/*`)

> **Authorization Requirement**: Every endpoint under `/api/v1/admin/*` enforces `requireAdmin(request)` on the server, verifying the caller's JWT and live PostgreSQL `User.role === "ADMIN"` and `User.status === "ACTIVE"`. Unauthenticated requests return `401 AUTHENTICATION_ERROR`; `CUSTOMER` or `STAFF` callers return `403 AUTHORIZATION_ERROR`.

| Module | Endpoint | HTTP Method | Purpose |
| :--- | :--- | :---: | :--- |
| **A. Overview** | `/api/v1/admin/overview` | `GET` | Platform KPIs, 5 analytics charts, recent transactions, and recent audit activity (`?months=6&startDate=&endDate=`). |
| **B. Customers** | `/api/v1/admin/customers` | `GET` | Paginated customer list with search (`name`, `email`, `customerCode`, `phone`), `status`, and `kycStatus` filters. |
| **B. Customers** | `/api/v1/admin/customers/[customerId]` | `GET` | Complete customer profile, financial summary, owned accounts, recent loans, deposits, and withdrawals. |
| **B. Customers** | `/api/v1/admin/customers/[customerId]` | `PATCH` | Activate, deactivate, or block a customer (`{ status, reason, kycStatus? }`), revoking active sessions and logging to `AuditLog`. |
| **B. Customers** | `/api/v1/admin/customers/[customerId]/transactions` | `GET` | Paginated transaction history across all accounts owned by the specified customer. |
| **C. Accounts** | `/api/v1/admin/accounts` | `GET` | Paginated list of customer bank accounts with search (`accountNumber`, `accountTitle`, owner name/email), `accountType`, `status`, and `userId` filters. |
| **C. Accounts** | `/api/v1/admin/accounts` | `POST` | Create a new `SAVINGS`, `CURRENT`, or `BUSINESS` account for an active customer with optional atomic `initialDeposit` and limit overrides. |
| **C. Accounts** | `/api/v1/admin/accounts/[accountId]` | `GET` | Complete bank account details, effective limits, and recent double-entry `LedgerEntry` lines. |
| **C. Accounts** | `/api/v1/admin/accounts/[accountId]` | `PATCH` | Update permitted account information (`accountTitle`, `accountType`, `status`, `frozenReason`, limits). |
| **C. Accounts** | `/api/v1/admin/accounts/[accountId]/status` | `PATCH` | Freeze (`FROZEN`), unfreeze (`ACTIVE`), deactivate (`INACTIVE`), or block (`BLOCKED`) an account (`{ status, reason }`). |
| **C. Accounts** | `/api/v1/admin/accounts/[accountId]/limits` | `PATCH` | Configure per-account transaction limits (`{ dailyTransferLimit, maxSingleTransactionLimit, minBalanceRequired }`). |
| **D. Transactions** | `/api/v1/admin/transactions` | `GET` | Paginated ledger of all transactions with search by `referenceId`, `type`, `status`, `isFlagged`, `accountId`, `customerId`, and date range. |
| **D. Transactions** | `/api/v1/admin/transactions/[transactionId]` | `GET` | Complete transaction details (by `id` or `referenceId`), sender/receiver accounts, double-entry `LedgerEntry` rows, and `SuspiciousTransactionFlag` records. |
| **D. Transactions** | `/api/v1/admin/transactions/[transactionId]` | `PATCH` | Review/flag suspicious transactions (`FLAG_SUSPICIOUS`, `RESOLVE_FLAG_SAFE`, `CONFIRM_SUSPICIOUS`) or execute an atomic compensating reversal (`REVERSE_TRANSACTION`). |
| **E. Deposits** | `/api/v1/admin/deposits` | `GET` | Paginated list of customer deposit requests filtered by `status` (`PENDING`, `APPROVED`, `REJECTED`), `search`, `customerId`, `accountId`, and date range. |
| **E. Deposits** | `/api/v1/admin/deposits/[depositId]` | `GET` | Complete deposit request details (by `id` or `requestReference`). |
| **E. Deposits** | `/api/v1/admin/deposits/[depositId]` | `PATCH` | Approve or reject a `PENDING` deposit request (`{ decision: "APPROVE" \| "REJECT", reviewNote? }`). Approval atomically credits the customer account and debits internal treasury with a `DEPOSIT` `Transaction` and 2 `LedgerEntry` rows. |
| **F. Withdrawals** | `/api/v1/admin/withdrawals` | `GET` | Paginated list of customer withdrawal requests filtered by `status`, `search`, `customerId`, `accountId`, and date range. |
| **F. Withdrawals** | `/api/v1/admin/withdrawals/[withdrawalId]` | `GET` | Complete withdrawal request details (by `id` or `requestReference`). |
| **F. Withdrawals** | `/api/v1/admin/withdrawals/[withdrawalId]` | `PATCH` | Approve or reject a `PENDING` withdrawal request (`{ decision: "APPROVE" \| "REJECT", reviewNote? }`). Approval validates balance, minimum balance floor, and single transaction limit, then atomically debits the customer account and credits internal treasury. |
| **G. Loans** | `/api/v1/admin/loans` | `GET` | Paginated list of loan applications filtered by `status`, `loanType`, `search`, `customerId`, and date range. |
| **G. Loans** | `/api/v1/admin/loans/[loanId]` | `GET` | Complete loan application details, customer profile, staff review notes (`LoanNote`), installment schedule (`LoanRepaymentSchedule`), and repayment history (`LoanRepayment`). |
| **G. Loans** | `/api/v1/admin/loans/[loanId]` | `PATCH` | Approve or reject a `PENDING` / `UNDER_REVIEW` loan application (`{ decision: "APPROVE" \| "REJECT", approvedAmount?, interestRate?, note?, rejectionReason? }`). Approval atomically generates the monthly `LoanRepaymentSchedule` and disburses funds into `disbursementAccount` via a `LOAN_DISBURSEMENT` transaction. |
| **H. Analytics** | `/api/v1/admin/analytics` | `GET` | Database-aggregated KPIs and chart series (*Monthly Transaction Volume*, *Deposit vs Withdrawal*, *Account Distribution*, *Loan Approval Statistics*, *Monthly Banking Activity*). |
| **I. Settings** | `/api/v1/admin/settings` | `GET` | Retrieve bank-wide financial configuration (`SystemSetting`). |
| **I. Settings** | `/api/v1/admin/settings` | `PATCH` | Update bank-wide limits and defaults (`defaultDailyTransferLimit`, `defaultMaxSingleTransfer`, `defaultMinAccountBalance`, `transferFeeFlat`, `suspiciousAmountThreshold`, `defaultLoanInterestRate`). |

---

## 7. Bank Staff Backend Endpoints (`/api/v1/staff/*`)

> **Authorization Requirement**: Every endpoint under `/api/v1/staff/*` enforces `requireStaff(request)` on the server, verifying the caller's JWT and live PostgreSQL `User.role === "STAFF"` and `User.status === "ACTIVE"`. Unauthenticated requests return `401 AUTHENTICATION_ERROR`; `CUSTOMER` or `ADMIN` callers return `403 AUTHORIZATION_ERROR`. Staff cannot approve/reject loans, review their own loan applications, or modify bank-wide settings.

| Module | Endpoint | HTTP Method | Purpose |
| :--- | :--- | :---: | :--- |
| **1. Overview** | `/api/v1/staff/overview` | `GET` | Operational KPIs (`pendingKycVerifications`, `pendingTransactions`, `openSuspiciousFlags`, `pendingLoanApplications`, `underReviewLoanApplications`) and recent operational queues. |
| **2. Customers** | `/api/v1/staff/customers` | `GET` | Paginated customer list with search, `status`, and `kycStatus` filters (reuses `listCustomersForAdmin`). |
| **2. Customers** | `/api/v1/staff/customers` | `POST` | Register a new `CUSTOMER` account (`User` + `CustomerProfile` + `AuditLog`) with duplicate email, phone, and national ID validation. |
| **2. Customers** | `/api/v1/staff/customers/[customerId]` | `GET` | View complete customer profile, KYC status, accounts, and recent activity (reuses `getCustomerDetailsForAdmin`). |
| **3. Accounts** | `/api/v1/staff/accounts` | `GET` | Paginated list of customer bank accounts (reuses `listBankAccountsForAdmin`). |
| **3. Accounts** | `/api/v1/staff/accounts` | `POST` | Create a new `SAVINGS`, `CURRENT`, or `BUSINESS` bank account for an active customer (reuses `createBankAccountForCustomer` with `actorRole: "STAFF"`). |
| **3. Accounts** | `/api/v1/staff/accounts/[accountId]` | `GET` | View customer bank account details, effective limits, and recent double-entry ledger postings (reuses `getBankAccountDetailsForAdmin`). |
| **4. Verification** | `/api/v1/staff/customers/[customerId]/verify` | `PATCH` | Update customer KYC status (`PENDING`, `VERIFIED`, `REJECTED`) with optional `kycNotes`, recording `verifiedById`, `verifiedAt`, customer `Notification`, and `AuditLog`. |
| **5. Transactions** | `/api/v1/staff/transactions` | `GET` | Paginated transaction ledger with search by `referenceId` / account / description, date range, `type`, `status`, and `isFlagged` filters (reuses `listTransactionsForAdmin`). |
| **5. Transactions** | `/api/v1/staff/transactions/[transactionId]` | `GET` | Complete transaction details, sender/receiver accounts, double-entry `LedgerEntry` rows, and suspicious flags (reuses `getTransactionDetailsForAdmin`). |
| **6. Suspicious Tx** | `/api/v1/staff/transactions/[transactionId]/flag` | `POST` | Flag a transaction (`STAFF_MANUAL`) for Admin review, marking `Transaction.isFlagged = true` and recording `SuspiciousTransactionFlag` + `AuditLog`. |
| **6. Suspicious Tx** | `/api/v1/staff/suspicious-transactions` | `GET` | Paginated queue of `SuspiciousTransactionFlag` records filtered by `status` (`OPEN`, `UNDER_REVIEW`, `CONFIRMED_SUSPICIOUS`, `RESOLVED_SAFE`) and `search`. |
| **7. Loan Review** | `/api/v1/staff/loans` | `GET` | Paginated list of loan applications with search, `status`, `loanType`, and date filters (reuses `listLoansForAdmin`). |
| **7. Loan Review** | `/api/v1/staff/loans/[loanId]` | `GET` | Complete loan application details, customer financial info, staff notes, schedule, and repayments (reuses `getLoanDetailsForAdmin`). |
| **7. Loan Review** | `/api/v1/staff/loans/[loanId]` | `PATCH` | Add internal review note (`ADD_NOTE`) or forward application for Admin approval (`FORWARD_FOR_APPROVAL`), transitioning status to `UNDER_REVIEW` and blocking self-review (`loan.customerId === staffId`). |
| **8. Deposit Approval** | `/api/v1/staff/deposits` | `GET` | Paginated list of customer deposit requests with search, status filter, and summary counts (reuses `listDepositRequestsForAdmin`). |
| **8. Deposit Approval** | `/api/v1/staff/deposits/[depositId]` | `GET` | Complete deposit request details including customer, target account, and linked transaction (reuses `getDepositRequestDetailsForAdmin`). |
| **8. Deposit Approval** | `/api/v1/staff/deposits/[depositId]` | `PATCH` | Approve (`APPROVE`) or reject (`REJECT`) a pending deposit request atomically via `reviewDepositRequestForAdmin` with `actorRole: "STAFF"`, duplicate-approval guard, self-approval block, double-entry ledger settlement, and `AuditLog`. |
| **9. Withdrawal Approval** | `/api/v1/staff/withdrawals` | `GET` | Paginated list of customer withdrawal requests with search, status filter, and summary counts (reuses `listWithdrawalRequestsForAdmin`). |
| **9. Withdrawal Approval** | `/api/v1/staff/withdrawals/[withdrawalId]` | `GET` | Complete withdrawal request details including customer, source account, and linked transaction (reuses `getWithdrawalRequestDetailsForAdmin`). |
| **9. Withdrawal Approval** | `/api/v1/staff/withdrawals/[withdrawalId]` | `PATCH` | Approve (`APPROVE`) or reject (`REJECT`) a pending withdrawal request atomically via `reviewWithdrawalRequestForAdmin` with `actorRole: "STAFF"`, duplicate-approval guard, self-approval block, double-entry ledger settlement, and `AuditLog`. |

---

## 8. Customer Backend Endpoints (`/api/v1/customer/*`, `/api/v1/accounts/*`, `/api/v1/transfers`, `/api/v1/deposits`, `/api/v1/withdrawals`, `/api/v1/transactions`, `/api/v1/loans`, `/api/v1/statements`, `/api/v1/notifications`)

> **Authorization Requirement**: Every Customer endpoint enforces `requireCustomer(request)` on the server, verifying the caller's JWT and live PostgreSQL `User.role === "CUSTOMER"` and `User.status === "ACTIVE"`. Unauthenticated requests return `401 AUTHENTICATION_ERROR`; `ADMIN` or `STAFF` callers return `403 AUTHORIZATION_ERROR`. All account, transaction, loan, statement, and notification queries strictly enforce ownership (`userId === customer.id` / `customerId === customer.id`).

| Module | Endpoint | HTTP Method | Purpose |
| :--- | :--- | :---: | :--- |
| **1. Overview** | `/api/v1/customer/overview` | `GET` | Personalized balance, deposit/withdrawal totals, recent transactions, active loans, account list, and monthly spending/deposit/distribution analytics (`?months=6&accountId=&startDate=&endDate=`). |
| **2. Accounts** | `/api/v1/accounts` | `GET` | List all bank accounts owned by the authenticated customer with effective limits. |
| **2. Accounts** | `/api/v1/accounts/[accountId]` | `GET` | View owned account details, status, balance, and effective limits (`403` if not owner). |
| **2. Accounts** | `/api/v1/accounts/[accountId]/transactions` | `GET` | Paginated transactions scoped to a specific owned account. |
| **3. Transfers** | `/api/v1/transfers` | `POST` | Atomic double-entry internal/intra-bank fund transfer with Transaction PIN verification (5-attempt lockout), idempotency key, limit/min-balance checks, flat fee, and automatic suspicious-threshold flagging. |
| **4. Deposits** | `/api/v1/deposits` | `GET`, `POST` | List customer deposit requests or submit a new `PENDING` deposit request for an owned active account. |
| **4. Deposits** | `/api/v1/deposits/[depositId]` | `GET` | View owned deposit request details and settlement status. |
| **5. Withdrawals** | `/api/v1/withdrawals` | `GET`, `POST` | List customer withdrawal requests or submit a new `PENDING` withdrawal request (validating balance, single limit, and minimum balance floor). |
| **5. Withdrawals** | `/api/v1/withdrawals/[withdrawalId]` | `GET` | View owned withdrawal request details and settlement status. |
| **6. Transactions** | `/api/v1/transactions` | `GET` | Paginated transaction history across owned accounts with search by `referenceId`, date range, `type`, `status`, and `accountId`. |
| **6. Transactions** | `/api/v1/transactions/[transactionId]` | `GET` | View owned transaction details and customer-scoped `LedgerEntry` lines. |
| **7. Loans** | `/api/v1/loans` | `GET`, `POST` | List customer loan applications/active loans or submit a new `PENDING` loan application. |
| **7. Loans** | `/api/v1/loans/[loanId]` | `GET` | View owned loan details, public notes, `LoanRepaymentSchedule`, and `LoanRepayment` history. |
| **8. Repayments** | `/api/v1/loans/[loanId]/repay` | `POST` | Execute atomic loan installment/balance repayment with Transaction PIN verification, updating schedule, remaining balance, and ledger entries. |
| **9. Statements** | `/api/v1/statements` | `GET` | Retrieve owned account statement (`?accountId=&startDate=&endDate=&format=json\|csv\|pdf`) with downloadable CSV and PDF 1.4 exports. |
| **10. Notifications** | `/api/v1/notifications` | `GET` | Paginated customer notifications (`?unreadOnly=true`) and `unreadCount`. |
| **10. Notifications** | `/api/v1/notifications/[notificationId]` | `GET`, `PATCH` | Read notification details or mark a single notification as read. |
| **10. Notifications** | `/api/v1/notifications/read-all` | `PATCH` | Mark all unread customer notifications as read. |
| **11. Profile & PIN** | `/api/v1/customer/profile` | `GET`, `PATCH` | View safe customer profile (never exposes hashes) and update permitted contact/residency/employment fields. |
| **11. Profile & PIN** | `/api/v1/customer/security/pin` | `POST`, `PATCH` | Set initial Transaction PIN (verifying password) or change existing Transaction PIN (verifying current PIN), stored as bcrypt hash. |
