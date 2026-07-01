"use client";

import React, { memo, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, ArrowLeftRight, CreditCard, Building2, LayoutDashboard, Menu, X } from "lucide-react";
import { useWallet } from "./wallet-provider";

const navLinks = [
  { href: "/bridge", label: "Bridge", icon: ArrowLeftRight },
  { href: "/onramp", label: "Onramp", icon: CreditCard },
  { href: "/cex", label: "CEX", icon: Building2 },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const Navbar = () => {
  const pathname = usePathname();
  const { isConnected, address, connect, isConnecting } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const handleConnect = useCallback(() => connect(), [connect]);
  const handleMobileConnect = useCallback(() => {
    connect();
    setMobileOpen(false);
  }, [connect]);

  const addressDisplay = useMemo(() => (address ? `${address.slice(0, 4)}...${address.slice(-4)}` : null), [address]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
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
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--primary)]/10 text-[var(--primary-light)]"
                      : "text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <div className="w-2 h-2 rounded-full bg-[var(--success)]" />
                <span className="text-xs font-mono text-[var(--text-muted)]">{addressDisplay}</span>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}

            <button onClick={toggleMobile} className="md:hidden p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)]">
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
                  href={link.href}
                  onClick={closeMobile}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--primary)]/10 text-[var(--primary-light)]"
                      : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
            {!isConnected && (
              <button
                onClick={handleMobileConnect}
                disabled={isConnecting}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm font-medium"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default memo(Navbar);
