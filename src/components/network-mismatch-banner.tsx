"use client";

import { AlertTriangle } from "lucide-react";
import { useWallet } from "@/components/wallet-provider";

export function NetworkMismatchBanner() {
  const { isNetworkMismatched, walletNetwork, appNetwork, switchNetwork } = useWallet();

  if (!isNetworkMismatched) return null;

  const walletLabel = walletNetwork === "PUBLIC" ? "Mainnet" : "Testnet";
  const appLabel = appNetwork === "PUBLIC" ? "Mainnet" : "Testnet";

  return (
    <div className="w-full bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2 text-sm text-amber-300">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
        <span>
          Your wallet is connected to <strong>{walletLabel}</strong>, but this app is running on{" "}
          <strong>{appLabel}</strong>.
        </span>
      </div>
      <button
        onClick={() => switchNetwork(walletNetwork)}
        className="text-xs font-medium px-3 py-1.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 transition-colors whitespace-nowrap"
      >
        Switch to {walletLabel}
      </button>
    </div>
  );
}
