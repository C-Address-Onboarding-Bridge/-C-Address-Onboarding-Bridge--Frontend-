"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowLeftRight, CreditCard, Building2, ExternalLink, Loader2 } from "lucide-react";
import type { BridgeTransactionData } from "@/lib/stellar";
import { getExplorerUrl } from "@/lib/stellar";

const typeConfig: Record<string, { icon: typeof ArrowLeftRight; label: string; color: string }> = {
  "g-to-c": { icon: ArrowLeftRight, label: "G → C Bridge", color: "text-[var(--primary-light)]" },
  fiat: { icon: CreditCard, label: "Fiat Onramp", color: "text-[var(--secondary)]" },
  cex: { icon: Building2, label: "CEX Withdrawal", color: "text-[var(--accent)]" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "text-[var(--warning)]" },
  confirmed: { label: "Confirmed", color: "text-[var(--success)]" },
  failed: { label: "Failed", color: "text-[var(--error)]" },
};

const ROW_HEIGHT = 73;
const OVERSCAN = 5;

interface Props {
  transactions: BridgeTransactionData[];
  loading: boolean;
  network: "PUBLIC" | "TESTNET" | "SANDBOX";
}

function TransactionRow({ tx, network }: { tx: BridgeTransactionData; network: "PUBLIC" | "TESTNET" | "SANDBOX" }) {
  const type = typeConfig[tx.type] || typeConfig["g-to-c"];
  const status = statusConfig[tx.status];
  const Icon = type.icon;
  return (
    <div className="p-4 hover:bg-[var(--surface-2)] transition-colors border-b border-[var(--border)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center flex-shrink-0">
            <Icon className={`w-4 h-4 ${type.color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">{type.label}</p>
            <p className="text-xs text-[var(--text-muted)] truncate max-w-[200px]">
              {tx.amount} {tx.asset} → {tx.toAddress}
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`text-xs font-medium ${status.color}`}>{status.label}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {new Date(tx.timestamp).toLocaleDateString()}
          </p>
          {tx.hash && (
            <a
              href={getExplorerUrl(network, "tx", tx.hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--primary-light)] hover:underline inline-flex items-center gap-0.5"
            >
              <ExternalLink className="w-3 h-3" />
              View
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TransactionHistory({ transactions, loading, network }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="p-5 border-b border-[var(--border)]">
        <h3 className="font-semibold">Recent Transactions</h3>
      </div>
      {loading ? (
        <div className="p-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-sm text-[var(--text-muted)]">No transactions found for this account.</p>
        </div>
      ) : (
        <div ref={parentRef} className="overflow-auto" style={{ maxHeight: ROW_HEIGHT * 10, contain: "strict" }}>
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => (
              <div
                key={transactions[virtualItem.index].id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <TransactionRow tx={transactions[virtualItem.index]} network={network} />
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="p-4 border-t border-[var(--border)]">
        <a
          href={`https://stellar.expert/explorer/${network === "PUBLIC" ? "public" : "testnet"}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
        >
          View all on Stellar Expert
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
