"use client";

import { useEffect, useState } from "react";
import { X, Download, CheckCircle } from "lucide-react";

interface Wallet {
  name: string;
  id: string;
  isInstalled: boolean;
  installUrl: string;
  icon: string;
}

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (walletId: string) => Promise<void>;
  connectedAddress?: string | null;
  network?: "PUBLIC" | "TESTNET";
  isConnecting?: boolean;
}

const WALLETS: Wallet[] = [
  {
    name: "Freighter",
    id: "freighter",
    isInstalled: false,
    installUrl: "https://freighter.app",
    icon: "🔐",
  },
  {
    name: "Lobstr",
    id: "lobstr",
    isInstalled: false,
    installUrl: "https://lobstr.co",
    icon: "🔑",
  },
];

export default function WalletModal({
  isOpen,
  onClose,
  onConnect,
  connectedAddress,
  network = "TESTNET",
  isConnecting = false,
}: WalletModalProps) {
  const [wallets, setWallets] = useState<Wallet[]>(WALLETS);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const checkInstalledWallets = async () => {
      const updated = [...WALLETS];
      try {
        const freighterInstalled = window && "freighter" in window;
        if (freighterInstalled) {
          updated[0].isInstalled = true;
        }
      } catch {
        // Freighter check failed
      }
      setWallets(updated);
    };

    if (isOpen) {
      checkInstalledWallets();
    }
  }, [isOpen]);

  const handleConnect = async (walletId: string) => {
    setConnecting(true);
    try {
      await onConnect(walletId);
    } finally {
      setConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md mx-4 bg-[var(--background)] rounded-xl border border-[var(--border)] shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold mb-2">Connect Wallet</h2>
          <p className="text-[var(--text-muted)] mb-6">
            Select a wallet to connect to the C-Address Bridge
          </p>

          {connectedAddress && (
            <div className="mb-6 p-4 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/30">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[var(--success)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[var(--success)]">Connected</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1 font-mono break-all">
                    {connectedAddress}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Network: <span className="font-medium">{network}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 mb-6">
            {wallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleConnect(wallet.id)}
                disabled={!wallet.isInstalled || connecting || isConnecting}
                className={`w-full p-4 rounded-lg border transition-all flex items-center justify-between ${
                  wallet.isInstalled
                    ? "border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] hover:border-[var(--primary)] cursor-pointer"
                    : "border-[var(--border)]/50 bg-[var(--surface-2)]/50 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{wallet.icon}</span>
                  <div className="text-left">
                    <p className="font-medium text-[var(--foreground)]">{wallet.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {wallet.isInstalled ? "Installed" : "Not installed"}
                    </p>
                  </div>
                </div>
                {wallet.isInstalled ? (
                  <div className="w-2 h-2 rounded-full bg-[var(--success)]" />
                ) : (
                  <Download className="w-4 h-4 text-[var(--text-muted)]" />
                )}
              </button>
            ))}
          </div>

          {!wallets.some((w) => w.isInstalled) && (
            <div className="p-4 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/30 mb-6">
              <p className="text-sm text-[var(--text-muted)]">
                No wallet detected. Install one to get started:
              </p>
              <div className="mt-3 space-y-2">
                {wallets.map((wallet) => (
                  <a
                    key={wallet.id}
                    href={wallet.installUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download {wallet.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg text-center text-sm font-medium bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[var(--surface-3)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
