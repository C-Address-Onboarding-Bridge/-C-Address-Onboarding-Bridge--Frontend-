"use client";

import { ArrowLeftRight, CreditCard, Building2, ExternalLink } from "lucide-react";
import type { BridgeTransaction as BridgeTransactionData } from "@/lib/types";
import { getExplorerUrl } from "@/lib/stellar";
import { EXPLORER_BASE_URLS } from "@/lib/constants";
import { DataTable } from "@/components/data-table";
import { useLocale } from "@/components/locale-provider";
import { formatDate, formatDateTime, formatNumber, translate } from "@/lib/i18n";

const typeConfig: Record<string, { icon: typeof ArrowLeftRight; labelKey: string; color: string }> = {
  "g-to-c": { icon: ArrowLeftRight, labelKey: "history.typeG2C", color: "text-[var(--primary-light)]" },
  fiat: { icon: CreditCard, labelKey: "history.typeFiat", color: "text-[var(--secondary)]" },
  cex: { icon: Building2, labelKey: "history.typeCex", color: "text-[var(--accent)]" },
};

const statusConfig: Record<string, { labelKey: string; color: string }> = {
  pending: { labelKey: "history.statusPending", color: "text-[var(--warning)]" },
  confirmed: { labelKey: "history.statusConfirmed", color: "text-[var(--success)]" },
  failed: { labelKey: "history.statusFailed", color: "text-[var(--error)]" },
};

interface Props {
  transactions: BridgeTransactionData[];
  loading: boolean;
  network: "PUBLIC" | "TESTNET";
}

export default function TransactionHistory({ transactions, loading, network }: Props) {
  const { locale } = useLocale();

  const columns: Column<BridgeTransactionData>[] = [
    {
      key: "type",
      label: translate(locale, "history.type"),
      sortable: true,
      render: (value) => {
        const type = typeConfig[String(value)] || typeConfig["g-to-c"];
        const Icon = type.icon;
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center flex-shrink-0">
              <Icon className={`w-4 h-4 ${type.color}`} />
            </div>
            <span>{translate(locale, type.labelKey)}</span>
          </div>
        );
      },
    },
    {
      key: "asset",
      label: translate(locale, "history.asset"),
      sortable: true,
    },
    {
      key: "amount",
      label: translate(locale, "history.amount"),
      sortable: true,
      render: (value) => <span className="font-mono">{formatNumber(parseFloat(String(value)), locale, { minimumFractionDigits: 2, maximumFractionDigits: 7 })}</span>,
    },
    {
      key: "status",
      label: translate(locale, "history.status"),
      sortable: true,
      render: (value) => {
        const status = statusConfig[String(value)];
        return <span className={`font-medium ${status.color}`}>{translate(locale, status.labelKey)}</span>;
      },
    },
    {
      key: "timestamp",
      label: translate(locale, "history.date"),
      sortable: true,
      render: (value) => formatDate(String(value), locale),
    },
    {
      key: "hash",
      label: translate(locale, "history.explorer"),
      render: (value) =>
        value ? (
          <a
            href={getExplorerUrl(network, "tx", String(value))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[var(--primary-light)] hover:underline transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            {translate(locale, "history.view")}
          </a>
        ) : (
          <span className="text-[var(--text-muted)]">{translate(locale, "history.unknown")}</span>
        ),
    },
  ];

  return (
    <div>
      <div className="mb-4">
        <h3 className="font-semibold text-lg mb-1">{translate(locale, "history.title")}</h3>
        <p className="text-sm text-[var(--text-muted)]">{translate(locale, "history.subtitle")}</p>
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        keyExtractor={(tx) => tx.id}
        loading={loading}
        emptyMessage={translate(locale, "history.empty")}
        expandable
        renderExpanded={(tx) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[var(--text-muted)] text-xs mb-1">{translate(locale, "history.from")}</p>
              <p className="font-mono break-all text-xs">{tx.fromAddress}</p>
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-xs mb-1">{translate(locale, "history.to")}</p>
              <p className="font-mono break-all text-xs">{tx.toAddress}</p>
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-xs mb-1">{translate(locale, "history.hash")}</p>
              <p className="font-mono break-all text-xs">{tx.hash || "—"}</p>
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-xs mb-1">{translate(locale, "history.timestamp")}</p>
              <p className="text-xs">{formatDateTime(tx.timestamp, locale)}</p>
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
          {translate(locale, "history.viewAll")}
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
