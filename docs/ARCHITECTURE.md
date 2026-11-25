# VaultEdge — Application Architecture Specification

> **Purpose**: This document is the canonical architectural reference for **VaultEdge**, defining the complete planned folder tree, route mappings across all user roles, Server vs. Client Component conventions, feature-oriented modular organization, backend service & data-access layers, state management architecture, and security/financial consistency principles.
>
> **Implementation Status**: All directories documented below are currently established as **planned directories** (preserved via `.gitkeep`). Feature files, pages, layouts, Route Handlers, Redux slices, and database models must only be created inside their designated directories when their respective implementation phase begins.

---

## 1. Application Architecture Overview
**VaultEdge** is architected as a modular, feature-oriented full-stack **Next.js (App Router)** application written in **TypeScript**. Both the responsive fintech UI and the transactional backend API reside within a single unified Next.js application (no separate Express.js server), maintaining strict separation between presentation, client state, API Route Handlers, server business logic, and database access.

```text
[ Client & Server UI (src/app/*, src/components/*, src/features/*) ]
   ├── Server Components by default (Layouts, Pages, Initial Data Fetching)
   └── Isolated Client Components (Interactive Forms, Charts, Modals, Redux Hooks)
                     │
                     ▼
[ Redux Toolkit Store & RTK Query Cache Layer (src/store/*, src/features/*) ]
                     │ (HTTPS / JSON + HttpOnly JWT Cookie)
                     ▼
[ Next.js Route Handlers (src/app/api/v1/*) ]
   ├── Auth & RBAC Verification
   └── Request Payload Validation
                     │
                     ▼
[ Server Domain & Business Logic Layer (src/server/*) ]
   ├── Financial Rules, Ownership & Limit Validation
   ├── Transaction PIN Verification
   └── Atomic Prisma Transactions ($transaction)
                     │
                     ▼
[ Database & ORM Layer (src/db/*, prisma/*) ]
                     │
                     ▼
[ PostgreSQL Relational Database ]
```

---

## 2. Canonical Planned Folder Tree

> **Note**: Directories marked *(planned — empty)* currently contain only `.gitkeep` placeholders and await their scheduled implementation phase.

