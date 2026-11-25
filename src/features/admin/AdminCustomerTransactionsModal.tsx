"use client";

import type { AdminRecentTransactionDTO } from "@/types/admin.types";
import { formatCurrencyFull, formatTimeStampHMS } from "@/utils/formatters";

interface AdminCustomerTransactionsModalProps {
  open: boolean;
  onClose: () => void;
  customerName: string;
  customerCode: string;
  transactions: AdminRecentTransactionDTO[];
  isLoading: boolean;
}

export function AdminCustomerTransactionsModal({
  open,
  onClose,
  customerName,
  customerCode,
  transactions,
  isLoading,
}: AdminCustomerTransactionsModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-tx-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-background-glass backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-surface p-6 ve-elevated-shadow">
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <span className="rounded border border-accent-border bg-accent-subtle px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-accent">
              IMMUTABLE LEDGER ARCHIVE • {customerCode}
            </span>
            <h2
              id="customer-tx-modal-title"
              className="mt-2 text-lg font-bold text-text-primary"
            >
              {customerName} — Transaction History
            </h2>
            <p className="mt-0.5 text-xs text-text-secondary">
              Authoritative debit and credit postings across all owned customer
              accounts.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-inner text-text-secondary transition-colors hover:border-accent hover:text-accent"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="py-12 text-center font-mono text-xs text-text-muted">
              Loading customer ledger postings...
            </div>
          ) : transactions.length === 0 ? (
            <div className="rounded-xl border border-border-subtle bg-surface-inner p-8 text-center">
              <p className="text-sm font-semibold text-text-primary">
                No Ledger Transactions Recorded
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                This customer entity has no completed or pending transactions
                yet.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  <th className="py-2.5 pr-3">Reference / Time</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Counterparty / Note</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 pl-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-xs">
                {transactions.map((tx) => {
                  const isCredit =
                    tx.type === "DEPOSIT" || tx.type === "LOAN_DISBURSEMENT";

                  return (
                    <tr
                      key={tx.id}
                      className="transition-colors hover:bg-surface-hover"
                    >
                      <td className="py-3 pr-3 font-mono text-[11px]">
                        <p className="font-semibold text-accent">
                          {tx.referenceId}
                        </p>
                        <p className="text-[10px] text-text-muted">
                          {new Date(tx.executedAt).toLocaleDateString()} •{" "}
                          {formatTimeStampHMS(tx.executedAt)}
                        </p>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-text-secondary">
                        {tx.type}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-medium text-text-primary">
                          {tx.description ?? "Verified Ledger Settlement"}
                        </p>
                        <p className="text-[10px] text-text-muted">
                          {tx.senderAccount
                            ? `From #${tx.senderAccount.accountNumber}`
                            : ""}{" "}
                          {tx.receiverAccount
                            ? `→ To #${tx.receiverAccount.accountNumber}`
                            : ""}
                        </p>
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-mono font-bold ${
                          isCredit ? "text-status-success" : "text-text-primary"
                        }`}
                      >
                        {isCredit ? "+" : "-"}
                        {formatCurrencyFull(tx.amount)}
                      </td>
                      <td className="py-3 pl-3 text-right font-mono text-[10px]">
                        <span className="rounded border border-accent-border bg-accent-subtle px-2 py-0.5 font-semibold text-accent">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 flex items-center justify-end border-t border-border-subtle pt-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-btn-primary px-4 text-xs font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover"
          >
            Close Archive
          </button>
        </div>
      </div>
    </div>
  );
}
