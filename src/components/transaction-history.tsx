"use client";

import { ArrowLeftRight, CreditCard, Building2, ExternalLink } from "lucide-react";
import { type BridgeTransaction as BridgeTransactionData, getExplorerUrl, EXPLORER_BASE_URLS } from "@/lib";

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

interface Props {
  transactions: BridgeTransactionData[];
  loading: boolean;
  network: "PUBLIC" | "TESTNET";
}

export default function TransactionHistory({ transactions, loading, network }: Props) {
  const columns: Column<BridgeTransactionData>[] = [
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (value) => {
        const type = typeConfig[String(value)] || typeConfig["g-to-c"];
        const Icon = type.icon;
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center flex-shrink-0">
              <Icon className={`w-4 h-4 ${type.color}`} />
            </div>
            <span>{type.label}</span>
          </div>
        );
      },
    },
    {
      key: "asset",
      label: "Asset",
      sortable: true,
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (value) => <span className="font-mono">{value}</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value) => {
        const status = statusConfig[String(value)];
        return <span className={`font-medium ${status.color}`}>{status.label}</span>;
      },
    },
    {
      key: "timestamp",
      label: "Date",
      sortable: true,
      render: (value) => new Date(String(value)).toLocaleDateString(),
    },
    {
      key: "hash",
      label: "Explorer",
      render: (value) =>
        value ? (
          <a
            href={getExplorerUrl(network, "tx", String(value))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[var(--primary-light)] hover:underline transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View
          </a>
        ) : (
          <span className="text-[var(--text-muted)]">—</span>
        ),
    },
  ];

  return (
    <div>
      <div className="mb-4">
        <h3 className="font-semibold text-lg mb-1">Recent Transactions</h3>
        <p className="text-sm text-[var(--text-muted)]">View and manage your transaction history</p>
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        keyExtractor={(tx) => tx.id}
        loading={loading}
        emptyMessage="No transactions found for this account."
        expandable
        renderExpanded={(tx) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[var(--text-muted)] text-xs mb-1">FROM</p>
              <p className="font-mono break-all text-xs">{tx.fromAddress}</p>
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-xs mb-1">TO</p>
              <p className="font-mono break-all text-xs">{tx.toAddress}</p>
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-xs mb-1">TRANSACTION HASH</p>
              <p className="font-mono break-all text-xs">{tx.hash || "—"}</p>
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-xs mb-1">TIMESTAMP</p>
              <p className="text-xs">{new Date(tx.timestamp).toLocaleString()}</p>
            </div>
          </div>
        )}
      />

      <div className="mt-6 p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
        <a
          href={EXPLORER_BASE_URLS[network]}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-[var(--primary-light)] hover:text-[var(--primary)] transition-colors font-medium"
        >
          View all transactions on Stellar Expert
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