```text
VaultEdge/
├── docs/
│   ├── REQUIREMENTS.md                      # Single source of truth for all project requirements
│   ├── ARCHITECTURE.md                      # Canonical folder tree, route maps & architecture rules
│   ├── DATABASE_SCHEMA.md                   # (Future - Database Design Phase) Prisma schema & ERD
│   └── API_DOCUMENTATION.md                 # (Future - API Phase) Route Handler contracts
├── public/
│   ├── images/                              # Static illustrations, brand banners & graphics (planned — empty)
│   ├── icons/                               # Custom SVG/PNG fintech icons (planned — empty)
│   └── fonts/                               # Self-hosted typography assets if needed (planned — empty)
├── src/
│   ├── app/                                 # Next.js App Router entry point
│   │   ├── favicon.ico                      # Default app icon
│   │   ├── globals.css                      # Global Tailwind CSS styles
│   │   ├── layout.tsx                       # Root application Server Component layout
│   │   ├── page.tsx                         # Root Landing Page / starter entry point
│   │   ├── (auth)/                          # Authentication route group (planned — empty)
│   │   │   ├── login/                       # /login
│   │   │   ├── register/                    # /register
│   │   │   ├── forgot-password/             # /forgot-password
│   │   │   └── reset-password/              # /reset-password
│   │   ├── (admin)/                         # Admin portal route group (planned — empty)
│   │   │   └── admin/
│   │   │       ├── overview/                # /admin/overview
│   │   │       ├── customers/               # /admin/customers
│   │   │       ├── accounts/                # /admin/accounts
│   │   │       ├── transactions/            # /admin/transactions
│   │   │       ├── deposits/                # /admin/deposits
│   │   │       ├── withdrawals/             # /admin/withdrawals
│   │   │       ├── loans/                   # /admin/loans
│   │   │       ├── analytics/               # /admin/analytics
│   │   │       └── settings/                # /admin/settings
│   │   ├── (staff)/                         # Bank Staff portal route group (planned — empty)
│   │   │   └── staff/
│   │   │       ├── overview/                # /staff/overview
│   │   │       ├── customers/               # /staff/customers
│   │   │       ├── accounts/                # /staff/accounts
│   │   │       ├── verification/            # /staff/verification
│   │   │       ├── transactions/            # /staff/transactions
│   │   │       ├── suspicious-transactions/ # /staff/suspicious-transactions
│   │   │       └── loan-applications/       # /staff/loan-applications
│   │   ├── (customer)/                      # Customer banking portal route group (planned — empty)
│   │   │   └── customer/
│   │   │       ├── overview/                # /customer/overview
│   │   │       ├── accounts/                # /customer/accounts
│   │   │       ├── transfers/               # /customer/transfers
│   │   │       ├── deposit-requests/        # /customer/deposit-requests
│   │   │       ├── withdrawal-requests/     # /customer/withdrawal-requests
│   │   │       ├── transactions/            # /customer/transactions
│   │   │       ├── loans/                   # /customer/loans
│   │   │       ├── statements/              # /customer/statements
│   │   │       ├── notifications/           # /customer/notifications
│   │   │       └── profile-security/        # /customer/profile-security
│   │   └── api/
│   │       └── v1/                          # Versioned backend REST API Route Handlers (planned — empty)
│   ├── components/                          # Reusable presentation & UI layer (planned — empty)
│   │   ├── ui/                              # Atomic UI primitives (buttons, badges, cards, inputs, dialogs)
│   │   ├── shared/                          # Multi-role shared widgets (data tables, filter bars, stat cards, charts)
│   │   ├── layout/                          # Dashboard shells, headers, containers, theme wrappers
│   │   ├── navigation/                      # Role-based sidebars, topbars, breadcrumbs, account switcher
│   │   ├── forms/                           # Reusable form controls, PIN inputs, currency inputs, field wrappers
│   │   └── feedback/                        # Alerts, empty states, skeletons, toast notifications, error boundaries
│   ├── features/                            # Domain feature modules (slices, RTK Query endpoints, feature UI) (planned — empty)
│   │   ├── auth/                            # Login, registration, password reset, session state
│   │   ├── admin/                           # Admin analytics, customer/account controls, system settings
│   │   ├── staff/                           # Staff customer onboarding, KYC verification, flagging workflows
│   │   ├── customer/                        # Customer overview widgets, profile & security settings
│   │   ├── accounts/                        # Multi-account switcher, account details, balance cards, limits
│   │   ├── transactions/                    # Transaction ledger table, filters, search by ID, receipt view/PDF
│   │   ├── transfers/                       # Own-account & intra-bank transfer forms, PIN verification modal
│   │   ├── deposits/                        # Customer deposit requests & Admin/Staff approval queue
│   │   ├── withdrawals/                     # Customer withdrawal requests & Admin/Staff approval queue
│   │   ├── loans/                           # Loan application, staff review notes, admin approval & repayment schedule
│   │   ├── notifications/                   # Customer notification feed & unread state
│   │   └── statements/                      # Account statement filtering & CSV/PDF export
│   ├── lib/                                 # Third-party library wrappers & low-level helpers (planned — empty)
│   ├── db/                                  # Prisma client singleton, database connection & query helpers (planned — empty)
│   ├── server/                              # Server-only business logic, services, auth/RBAC guards, validators (planned — empty)
│   ├── store/                               # Root Redux store configuration, root reducer & RTK Query base API (planned — empty)
│   ├── hooks/                               # Typed Redux hooks (useAppDispatch, useAppSelector) & UI hooks (planned — empty)
│   ├── types/                               # Shared TypeScript interfaces, domain enums, DTOs & API contracts (planned — empty)
│   ├── config/                              # Environment variable validation, route configs, role navigation configs (planned — empty)
│   ├── constants/                           # Banking enums, status labels, account types, default limits (planned — empty)
│   └── utils/                               # Pure helper functions (currency/date formatting, ID masks, pagination) (planned — empty)
├── AGENTS.md                                # Permanent AI agent instructions
├── PROJECT_STATUS.md                        # Concise project phase & module tracker
├── package.json
├── tsconfig.json
└── README.md
```

