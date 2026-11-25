# VaultEdge — Permanent AI Agent Instructions

## 1. Project Identity & Purpose
**VaultEdge** is an Advanced Digital Banking Management System built as a modern, production-grade full-stack fintech application using Next.js. It simulates a complete real-world banking environment supporting multi-role workflows (**Admin**, **Bank Staff**, and **Customer**), multi-account management, atomic fund transfers, deposit/withdrawal approval flows, loan lifecycle management, financial analytics, and strict server-side security.

---

## 2. Source of Truth & Documentation Rules
1. **Single Source of Truth**: Always follow `docs/REQUIREMENTS.md` as the original, authoritative source of truth for all project objectives, user capabilities, financial validations, and evaluation criteria.
2. **No Silent Modifications**: Never remove, alter, or simplify required features without explicit user permission.
3. **No Invented Business Logic**: Never invent missing business rules, financial formulas, fees, limits, or role permissions. Ask for clarification when an edge case is unspecified.
4. **Token & Documentation Efficiency**:
   - Use `AGENTS.md` as the permanent instruction foundation.
   - Read **only** the relevant sections of `docs/REQUIREMENTS.md` for the task at hand—do not repeatedly read the full requirements document for unrelated tasks.
   - Consult `docs/ARCHITECTURE.md` only when making or verifying structural, state, data-access, or architectural decisions.
   - Update only the affected sections of `PROJECT_STATUS.md` after completing each assigned task.
   - Do not create redundant documentation or duplicate requirements across multiple files.
   - Future specifications (such as `docs/DATABASE_SCHEMA.md` and `docs/API_DOCUMENTATION.md`) must only be created when their respective phases begin.

---

## 3. Technology Stack
- **Framework**: Next.js (App Router, Full-Stack)
- **Language**: TypeScript (Strict mode)
- **Styling**: Tailwind CSS
- **Global & Server State Management**: Redux Toolkit (Mandatory) + RTK Query
- **Backend / API Layer**: Next.js Route Handlers (`src/app/api/...`)
- **Database & ORM**: PostgreSQL + Prisma ORM *(install only during the database phase)*
- **Authentication**: Custom JWT Authentication *(install only during the auth phase)*
- **Data Visualization**: Recharts or Chart.js *(install only during dashboard/analytics implementation)*

> **Dependency Rule**: Do not install backend, charting, or utility packages ahead of their scheduled implementation phase. Always use stable, compatible versions and avoid unnecessary dependencies.

---

## 4. Architecture & Folder Organization Principles
- **Canonical Architecture Reference**: Always consult `docs/ARCHITECTURE.md` for the canonical folder tree, route mappings (`(auth)`, `(admin)`, `(staff)`, `(customer)`, and `api/v1`), and module boundaries. Do not duplicate the full folder tree across other documents.
- **Strict File Placement**: Every future page, layout, API Route Handler, component, Redux slice, RTK Query endpoint, server service, database helper, hook, type, or utility **must** be created inside its designated feature or route directory as defined in `docs/ARCHITECTURE.md`. Never create ad-hoc folders or misplace domain code.
- **Server Components by Default**: Keep Next.js pages and layouts as Server Components by default. Use small, isolated Client Components (`'use client'`) only when interactive browser state, event handlers, Redux hooks, or interactive charts require them.
- **Separation of Concerns**: Keep presentation/UI components (`src/components/`, `src/features/`) strictly separated from Redux store configuration (`src/store/`), server-side business logic (`src/server/`), and database access (`src/db/`). Never create a separate Express.js server.
- **Core Directory Responsibilities** (under `src/` with `@/*` alias and `public/`):
  - `src/app/` — Next.js App Router root Landing Page (`page.tsx`), role route groups `(auth)`, `(admin)`, `(staff)`, `(customer)`, and versioned Route Handlers (`src/app/api/v1/`).
  - `src/components/` — Reusable UI primitives and layout blocks (`ui`, `shared`, `layout`, `navigation`, `forms`, `feedback`).
  - `src/features/` — Feature-scoped modules (`auth`, `admin`, `staff`, `customer`, `accounts`, `transactions`, `transfers`, `deposits`, `withdrawals`, `loans`, `notifications`, `statements`).
  - `src/server/` — Server-only domain business logic, financial validations, atomic transaction services, and auth/RBAC guards.
  - `src/db/` — Prisma client singleton and database connection/transaction helpers.
  - `src/store/` — Root Redux store setup, root reducer, and RTK Query base API configuration.
  - `src/lib/`, `src/hooks/`, `src/types/`, `src/config/`, `src/constants/`, `src/utils/` — Shared libraries, typed Redux/UI hooks, TypeScript contracts, configuration, banking enums/constants, and pure utilities.
  - `public/` — Static assets organized under `images/`, `icons/`, and `fonts/`.

