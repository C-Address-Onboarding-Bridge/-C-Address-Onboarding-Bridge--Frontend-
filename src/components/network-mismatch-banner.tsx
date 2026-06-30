'use client';

import { AlertTriangle } from 'lucide-react';
import { useWallet } from '@/components/wallet-provider';

export function NetworkMismatchBanner() {
  const { isNetworkMismatched, walletNetwork, appNetwork, switchNetwork } =
    useWallet();

  if (!isNetworkMismatched) return null;

  const walletLabel = walletNetwork === 'PUBLIC' ? 'Mainnet' : 'Testnet';
  const appLabel = appNetwork === 'PUBLIC' ? 'Mainnet' : 'Testnet';

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-4 border-b border-amber-500/30 bg-amber-500/15 px-4 py-2.5">
      <div className="flex items-center gap-2 text-sm text-amber-300">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-400" />
        <span>
          Your wallet is connected to <strong>{walletLabel}</strong>, but this
          app is running on <strong>{appLabel}</strong>.
        </span>
      </div>
      <button
        onClick={() => switchNetwork(walletNetwork)}
        className="rounded-md border border-amber-500/30 bg-amber-500/20 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-amber-200 transition-colors hover:bg-amber-500/30"
      >
        Switch to {walletLabel}
      </button>
    </div>
  );
}