---

## 3. Purpose of Each Major Directory

### 3.1 Routing & API (`src/app/`)
- **`src/app/page.tsx`**: Root Landing Page entry point (never duplicated in a `(public)` route group).
- **`src/app/(auth)/*`**: Public authentication flows (login, registration, forgot/reset password) sharing an auth-focused layout.
- **`src/app/(admin)/admin/*`**: Protected Admin portal pages with Admin sidebar navigation and server-side role verification.
- **`src/app/(staff)/staff/*`**: Protected Bank Staff operational pages with Staff sidebar navigation and server-side role verification.
- **`src/app/(customer)/customer/*`**: Protected Customer banking pages with Customer sidebar navigation, account switcher, and ownership enforcement.
- **`src/app/api/v1/*`**: Versioned Next.js Route Handlers acting as thin HTTP controllers that delegate business logic to `src/server/`.

### 3.2 Shared Components (`src/components/`)
- **`ui/`**: Stateless design-system primitives (Button, Input, Select, Badge, Modal, Table, Card, Tabs).
- **`shared/`**: Complex domain-agnostic blocks reused across roles (KPI cards, pagination controls, date-range filters, chart containers, confirmation modals).
- **`layout/`**: Role dashboard shells, page headers, responsive grid wrappers.
- **`navigation/`**: Role-aware sidebar navigation, mobile drawer menu, top bar, customer multi-account switcher dropdown.
- **`forms/`**: Standardized form inputs, currency fields, 4/6-digit Transaction PIN inputs, validation message displays.
- **`feedback/`**: Loading skeletons, status banners, toast alerts, empty-data placeholders, error states.

### 3.3 Feature Modules (`src/features/`)
Each feature directory (`auth`, `admin`, `staff`, `customer`, `accounts`, `transactions`, `transfers`, `deposits`, `withdrawals`, `loans`, `notifications`, `statements`) encapsulates domain-specific frontend logic:
- Feature-specific components and views rendered by `src/app/` pages.
- Feature Redux slice (`*Slice.ts`) for local UI state (active filters, selected account, modal steps).
- Feature RTK Query API endpoints (`*Api.ts`) injected into the base API from `src/store/`.
- Feature-scoped client validation schemas and types.

### 3.4 Shared Application Infrastructure (`src/lib/`, `src/db/`, `src/server/`, `src/store/`, etc.)
- **`src/db/`**: Prisma client singleton instance (`prisma.ts`), transaction helpers, and database seed/connection utilities.
- **`src/server/`**: Server-only domain services (fund transfers, deposit/withdrawal approvals, loan disbursement, suspicious activity detection), JWT signing/verification, password/PIN hashing, and RBAC route guards. Must never be imported by Client Components.
- **`src/lib/`**: Configured third-party library instances and shared adapters (e.g., PDF/CSV generators, HTTP response builders).
- **`src/store/`**: Redux Toolkit `configureStore`, root reducer combining feature slices, RTK Query base API service with tag types, and Redux Provider component.
- **`src/hooks/`**: `useAppDispatch`, `useAppSelector`, `useDebounce`, `useActiveAccount`, and responsive viewport hooks.
- **`src/types/`**: Shared TypeScript domain interfaces (`User`, `BankAccount`, `Transaction`, `Loan`, `DepositRequest`, `WithdrawalRequest`, `Notification`) and standardized API response envelopes.
- **`src/config/`**: Validated server/client config objects, role-based sidebar menu definitions, and route permission maps.
- **`src/constants/`**: Immutable constants (`UserRole`, `AccountType`, `AccountStatus`, `TransactionType`, `TransactionStatus`, `LoanStatus`, `RequestStatus`).
- **`src/utils/`**: Pure utility functions for currency formatting, account number masking, date formatting, and query string serialization.

