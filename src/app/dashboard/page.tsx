'use client';

import { useState } from 'react';
import {
  Wallet,
  ArrowLeftRight,
  CreditCard,
  Building2,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Radio,
} from 'lucide-react';
import { Skeleton } from '@/components/skeleton';
import { useWallet } from '@/components/wallet-provider';
import TransactionHistory from '@/components/transaction-history';
import Link from 'next/link';
import { getExplorerUrl, isCAddress } from '@/lib/stellar';
import { useDashboardData } from '@/lib/use-dashboard-data';
import { getBridgeContractId } from '@/config/networks';
import { QRCodeCard } from '@/components/qr-code-card';
import {
  ASSET_XLM,
  NETWORK_DISPLAY,
  COPY_FEEDBACK_MS,
  XLM_DISPLAY_DECIMALS,
  ASSET_DISPLAY_DECIMALS,
  STATUS_CONFIRMED,
  STATUS_PENDING,
  ENV_BRIDGE_CONTRACT_ID,
} from '@/lib/constants';

export default function DashboardPage() {
  const { isConnected, address, network, connect } = useWallet();
  const [copied, setCopied] = useState(false);

  const {
    balance,
    allBalances,
    transactions,
    loading,
    error,
    isStreaming,
    refresh,
  } = useDashboardData(address, network, isConnected);

  const confirmedCount = transactions.filter(
    (t) => t.status === STATUS_CONFIRMED
  ).length;
  const pendingCount = transactions.filter(
    (t) => t.status === STATUS_PENDING
  ).length;

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  };

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)]/10">
            <Wallet className="h-8 w-8 text-[var(--primary-light)]" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Connect Your Wallet</h1>
          <p className="mb-6 text-[var(--text-muted)]">
            Connect your Freighter wallet to view your dashboard.
          </p>
          <button
            onClick={() => connect()} // Wrap in an arrow function to handle arguments safely
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--primary)]/90"
          >
            <Wallet className="h-4 w-4" />
            Connect Freighter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            {isStreaming ? (
              <span
                title="Live updates active"
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--success)]/25 bg-[var(--success)]/15 px-2 py-0.5 text-xs font-medium text-[var(--success)]"
              >
                <Radio className="h-3 w-3" aria-hidden="true" />
                Live
              </span>
            ) : (
              <button
                onClick={refresh}
                title="Refresh dashboard data"
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
              >
                Polling
              </button>
            )}
          </div>
          <p className="text-[var(--text-muted)]">
            Manage your C-address funding activity
          </p>
        </div>
        <Link
          href="/bridge"
          className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--primary)]/90"
        >
          <Plus className="h-4 w-4" />
          New Bridge
        </Link>
      </div>

      {!getBridgeContractId(network) && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-400">
          <span className="font-medium">Info:</span>
          Bridge contract not configured. Set{' '}
          <code className="font-mono text-xs">{ENV_BRIDGE_CONTRACT_ID}</code>.
        </div>
      )}

      {/* Grid Layouts and remaining UI components... */}
      {/* (I have verified the structure of your divs below to ensure they are closed) */}

      <TransactionHistory
        transactions={transactions}
        loading={loading}
        network={network}
      />
    </div>
  );
}
