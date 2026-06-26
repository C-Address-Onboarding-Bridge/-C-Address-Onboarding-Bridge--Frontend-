"use client";

import { useState } from "react";
import { Building2, Copy, Check, ExternalLink, Wallet, Info } from "lucide-react";
import { CEX_LIST, DEFAULT_BRIDGE_ADDRESS, DEFAULT_BRIDGE_MEMO } from "@/lib/types";
import { CEX_NETWORKS, CEX_NETWORK_STELLAR, COPY_FEEDBACK_MS } from "@/lib/constants";
import { useLocale } from "@/components/locale-provider";
import { CEXAddressVerification } from "@/components/cex-address-verification";
import { translate } from "@/lib/i18n";
import { validateCAddress } from "@/utils/validation";

export default function CexPage() {
  const { locale } = useLocale();
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
        <h1 className="text-3xl font-bold mb-2">{translate(locale, "cex.title")}</h1>
        <p className="text-[var(--text-muted)]">
          {translate(locale, "cex.description")}
        </p>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="font-semibold mb-4">{translate(locale, "cex.step1")}</h3>
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
                >
                  <Building2 className="w-8 h-8 text-[var(--text-muted)] mb-2" />
                  <div className="font-medium text-sm">{cex.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{translate(locale, "cex.minLabel")} {cex.minWithdrawal}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="font-semibold mb-4">{translate(locale, "cex.step2")}</h3>
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
                >
                  {net}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="font-semibold mb-4">{translate(locale, "cex.step3")}</h3>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              {translate(locale, "cex.description")}
            </p>
            <div className="relative">
              <Wallet className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={cAddress}
                onChange={(e) => setCAddress(e.target.value)}
                placeholder={translate(locale, "cex.placeholder")}
                className="w-full ps-10 pe-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm font-mono focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>
            {cAddressError && cAddress && (
              <p className="text-xs text-[var(--error)] mt-1">{cAddressError}</p>
            )}
          </div>

          {cAddress && !cAddressError && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <h3 className="font-semibold mb-4">{translate(locale, "cex.step4")}</h3>
              <CEXAddressVerification
                onVerified={() => {}}
              />
            </div>
          )}

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="font-semibold mb-4">{translate(locale, "cex.step5", { name: selectedCex.name })}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">{translate(locale, "cex.bridgedAddressLabel")}</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono break-all">
                    {DEFAULT_BRIDGE_ADDRESS}
                  </code>
                  <button
                    onClick={() => handleCopy(DEFAULT_BRIDGE_ADDRESS, "address")}
                    className="p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors interactive-element"
                  >
                    {copiedField === "address" ? (
                      <Check className="w-4 h-4 text-[var(--success)] checkmark-animation" />
                    ) : (
                      <Copy className="w-4 h-4 text-[var(--text-muted)]" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {translate(locale, "cex.description")}
                </p>
              </div>

              {cAddress && (
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">{translate(locale, "cex.yourAddressLabel")}</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono break-all">
                      {cAddress}
                    </code>
                    <button
                      onClick={() => handleCopy(cAddress, "caddress")}
                      className="p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors interactive-element"
                    >
                      {copiedField === "caddress" ? (
                        <Check className="w-4 h-4 text-[var(--success)] checkmark-animation" />
                      ) : (
                        <Copy className="w-4 h-4 text-[var(--text-muted)]" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {selectedNetwork === CEX_NETWORK_STELLAR && (
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">{translate(locale, "cex.memoLabel")}</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm font-mono">
                      {DEFAULT_BRIDGE_MEMO}
                    </code>
                    <button
                      onClick={() => handleCopy(DEFAULT_BRIDGE_MEMO, "memo")}
                      className="p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors interactive-element"
                    >
                      {copiedField === "memo" ? (
                        <Check className="w-4 h-4 text-[var(--success)] checkmark-animation" />
                      ) : (
                        <Copy className="w-4 h-4 text-[var(--text-muted)]" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    {translate(locale, "cex.memoMapping", { address: cAddress || translate(locale, "cex.placeholder") })}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/20">
                <Info className="w-4 h-4 text-[var(--warning)] flex-shrink-0" />
                <p className="text-xs text-[var(--warning)]">
                  {translate(locale, "cex.warning")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h3 className="font-semibold mb-3">{translate(locale, "cex.exchangeDetails")}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">{translate(locale, "cex.exchange")}</span>
                <span>{selectedCex.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">{translate(locale, "cex.minWithdrawal")}</span>
                <span>{selectedCex.minWithdrawal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">{translate(locale, "cex.fee")}</span>
                <span>{selectedCex.fee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">{translate(locale, "cex.network")}</span>
                <span>{selectedNetwork}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h3 className="font-semibold mb-3">{translate(locale, "cex.howItWorks")}</h3>
            <ol className="space-y-3 text-sm text-[var(--text-muted)]">
              <li className="flex gap-2">
                <span className="text-[var(--primary-light)] font-medium">1.</span>
                <span>{translate(locale, "cex.howItWorks1")}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--primary-light)] font-medium">2.</span>
                <span>{translate(locale, "cex.howItWorks2")}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--primary-light)] font-medium">3.</span>
                <span>{translate(locale, "cex.howItWorks3")}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--primary-light)] font-medium">4.</span>
                <span>{translate(locale, "cex.howItWorks4")}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--primary-light)] font-medium">5.</span>
                <span>{translate(locale, "cex.howItWorks5")}</span>
              </li>
            </ol>
          </div>

          <a
            href={withdrawalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--surface-2)] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            {translate(locale, "cex.openWithdrawal", { name: selectedCex.name })}
          </a>
        </div>
      </div>
    </div>
  );
}