---

## 4. Role & Authentication Route Mappings

### 4.1 Authentication Route Mapping (`src/app/(auth)/`)
| Route Path | Directory | Purpose |
| :--- | :--- | :--- |
| `/login` | `src/app/(auth)/login` | Role-aware user sign-in (Admin, Bank Staff, Customer) |
| `/register` | `src/app/(auth)/register` | New customer self-registration / onboarding entry |
| `/forgot-password` | `src/app/(auth)/forgot-password` | Account recovery request initiation |
| `/reset-password` | `src/app/(auth)/reset-password` | Secure password reset completion |

### 4.2 Admin Route Mapping (`src/app/(admin)/admin/`)
| Route Path | Directory | Aligned Requirements (`docs/REQUIREMENTS.md` §2.1, §3, §5) |
| :--- | :--- | :--- |
| `/admin/overview` | `src/app/(admin)/admin/overview` | Platform KPIs (Total Customers, Accounts, Bank Balance, Deposits, Withdrawals, Transactions, Pending Loans) & summary charts |
| `/admin/customers` | `src/app/(admin)/admin/customers` | View/search all customers, view details, activate/deactivate, block suspicious accounts, view customer transaction history |
| `/admin/accounts` | `src/app/(admin)/admin/accounts` | Create bank accounts, view all accounts, update account info, freeze/unfreeze accounts, set account transaction limits |
| `/admin/transactions` | `src/app/(admin)/admin/transactions` | System-wide transaction ledger, search by Transaction ID, date/type filter, pagination, flagged transaction review |
| `/admin/deposits` | `src/app/(admin)/admin/deposits` | Review, approve, or reject customer deposit requests |
| `/admin/withdrawals` | `src/app/(admin)/admin/withdrawals` | Review, approve, or reject customer withdrawal requests |
| `/admin/loans` | `src/app/(admin)/admin/loans` | View loan applications (including staff-forwarded applications & notes), approve/reject loans (triggering `Loan Disbursement`), view repayment history |
| `/admin/analytics` | `src/app/(admin)/admin/analytics` | Full data visualizations: Monthly Transaction Volume, Deposit vs Withdrawal, Account Distribution, Loan Approval Statistics, Monthly Banking Activity |
| `/admin/settings` | `src/app/(admin)/admin/settings` | Bank-wide financial settings & configurable transaction limits (daily transfer limit, max single transaction, minimum balance) |

### 4.3 Bank Staff Route Mapping (`src/app/(staff)/staff/`)
| Route Path | Directory | Aligned Requirements (`docs/REQUIREMENTS.md` §2.2) |
| :--- | :--- | :--- |
| `/staff/overview` | `src/app/(staff)/staff/overview` | Operational summary of pending verifications, pending transactions, and loan applications awaiting staff review |
| `/staff/customers` | `src/app/(staff)/staff/customers` | Register new customers and view customer profiles |
| `/staff/accounts` | `src/app/(staff)/staff/accounts` | Create customer bank accounts (`Savings`, `Current`, `Business`) and view customer account details |
| `/staff/verification` | `src/app/(staff)/staff/verification` | Verify customer KYC information and account eligibility |
| `/staff/transactions` | `src/app/(staff)/staff/transactions` | View transactions, search by Transaction ID, filter by date and type, review pending transactions |
| `/staff/suspicious-transactions` | `src/app/(staff)/staff/suspicious-transactions` | Flag suspicious transactions for Admin review and inspect rule-flagged activity |
| `/staff/loan-applications` | `src/app/(staff)/staff/loan-applications` | View loan applications, review customer financial info, add internal notes, forward applications for Admin approval *(no approval authority)* |

