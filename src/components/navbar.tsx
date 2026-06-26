"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, ArrowLeftRight, CreditCard, Building2, LayoutDashboard, Menu, X } from "lucide-react";
import { useState } from "react";
import { useWallet } from "./wallet-provider";
import { ThemeToggle } from "./theme-toggle";
import WalletModal from "./wallet-modal";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useEscapeKey } from "@/hooks/use-keyboard-shortcuts";
import { useLocale } from "@/components/locale-provider";
import { getLocalizedPath, translate } from "@/lib/i18n";

const navLinks = [
  { href: "/bridge", key: "nav.bridge", icon: ArrowLeftRight },
  { href: "/onramp", key: "nav.onramp", icon: CreditCard },
  { href: "/cex", key: "nav.cex", icon: Building2 },
  { href: "/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
];

export default function Navbar() {
  const pathname = usePathname();
  const { locale } = useLocale();
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
      className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl"
      aria-label="Primary navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href={getLocalizedPath("/", locale)} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg">C-Address Bridge</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={getLocalizedPath(link.href, locale)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--primary)]/10 text-[var(--primary-light)]"
                      : "text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {translate(locale, link.key)}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
            {isConnected ? (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] bounce-in">
                <div className="w-2 h-2 rounded-full bg-[var(--success)] pulse-glow" />
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  {address?.slice(0, 4)}...{address?.slice(-4)}
                </span>
              </div>
            ) : (
              <button
                onClick={handleConnectClick}
                disabled={isConnecting}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? translate(locale, "nav.connecting") : translate(locale, "nav.connectWallet")}
              </button>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)]"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--background)]">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={getLocalizedPath(link.href, locale)}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--primary)]/10 text-[var(--primary-light)]"
                      : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {translate(locale, link.key)}
                </Link>
              );
            })}
            {!isConnected && (
              <button
                onClick={() => { setWalletModalOpen(true); setMobileOpen(false); }}
                disabled={isConnecting}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm font-medium"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? translate(locale, "nav.connecting") : translate(locale, "nav.connectWallet")}
              </button>
            )}
            {isConnected && (
              <button
                onClick={() => { setWalletModalOpen(true); setMobileOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[var(--surface-2)] text-[var(--foreground)] text-sm font-medium border border-[var(--border)]"
              >
                <div className="w-2 h-2 rounded-full bg-[var(--success)]" />
                <span className="font-mono text-xs">
                  {address?.slice(0, 4)}...{address?.slice(-4)}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        onConnect={connect}
        connectedAddress={address}
        network={network}
        isConnecting={isConnecting}
      />
    </nav>
  );
}
