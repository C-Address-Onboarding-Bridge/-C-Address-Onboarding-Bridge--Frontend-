'use client';

import { useEffect, useState } from 'react';
import { X, Download, CheckCircle } from 'lucide-react';
import { FocusTrap } from './focus-trap';

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
  network?: 'PUBLIC' | 'TESTNET';
  isConnecting?: boolean;
}

const WALLETS: Wallet[] = [
  {
    name: 'Freighter',
    id: 'freighter',
    isInstalled: false,
    installUrl: 'https://freighter.app',
    icon: '🔐',
  },
  {
    name: 'Lobstr',
    id: 'lobstr',
    isInstalled: false,
    installUrl: 'https://lobstr.co',
    icon: '🔑',
  },
];

declare global {
  interface Window {
    freighter: any;
  }
}

export default function WalletModal({
  isOpen,
  onClose,
  onConnect,
  connectedAddress,
  network = 'TESTNET',
  isConnecting = false,
}: WalletModalProps) {
  const [wallets, setWallets] = useState<Wallet[]>(WALLETS);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const checkInstalledWallets = async () => {
      const updated = [...WALLETS];
      try {
        const freighterInstalled =
          typeof window !== 'undefined' && 'freighter' in window;
        // Add a safety check: make sure updated[0] exists
        if (freighterInstalled && updated[0]) {
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
    <div className="animate-in fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="animate-in zoom-in-95 relative mx-4 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-2xl duration-200">
        <FocusTrap active={isOpen} onClose={onClose}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-6 sm:p-8">
            <h2 className="mb-2 text-2xl font-bold">Connect Wallet</h2>
            <p className="mb-6 text-[var(--text-muted)]">
              Select a wallet to connect to the C-Address Bridge
            </p>

            {connectedAddress && (
              <div className="mb-6 rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/10 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--success)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--success)]">
                      Connected
                    </p>
                    <p className="mt-1 font-mono text-xs break-all text-[var(--text-muted)]">
                      {connectedAddress}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Network: <span className="font-medium">{network}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6 space-y-3">
              {wallets.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => handleConnect(wallet.id)}
                  disabled={!wallet.isInstalled || connecting || isConnecting}
                  className={`flex w-full items-center justify-between rounded-lg border p-4 transition-all ${
                    wallet.isInstalled
                      ? 'cursor-pointer border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--primary)] hover:bg-[var(--surface-3)]'
                      : 'border-[var(--border)]/50 bg-[var(--surface-2)]/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{wallet.icon}</span>
                    <div className="text-left">
                      <p className="font-medium text-[var(--foreground)]">
                        {wallet.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {wallet.isInstalled ? 'Installed' : 'Not installed'}
                      </p>
                    </div>
                  </div>
                  {wallet.isInstalled ? (
                    <div className="h-2 w-2 rounded-full bg-[var(--success)]" />
                  ) : (
                    <Download className="h-4 w-4 text-[var(--text-muted)]" />
                  )}
                </button>
              ))}
            </div>

            {!wallets.some((w) => w.isInstalled) && (
              <div className="mb-6 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/10 p-4">
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
                      className="flex items-center gap-2 text-sm text-[var(--primary)] transition-colors hover:text-[var(--primary-light)]"
                    >
                      <Download className="h-4 w-4" />
                      Download {wallet.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full rounded-lg bg-[var(--surface-2)] px-4 py-2 text-center text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-3)]"
            >
              Close
            </button>
          </div>
        </FocusTrap>
      </div>
    </div>
  );
}
