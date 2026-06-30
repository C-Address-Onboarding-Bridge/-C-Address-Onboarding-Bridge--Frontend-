"use client";

import { useState } from "react";
import { Building2, Copy, Check, ExternalLink, Wallet, Info } from "lucide-react";
import {
  CEX_LIST,
  DEFAULT_BRIDGE_ADDRESS,
  DEFAULT_BRIDGE_MEMO,
  CEX_NETWORKS,
  CEX_NETWORK_STELLAR,
  COPY_FEEDBACK_MS,
} from "@/lib";
import { validateCAddress } from "@/utils/validation";

export default function CexPage() {
  const [selectedCex, setSelectedCex] = useState(CEX_LIST[0]);
  const [selectedNetwork, setSelectedNetwork] = useState<string>(CEX_NETWORK_STELLAR);
  const [cAddress, setCAddress] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), COPY_FEEDBACK_MS);
  };

  const withdrawalUrl = selectedCex.withdrawalUrl;
  const cAddressError = validateCAddress(cAddress);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">CEX Withdrawal Routing</h1>
        <p className="text-[var(--text-muted)]">
          Route your centralized exchange withdrawals directly to a Soroban C-address.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="font-semibold mb-4">1. Select Your Exchange</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CEX_LIST.map((cex) => (
                <button
                  key={cex.name}
                  onClick={() => setSelectedCex(cex)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    selectedCex.name === cex.name
                      ? "border-[var(--primary)] bg-[var(--primary)]/5 cex-logo selected transform scale-105"
                      : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--text-muted)] cex-logo"
                  }`}
                  aria-label={`Select ${cex.name} exchange`}
                >
                  <Building2 className="w-8 h-8 text-[var(--text-muted)] mb-2" aria-hidden="true" />
                  <div className="font-medium text-sm">{cex.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">Min: {cex.minWithdrawal}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="font-semibold mb-4">2. Choose Withdrawal Network</h2>
            <div className="flex flex-wrap gap-2">
              {CEX_NETWORKS.map((net) => (
                <button
                  key={net}
                  onClick={() => setSelectedNetwork(net)}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                    selectedNetwork === net
                      ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary-light)]"
                      : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--foreground)]"
                  }`}
                  aria-label={`Select ${net} network`}
                >
                  {net}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="font-semibold mb-4">3. Enter Your C-Address</h2>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              This is the Soroban smart account address you want to fund.
              It will be linked to your deposit via the bridge memo.
            </p>
            <div className="relative">
              <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
              <input
                type="text"
                id="cex-c-address"
                value={cAddress}
                onChange={(e) => setCAddress(e.target.value)}
                placeholder="CABC...DEF"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm font-mono focus:outline-none focus:border-[var(--primary)] transition-colors"
                aria-describedby="cex-c-address-error"
                aria-invalid={!!cAddressError && !!cAddress}
              />
            </div>
            {cAddressError && cAddress && (
              <p id="cex-c-address-error" role="alert" className="text-xs text-[var(--error)] mt-1">{cAddressError}</p>
            )}
          </div>

          {cAddress && !cAddressError && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <h2 className="font-semibold mb-4">4. Verify Bridge Address Access</h2>
              <CEXAddressVerification
                onVerified={() => {}}
              />
            </div>
          )}

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="font-semibold mb-4">5. Withdrawal Details for {selectedCex.name}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1" id="bridge-address-label">
                  Bridge Deposit Address
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono break-all">
                    {DEFAULT_BRIDGE_ADDRESS}
                  </code>
                  <button
                    onClick={() => handleCopy(DEFAULT_BRIDGE_ADDRESS, "address")}
                    className="p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors interactive-element"
                    aria-label="Copy bridge address"
                  >
                    {copiedField === "address" ? (
                      <Check className="w-4 h-4 text-[var(--success)] checkmark-animation" aria-hidden="true" />
                    ) : (
                      <Copy className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Send your withdrawal to this bridge address. The bridge will route funds to your C-address.
                </p>
              </div>

              {cAddress && (
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1" id="c-address-label">
                    Your C-Address (for reference)
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono break-all">
                      {cAddress}
                    </code>
                    <button
                      onClick={() => handleCopy(cAddress, "caddress")}
                      className="p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors interactive-element"
                      aria-label="Copy C-address"
                    >
                      {copiedField === "caddress" ? (
                        <Check className="w-4 h-4 text-[var(--success)] checkmark-animation" aria-hidden="true" />
                      ) : (
                        <Copy className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {selectedNetwork === CEX_NETWORK_STELLAR && (
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1" id="memo-label">
                    Memo (Required for Stellar)
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm font-mono">
                      {DEFAULT_BRIDGE_MEMO}
                    </code>
                    <button
                      onClick={() => handleCopy(DEFAULT_BRIDGE_MEMO, "memo")}
                      className="p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors interactive-element"
                      aria-label="Copy memo"
                    >
                      {copiedField === "memo" ? (
                        <Check className="w-4 h-4 text-[var(--success)] checkmark-animation" aria-hidden="true" />
                      ) : (
                        <Copy className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
                    <Info className="w-3 h-3" aria-hidden="true" />
                    This memo maps your deposit to your C-address ({cAddress || "enter a C-address above"})
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/20">
                <Info className="w-4 h-4 text-[var(--warning)] flex-shrink-0" aria-hidden="true" />
                <p className="text-xs text-[var(--warning)]">
                  Send only Stellar assets (XLM, USDC) to this address. Using the wrong network will result in lost funds.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="font-semibold mb-3">Exchange Details</h2>
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
            <h2 className="font-semibold mb-3">How It Works</h2>
            <ol className="space-y-3 text-sm text-[var(--text-muted)]">
              <li className="flex gap-2">
                <span className="text-[var(--primary-light)] font-medium">1.</span>
                <span>Verify bridge address access with micro-transaction</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--primary-light)] font-medium">2.</span>
                <span>Withdraw from your CEX to the bridge address</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--primary-light)] font-medium">3.</span>
                <span>The Soroban bridge contract detects the deposit</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--primary-light)] font-medium">4.</span>
                <span>Funds are routed to your C-address automatically</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--primary-light)] font-medium">5.</span>
                <span>Use your Soroban dApp directly</span>
              </li>
            </ol>
          </div>

          <a
            href={withdrawalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--surface-2)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
            aria-label={`Open ${selectedCex.name} withdrawal page`}
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
            Open {selectedCex.name} Withdrawal
          </a>
        </div>
      </div>
    </div>
  );
}