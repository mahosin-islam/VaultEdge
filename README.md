# VaultEdge — Digital Banking Management System

**VaultEdge** is a full-stack, role-based simulated digital banking and financial operations platform built with Next.js (App Router), TypeScript, Tailwind CSS, Redux Toolkit / RTK Query, Prisma ORM, and PostgreSQL (Neon). It supports end-to-end banking workflows across **Customer**, **Bank Staff**, and **Administrator** portals with PIN-protected atomic transfers, deposit/withdrawal approvals, loan lifecycle management, and AML suspicious transaction monitoring.

---

## Live Deployment & Repository

- **Live Application:** [https://vault-edge-phi.vercel.app](https://vault-edge-phi.vercel.app)
- **GitHub Repository:** `https://github.com/<your-username>/<your-repo-name>` *(Replace with your public repository URL)*

---

## Demo Credentials

Use the following pre-configured demo accounts to test all role-based workflows on the live deployment:

| Role | Email | Password | Transaction PIN | Notes / Account No. |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin@vaultedge.com` *(update if different)* | `Admin@234` *(update)* | — | Full system, account, deposit, loan & compliance control |
| **Bank Staff** | `staff@vaultedge.com` *(update if different)* | `Staff@1234` *(update)* | — | Customer verification, transaction review, AML flagging & loan review |
| **Customer 1** | `customar@gmail.com` | `Customer@1234` *(update)* | `1234` *(update)* | Active Account: `1029247302` |
| **Customer 2** | `mahosin@gmail.com` *(update if different)* | `Customer@1234` *(update)* | `1234` *(update)* | Active Account: `1033761757` (Useful as fund transfer recipient) |

> **Important:** Before submitting, replace the placeholder passwords/PINs above with the exact working credentials configured in your live Neon database.

---

## Core Role-Based Workflows

### 1. Customer Portal (`/customer/*`)
- **Account Overview & Multi-Account Summary:** Real-time available balance, total deposits/withdrawals, active loans, 6-month cashflow chart, and transaction distribution.
- **Deposit & Withdrawal Requests:** Submit cash/wire deposit requests and payout requests with real-time approval status tracking.
- **Atomic Fund Transfers:** Transfer funds to other VaultEdge customer accounts (`To Another Account`) or between own accounts with **Transaction PIN** verification, idempotency protection, and daily/single-transfer limits.
- **Loan Management:** Apply for Personal, Business, Education, Home, or Auto loans; inspect EMI repayment schedules; execute PIN-protected repayments.
- **Statements & Security:** View/export account statements and configure/update Transaction PIN and profile details.

### 2. Bank Staff Console (`/staff/*`)
- **Customer Onboarding & Verification:** Register new customers, manage customer accounts, and verify KYC status.
- **Transaction & Compliance Review:** Inspect ledger postings and flag unusual activity into the **Suspicious Transactions Queue** (`OPEN`, `UNDER REVIEW`, `CONFIRMED SUSPICIOUS`, `RESOLVED SAFE`).
- **Loan Application Review:** Review incoming customer loan applications, add review notes, and forward eligible applications for Admin approval.

### 3. Administrator Portal (`/admin/*`)
- **System-Wide Oversight:** Full visibility into users, bank accounts, deposits, withdrawals, transfers, loans, and compliance escalations.
- **Approvals & Disbursements:** Approve/reject pending deposit and withdrawal requests and disburse approved loans directly into customer accounts.

---

## Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **State & Data Fetching:** Redux Toolkit, RTK Query
- **Backend & Auth:** Next.js Route Handlers (REST APIs), Custom JWT Authentication, Role-Based Access Control (RBAC)
- **Database & ORM:** PostgreSQL (Neon Serverless), Prisma ORM
- **Deployment:** Vercel

---

## Environment Variables

Create a `.env` file in the root directory and configure the following required variables (also add them in **Vercel Project Settings -> Environment Variables** for production):

```env
# PostgreSQL Connection String (Neon Cloud or Local PostgreSQL)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"

# Secret key used for signing and verifying JWT authentication tokens
JWT_SECRET="your-strong-random-jwt-secret-key"

# Application Environment ("development" for local, "production" for Vercel)
NODE_ENV="development"

# Base URL of the application ("http://localhost:3000" locally, Vercel URL in production)
APP_URL="http://localhost:3000"