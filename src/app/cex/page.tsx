'use client';

import { useState } from 'react';
import {
  Building2,
  Copy,
  Check,
  ExternalLink,
  Wallet,
  Info,
} from 'lucide-react';
import {
  CEX_LIST,
  DEFAULT_BRIDGE_ADDRESS,
  DEFAULT_BRIDGE_MEMO,
  CEX_NETWORKS,
  CEX_NETWORK_STELLAR,
  COPY_FEEDBACK_MS,
} from '@/lib';
import { validateCAddress } from '@/utils/validation';

export default function CexPage() {
  const [selectedCex, setSelectedCex] = useState(CEX_LIST[0]);
  const [selectedNetwork, setSelectedNetwork] =
    useState<string>(CEX_NETWORK_STELLAR);
  const [cAddress, setCAddress] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), COPY_FEEDBACK_MS);
  };

  const withdrawalUrl = selectedCex.withdrawalUrl;
  const cAddressError = validateCAddress(cAddress);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">CEX Withdrawal Routing</h1>
        <p className="text-[var(--text-muted)]">
          Route your centralized exchange withdrawals directly to a Soroban
          C-address.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="mb-4 font-semibold">1. Select Your Exchange</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {CEX_LIST.map((cex) => (
                <button
                  key={cex.name}
                  onClick={() => setSelectedCex(cex)}
                  className={`rounded-lg border p-4 text-left transition-all ${
                    selectedCex.name === cex.name
                      ? 'cex-logo selected scale-105 transform border-[var(--primary)] bg-[var(--primary)]/5'
                      : 'cex-logo border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <Building2 className="mb-2 h-8 w-8 text-[var(--text-muted)]" />
                  <div className="text-sm font-medium">{cex.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Min: {cex.minWithdrawal}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="mb-4 font-semibold">2. Choose Withdrawal Network</h3>
            <div className="flex flex-wrap gap-2">
              {CEX_NETWORKS.map((net) => (
                <button
                  key={net}
                  onClick={() => setSelectedNetwork(net)}
                  className={`rounded-lg border px-4 py-2 text-sm transition-all ${
                    selectedNetwork === net
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary-light)]'
                      : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {net}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="mb-4 font-semibold">3. Enter Your C-Address</h3>
            <p className="mb-3 text-xs text-[var(--text-muted)]">
              This is the Soroban smart account address you want to fund. It
              will be linked to your deposit via the bridge memo.
            </p>
            <div className="relative">
              <Wallet className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                id="cex-c-address"
                value={cAddress}
                onChange={(e) => setCAddress(e.target.value)}
                placeholder="CABC...DEF"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] py-3 pr-4 pl-10 font-mono text-sm transition-colors focus:border-[var(--primary)] focus:outline-none"
                aria-describedby="cex-c-address-error"
                aria-invalid={!!cAddressError && !!cAddress}
              />
            </div>
            {cAddressError && cAddress && (
              <p
                id="cex-c-address-error"
                role="alert"
                className="mt-1 text-xs text-[var(--error)]"
              >
                {cAddressError}
              </p>
            )}
          </div>

          {cAddress && !cAddressError && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <h3 className="mb-4 font-semibold">
                4. Verify Bridge Address Access
              </h3>
              <CEXAddressVerification onVerified={() => {}} />
            </div>
          )}

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="mb-4 font-semibold">
              5. Withdrawal Details for {selectedCex.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-[var(--text-muted)]">
                  Bridge Deposit Address
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 font-mono text-xs break-all">
                    {DEFAULT_BRIDGE_ADDRESS}
                  </code>
                  <button
                    onClick={() =>
                      handleCopy(DEFAULT_BRIDGE_ADDRESS, 'address')
                    }
                    className="interactive-element rounded-lg border border-[var(--border)] p-3 transition-colors hover:bg-[var(--surface-2)]"
                  >
                    {copiedField === 'address' ? (
                      <Check className="checkmark-animation h-4 w-4 text-[var(--success)]" />
                    ) : (
                      <Copy className="h-4 w-4 text-[var(--text-muted)]" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Send your withdrawal to this bridge address. The bridge will
                  route funds to your C-address.
                </p>
              </div>

              {cAddress && (
                <div>
                  <label className="mb-1 block text-xs text-[var(--text-muted)]">
                    Your C-Address (for reference)
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 font-mono text-xs break-all">
                      {cAddress}
                    </code>
                    <button
                      onClick={() => handleCopy(cAddress, 'caddress')}
                      className="interactive-element rounded-lg border border-[var(--border)] p-3 transition-colors hover:bg-[var(--surface-2)]"
                    >
                      {copiedField === 'caddress' ? (
                        <Check className="checkmark-animation h-4 w-4 text-[var(--success)]" />
                      ) : (
                        <Copy className="h-4 w-4 text-[var(--text-muted)]" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {selectedNetwork === CEX_NETWORK_STELLAR && (
                <div>
                  <label className="mb-1 block text-xs text-[var(--text-muted)]">
                    Memo (Required for Stellar)
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 font-mono text-sm">
                      {DEFAULT_BRIDGE_MEMO}
                    </code>
                    <button
                      onClick={() => handleCopy(DEFAULT_BRIDGE_MEMO, 'memo')}
                      className="interactive-element rounded-lg border border-[var(--border)] p-3 transition-colors hover:bg-[var(--surface-2)]"
                    >
                      {copiedField === 'memo' ? (
                        <Check className="checkmark-animation h-4 w-4 text-[var(--success)]" />
                      ) : (
                        <Copy className="h-4 w-4 text-[var(--text-muted)]" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <Info className="h-3 w-3" />
                    This memo maps your deposit to your C-address (
                    {cAddress || 'enter a C-address above'})
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 rounded-lg border border-[var(--warning)]/20 bg-[var(--warning)]/10 p-3">
                <Info className="h-4 w-4 flex-shrink-0 text-[var(--warning)]" />
                <p className="text-xs text-[var(--warning)]">
                  Send only Stellar assets (XLM, USDC) to this address. Using
                  the wrong network will result in lost funds.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h3 className="mb-3 font-semibold">Exchange Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Exchange</span>
                <span>{selectedCex.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Min Withdrawal</span>
                <span>{selectedCex.minWithdrawal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Fee</span>
                <span>{selectedCex.fee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Network</span>
                <span>{selectedNetwork}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h3 className="mb-3 font-semibold">How It Works</h3>
            <ol className="space-y-3 text-sm text-[var(--text-muted)]">
              <li className="flex gap-2">
                <span className="font-medium text-[var(--primary-light)]">
                  1.
                </span>
                <span>Verify bridge address access with micro-transaction</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-[var(--primary-light)]">
                  2.
                </span>
                <span>Withdraw from your CEX to the bridge address</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-[var(--primary-light)]">
                  3.
                </span>
                <span>The Soroban bridge contract detects the deposit</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-[var(--primary-light)]">
                  4.
                </span>
                <span>Funds are routed to your C-address automatically</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-[var(--primary-light)]">
                  5.
                </span>
                <span>Use your Soroban dApp directly</span>
              </li>
            </ol>
          </div>

          <a
            href={withdrawalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-medium transition-colors hover:bg-[var(--surface-2)]"
          >
            <ExternalLink className="h-4 w-4" />
            Open {selectedCex.name} Withdrawal
          </a>
        </div>
      </div>
    </div>
  );
}