### 4.4 Customer Route Mapping (`src/app/(customer)/customer/`)
| Route Path | Directory | Aligned Requirements (`docs/REQUIREMENTS.md` §2.3, §3, §5) |
| :--- | :--- | :--- |
| `/customer/overview` | `src/app/(customer)/customer/overview` | Personalized dashboard: Total Account Balance, Deposits, Withdrawals, Recent Transactions, Active Loans, Account Info, multi-account switcher, and Customer charts (Monthly Spending, Monthly Deposit History, Transaction Distribution) |
| `/customer/accounts` | `src/app/(customer)/customer/accounts` | View all owned accounts (`Savings`, `Current`, `Business`), account numbers, types, available balances, statuses, and limits |
| `/customer/transfers` | `src/app/(customer)/customer/transfers` | Atomic fund transfers between own accounts or to another customer within the bank with Transaction PIN validation |
| `/customer/deposit-requests` | `src/app/(customer)/customer/deposit-requests` | Submit deposit requests (Account, Amount, Date, Description) and track status (`Pending`, `Approved`, `Rejected`) |
| `/customer/withdrawal-requests` | `src/app/(customer)/customer/withdrawal-requests` | Submit withdrawal requests (Account, Amount, Date, Description) and track status (`Pending`, `Approved`, `Rejected`) |
| `/customer/transactions` | `src/app/(customer)/customer/transactions` | Complete personal transaction history, search by Transaction ID, filter by date/type, pagination, and downloadable PDF receipt generation |
| `/customer/loans` | `src/app/(customer)/customer/loans` | Apply for loans, view application status, approved loan details, repayment schedule, remaining loan balance, and repayment history |
| `/customer/statements` | `src/app/(customer)/customer/statements` | Filter and download account statements in CSV or PDF format |
| `/customer/notifications` | `src/app/(customer)/customer/notifications` | View notifications for money received, transfers completed, deposits approved, withdrawals rejected, and loans approved/rejected |
| `/customer/profile-security` | `src/app/(customer)/customer/profile-security` | View personal profile, manage password, Transaction PIN, Two-Factor Authentication (2FA), and theme preferences |

---

## 5. Server Component & Client Component Rules
1. **Server Components by Default**:
   - All Next.js `page.tsx` and `layout.tsx` files in `src/app/` must be **React Server Components (RSC)** by default.
   - Do not add `'use client'` at the page or layout level unless strictly unavoidable; instead, compose pages from Server Components that pass serializable props to leaf Client Components.
2. **Isolated Client Components (`'use client'`)**:
   - Use Client Components **only** when interactive browser APIs, React state/effects (`useState`, `useEffect`), event listeners (`onClick`, `onSubmit`), Redux hooks (`useAppSelector`, `useAppDispatch`), or interactive charts (Recharts/Chart.js) are required.
   - Keep Client Components as small, leaf-level, and isolated as practical inside `src/features/<feature>/` or `src/components/`.
3. **Strict Server Boundary for Sensitive Logic**:
   - All database queries (`src/db/`), business logic (`src/server/`), authentication verification, role-based authorization checks, Transaction PIN verification, and financial calculations must run exclusively on the server.
   - Never expose secrets, raw database models, or password/PIN hashes to Client Components.
4. **Data Fetching & Streaming**:
   - Use direct server-side service/database calls in Server Components for initial render where appropriate, paired with RTK Query in Client Components for interactive mutations, filtering, pagination, and cache invalidation.
   - Use `loading.tsx`, `<Suspense>`, and streaming **only** when needed for genuine asynchronous loading states.
   - Never introduce artificial delays (`setTimeout` sleeps) to simulate loading, and never force full-page reloads (`window.location.reload()`) when RTK Query cache invalidation or `router.refresh()` can update state cleanly.

---

