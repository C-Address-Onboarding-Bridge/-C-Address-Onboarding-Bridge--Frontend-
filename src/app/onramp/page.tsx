"use client";

import { useState } from "react";
import { CreditCard, Wallet, ExternalLink, ArrowRight, Check, DollarSign, AlertCircle } from "lucide-react";
import { isValidStellarAddress, isCAddress } from "@/lib/stellar";
import { validateCAddress } from "@/utils/validation";
import {
  STELLAR_ADDRESS_LENGTH,
  PROVIDER_MOONPAY,
  PROVIDER_TRANSAK,
  WALLET_CHAIN_STELLAR,
  DEFAULT_CRYPTO_CURRENCY,
  MOONPAY_FEE_RATE,
  TRANSAK_FEE_RATE,
  BASE_RECEIVE_MULTIPLIER,
  MOONPAY_RECEIVE_MULTIPLIER,
  TRANSAK_RECEIVE_MULTIPLIER,
  FIAT_DISPLAY_DECIMALS,
  MOONPAY_BASE_URL,
  TRANSAK_BASE_URL,
  REDIRECT_DELAY_MS,
  ENV_MOONPAY_API_KEY,
  ENV_TRANSAK_API_KEY,
  STEP_FORM,
  STEP_REDIRECT,
} from "@/lib/constants";

const MOONPAY_API_KEY = process.env.NEXT_PUBLIC_MOONPAY_API_KEY || "";
const TRANSAK_API_KEY = process.env.NEXT_PUBLIC_TRANSAK_API_KEY || "";

const providers = [
  {
    id: PROVIDER_MOONPAY,
    name: "Moonpay",
    description: "Buy with credit/debit card",
    fee: "4.5%",
    limits: "$20 - $10,000",
    currencies: ["USD", "EUR", "GBP"],
    supported: true,
    apiKey: MOONPAY_API_KEY,
    baseUrl: MOONPAY_BASE_URL,
  },
  {
    id: PROVIDER_TRANSAK,
    name: "Transak",
    description: "Buy with card, Apple Pay, Google Pay",
    fee: "5%",
    limits: "$15 - $25,000",
    currencies: ["USD", "EUR", "GBP", "INR"],
    supported: true,
    apiKey: TRANSAK_API_KEY,
    baseUrl: TRANSAK_BASE_URL,
  },
];

