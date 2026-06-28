"use client";

import { useState, useEffect } from "react";
import { Wallet, ArrowLeftRight, CreditCard, Building2, Copy, Check, ExternalLink, Plus, Radio } from "lucide-react";
import { Skeleton } from "@/components/skeleton";
import { useWallet } from "@/components/wallet-provider";
import TransactionHistory from "@/components/transaction-history";
import Link from "next/link";
import { getExplorerUrl, isCAddress } from "@/lib/stellar";
import { useDashboardData } from "@/lib/use-dashboard-data";
import { getBridgeContractId } from "@/config/networks";
import { QRCodeCard } from "@/components/qr-code-card";
import {
  getAccountBalances,
  fetchRecentTransactions,
  getSorobanAccountBalances,
  type BridgeTransaction,
  ASSET_XLM,
  NETWORK_DISPLAY,
  COPY_FEEDBACK_MS,
  XLM_DISPLAY_DECIMALS,
  ASSET_DISPLAY_DECIMALS,
  STATUS_CONFIRMED,
  STATUS_PENDING,
  ENV_BRIDGE_CONTRACT_ID,
} from "@/lib/constants";

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

  const confirmedCount = transactions.filter((t) => t.status === STATUS_CONFIRMED).length;
  const pendingCount = transactions.filter((t) => t.status === STATUS_PENDING).length;

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-[var(--primary-light)]" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Connect Your Wallet</h1>
          <p className="text-[var(--text-muted)] mb-6">
            Connect your Freighter wallet to view your dashboard.
          </p>
          <button
            onClick={connect}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary)]/90 transition-colors"
          >
            <Wallet className="w-4 h-4" />
            Connect Freighter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            {isStreaming ? (
              <span
                title="Live updates active"
                className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/25"
              >
                <Radio className="w-3 h-3" aria-hidden="true" />
                Live
              </span>
            ) : (
              <button
                onClick={refresh}
                title="Refresh dashboard data"
                className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text)] transition-colors"
              >
                Polling
              </button>
            )}
          </div>
          <p className="text-[var(--text-muted)]">Manage your C-address funding activity</p>
        </div>
        <Link
          href="/bridge"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary)]/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Bridge
        </Link>
      </div>

      {!getBridgeContractId(network) && (
        <div className="mb-6 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400 flex items-center gap-2">
          <span className="font-medium">Info:</span>
          Bridge contract not configured — bridge transactions will use direct payment.
          Set <code className="font-mono text-xs">{ENV_BRIDGE_CONTRACT_ID}</code> to enable the smart contract.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 card-entrance">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-[var(--primary-light)]" />
            <span className="text-xs text-[var(--text-muted)]">Connected Address</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono">
              {address?.slice(0, 8)}...{address?.slice(-8)}
            </code>
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-[var(--surface-2)] transition-colors"
              aria-label="Copy address"
            >
              {copied ? (
                <Check className="w-3 h-3 text-[var(--success)]" />
              ) : (
                <Copy className="w-3 h-3 text-[var(--text-muted)]" />
              )}
            </button>
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">
            {NETWORK_DISPLAY[network]}
            {address && (
              <a
                href={getExplorerUrl(network, "account", address)}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-[var(--primary-light)] hover:underline inline-flex items-center gap-0.5"
              >
                <ExternalLink className="w-3 h-3" />
                View
              </a>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="text-xs text-[var(--text-muted)] mb-1">{ASSET_XLM} Balance</div>
          {loading ? (
            <div className="space-y-2 mt-1">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-3 w-8" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold mb-1">
                {balance !== null ? parseFloat(balance).toFixed(XLM_DISPLAY_DECIMALS) : "—"}
              </div>
              <div className="text-xs text-[var(--text-muted)]">{ASSET_XLM}</div>
            </>
          )}
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 card-entrance">
          <div className="text-xs text-[var(--text-muted)] mb-1">Transactions</div>
          {loading ? (
            <div className="space-y-2 mt-1">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-28" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold mb-1">{transactions.length}</div>
              <div className="text-xs text-[var(--text-muted)]">
                {confirmedCount} confirmed{pendingCount > 0 ? `, ${pendingCount} pending` : ""}
              </div>
            </>
          )}
        </div>
      </div>

      {isCAddress(address ?? "") && address ? (
        <div className="mb-8">
          <QRCodeCard address={address} />
        </div>
      ) : null}

      {allBalances.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 mb-6 card-entrance">
          <h3 className="text-sm font-semibold mb-3">Token Balances</h3>
          <div className="divide-y divide-[var(--border)]">
            {allBalances.map((b) => (
              <div
                key={b.asset}
                className="flex justify-between items-center py-2 first:pt-0 last:pb-0"
              >
                <span className="text-sm text-[var(--text-muted)]">{b.asset}</span>
                <span className="text-sm font-mono">
                  {parseFloat(b.amount).toFixed(
                    b.asset === ASSET_XLM ? XLM_DISPLAY_DECIMALS : ASSET_DISPLAY_DECIMALS
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Link
          href="/bridge"
          className="feature-card flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]"
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5 text-[var(--primary-light)]" />
          </div>
          <div>
            <p className="text-sm font-medium">G → C Bridge</p>
            <p className="text-xs text-[var(--text-muted)]">Fund from G-address</p>
          </div>
        </Link>

        <Link
          href="/onramp"
          className="feature-card flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]"
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--secondary)]/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-[var(--secondary)]" />
          </div>
          <div>
            <p className="text-sm font-medium">Fiat Onramp</p>
            <p className="text-xs text-[var(--text-muted)]">Buy with card</p>
          </div>
        </Link>

        <Link
          href="/cex"
          className="feature-card flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]"
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div>
            <p className="text-sm font-medium">CEX Withdrawal</p>
            <p className="text-xs text-[var(--text-muted)]">Route exchange funds</p>
          </div>
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20 text-sm text-[var(--error)]">
          {error}
        </div>
      )}

      <TransactionHistory transactions={transactions} loading={loading} network={network} />
    </div>
  );
}
