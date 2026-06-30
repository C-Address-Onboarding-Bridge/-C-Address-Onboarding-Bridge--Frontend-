'use client';

import {
  ArrowLeftRight,
  CreditCard,
  Building2,
  ExternalLink,
} from 'lucide-react';
import {
  type BridgeTransaction as BridgeTransactionData,
  getExplorerUrl,
  EXPLORER_BASE_URLS,
} from '@/lib';

const typeConfig: Record<
  string,
  { icon: typeof ArrowLeftRight; label: string; color: string }
> = {
  'g-to-c': {
    icon: ArrowLeftRight,
    label: 'G → C Bridge',
    color: 'text-[var(--primary-light)]',
  },
  fiat: {
    icon: CreditCard,
    label: 'Fiat Onramp',
    color: 'text-[var(--secondary)]',
  },
  cex: {
    icon: Building2,
    label: 'CEX Withdrawal',
    color: 'text-[var(--accent)]',
  },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-[var(--warning)]' },
  confirmed: { label: 'Confirmed', color: 'text-[var(--success)]' },
  failed: { label: 'Failed', color: 'text-[var(--error)]' },
};

const ROW_HEIGHT = 73;
const OVERSCAN = 5;

interface Props {
  transactions: BridgeTransactionData[];
  loading: boolean;
  network: 'PUBLIC' | 'TESTNET';
}

export default function TransactionHistory({
  transactions,
  loading,
  network,
}: Props) {
  const columns: Column<BridgeTransactionData>[] = [
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value) => {
        const type = typeConfig[String(value)] || typeConfig['g-to-c'];
        const Icon = type.icon;
        return (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)]">
              <Icon className={`h-4 w-4 ${type.color}`} />
            </div>
            <span>{type.label}</span>
          </div>
        );
      },
    },
    {
      key: 'asset',
      label: 'Asset',
      sortable: true,
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value) => <span className="font-mono">{value}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const status = statusConfig[String(value)];
        return (
          <span className={`font-medium ${status.color}`}>{status.label}</span>
        );
      },
    },
    {
      key: 'timestamp',
      label: 'Date',
      sortable: true,
      render: (value) => new Date(String(value)).toLocaleDateString(),
    },
    {
      key: 'hash',
      label: 'Explorer',
      render: (value) =>
        value ? (
          <a
            href={getExplorerUrl(network, 'tx', String(value))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[var(--primary-light)] transition-colors hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
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
        <h3 className="mb-1 text-lg font-semibold">Recent Transactions</h3>
        <p className="text-sm text-[var(--text-muted)]">
          View and manage your transaction history
        </p>
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        keyExtractor={(tx) => tx.id}
        loading={loading}
        emptyMessage="No transactions found for this account."
        expandable
        renderExpanded={(tx) => (
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs text-[var(--text-muted)]">FROM</p>
              <p className="font-mono text-xs break-all">{tx.fromAddress}</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-[var(--text-muted)]">TO</p>
              <p className="font-mono text-xs break-all">{tx.toAddress}</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-[var(--text-muted)]">
                TRANSACTION HASH
              </p>
              <p className="font-mono text-xs break-all">{tx.hash || '—'}</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-[var(--text-muted)]">TIMESTAMP</p>
              <p className="text-xs">
                {new Date(tx.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      />

      <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4">
        <a
          href={EXPLORER_BASE_URLS[network]}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm font-medium text-[var(--primary-light)] transition-colors hover:text-[var(--primary)]"
        >
          View all transactions on Stellar Expert
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
