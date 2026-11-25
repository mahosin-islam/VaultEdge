// ============================================================================
// VaultEdge — Admin Settings Service
// Reads and updates bank-wide financial limits, fees, and interest rate defaults.
// Records every mutation in AuditLog.
// ============================================================================

import { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { BusinessRuleError } from "@/server/errors/app-error";
import {
  DEFAULT_SYSTEM_SETTING_ID,
  ensureSystemSettings,
  formatDecimal,
} from "@/server/utils/banking";
import type { AdminUpdateSettingsInput } from "@/server/validators/admin.schema";

export interface SystemSettingDTO {
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

export async function getSystemSettings(): Promise<SystemSettingDTO> {
  const settings = await prisma.$transaction(async (tx) =>
    ensureSystemSettings(tx)
  );

  return {
    id: settings.id,
    defaultDailyTransferLimit: formatDecimal(settings.defaultDailyTransferLimit),
    defaultMaxSingleTransfer: formatDecimal(settings.defaultMaxSingleTransfer),
    defaultMinAccountBalance: formatDecimal(settings.defaultMinAccountBalance),
    transferFeeFlat: formatDecimal(settings.transferFeeFlat),
    suspiciousAmountThreshold: formatDecimal(settings.suspiciousAmountThreshold),
    defaultLoanInterestRate: formatDecimal(settings.defaultLoanInterestRate),
    updatedByAdminId: settings.updatedByAdminId,
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export async function updateSystemSettings(params: {
  adminId: string;
  ipAddress: string | null;
  input: AdminUpdateSettingsInput;
}): Promise<SystemSettingDTO> {
  const updated = await prisma.$transaction(async (tx) => {
    const current = await ensureSystemSettings(tx);

    const nextDaily =
      params.input.defaultDailyTransferLimit !== undefined
        ? new Prisma.Decimal(params.input.defaultDailyTransferLimit.toFixed(2))
        : current.defaultDailyTransferLimit;

    const nextMaxSingle =
      params.input.defaultMaxSingleTransfer !== undefined
        ? new Prisma.Decimal(params.input.defaultMaxSingleTransfer.toFixed(2))
        : current.defaultMaxSingleTransfer;

    if (nextDaily.lessThan(nextMaxSingle)) {
      throw new BusinessRuleError(
        "defaultDailyTransferLimit cannot be less than defaultMaxSingleTransfer."
      );
    }

    const nextMinBalance =
      params.input.defaultMinAccountBalance !== undefined
        ? new Prisma.Decimal(params.input.defaultMinAccountBalance.toFixed(2))
        : current.defaultMinAccountBalance;

    const nextFee =
      params.input.transferFeeFlat !== undefined
        ? new Prisma.Decimal(params.input.transferFeeFlat.toFixed(2))
        : current.transferFeeFlat;

    const nextSuspiciousThreshold =
      params.input.suspiciousAmountThreshold !== undefined
        ? new Prisma.Decimal(params.input.suspiciousAmountThreshold.toFixed(2))
        : current.suspiciousAmountThreshold;

    const nextLoanRate =
      params.input.defaultLoanInterestRate !== undefined
        ? new Prisma.Decimal(params.input.defaultLoanInterestRate.toFixed(2))
        : current.defaultLoanInterestRate;

    const saved = await tx.systemSetting.update({
      where: { id: DEFAULT_SYSTEM_SETTING_ID },
      data: {
        defaultDailyTransferLimit: nextDaily,
        defaultMaxSingleTransfer: nextMaxSingle,
        defaultMinAccountBalance: nextMinBalance,
        transferFeeFlat: nextFee,
        suspiciousAmountThreshold: nextSuspiciousThreshold,
        defaultLoanInterestRate: nextLoanRate,
        updatedByAdminId: params.adminId,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: params.adminId,
        actorRole: "ADMIN",
        action: "SYSTEM_SETTINGS_UPDATED",
        entityType: "SystemSetting",
        entityId: saved.id,
        ipAddress: params.ipAddress,
        metadata: {
          before: {
            defaultDailyTransferLimit: formatDecimal(
              current.defaultDailyTransferLimit
            ),
            defaultMaxSingleTransfer: formatDecimal(
              current.defaultMaxSingleTransfer
            ),
            defaultMinAccountBalance: formatDecimal(
              current.defaultMinAccountBalance
            ),
            transferFeeFlat: formatDecimal(current.transferFeeFlat),
            suspiciousAmountThreshold: formatDecimal(
              current.suspiciousAmountThreshold
            ),
            defaultLoanInterestRate: formatDecimal(
              current.defaultLoanInterestRate
            ),
          },
          after: {
            defaultDailyTransferLimit: formatDecimal(
              saved.defaultDailyTransferLimit
            ),
            defaultMaxSingleTransfer: formatDecimal(
              saved.defaultMaxSingleTransfer
            ),
            defaultMinAccountBalance: formatDecimal(
              saved.defaultMinAccountBalance
            ),
            transferFeeFlat: formatDecimal(saved.transferFeeFlat),
            suspiciousAmountThreshold: formatDecimal(
              saved.suspiciousAmountThreshold
            ),
            defaultLoanInterestRate: formatDecimal(
              saved.defaultLoanInterestRate
            ),
          },
        },
      },
    });

    return saved;
  });

  return {
    id: updated.id,
    defaultDailyTransferLimit: formatDecimal(updated.defaultDailyTransferLimit),
    defaultMaxSingleTransfer: formatDecimal(updated.defaultMaxSingleTransfer),
    defaultMinAccountBalance: formatDecimal(updated.defaultMinAccountBalance),
    transferFeeFlat: formatDecimal(updated.transferFeeFlat),
    suspiciousAmountThreshold: formatDecimal(updated.suspiciousAmountThreshold),
    defaultLoanInterestRate: formatDecimal(updated.defaultLoanInterestRate),
    updatedByAdminId: updated.updatedByAdminId,
    updatedAt: updated.updatedAt.toISOString(),
  };
}
