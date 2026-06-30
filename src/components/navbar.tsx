"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, ArrowLeftRight, CreditCard, Building2, LayoutDashboard, Menu, X } from "lucide-react";
import { useState } from "react";
import { useWallet } from "./wallet-provider";
import { ThemeToggle } from "./theme-toggle";
import { useEscapeKey } from "@/hooks/use-keyboard-shortcuts";
import { FocusTrap } from "./focus-trap";

const navLinks = [
  { href: "/bridge", label: "Bridge", icon: ArrowLeftRight },
  { href: "/onramp", label: "Onramp", icon: CreditCard },
  { href: "/cex", label: "CEX", icon: Building2 },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
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
    <>
      {/* Skip link for keyboard users */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl"
        aria-label="Primary navigation"
        role="navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] rounded-lg"
              aria-label="C-Address Bridge - Home"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center" aria-hidden="true">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-lg">C-Address Bridge</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1" role="menubar">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] ${
                      isActive
                        ? "bg-[var(--primary)]/10 text-[var(--primary-light)]"
                        : "text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              {isConnected ? (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] bounce-in">
                  <div className="w-2 h-2 rounded-full bg-[var(--success)] pulse-glow" aria-hidden="true" />
                  <span className="text-xs font-mono text-[var(--text-muted)]" aria-label={`Connected wallet address: ${address}`}>
                    {address?.slice(0, 4)}...{address?.slice(-4)}
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleConnectClick}
                  disabled={isConnecting}
                  aria-label="Connect wallet"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                >
                  <Wallet className="w-4 h-4" aria-hidden="true" />
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </button>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
              >
                {mobileOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[var(--border)] bg-[var(--background)]" id="mobile-menu" role="menu" aria-label="Mobile navigation">
            <FocusTrap active={mobileOpen} onClose={() => setMobileOpen(false)}>
              <div className="px-4 py-3 space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      onClick={() => setMobileOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] ${
                        isActive
                          ? "bg-[var(--primary)]/10 text-[var(--primary-light)]"
                          : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      {link.label}
                    </Link>
                  );
                })}
                {!isConnected && (
                  <button
                    onClick={() => { setWalletModalOpen(true); setMobileOpen(false); }}
                    disabled={isConnecting}
                    aria-label="Connect wallet"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                  >
                    <Wallet className="w-4 h-4" aria-hidden="true" />
                    {isConnecting ? "Connecting..." : "Connect Wallet"}
                  </button>
                )}
                {isConnected && (
                  <button
                    onClick={() => { setWalletModalOpen(true); setMobileOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[var(--surface-2)] text-[var(--foreground)] text-sm font-medium border border-[var(--border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                    aria-label={`Connected wallet: ${address}`}
                  >
                    <div className="w-2 h-2 rounded-full bg-[var(--success)]" aria-hidden="true" />
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
          onConnect={connect}
          connectedAddress={address}
          network={network}
          isConnecting={isConnecting}
        />
      </nav>
    </>
  );
}