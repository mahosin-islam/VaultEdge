"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useDecideAdminDepositMutation,
  useDecideAdminLoanMutation,
  useDecideAdminWithdrawalMutation,
  useFreezeAdminAccountMutation,
} from "@/features/admin/adminApi";
import type { AdminActionQueueItemDTO } from "@/types/admin.types";
import type { ApiErrorEnvelope } from "@/types/api.types";
import { formatCurrencyFull } from "@/utils/formatters";

interface AdminActionQueueCardProps {
  items: AdminActionQueueItemDTO[];
  totalPendingCount: number;
}

export function AdminActionQueueCard({
  items,
  totalPendingCount,
}: AdminActionQueueCardProps) {
  const [decideDeposit] = useDecideAdminDepositMutation();
  const [decideWithdrawal] = useDecideAdminWithdrawalMutation();
  const [decideLoan] = useDecideAdminLoanMutation();
  const [freezeAccount] = useFreezeAdminAccountMutation();

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handlePrimaryAction = async (item: AdminActionQueueItemDTO) => {
    setProcessingId(item.id);
    setFeedback(null);

    try {
      if (item.category === "DEPOSIT") {
        await decideDeposit({
          depositId: item.entityId,
          decision: "APPROVE",
          reviewNote: "Authorized from Admin Overview Command Queue.",
        }).unwrap();
        setFeedback({
          type: "success",
          text: `Deposit ${item.referenceCode} authorized and credited.`,
        });
      } else if (item.category === "WITHDRAWAL") {
        await decideWithdrawal({
          withdrawalId: item.entityId,
          decision: "APPROVE",
          reviewNote: "Authorized from Admin Overview Command Queue.",
        }).unwrap();
        setFeedback({
          type: "success",
          text: `Withdrawal ${item.referenceCode} authorized and settled.`,
        });
      } else if (item.category === "LOAN") {
        await decideLoan({
          loanId: item.entityId,
          decision: "APPROVE",
          note: "Approved & disbursed from Admin Overview Command Queue.",
        }).unwrap();
        setFeedback({
          type: "success",
          text: `Loan ${item.referenceCode} approved, schedule generated, and disbursed.`,
        });
      } else if (
        item.category === "SUSPICIOUS_FLAG" &&
        item.targetAccountId
      ) {
        await freezeAccount({
          accountId: item.targetAccountId,
          status: "FROZEN",
          reason: `Frozen from Admin Overview due to flag ${item.referenceCode}`,
        }).unwrap();
        setFeedback({
          type: "success",
          text: `Account associated with ${item.referenceCode} frozen for compliance review.`,
        });
      }
    } catch (err: unknown) {
      const apiErr = (err as { data?: ApiErrorEnvelope })?.data;
      setFeedback({
        type: "error",
        text:
          apiErr?.error?.message ??
          "Action could not be completed. Please review the item directly.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getReviewHref = (item: AdminActionQueueItemDTO): string => {
    switch (item.category) {
      case "DEPOSIT":
        return "/admin/deposits";
      case "WITHDRAWAL":
        return "/admin/withdrawals";
      case "LOAN":
        return "/admin/loans";
      case "SUSPICIOUS_FLAG":
        return "/admin/transactions";
    }
  };

  return (
    <section
      aria-labelledby="action-queue-heading"
      className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 ve-card-shadow"
    >
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2">
            <span className="text-accent">⚠</span>
            <h2
              id="action-queue-heading"
              className="text-sm font-bold text-text-primary sm:text-base"
            >
              Action Queue ({items.length} High Priority)
            </h2>
          </div>
          <span className="font-mono text-[11px] font-semibold text-accent">
            Supervised
          </span>
        </div>

        {/* Inline Feedback Alert */}
        {feedback && (
          <div
            role={feedback.type === "error" ? "alert" : "status"}
            className={`mt-4 rounded-xl border px-3.5 py-2.5 text-xs ${
              feedback.type === "success"
                ? "border-status-success-border bg-status-success-bg text-status-success"
                : "border-status-danger-border bg-status-danger-bg text-status-danger"
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* Queue Items or Empty State */}
        {items.length === 0 ? (
          <div className="mt-6 rounded-xl border border-border-subtle bg-surface-inner p-8 text-center">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-status-success-border bg-status-success-bg text-status-success">
              ✓
            </span>
            <p className="mt-3 text-sm font-semibold text-text-primary">
              All Supervised Queues Cleared
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Zero pending deposits, withdrawals, loan dossiers, or unresolved
              suspicious flags require immediate intervention.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3.5">
            {items.map((item) => {
              const isBusy = processingId === item.id;
              const isDanger = item.severity === "DANGER";

              return (
                <article
                  key={item.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    isDanger
                      ? "border-status-danger-border bg-surface-inner"
                      : "border-border-subtle bg-surface-inner hover:border-accent-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold ${
                          isDanger
                            ? "border-status-danger-border bg-status-danger-bg text-status-danger"
                            : "border-border bg-surface text-text-secondary"
                        }`}
                      >
                        {item.referenceCode}
                      </span>
                      <div>
                        <h3 className="text-xs font-bold text-text-primary sm:text-sm">
                          {item.title}
                        </h3>
                        <p className="mt-0.5 text-[11px] text-text-secondary">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 font-mono text-xs font-bold sm:text-sm ${
                        isDanger ? "text-status-danger" : "text-accent"
                      }`}
                    >
                      {formatCurrencyFull(item.amount)}
                    </span>
                  </div>

                  <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3">
                    <span
                      className={`font-mono text-[11px] ${
                        isDanger
                          ? "text-status-danger"
                          : "text-text-muted"
                      }`}
                    >
                      {isDanger ? "⊘ " : "🔒 "}
                      {item.metaNote}
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={getReviewHref(item)}
                        className="inline-flex h-7 items-center justify-center rounded-md border border-btn-secondary-border bg-btn-secondary px-2.5 font-mono text-[11px] font-semibold text-btn-secondary-text transition-colors hover:border-accent hover:bg-btn-secondary-hover"
                      >
                        {isDanger ? "Inspect" : "Review"}
                      </Link>

                      {(item.category !== "SUSPICIOUS_FLAG" ||
                        item.targetAccountId) && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handlePrimaryAction(item)}
                          className={`inline-flex h-7 items-center justify-center rounded-md px-3 font-mono text-[11px] font-bold transition-colors disabled:opacity-60 ${
                            isDanger
                              ? "border border-status-danger-border bg-status-danger-bg text-status-danger hover:bg-status-danger hover:text-background"
                              : "bg-btn-primary text-btn-primary-text hover:bg-btn-primary-hover"
                          }`}
                        >
                          {isBusy
                            ? "Processing..."
                            : item.category === "LOAN"
                              ? "Approve"
                              : isDanger
                                ? "Freeze Account"
                                : "Authorize"}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Compliance Row */}
      <div className="mt-5 flex items-center justify-between border-t border-border-subtle pt-3.5 font-mono text-[11px]">
        <span className="text-text-muted">
          Compliance Protocol: SOC2 Type II
        </span>
        <Link
          href="/admin/loans"
          className="font-semibold text-accent transition-colors hover:text-accent-hover"
        >
          View full {totalPendingCount} action items →
        </Link>
      </div>
    </section>
  );
}