export default function OnrampPage() {
  const [cAddress, setCAddress] = useState("");
  const [fiatAmount, setFiatAmount] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>(PROVIDER_MOONPAY);
  const [step, setStep] = useState<"form" | "redirect">(STEP_FORM);
  const [error, setError] = useState<string | null>(null);

  const cAddressError = validateCAddress(cAddress);
  const validAddress = !cAddress || (!cAddressError && isValidStellarAddress(cAddress) && isCAddress(cAddress));
  const validAmount = !fiatAmount || /^\d+(\.\d{1,2})?$/.test(fiatAmount);
  const canProceed = cAddress && fiatAmount && validAddress && validAmount;

  const handleProviderRedirect = () => {
    if (!canProceed) return;
    setError(null);

    const provider = providers.find((p) => p.id === selectedProvider);
    if (!provider) return;

    if (!provider.apiKey) {
      setError(`${provider.name} API key is not configured. Set ${provider.id === PROVIDER_MOONPAY ? ENV_MOONPAY_API_KEY : ENV_TRANSAK_API_KEY} in your environment.`);
      return;
    }

    setStep(STEP_REDIRECT);

    const params = new URLSearchParams({
      apiKey: provider.apiKey,
      walletAddress: cAddress,
      walletChain: WALLET_CHAIN_STELLAR,
      defaultCryptoCurrency: DEFAULT_CRYPTO_CURRENCY,
      defaultFiatAmount: fiatAmount,
    });

    const url = `${provider.baseUrl}?${params}`;

    setTimeout(() => {
      window.open(url, "_blank", "noopener,noreferrer");
    }, REDIRECT_DELAY_MS);
  };

  const provider = providers.find((p) => p.id === selectedProvider);

  const missingKeys = providers.filter((p) => !p.apiKey).map((p) => p.name);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Fiat Onramp</h1>
        <p className="text-[var(--text-muted)]">
          Buy crypto with a credit card and send it directly to a Soroban C-address.
        </p>
      </div>

      {missingKeys.length > 0 && (
        <div className="mb-6 p-3 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/20 flex items-start gap-2 text-sm">
          <AlertCircle className="w-4 h-4 text-[var(--warning)] flex-shrink-0 mt-0.5" />
          <span className="text-[var(--warning)]">
            {missingKeys.join(" and ")} {missingKeys.length === 1 ? "is" : "are"} not configured and will be unavailable.
            Set the corresponding <code className="font-mono text-xs">NEXT_PUBLIC_*_API_KEY</code> environment variable to enable {missingKeys.length === 1 ? "it" : "them"}.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            {step === STEP_FORM && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3">Select Provider</label>
                  <div className="grid grid-cols-2 gap-3">
                    {providers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedProvider(p.id); setError(null); }}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          selectedProvider === p.id
                            ? "border-[var(--primary)] bg-[var(--primary)]/5"
                            : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--text-muted)]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{p.name}</span>
                          {selectedProvider === p.id && (
                            <Check className="w-4 h-4 text-[var(--primary)]" />
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mb-1">{p.description}</p>
                        <div className="flex gap-2 text-xs text-[var(--text-muted)]">
                          <span>Fee: {p.fee}</span>
                          <span>•</span>
                          <span>{p.limits}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Destination C-Address</label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={cAddress}
                      onChange={(e) => setCAddress(e.target.value)}
                      placeholder="CABC...DEF"
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm font-mono focus:outline-none focus:border-[var(--primary)] transition-colors"
                    />
                  </div>
                  {!validAddress && cAddress && (
                    <p className="text-xs text-[var(--error)] mt-1">{cAddressError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Amount (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={fiatAmount}
                      onChange={(e) => setFiatAmount(e.target.value)}
                      placeholder="100.00"
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                    />
                  </div>
                  {!validAmount && fiatAmount && (
                    <p className="text-xs text-[var(--error)] mt-1">Invalid amount format</p>
                  )}
                </div>

                <div className="p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                  <h4 className="text-sm font-medium mb-2">Estimated Output</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">You pay</span>
                    <span>${fiatAmount || "0"} USD</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-[var(--text-muted)]">Fee ({provider?.fee})</span>
                    <span>
                      -${fiatAmount ? (Number(fiatAmount) * (selectedProvider === PROVIDER_MOONPAY ? MOONPAY_FEE_RATE : TRANSAK_FEE_RATE)).toFixed(FIAT_DISPLAY_DECIMALS) : "0"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-[var(--text-muted)]">Est. receive</span>
                    <span className="font-semibold">
                      {fiatAmount && validAmount
                        ? `~${(Number(fiatAmount) * BASE_RECEIVE_MULTIPLIER * (selectedProvider === PROVIDER_MOONPAY ? MOONPAY_RECEIVE_MULTIPLIER : TRANSAK_RECEIVE_MULTIPLIER)).toFixed(FIAT_DISPLAY_DECIMALS)} USDC`
                        : "—"}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[var(--error)] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[var(--error)]">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleProviderRedirect}
                  disabled={!canProceed}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard className="w-4 h-4" />
                  Continue with {provider?.name}
                </button>
              </div>
            )}

            {step === STEP_REDIRECT && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-4">
                  <ExternalLink className="w-8 h-8 text-[var(--primary-light)]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Redirecting to {provider?.name}</h3>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  You will be redirected to complete your purchase. Funds will be sent to your C-address.
                </p>
                <button
                  onClick={() => setStep(STEP_FORM)}
                  className="text-sm text-[var(--primary-light)] hover:underline"
                >
                  Go back
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h3 className="font-semibold mb-3">Supported Providers</h3>
            <div className="space-y-3">
              {providers.map((p) => (
                <div key={p.id} className="p-3 rounded-lg bg-[var(--surface-2)]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className="text-xs text-[var(--text-muted)]">Fee: {p.fee}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{p.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h3 className="font-semibold mb-3">Why Fiat Onramp?</h3>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li className="flex gap-2">
                <ArrowRight className="w-4 h-4 text-[var(--primary-light)] flex-shrink-0 mt-0.5" />
                <span>No G-address needed at all</span>
              </li>
              <li className="flex gap-2">
                <ArrowRight className="w-4 h-4 text-[var(--primary-light)] flex-shrink-0 mt-0.5" />
                <span>New users can go straight to Soroban dApps</span>
              </li>
              <li className="flex gap-2">
                <ArrowRight className="w-4 h-4 text-[var(--primary-light)] flex-shrink-0 mt-0.5" />
                <span>Credit/debit card, Apple Pay, Google Pay</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
