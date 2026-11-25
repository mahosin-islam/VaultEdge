'use client';

import React, { useState, type FormEvent } from 'react';
import {
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
} from '@/features/admin/adminApi';
import type { AdminSystemSettingsDTO } from '@/types/admin.types';
import type { ApiErrorEnvelope } from '@/types/api.types';
import { formatCurrencyFull, formatTimeStampHMS } from '@/utils/formatters';

interface AdminSettingsViewProps {
  initialSettings: AdminSystemSettingsDTO;
}

function SettingsFormBody({
  settings,
  isFetching,
}: {
  settings: AdminSystemSettingsDTO;
  isFetching: boolean;
}) {
  const [dailyLimit, setDailyLimit] = useState(
    settings.defaultDailyTransferLimit,
  );
  const [maxSingleTransfer, setMaxSingleTransfer] = useState(
    settings.defaultMaxSingleTransfer,
  );
  const [minAccountBalance, setMinAccountBalance] = useState(
    settings.defaultMinAccountBalance,
  );
  const [transferFeeFlat, setTransferFeeFlat] = useState(
    settings.transferFeeFlat,
  );
  const [suspiciousThreshold, setSuspiciousThreshold] = useState(
    settings.suspiciousAmountThreshold,
  );
  const [loanInterestRate, setLoanInterestRate] = useState(
    settings.defaultLoanInterestRate,
  );
  const [feedback, setFeedback] = useState<{
    kind: 'success' | 'error';
    message: string;
  } | null>(null);

  const [updateSettings, { isLoading: isSaving }] =
    useUpdateAdminSettingsMutation();

  const handleReset = () => {
    setDailyLimit(settings.defaultDailyTransferLimit);
    setMaxSingleTransfer(settings.defaultMaxSingleTransfer);
    setMinAccountBalance(settings.defaultMinAccountBalance);
    setTransferFeeFlat(settings.transferFeeFlat);
    setSuspiciousThreshold(settings.suspiciousAmountThreshold);
    setLoanInterestRate(settings.defaultLoanInterestRate);
    setFeedback(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const parsedDaily = Number(dailyLimit);
    const parsedSingle = Number(maxSingleTransfer);
    const parsedMinBal = Number(minAccountBalance);
    const parsedFee = Number(transferFeeFlat);
    const parsedThreshold = Number(suspiciousThreshold);
    const parsedRate = Number(loanInterestRate);

    if (!Number.isFinite(parsedDaily) || parsedDaily <= 0) {
      setFeedback({
        kind: 'error',
        message: 'Default daily transfer limit must be a positive amount.',
      });
      return;
    }
    if (!Number.isFinite(parsedSingle) || parsedSingle <= 0) {
      setFeedback({
        kind: 'error',
        message: 'Maximum single transaction limit must be a positive amount.',
      });
      return;
    }
    if (parsedDaily < parsedSingle) {
      setFeedback({
        kind: 'error',
        message:
          'Default daily transfer limit cannot be less than maximum single transaction limit.',
      });
      return;
    }
    if (!Number.isFinite(parsedMinBal) || parsedMinBal < 0) {
      setFeedback({
        kind: 'error',
        message: 'Minimum account balance cannot be negative.',
      });
      return;
    }
    if (!Number.isFinite(parsedFee) || parsedFee < 0) {
      setFeedback({
        kind: 'error',
        message: 'Transfer fee cannot be negative.',
      });
      return;
    }
    if (!Number.isFinite(parsedThreshold) || parsedThreshold <= 0) {
      setFeedback({
        kind: 'error',
        message: 'Suspicious transaction threshold must be a positive amount.',
      });
      return;
    }
    if (!Number.isFinite(parsedRate) || parsedRate < 0 || parsedRate > 100) {
      setFeedback({
        kind: 'error',
        message: 'Default loan interest rate must be between 0% and 100%.',
      });
      return;
    }

    try {
      await updateSettings({
        defaultDailyTransferLimit: parsedDaily,
        defaultMaxSingleTransfer: parsedSingle,
        defaultMinAccountBalance: parsedMinBal,
        transferFeeFlat: parsedFee,
        suspiciousAmountThreshold: parsedThreshold,
        defaultLoanInterestRate: parsedRate,
      }).unwrap();

      setFeedback({
        kind: 'success',
        message:
          'Bank-wide financial policies updated and recorded in the immutable audit log.',
      });
    } catch (err) {
      const apiErr = err as { data?: ApiErrorEnvelope };
      setFeedback({
        kind: 'error',
        message:
          apiErr?.data?.error?.message ??
          'Failed to update bank-wide financial settings.',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Executive Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            TREASURY GOVERNANCE / BANK-WIDE PARAMETERS
          </p>
          <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
            Bank-Wide Financial Settings
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-text-secondary sm:text-sm">
            Configure global transaction velocity limits, minimum vault balance
            rules, flat transfer fees, loan interest defaults, and AML thresholds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-muted">
            <span
              className={`h-2 w-2 rounded-full ${
                isFetching ? 'animate-pulse bg-accent' : 'bg-status-success'
              }`}
            />
            <span>
              Last updated {new Date(settings.updatedAt).toLocaleDateString()} •{' '}
              {formatTimeStampHMS(settings.updatedAt)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            Reset Changes
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-btn-primary px-4 py-2 text-xs font-semibold text-btn-primary-text shadow-sm transition-colors hover:bg-btn-primary-hover disabled:opacity-50"
          >
            {isSaving ? 'Saving Policies...' : 'Save Policy Changes'}
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback ? (
        <div
          className={`rounded-xl border px-4 py-3 text-xs ${
            feedback.kind === 'success'
              ? 'border-border bg-status-success-bg text-status-success'
              : 'border-border bg-status-danger-bg text-status-danger'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left: Configuration Sections */}
        <div className="space-y-6 xl:col-span-8">
          {/* 1. Transfer & Liquidity Limits */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="border-b border-border pb-3">
              <h2 className="text-sm font-semibold text-text-primary">
                Transaction &amp; Liquidity Limits
              </h2>
              <p className="mt-0.5 text-xs text-text-muted">
                Applied as default ceilings for all customer accounts unless
                overridden per account.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="block text-xs">
                <span className="font-medium text-text-secondary">
                  Daily Transfer Limit (USD)
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 font-mono text-sm text-text-primary focus:border-accent focus:outline-none"
                />
                <span className="mt-1 block text-[11px] text-text-muted">
                  Must be ≥ single tx limit
                </span>
              </label>

              <label className="block text-xs">
                <span className="font-medium text-text-secondary">
                  Max Single Transaction (USD)
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={maxSingleTransfer}
                  onChange={(e) => setMaxSingleTransfer(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 font-mono text-sm text-text-primary focus:border-accent focus:outline-none"
                />
                <span className="mt-1 block text-[11px] text-text-muted">
                  Per-transfer hard cap
                </span>
              </label>

              <label className="block text-xs">
                <span className="font-medium text-text-secondary">
                  Minimum Account Balance (USD)
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={minAccountBalance}
                  onChange={(e) => setMinAccountBalance(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 font-mono text-sm text-text-primary focus:border-accent focus:outline-none"
                />
                <span className="mt-1 block text-[11px] text-text-muted">
                  Protected reserve floor
                </span>
              </label>
            </div>
          </section>

          {/* 2. Fee Schedule & Credit Defaults */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="border-b border-border pb-3">
              <h2 className="text-sm font-semibold text-text-primary">
                Fee Schedule &amp; Credit Underwriting Defaults
              </h2>
              <p className="mt-0.5 text-xs text-text-muted">
                Server-computed flat transfer fees and baseline annual loan
                interest rate.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-xs">
                <span className="font-medium text-text-secondary">
                  Flat Transfer Fee (USD)
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={transferFeeFlat}
                  onChange={(e) => setTransferFeeFlat(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 font-mono text-sm text-text-primary focus:border-accent focus:outline-none"
                />
                <span className="mt-1 block text-[11px] text-text-muted">
                  Credited to internal fee revenue ledger
                </span>
              </label>

              <label className="block text-xs">
                <span className="font-medium text-text-secondary">
                  Default Loan Interest Rate (% APR)
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={loanInterestRate}
                  onChange={(e) => setLoanInterestRate(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 font-mono text-sm text-text-primary focus:border-accent focus:outline-none"
                />
                <span className="mt-1 block text-[11px] text-text-muted">
                  Applied to new loan applications (0–100%)
                </span>
              </label>
            </div>
          </section>

          {/* 3. AML & Suspicious Transaction Detection */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="border-b border-border pb-3">
              <h2 className="text-sm font-semibold text-text-primary">
                AML &amp; Suspicious Transaction Detection
              </h2>
              <p className="mt-0.5 text-xs text-text-muted">
                Rule-based compliance threshold that automatically flags unusual
                high-value transactions for Admin review.
              </p>
            </div>

            <div className="mt-4 max-w-md">
              <label className="block text-xs">
                <span className="font-medium text-text-secondary">
                  Suspicious Amount Threshold (USD)
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={suspiciousThreshold}
                  onChange={(e) => setSuspiciousThreshold(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-border bg-surface-inner px-3 py-2 font-mono text-sm text-text-primary focus:border-accent focus:outline-none"
                />
                <span className="mt-1 block text-[11px] text-text-muted">
                  Transactions at or above this amount trigger an automatic
                  compliance flag.
                </span>
              </label>
            </div>
          </section>
        </div>

        {/* Right: Active Policy Summary & RBAC Governance */}
        <aside className="space-y-4 xl:col-span-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <span className="rounded border border-accent-border bg-accent-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
              ACTIVE POLICY SNAPSHOT
            </span>
            <h3 className="mt-2 text-base font-semibold text-text-primary">
              Current Bank-Wide Defaults
            </h3>

            <div className="mt-4 space-y-2.5 rounded-lg border border-border bg-surface-inner p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Daily Transfer Limit</span>
                <span className="font-mono font-semibold text-text-primary">
                  {formatCurrencyFull(settings.defaultDailyTransferLimit)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Max Single Transfer</span>
                <span className="font-mono font-semibold text-text-primary">
                  {formatCurrencyFull(settings.defaultMaxSingleTransfer)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Min Account Balance</span>
                <span className="font-mono font-semibold text-text-primary">
                  {formatCurrencyFull(settings.defaultMinAccountBalance)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Flat Transfer Fee</span>
                <span className="font-mono font-semibold text-accent">
                  {formatCurrencyFull(settings.transferFeeFlat)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">AML Flag Threshold</span>
                <span className="font-mono font-semibold text-status-danger">
                  {formatCurrencyFull(settings.suspiciousAmountThreshold)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Default Loan APR</span>
                <span className="font-mono font-semibold text-status-success">
                  {settings.defaultLoanInterestRate}%
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-border-subtle bg-surface-inner p-3 text-[11px] text-text-secondary">
              <p className="font-semibold text-text-primary">
                Server-Side RBAC &amp; Audit Guarantee
              </p>
              <p className="mt-1 leading-relaxed text-text-muted">
                Only <span className="font-semibold text-accent">ADMIN</span>{' '}
                sessions can mutate bank-wide parameters. Every update writes
                before/after snapshots to the immutable{' '}
                <span className="font-mono">AuditLog</span> table.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}

export function AdminSettingsView({ initialSettings }: AdminSettingsViewProps) {
  const { data: settingsResponse, isFetching } = useGetAdminSettingsQuery();
  const settings = settingsResponse?.data?.settings ?? initialSettings;

  return (
    <SettingsFormBody
      key={settings.updatedAt}
      settings={settings}
      isFetching={isFetching}
    />
  );
}