## 6. Feature-Based Code Organization Rules
To keep the codebase scalable and prevent monolithic files:
1. **Thin App Router Pages**: Files inside `src/app/(role)/...` should focus on route metadata, server-side session/role checks, and composing views exported from `src/features/`.
2. **Feature Encapsulation**: Domain-specific forms, tables, modals, Redux slices, and RTK Query endpoints belong inside their matching `src/features/<domain>/` directory.
3. **Cross-Feature Reusability**: If a UI element is used across multiple features (e.g., `StatusBadge`, `CurrencyDisplay`, `ConfirmDialog`, `DataTable`), place it in `src/components/ui/` or `src/components/shared/`.
4. **Centralized Store Registration**: All feature slices and RTK Query endpoints register cleanly into `src/store/` without circular dependencies.

---

## 7. Future API & Database Organization

### 7.1 Versioned API Route Handlers (`src/app/api/v1/`)
During the API development phases, endpoints will be organized under `src/app/api/v1/`:
- `api/v1/auth/*` — Login, register, logout, current session (`me`), password & PIN verification/update.
- `api/v1/admin/*` — Platform analytics, customer status controls, system-wide limit settings.
- `api/v1/staff/*` — Customer onboarding, KYC verification, suspicious transaction flagging, loan review notes.
- `api/v1/accounts/*` — Account creation, listing, details, freeze/unfreeze, account-specific limits.
- `api/v1/transfers/*` — Atomic own-account and intra-bank fund transfer execution.
- `api/v1/deposits/*` — Customer deposit request submission and Admin/Staff approval/rejection.
- `api/v1/withdrawals/*` — Customer withdrawal request submission and Admin/Staff approval/rejection.
- `api/v1/transactions/*` — Paginated/filtered transaction history, lookup by Transaction ID, receipt data.
- `api/v1/loans/*` — Loan application submission, staff review forwarding, admin approval/rejection + disbursement, repayment execution & schedule.
- `api/v1/statements/*` — Statement generation & export payloads.
- `api/v1/notifications/*` — Customer notification listing and read-state updates.

