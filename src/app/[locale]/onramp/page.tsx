"use client";

import { useState } from "react";
import { CreditCard, Wallet, ExternalLink, ArrowRight, Check, DollarSign, AlertCircle } from "lucide-react";
import { isValidStellarAddress, isCAddress } from "@/lib/stellar";
import { useLocale } from "@/components/locale-provider";
import { translate, formatNumber, formatCurrency } from "@/lib/i18n";
import { validateCAddress } from "@/utils/validation";
import {
  STELLAR_ADDRESS_LENGTH,
  PROVIDER_MOONPAY,
  PROVIDER_TRANSAK,
  WALLET_CHAIN_STELLAR,
  DEFAULT_CRYPTO_CURRENCY,
  FIAT_DISPLAY_DECIMALS,
  MOONPAY_BASE_URL,
  TRANSAK_BASE_URL,
  REDIRECT_DELAY_MS,
  ENV_MOONPAY_API_KEY,
  ENV_TRANSAK_API_KEY,
  STEP_FORM,
  STEP_REDIRECT,
} from "@/lib/constants";
import { estimateOnrampOutput } from "@/lib/onramp";

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
  const { locale } = useLocale();
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
        <h1 className="text-3xl font-bold mb-2">{translate(locale, "onramp.title")}</h1>
        <p className="text-[var(--text-muted)]">
          {translate(locale, "onramp.description")}
        </p>
      </div>

      {missingKeys.length > 0 && (
        <div className="mb-6 p-3 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/20 flex items-start gap-2 text-sm">
          <AlertCircle className="w-4 h-4 text-[var(--warning)] flex-shrink-0 mt-0.5" />
          <span className="text-[var(--warning)]">
            {translate(locale, "onramp.providerAlert", { names: missingKeys.join(" and "), count: missingKeys.length })}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            {step === STEP_FORM && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3">{translate(locale, "onramp.selectProvider")}</label>
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
                  <label className="block text-sm font-medium mb-2">{translate(locale, "onramp.destinationAddress")}</label>
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
                  {!validAddress && cAddress && (
                    <p className="text-xs text-[var(--error)] mt-1">{cAddressError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{translate(locale, "onramp.amount")}</label>
                  <div className="relative">
                    <DollarSign className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={fiatAmount}
                      onChange={(e) => setFiatAmount(e.target.value)}
                      placeholder="100.00"
                      className="w-full ps-10 pe-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                    />
                  </div>
                  {!validAmount && fiatAmount && (
                    <p className="text-xs text-[var(--error)] mt-1">{translate(locale, "common.invalidAmount")}</p>
                  )}
                </div>

                 <div className="p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                   <h4 className="text-sm font-medium mb-2">{translate(locale, "onramp.estimatedOutput")}</h4>
                   <div className="flex justify-between text-sm">
                     <span className="text-[var(--text-muted)]">{translate(locale, "onramp.youPay")}</span>
                     <span>{fiatAmount ? formatCurrency(Number(fiatAmount), locale, "USD") : formatCurrency(0, locale, "USD")}</span>
                   </div>
                   <div className="flex justify-between text-sm mt-1">
                     <span className="text-[var(--text-muted)]">{translate(locale, "onramp.fee", { fee: provider?.fee ?? "" })}</span>
                     <span>
                       {fiatAmount ? formatNumber(estimateOnrampOutput(Number(fiatAmount), selectedProvider as typeof PROVIDER_MOONPAY | typeof PROVIDER_TRANSAK).fee, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : formatNumber(0, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </span>
                   </div>
                   <div className="flex justify-between text-sm mt-1">
                     <span className="text-[var(--text-muted)]">{translate(locale, "onramp.estReceive")}</span>
                     <span className="font-semibold">
                       {fiatAmount && validAmount
                         ? formatNumber(estimateOnrampOutput(Number(fiatAmount), selectedProvider as typeof PROVIDER_MOONPAY | typeof PROVIDER_TRANSAK).receive, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " USDC"
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
                  {translate(locale, "onramp.continue", { provider: provider?.name ?? "" })}
                </button>
              </div>
            )}

            {step === STEP_REDIRECT && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-4">
                  <ExternalLink className="w-8 h-8 text-[var(--primary-light)]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{translate(locale, "onramp.redirectTitle", { provider: provider?.name ?? "" })}</h3>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  {translate(locale, "onramp.redirectText")}
                </p>
                <button
                  onClick={() => setStep(STEP_FORM)}
                  className="text-sm text-[var(--primary-light)] hover:underline"
                >
                  {translate(locale, "onramp.back")}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h3 className="font-semibold mb-3">{translate(locale, "onramp.supportedProviders")}</h3>
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
            <h3 className="font-semibold mb-3">{translate(locale, "onramp.whyFiat")}</h3>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li className="flex gap-2">
                <ArrowRight className="w-4 h-4 text-[var(--primary-light)] flex-shrink-0 mt-0.5" />
                <span>{translate(locale, "onramp.noGAddress")}</span>
              </li>
              <li className="flex gap-2">
                <ArrowRight className="w-4 h-4 text-[var(--primary-light)] flex-shrink-0 mt-0.5" />
                <span>{translate(locale, "onramp.newUsers")}</span>
              </li>
              <li className="flex gap-2">
                <ArrowRight className="w-4 h-4 text-[var(--primary-light)] flex-shrink-0 mt-0.5" />
                <span>{translate(locale, "onramp.cardOptions")}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
