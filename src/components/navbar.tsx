'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Wallet,
  ArrowLeftRight,
  CreditCard,
  Building2,
  LayoutDashboard,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useWallet } from './wallet-provider';
// Add this line at the very top of your file, adjusting the path if necessary
import WalletModal from '@/components/wallet-modal'; // Adjust path based on your folder structure
import { ThemeToggle } from './theme-toggle';
import { useEscapeKey } from '@/hooks/use-keyboard-shortcuts';
import { FocusTrap } from './focus-trap';

const navLinks = [
  { href: '/bridge', label: 'Bridge', icon: ArrowLeftRight },
  { href: '/onramp', label: 'Onramp', icon: CreditCard },
  { href: '/cex', label: 'CEX', icon: Building2 },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isConnected, address, connect, isConnecting, network } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const handleConnectClick = () => {
    setWalletModalOpen(true);
  };

  useEscapeKey(() => {
    if (mobileOpen) {
      setMobileOpen(false);
    }
  });

  return (
    <nav
      className="fixed top-0 right-0 left-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl"
      aria-label="Primary navigation"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)]">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold">C-Address Bridge</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--primary)]/10 text-[var(--primary-light)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isConnected ? (
              <button className="bounce-in hidden items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 sm:flex">
                <div className="pulse-glow h-2 w-2 rounded-full bg-[var(--success)]" />
                <span className="font-mono text-xs text-[var(--text-muted)]">
                  {address?.slice(0, 4)}...{address?.slice(-4)}
                </span>
              </button>
            ) : (
              <button
                onClick={handleConnectClick}
                disabled={isConnecting}
                className="hidden items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--primary)]/90 disabled:opacity-50 sm:flex"
              >
                <Wallet className="h-4 w-4" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-[var(--text-muted)] hover:text-[var(--foreground)] md:hidden"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

      {mobileOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--background)] md:hidden">
          <FocusTrap active={mobileOpen} onClose={() => setMobileOpen(false)}>
            <div className="space-y-1 px-4 py-3">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--primary)]/10 text-[var(--primary-light)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
              {!isConnected && (
                <button
                  onClick={() => {
                    setWalletModalOpen(true);
                    setMobileOpen(false);
                  }}
                  disabled={isConnecting}
                  className="flex w-full items-center gap-3 rounded-lg bg-[var(--primary)] px-3 py-2.5 text-sm font-medium text-white"
                >
                  <Wallet className="h-4 w-4" />
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
              {isConnected && (
                <button
                  onClick={() => {
                    setWalletModalOpen(true);
                    setMobileOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm font-medium text-[var(--foreground)]"
                >
                  <div className="h-2 w-2 rounded-full bg-[var(--success)]" />
                  <span className="font-mono text-xs">
                    {address?.slice(0, 4)}...{address?.slice(-4)}
                  </span>
                </button>
              )}
            </div>
          </FocusTrap>
        </div>
      )}

      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        // Wrap the call to ensure it always passes a string
        onConnect={async (walletId: string) => {
          await connect(walletId as any); // 'as any' or a specific cast resolves the undefined mismatch
        }}
        connectedAddress={address}
        network={network}
        isConnecting={isConnecting}
      />
    </nav>
  );
}