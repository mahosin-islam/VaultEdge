"use client";

import Link from "next/link";
import { useAppSelector } from "@/hooks/redux";
import type { AdminRecentTransactionDTO } from "@/types/admin.types";
import { formatCurrencyFull, formatTimeStampHMS } from "@/utils/formatters";

interface AdminLiveTransactionStreamCardProps {
  transactions: AdminRecentTransactionDTO[];
  totalTransactions: number;
}

function getRailLabel(type: AdminRecentTransactionDTO["type"]): string {
  switch (type) {
    case "FUND_TRANSFER":
      return "Inter-bank";
    case "DEPOSIT":
      return "ACH Direct";
    case "WITHDRAWAL":
      return "RTGS Wire";
    case "LOAN_DISBURSEMENT":
      return "Fedwire";
    case "LOAN_REPAYMENT":
      return "SWIFT MT103";
  }
}

export function AdminLiveTransactionStreamCard({
  transactions,
  totalTransactions,
}: AdminLiveTransactionStreamCardProps) {
  const searchQuery = useAppSelector((state) =>
    (state.admin?.searchQuery ?? "").trim().toLowerCase()
  );

  const filteredTransactions = searchQuery
    ? transactions.filter(
        (tx) =>
          tx.referenceId.toLowerCase().includes(searchQuery) ||
          (tx.description ?? "").toLowerCase().includes(searchQuery) ||
          (tx.senderAccount?.accountTitle ?? "")
            .toLowerCase()
            .includes(searchQuery) ||
          (tx.senderAccount?.accountNumber ?? "")
            .toLowerCase()
            .includes(searchQuery) ||
          (tx.receiverAccount?.accountTitle ?? "")
            .toLowerCase()
            .includes(searchQuery) ||
          (tx.receiverAccount?.accountNumber ?? "")
            .toLowerCase()
            .includes(searchQuery)
      )
    : transactions;

  return (
    <section
      aria-labelledby="live-ledger-heading"
      className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 ve-card-shadow"
    >
      <div>
        {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full bg-status-info"
              aria-hidden="true"
            />
            <h2
              id="live-ledger-heading"
              className="text-sm font-bold text-text-primary sm:text-base"
            >
              Live Transaction Ledger Stream
            </h2>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px] text-text-muted">
            <span>≡</span>
            <span>RT-BLOCK: #{100000 + totalTransactions}</span>
          </div>
        </div>

        {/* Table Header / Rows */}
        {filteredTransactions.length === 0 ? (
          <div className="mt-6 rounded-xl border border-border-subtle bg-surface-inner p-8 text-center">
            <p className="text-sm font-semibold text-text-primary">
              {searchQuery
                ? "No Matching Transactions in Current Stream"
                : "No Ledger Transactions Recorded Yet"}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              {searchQuery
                ? `No recent ledger items match "${searchQuery}".`
                : "Transactions will stream here in real time as deposits, withdrawals, transfers, and loans are executed."}
            </p>
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  <th className="py-2.5 pr-3">Tx Hash / Time</th>
                  <th className="py-2.5 px-3">Counterparty Entities</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 pl-3 text-right">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-xs">
                {filteredTransactions.map((tx) => {
                  const isInboundOrCredit =
                    tx.type === "DEPOSIT" || tx.type === "LOAN_DISBURSEMENT";
                  const primaryEntity = isInboundOrCredit
                    ? tx.receiverAccount?.accountTitle ??
                      "Customer Account Credit"
                    : tx.senderAccount?.accountTitle ??
                      tx.receiverAccount?.accountTitle ??
                      "Internal Settlement";
                  const secondaryNote =
                    tx.description ??
                    (tx.receiverAccount
                      ? `Acct #${tx.receiverAccount.accountNumber}`
                      : "Direct Ledger Posting");

                  return (
                    <tr
                      key={tx.id}
                      className="transition-colors hover:bg-surface-hover"
                    >
                      {/* 1. Tx Hash / Time */}
                      <td className="py-3.5 pr-3 align-top font-mono text-[11px]">
                        <p className="font-semibold text-accent">
                          {tx.referenceId}
                        </p>
                        <p className="mt-0.5 text-[10px] text-text-muted">
                          {formatTimeStampHMS(tx.executedAt)}
                        </p>
                      </td>

                      {/* 2. Counterparty Entities */}
                      <td className="py-3.5 px-3 align-top">
                        <p className="font-semibold text-text-primary">
                          {primaryEntity}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-text-muted">
                          {secondaryNote}
                        </p>
                      </td>

                      {/* 3. Type / Rail */}
                      <td className="py-3.5 px-3 align-top font-mono text-[11px] text-text-secondary">
                        {getRailLabel(tx.type)}
                      </td>

                      {/* 4. Amount */}
                      <td
                        className={`py-3.5 px-3 align-top text-right font-mono text-xs font-bold ${
                          isInboundOrCredit
                            ? "text-accent"
                            : "text-text-primary"
                        }`}
                      >
                        {isInboundOrCredit ? "+" : "-"}
                        {formatCurrencyFull(tx.amount)}
                      </td>

                      {/* 5. Settlement Status Badge */}
                      <td className="py-3.5 pl-3 align-top text-right font-mono text-[10px]">
                        {tx.isFlagged ? (
                          <span className="inline-flex items-center gap-1 rounded border border-status-danger-border bg-status-danger-bg px-2 py-0.5 font-semibold text-status-danger">
                            <span>●</span>
                            <span>Flagged</span>
                          </span>
                        ) : tx.status === "COMPLETED" ? (
                          <span className="inline-flex items-center gap-1 rounded border border-accent-border bg-accent-subtle px-2 py-0.5 font-semibold text-accent">
                            <span>●</span>
                            <span>Cleared</span>
                          </span>
                        ) : tx.status === "PENDING" ? (
                          <span className="inline-flex items-center gap-1 rounded border border-status-info-border bg-status-info-bg px-2 py-0.5 font-semibold text-status-info">
                            <span>●</span>
                            <span>Settling</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded border border-border bg-surface-inner px-2 py-0.5 font-semibold text-text-muted">
                            <span>●</span>
                            <span>{tx.status}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Consensus Row */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3.5 font-mono text-[11px]">
        <span className="text-text-muted">
          Consensus: Multi-Sig Node #4 of 5 Validated
        </span>
        <Link
          href="/admin/transactions"
          className="font-semibold text-accent transition-colors hover:text-accent-hover"
        >
          Inspect Historical Audit Archive →
        </Link>
      </div>
    </section>
  );
}
