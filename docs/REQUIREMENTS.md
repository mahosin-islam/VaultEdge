# VaultEdge — Project Requirements Specification

> **Single Source of Truth**: This document preserves all original requirements for the **VaultEdge — Advanced Digital Banking Management System**. All modules, roles, business rules, security checks, and bonus features are documented in clearly indexed sections for targeted reference during future development phases.

---

## Table of Contents
1. [Project Overview & Objectives](#1-project-overview--objectives)
2. [User Roles & Capabilities](#2-user-roles--capabilities)
   - [2.1 Admin Role](#21-admin-role)
   - [2.2 Bank Staff Role](#22-bank-staff-role)
   - [2.3 Customer Role](#23-customer-role)
3. [Core Features & Technical Modules](#3-core-features--technical-modules)
   - [3.1 Authentication & Role-Based Security](#31-authentication--role-based-security)
   - [3.2 Transaction Management System](#32-transaction-management-system)
   - [3.3 Loan Management System](#33-loan-management-system)
   - [3.4 Redux Toolkit & RTK Query State Management](#34-redux-toolkit--rtk-query-state-management)
   - [3.5 Professional Banking UI/UX](#35-professional-banking-uiux)
   - [3.6 Data Visualization & Analytics](#36-data-visualization--analytics)
4. [Security, Financial Validation & Data Integrity Rules](#4-security-financial-validation--data-integrity-rules)
5. [Bonus Challenges](#5-bonus-challenges)
6. [Required Technology Stack](#6-required-technology-stack)
7. [Deliverables & Submission Requirements](#7-deliverables--submission-requirements)
8. [Evaluation Criteria](#8-evaluation-criteria)

---

## 1. Project Overview & Objectives
- **Task Title**: Advanced Digital Banking Management System (**VaultEdge**)
- **Primary Objective**: Build a professional, secure, and feature-rich Digital Banking Management System using Next.js that simulates a real-world banking environment.
- **Core Capabilities**: Customers can manage bank accounts, transfer funds, monitor transactions, apply for loans, and manage financial activities across three primary roles: **Admin**, **Bank Staff**, and **Customer**.
- **Product Standard**: Develop a complete banking workflow with proper business logic, transaction consistency, role-based permissions, and a professional modern fintech user experience that could realistically be used by a banking organization.

---

## 2. User Roles & Capabilities

### 2.1 Admin Role
> **Implementation Status**: **Admin Backend & APIs Completed & Verified** (`/api/v1/admin/overview`, `/analytics`, `/customers`, `/accounts`, `/transactions`, `/deposits`, `/withdrawals`, `/loans`, `/settings`). Admin Frontend Dashboard UI awaits user design screenshots.

1. **Dashboard & Analytics**:
   - Complete banking overview displaying:
     - Total Registered Customers
     - Total Bank Accounts
     - Total Bank Balance
     - Total Deposits
     - Total Withdrawals
     - Total Transactions
     - Pending Loan Applications
   - Display analytics using charts and graphs.
2. **Customer Management**:
   - View all customers
   - Search customers
   - View customer details
   - Activate or deactivate accounts
   - Block suspicious accounts
   - View customer transaction history
3. **Bank Account Management**:
   - Create bank accounts
   - View all accounts
   - Update account information
   - Freeze or unfreeze accounts
   - Set account transaction limits
4. **Loan Management**:
   - View loan applications
   - Approve loan applications
   - Reject loan applications
   - View loan repayment history

### 2.2 Bank Staff Role
1. **Customer Operations**:
   - Register new customers
   - Create customer bank accounts
   - Verify customer information
   - View customer account details
2. **Transaction Management**:
   - View transactions
   - Search transactions by transaction ID
   - Filter transactions by date and type
   - Review pending transactions
   - Flag suspicious transactions for admin review
3. **Loan Assistance**:
   - View loan applications
   - Review customer information
   - Add internal notes
   - Forward applications for admin approval
4. **Role Restrictions**:
   - Staff **must not** have permission to approve their own loan applications (or approve loans directly) or modify bank-wide financial settings.

### 2.3 Customer Role
1. **Customer Dashboard**:
   - Personalized dashboard displaying:
     - Total Account Balance
     - Total Deposits
     - Total Withdrawals
     - Recent Transactions
     - Active Loans
     - Account Information
   - Ability to switch between multiple bank accounts if the customer holds more than one.
2. **Account Management**:
   - Capabilities:
     - View account details
     - View account number
     - View account type
     - Check available balance
     - View account status
     - Download account statements
   - Supported Account Types:
     - `Savings Account`
     - `Current Account`
     - `Business Account`
3. **Fund Transfer**:
   - Transfer money:
     - Between the customer's own accounts
     - To another customer within the bank
   - Transfer form fields:
     - Recipient Account Number
     - Transfer Amount
     - Description
     - Transaction PIN
   - Required transfer validations:
     - Sufficient balance
     - Valid recipient account
     - Account status (active / unfrozen)
     - Transaction limits
     - Valid transaction PIN
   - Transfer execution output:
     - Generate a unique Transaction ID for every successful transfer.
     - Both sender and receiver must receive corresponding transaction records.
4. **Deposit & Withdrawal**:
   - Customers can submit deposit and withdrawal requests.
   - Request fields:
     - Account
     - Amount
     - Request Date
     - Description
   - Request statuses:
     - `Pending`
     - `Approved`
     - `Rejected`
   - Workflow: Deposits and withdrawals are simulated through an Admin/Staff approval workflow rather than real payment gateway integration.

---

## 3. Core Features & Technical Modules

### 3.1 Authentication & Role-Based Security
> **Implementation Status**: **Completed & Verified** — Custom JWT Authentication Backend API (`/api/v1/auth/register`, `/login`, `/refresh`, `/logout`, `/me`), Server-Side RBAC Guards (`src/server/auth/guards.ts`, `src/server/auth/session.ts`), Redux Toolkit + RTK Query Auth integration (`src/features/auth/authSlice.ts`, `src/features/auth/authApi.ts`), Register & Login UI (`/register`, `/login`), and Server-Enforced Role-Based Dashboard Routing (`/admin/overview`, `/staff/overview`, `/customer/overview`) are all implemented and verified.

- Implement authentication using NextAuth or a custom authentication solution (VaultEdge architecture uses Custom JWT Authentication).
- Required roles:
  - `Admin`
  - `Bank Staff`
  - `Customer`
- Route & API Protection Rules:
  - Customers cannot access admin dashboards.
  - Staff cannot modify admin-only settings.
  - Admin can access all management sections.
  - Customers can only access their own financial information.
  - **Mandatory Server Enforcement**: All authorization checks must be enforced on the server/API level, not just by hiding frontend components.

### 3.2 Transaction Management System
- **Transaction Types**:
  - `Deposit`
  - `Withdrawal`
  - `Fund Transfer`
  - `Loan Disbursement`
  - `Loan Repayment`
- **Transaction Record Fields**:
  - Transaction ID
  - Sender Account
  - Receiver Account *(if applicable)*
  - Transaction Type
  - Amount
  - Transaction Fee
  - Transaction Date
  - Transaction Status
  - Description
- **Transaction Statuses**:
  - `Pending`
  - `Completed`
  - `Failed`
  - `Reversed`
- **Required Capabilities**:
  - Transaction history
  - Transaction details
  - Search by transaction ID
  - Date filtering
  - Type filtering
  - Pagination
  - Transaction receipt generation
- **Consistency Requirement**: A fund transfer must update both accounts consistently. A failed transfer must never result in money being deducted from only one account.

### 3.3 Loan Management System
- **Loan Application Fields**:
  - Loan Type
  - Requested Amount
  - Loan Duration
  - Monthly Income
  - Employment Status
  - Application Description
- **Loan Statuses**:
  - `Pending`
  - `Under Review`
  - `Approved`
  - `Rejected`
  - `Active`
  - `Completed`
- **Customer Loan Capabilities**:
  - Apply for loans
  - View application status
  - View approved loan details
  - View repayment schedule
  - Track remaining loan balance
  - View repayment history
- **Admin Loan Capabilities & Disbursement Rule**:
  - Admin can approve or reject loan applications.
  - Approved loans must be disbursed through a recorded banking transaction (`Loan Disbursement`).

### 3.4 Redux Toolkit & RTK Query State Management
- **Mandatory Requirement**: Redux Toolkit must be used for global state management.
- **Required Implementations**:
  - Redux Store Configuration
  - Multiple Slices organized into separate feature-based modules (never put all application logic into a single slice)
  - Async Thunks or RTK Query
  - Centralized Loading States
  - Error Handling
  - Authentication State
  - Account State
  - Transaction State
  - Loan State
- **RTK Query (Recommended / Bonus)**: Use RTK Query for API data fetching, caching, invalidation, and synchronization.

### 3.5 Professional Banking UI/UX
- **Design Standard**: Production-level fintech banking application aesthetic (avoid generic template-like dashboards).
- **Required UI Elements**:
  - Professional sidebar navigation
  - Modern dashboard cards
  - Clean transaction tables
  - Advanced filter interfaces
  - Professional forms
  - Interactive charts
  - Account balance visualization
  - Status badges
  - Responsive navigation
  - Confirmation dialogs
- **Responsive Viewport Support**:
  - Desktop
  - Tablet
  - Mobile
- **Design System**: Consistent typography, spacing, colors, and reusable components.

### 3.6 Data Visualization & Analytics
- **Library**: Recharts or Chart.js (powered by real application data, never hardcoded values).
- **Admin Dashboard Charts**:
  - Monthly Transaction Volume
  - Deposit vs Withdrawal
  - Account Distribution
  - Loan Approval Statistics
  - Monthly Banking Activity
- **Customer Dashboard Charts**:
  - Monthly Spending
  - Monthly Deposit History
  - Transaction Distribution

---

## 4. Security, Financial Validation & Data Integrity Rules
1. **Required Integrity Controls**:
   - Server-side balance validation
   - Atomic fund transfers
   - Transaction history preservation
   - Account ownership verification
   - Transaction PIN validation
   - Role-based authorization
   - Duplicate transaction prevention
   - Proper error handling
2. **Strict Customer Restrictions** (A customer must **never** be able to):
   - Transfer more money than their available balance.
   - Modify their account balance directly.
   - Access another customer's transactions.
   - Approve their own deposit or withdrawal requests.
   - Manipulate transaction amounts through frontend requests.
3. **Database & Server Enforcement**:
   - Use database transactions for financial operations wherever supported.
   - Never trust balance values sent from the frontend.

---

## 5. Bonus Challenges
*(Optional but highly recommended)*
1. **Transaction Receipt**: Generate downloadable PDF receipts containing transaction details and a unique transaction reference.
2. **Notification System**: Notify customers when:
   - Money is received
   - A transfer is completed
   - A deposit is approved
   - A withdrawal is rejected
   - A loan is approved or rejected
3. **Transaction Limits**: Allow Admin to configure:
   - Daily transfer limit
   - Maximum single transaction amount
   - Minimum account balance
4. **Account Statement Export**: Allow customers to download transaction statements in CSV or PDF format.
5. **Two-Factor Authentication (2FA)**: Implement an additional verification step for sensitive banking operations.
6. **Suspicious Transaction Detection**: Create a rule-based system that flags unusual transaction patterns for admin review.
7. **Dark Mode**: Implement a complete light/dark theme with consistent styling across all dashboard pages.

---

## 6. Required Technology Stack
- **Framework**: Next.js (App Router)
- **Language**: TypeScript (Preferred / Confirmed)
- **Styling**: Tailwind CSS or professional UI library
- **State Management**: Redux Toolkit (Mandatory)
- **API Data Management**: RTK Query (Recommended / Confirmed)
- **Charts**: Recharts or Chart.js
- **Authentication**: NextAuth or Custom Authentication Solution (Confirmed: Custom JWT Authentication)
- **Backend & Database (Planned Full-Stack Architecture)**: Next.js Route Handlers, PostgreSQL, Prisma ORM

---

## 7. Deliverables & Submission Requirements
1. **Live Link**: Fully deployed version of the banking application (Vercel or Netlify).
2. **GitHub Repository**: Public repository containing clean, modular, and maintainable code.
3. **Final `README.md` Contents** *(to be completed prior to submission)*:
   - Project Overview
   - Application Features
   - User Roles & Permissions
   - Redux Toolkit Architecture
   - RTK Query Implementation
   - Authentication Strategy
   - Transaction Processing Logic
   - Database Structure
   - Security Implementation
   - Environment Variables
   - Local Setup Instructions
   - Deployment Instructions
   - Demo Credentials for all three roles (Admin, Bank Staff, Customer)

---

## 8. Evaluation Criteria
The project will be evaluated across:
- Next.js App Router
- TypeScript
- Redux Toolkit Architecture
- RTK Query
- Authentication & Authorization
- Complex CRUD Operations
- Financial Business Logic
- Transaction Consistency
- Database Design
- API Integration
- Form Validation
- Data Visualization
- Professional UI/UX
- Responsive Design
- Security & Error Handling
- Code Quality & Maintainability

> **Core Evaluation Note**: A beautiful dashboard without correct banking logic is incomplete, and financial operations without proper security and transaction consistency will significantly impact evaluation.
