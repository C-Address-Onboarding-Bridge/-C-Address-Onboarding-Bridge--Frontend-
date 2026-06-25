"use client";

import { Wallet, HelpCircle } from "lucide-react";

function RestartTourButton() {
  const handleRestartTour = () => {
    localStorage.removeItem("hasSeenOnboardingTour");
    window.location.reload();
  };

  return (
    <button
      onClick={handleRestartTour}
      className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
    >
      <HelpCircle className="w-4 h-4" />
      Restart Tour
    </button>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-lg">C-Address Bridge</span>
            </div>
            <p className="text-sm text-[var(--text-muted)] max-w-md">
              The onboarding layer for Soroban dApps. Fund any C-address directly
              from a CEX, fiat onramp, or existing G-address.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Protocol</h3>
            <ul className="space-y-2">
              <li><a href="/bridge" className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)]">G → C Bridge</a></li>
              <li><a href="/onramp" className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)]">Fiat Onramp</a></li>
              <li><a href="/cex" className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)]">CEX Withdrawal</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Help & Support</h3>
            <ul className="space-y-2">
              <li><RestartTourButton /></li>
              <li><a href="https://soroban.stellar.org" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)]">Soroban Docs</a></li>
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)]">GitHub</a></li>
              <li><a href="https://stellar.org" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)]">Stellar</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-muted)]">
            Built for the Stellar Soroban ecosystem. Not financial advice.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[var(--text-muted)]">C-Address Bridge Protocol</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