### 7.2 Implemented Backend Foundation & Authentication Layers (`src/config/`, `src/db/`, `src/lib/`, `src/server/`)
- **`prisma/schema.prisma`** *(Implemented & Migrated)*: Declarative PostgreSQL schema with `Decimal(18, 2)` monetary fields, indexes on `referenceId` and `accountNumber`, and `onDelete: Restrict` relational integrity constraints.
- **`src/config/env.ts`** *(Implemented)*: Server-only environment validation checking `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `APP_URL`, and `NODE_ENV` without exposing secret values.
- **`src/db/prisma.ts` & `src/lib/db/prisma.ts`** *(Implemented)*: Server-only Prisma Client singleton preventing multiple connection pools during Next.js hot reload.
- **`src/lib/api-response.ts` & `src/server/errors/app-error.ts`** *(Implemented)*: Standardized `{ success, message, data }` and `{ success: false, error: { code, message, details } }` JSON envelopes and custom error hierarchy (`ValidationError`, `AuthenticationError`, `AuthorizationError`, `AccountStatusError`, `NotFoundError`, `ConflictError`, `RateLimitError`).
- **`src/server/validators/`** *(Implemented)*: Reusable Zod request validation (`validate.ts`) and strict authentication schemas (`auth.schema.ts`).
- **`src/server/auth/`** *(Implemented)*:
  - `password.ts` — `bcryptjs` password hashing (`12` rounds) and `SHA-256` refresh token hashing.
  - `jwt.ts` — `jose` HS256 JWT signing and verification using distinct secrets for access (`15m`) and refresh (`7d`) tokens.
  - `cookies.ts` — `HttpOnly`, `SameSite=Lax`, `Secure` (in production) cookie helpers (`ve_access_token`, `ve_refresh_token`) plus Bearer header extraction.
  - `mappers.ts` — Safe user and customer profile DTO serializers that strip `passwordHash`, `transactionPinHash`, and `twoFactorSecret`.
  - `guards.ts` — Server-side authentication and RBAC guards (`requireAuthenticatedUser`, `requireRole`, `requireAdmin`, `requireStaffOrAdmin`, `requireCustomer`) verifying live database `User.status === "ACTIVE"` and role permissions.
- **`src/server/services/auth.service.ts`** *(Implemented)*: Transactional customer registration (`User` + `CustomerProfile` + `AuditLog`), login with blocked/deactivated rejection, refresh token rotation with revoked-token reuse detection, logout revocation, and safe profile lookup.
- **`src/app/api/v1/auth/*`** *(Implemented & Verified)*:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`
- **`src/server/services/admin-*.service.ts` & `src/app/api/v1/admin/*`** *(Implemented & Verified)*:
  - `admin-analytics.service.ts` → `GET /api/v1/admin/overview`, `GET /api/v1/admin/analytics`
  - `admin-customers.service.ts` → `GET /api/v1/admin/customers`, `GET|PATCH /api/v1/admin/customers/[customerId]`, `GET /api/v1/admin/customers/[customerId]/transactions`
  - `admin-accounts.service.ts` → `GET|POST /api/v1/admin/accounts`, `GET|PATCH /api/v1/admin/accounts/[accountId]`, `PATCH /api/v1/admin/accounts/[accountId]/status`, `PATCH /api/v1/admin/accounts/[accountId]/limits`
  - `admin-transactions.service.ts` → `GET /api/v1/admin/transactions`, `GET|PATCH /api/v1/admin/transactions/[transactionId]`
  - `admin-deposits.service.ts` → `GET /api/v1/admin/deposits`, `GET|PATCH /api/v1/admin/deposits/[depositId]`
  - `admin-withdrawals.service.ts` → `GET /api/v1/admin/withdrawals`, `GET|PATCH /api/v1/admin/withdrawals/[withdrawalId]`
  - `admin-loans.service.ts` → `GET /api/v1/admin/loans`, `GET|PATCH /api/v1/admin/loans/[loanId]`
  - `admin-settings.service.ts` → `GET|PATCH /api/v1/admin/settings`

---

## 8. Financial Transaction Consistency & Security Summary
1. **Atomic Execution**: All balance-mutating operations (`Fund Transfer`, approved `Deposit`, approved `Withdrawal`, `Loan Disbursement`, `Loan Repayment`) execute inside `prisma.$transaction`. A failed transfer rolls back completely so money is never deducted from only one account.
2. **Server-Side Pre-Checks**: Every transfer verifies account ownership, active/unfrozen status, valid hashed Transaction PIN, sufficient available balance (`balance >= amount + fee`), configured transaction limits, and duplicate-submission idempotency on the server.
3. **Zero Client Trust**: Client-submitted balances, fees, limits, or role claims are never trusted.

---

## 9. Confirmed Decisions vs. Decisions to Finalize

### Confirmed Decisions
- **Framework & Routing**: Next.js `16.4.6` (App Router) with `src/` directory, `@/*` alias, and role-segmented route groups `(auth)`, `(admin)`, `(staff)`, `(customer)`, plus versioned API namespace `src/app/api/v1/`.
- **Component Rendering Model**: Server Components by default; small, isolated Client Components only for interactive UI.
- **Folder Architecture**: Complete modular structure across `src/app`, `src/components`, `src/features`, `src/lib`, `src/db`, `src/server`, `src/store`, `src/hooks`, `src/types`, `src/config`, `src/constants`, `src/utils`, and `public/{images,icons,fonts}`.
- **Backend & ORM Plan**: Next.js Route Handlers + PostgreSQL + Prisma ORM + Custom JWT Authentication.
- **State Management Plan**: Redux Toolkit (modular feature slices) + RTK Query.

### Decisions to Be Finalized in Upcoming Phases
- **Charting Library Selection** *(Recharts vs. Chart.js)* before dashboard chart implementation.
- **Staff vs. Admin Deposit/Withdrawal Approval Scope** during database/API design.
- **Default Transaction Fee & Account Limit Values** during database schema design.
