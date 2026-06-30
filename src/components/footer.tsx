'use client';

import { Wallet, HelpCircle } from 'lucide-react';

function RestartTourButton() {
  const handleRestartTour = () => {
    localStorage.removeItem('hasSeenOnboardingTour');
    window.location.reload();
  };

  return (
    <button
      onClick={handleRestartTour}
      className="flex items-center gap-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]"
    >
      <HelpCircle className="h-4 w-4" />
      Restart Tour
    </button>
  );
}

export default function Footer() {
  return (
    <footer
      className="border-t border-[var(--border)] bg-[var(--surface)]"
      aria-label="Site footer"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)]">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-semibold">C-Address Bridge</span>
            </div>
            <p className="max-w-md text-sm text-[var(--text-muted)]">
              The onboarding layer for Soroban dApps. Fund any C-address
              directly from a CEX, fiat onramp, or existing G-address.
            </p>
          </div>

          <nav aria-label="Protocol links">
            <h3 className="mb-3 text-sm font-semibold">Protocol</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/bridge"
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)]"
                >
                  G → C Bridge
                </a>
              </li>
              <li>
                <a
                  href="/onramp"
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)]"
                >
                  Fiat Onramp
                </a>
              </li>
              <li>
                <a
                  href="/cex"
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)]"
                >
                  CEX Withdrawal
                </a>
              </li>
            </ul>
          </nav>

          <nav>
            <h3 className="mb-3 text-sm font-semibold">Help & Support</h3>
            <ul className="space-y-2">
              <li>
                <RestartTourButton />
              </li>
              <li>
                <a
                  href="https://soroban.stellar.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)]"
                >
                  Soroban Docs
                </a>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)]"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://stellar.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)]"
                >
                  Stellar
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-8 sm:flex-row">
          <p className="text-xs text-[var(--text-muted)]">
            Built for the Stellar Soroban ecosystem. Not financial advice.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[var(--text-muted)]">
              C-Address Bridge Protocol
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
