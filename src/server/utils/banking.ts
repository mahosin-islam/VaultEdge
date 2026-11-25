// ============================================================================
// VaultEdge — Banking Core Helpers (Treasury Account, Reference IDs, Pagination)
// ============================================================================

import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import type { PaginationMeta } from "@/types/api.types";

export const SYSTEM_TREASURY_ACCOUNT_NUMBER = "1000000001";
export const SYSTEM_TREASURY_ACCOUNT_TITLE = "VaultEdge Central Treasury Reserve";
export const DEFAULT_SYSTEM_SETTING_ID = "default";

/**
 * Ensures the internal bank treasury account (`isSystemAccount: true`,
 * `accountType: "INTERNAL_TREASURY"`) exists inside a transaction or Prisma client,
 * enabling balanced double-entry DEBIT/CREDIT postings for deposits, withdrawals,
 * loan disbursements, and loan repayments.
 */
export async function ensureSystemTreasuryAccount(
  tx: Prisma.TransactionClient
) {
  const existing = await tx.bankAccount.findFirst({
    where: {
      isSystemAccount: true,
      accountType: "INTERNAL_TREASURY",
    },
  });

  if (existing) {
    return existing;
  }

  return tx.bankAccount.upsert({
    where: { accountNumber: SYSTEM_TREASURY_ACCOUNT_NUMBER },
    update: {
      isSystemAccount: true,
      accountType: "INTERNAL_TREASURY",
      status: "ACTIVE",
    },
    create: {
      accountNumber: SYSTEM_TREASURY_ACCOUNT_NUMBER,
      accountTitle: SYSTEM_TREASURY_ACCOUNT_TITLE,
      accountType: "INTERNAL_TREASURY",
      status: "ACTIVE",
      isSystemAccount: true,
      currency: "USD",
      balance: new Prisma.Decimal("100000000.00"),
    },
  });
}

/**
 * Ensures the singleton `SystemSetting` row (`id: "default"`) exists.
 */
export async function ensureSystemSettings(tx: Prisma.TransactionClient) {
  return tx.systemSetting.upsert({
    where: { id: DEFAULT_SYSTEM_SETTING_ID },
    update: {},
    create: {
      id: DEFAULT_SYSTEM_SETTING_ID,
      defaultDailyTransferLimit: new Prisma.Decimal("25000.00"),
      defaultMaxSingleTransfer: new Prisma.Decimal("10000.00"),
      defaultMinAccountBalance: new Prisma.Decimal("100.00"),
      transferFeeFlat: new Prisma.Decimal("0.00"),
      suspiciousAmountThreshold: new Prisma.Decimal("15000.00"),
      defaultLoanInterestRate: new Prisma.Decimal("8.50"),
    },
  });
}

/**
 * Generates a unique 10-digit customer bank account number starting with prefix:
 * - SAVINGS  -> 101xxxxxxx
 * - CURRENT  -> 102xxxxxxx
 * - BUSINESS -> 103xxxxxxx
 */
export async function generateUniqueAccountNumber(
  tx: Prisma.TransactionClient,
  accountType: "SAVINGS" | "CURRENT" | "BUSINESS"
): Promise<string> {
  const prefix =
    accountType === "SAVINGS"
      ? "101"
      : accountType === "CURRENT"
        ? "102"
        : "103";

  for (let attempt = 0; attempt < 15; attempt++) {
    const randomPart = Math.floor(1000000 + Math.random() * 9000000).toString();
    const candidate = `${prefix}${randomPart}`;
    const clash = await tx.bankAccount.findUnique({
      where: { accountNumber: candidate },
      select: { id: true },
    });
    if (!clash) {
      return candidate;
    }
  }

  const fallback = `${prefix}${Date.now().toString().slice(-7)}`;
  return fallback;
}

/**
 * Generates a unique formatted Transaction Reference ID (e.g. TXN-20261123-A9F41C8B).
 */
export function generateTransactionReferenceId(prefix = "TXN"): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const rand = randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${y}${m}${d}-${rand}`;
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export function formatDecimal(
  val: Prisma.Decimal | number | string | null | undefined
): string {
  if (val === null || val === undefined) {
    return "0.00";
  }
  if (val instanceof Prisma.Decimal) {
    return val.toFixed(2);
  }
  const num = typeof val === "number" ? val : Number(val);
  return Number.isFinite(num) ? num.toFixed(2) : "0.00";
}