---

## 5. Coding Standards
- **TypeScript Strictness**: Use explicit types and interfaces for all domain models, API payloads, Redux states, and component props. Avoid `any`.
- **Modular Redux Design**: Organize Redux state into feature-specific slices (`auth`, `account`, `transaction`, `loan`, etc.) with centralized loading/error handling and RTK Query cache tags. Never place all application logic into a single slice.
- **Responsive Fintech UI/UX**: Follow a consistent design system supporting Desktop, Tablet, and Mobile viewports with clean tables, status badges, confirmation dialogs, and interactive data visualizations powered by real application data.
- **Strict Global Design Token System (Zero Hardcoded Colors)**:
  - **Never** hardcode colors (`#hex`, `rgb()`, `rgba()`, `hsl()`, or raw Tailwind palette utilities like `bg-slate-*`, `text-white`, `border-gray-*`) inside any component, page, JSX/TSX, or module file.
  - All UI colors across the entire application (Landing Page, Auth, Admin, Bank Staff, Customer dashboards) must come exclusively from semantic CSS variables and `@theme inline` tokens centrally defined in `src/app/globals.css`.
  - Support both **Dark Mode** (`#0B1424` bg, `#17263A` surface, `#F8FAFC` text, `#AAB7C7` secondary text, `#D6B77A` accent, `#2A3A50` border) and **Light Mode** (`#F5F7FA` bg, `#FFFFFF` surface, `#17263A` text, `#64748B` secondary text, `#C5A568` accent, `#E2E8F0` border).
  - If a new semantic color or variation is ever needed, define it in `src/app/globals.css` for both Dark and Light themes first before consuming it in a component.

---

## 6. Role-Based Access Control (RBAC) Principles
The system enforces three distinct roles:
1. **Admin**: Full access to platform analytics, customer management (activate/deactivate/block), bank account management (create/update/freeze/unfreeze/limits), and final loan approvals/rejections.
2. **Bank Staff**: Operational access to customer registration, account creation, customer verification, transaction review/flagging, and loan assistance (review, add internal notes, forward for admin approval). **Restrictions**: Staff cannot approve loan applications or modify bank-wide financial settings.
3. **Customer**: Scoped strictly to their own accounts, balances, account switching, internal/intra-bank fund transfers, deposit/withdrawal requests, loan applications, repayment tracking, and statements.

- **Server-Side Enforcement**: Every Route Handler and server action must verify authentication and role permissions on the server. Hiding UI elements on the client is never sufficient authorization.

---

## 7. Security, Database & Financial Logic Principles
1. **Zero Client Trust**: Never trust client-submitted balances, transaction fees, account ownership claims, or role claims. Always derive authoritative identity from verified server-side JWT sessions and fetch balances directly from PostgreSQL.
2. **Atomic Financial Operations**: All balance-affecting operations (Fund Transfers, Approved Deposits, Approved Withdrawals, Loan Disbursements, Loan Repayments) must execute inside atomic database transactions (`prisma.$transaction`). A failed transfer must never deduct funds from a sender without crediting the receiver.
3. **Pre-Transaction Server Validations**:
   - Verify account ownership and active/unfrozen account status.
   - Validate transaction PIN on the server before executing transfers.
   - Verify sufficient available balance and check configured transaction/daily limits.
   - Prevent duplicate transaction submissions and preserve immutable transaction history records for both sender and receiver with unique Transaction IDs.
4. **Secrets & Environment Hygiene**: Never hardcode or expose database credentials, JWT secrets, or private keys in client code, logs, or version control. Ensure `.env` files remain git-ignored.

---

## 8. Development Workflow
1. **Scoped Execution**: Implement only the explicitly assigned phase or task. Do not jump ahead to future phases or unrequested features.
2. **Architectural Consultation**: Ask the user before introducing significant architectural changes or new third-party libraries.
3. **Verification**: Verify builds, runtime behavior, and acceptance criteria after each change.
4. **Progress Tracking**: Update `PROJECT_STATUS.md` accurately after completing and verifying each task.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
