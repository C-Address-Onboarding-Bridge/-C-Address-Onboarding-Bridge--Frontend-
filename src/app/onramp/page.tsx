'use client';

import { useState } from 'react';
import {
  CreditCard,
  Wallet,
  ExternalLink,
  ArrowRight,
  Check,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { validateCAddress } from '@/utils/validation';
import {
  isValidStellarAddress,
  isCAddress,
  estimateOnrampOutput,
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
} from '@/lib';

const MOONPAY_API_KEY = process.env.NEXT_PUBLIC_MOONPAY_API_KEY || '';
const TRANSAK_API_KEY = process.env.NEXT_PUBLIC_TRANSAK_API_KEY || '';

const providers = [
  {
    id: PROVIDER_MOONPAY,
    name: 'Moonpay',
    description: 'Buy with credit/debit card',
    fee: '4.5%',
    limits: '$20 - $10,000',
    currencies: ['USD', 'EUR', 'GBP'],
    supported: true,
    apiKey: MOONPAY_API_KEY,
    baseUrl: MOONPAY_BASE_URL,
  },
  {
    id: PROVIDER_TRANSAK,
    name: 'Transak',
    description: 'Buy with card, Apple Pay, Google Pay',
    fee: '5%',
    limits: '$15 - $25,000',
    currencies: ['USD', 'EUR', 'GBP', 'INR'],
    supported: true,
    apiKey: TRANSAK_API_KEY,
    baseUrl: TRANSAK_BASE_URL,
  },
];

export default function OnrampPage() {
  const [cAddress, setCAddress] = useState('');
  const [fiatAmount, setFiatAmount] = useState('');
  const [selectedProvider, setSelectedProvider] =
    useState<string>(PROVIDER_MOONPAY);
  const [step, setStep] = useState<'form' | 'redirect'>(STEP_FORM);
  const [error, setError] = useState<string | null>(null);

  const cAddressError = validateCAddress(cAddress);
  const validAddress =
    !cAddress ||
    (!cAddressError && isValidStellarAddress(cAddress) && isCAddress(cAddress));
  const validAmount = !fiatAmount || /^\d+(\.\d{1,2})?$/.test(fiatAmount);
  const canProceed = cAddress && fiatAmount && validAddress && validAmount;

  const handleProviderRedirect = () => {
    if (!canProceed) {
      if (!cAddress || !validAddress) {
        document.getElementById('c-address')?.focus();
      } else if (!fiatAmount || !validAmount) {
        document.getElementById('fiat-amount')?.focus();
      }
      return;
    }
    setError(null);

    const provider = providers.find((p) => p.id === selectedProvider);
    if (!provider) return;

    if (!provider.apiKey) {
      setError(
        `${provider.name} API key is not configured. Set ${provider.id === PROVIDER_MOONPAY ? ENV_MOONPAY_API_KEY : ENV_TRANSAK_API_KEY} in your environment.`
      );
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
      window.open(url, '_blank', 'noopener,noreferrer');
    }, REDIRECT_DELAY_MS);
  };

  const provider = providers.find((p) => p.id === selectedProvider);

  const missingKeys = providers.filter((p) => !p.apiKey).map((p) => p.name);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Fiat Onramp</h1>
        <p className="text-[var(--text-muted)]">
          Buy crypto with a credit card and send it directly to a Soroban
          C-address.
        </p>
      </div>

      {missingKeys.length > 0 && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-[var(--warning)]/20 bg-[var(--warning)]/10 p-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--warning)]" />
          <span className="text-[var(--warning)]">
            {missingKeys.join(' and ')}{' '}
            {missingKeys.length === 1 ? 'is' : 'are'} not configured and will be
            unavailable. Set the corresponding{' '}
            <code className="font-mono text-xs">NEXT_PUBLIC_*_API_KEY</code>{' '}
            environment variable to enable{' '}
            {missingKeys.length === 1 ? 'it' : 'them'}.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            {step === STEP_FORM && (
              <div className="space-y-6">
                <div>
                  <label className="mb-3 block text-sm font-medium">
                    Select Provider
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {providers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedProvider(p.id);
                          setError(null);
                        }}
                        className={`rounded-lg border p-4 text-left transition-all ${
                          selectedProvider === p.id
                            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                            : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--text-muted)]'
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-semibold">{p.name}</span>
                          {selectedProvider === p.id && (
                            <Check className="h-4 w-4 text-[var(--primary)]" />
                          )}
                        </div>
                        <p className="mb-1 text-xs text-[var(--text-muted)]">
                          {p.description}
                        </p>
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
                  <label className="mb-2 block text-sm font-medium">
                    Destination C-Address
                  </label>
                  <div className="relative">
                    <Wallet className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      id="c-address"
                      value={cAddress}
                      onChange={(e) => setCAddress(e.target.value)}
                      placeholder="CABC...DEF"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] py-3 pr-4 pl-10 font-mono text-sm transition-colors focus:border-[var(--primary)] focus:outline-none"
                      aria-describedby="c-address-error"
                      aria-invalid={!validAddress && !!cAddress}
                    />
                  </div>
                  {!validAddress && cAddress && (
                    <p
                      id="c-address-error"
                      role="alert"
                      className="mt-1 text-xs text-[var(--error)]"
                    >
                      {cAddressError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      id="fiat-amount"
                      value={fiatAmount}
                      onChange={(e) => setFiatAmount(e.target.value)}
                      placeholder="100.00"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] py-3 pr-4 pl-10 text-sm transition-colors focus:border-[var(--primary)] focus:outline-none"
                      aria-describedby="fiat-amount-error"
                      aria-invalid={!validAmount && !!fiatAmount}
                    />
                  </div>
                  {!validAmount && fiatAmount && (
                    <p
                      id="fiat-amount-error"
                      role="alert"
                      className="mt-1 text-xs text-[var(--error)]"
                    >
                      Invalid amount format
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <h4 className="mb-2 text-sm font-medium">Estimated Output</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">You pay</span>
                    <span>${fiatAmount || '0'} USD</span>
                  </div>
                  <div className="mt-1 flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">
                      Fee ({provider?.fee})
                    </span>
                    <span>
                      -$
                      {fiatAmount
                        ? estimateOnrampOutput(
                            Number(fiatAmount),
                            selectedProvider as
                              typeof PROVIDER_MOONPAY | typeof PROVIDER_TRANSAK
                          ).fee.toFixed(FIAT_DISPLAY_DECIMALS)
                        : '0'}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">
                      Est. receive
                    </span>
                    <span className="font-semibold">
                      {fiatAmount && validAmount
                        ? `~${estimateOnrampOutput(Number(fiatAmount), selectedProvider as typeof PROVIDER_MOONPAY | typeof PROVIDER_TRANSAK).receive.toFixed(FIAT_DISPLAY_DECIMALS)} USDC`
                        : '—'}
                    </span>
                  </div>
                </div>

                {error && (
                  <div
                    aria-live="polite"
                    className="flex items-start gap-3 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/10 p-4"
                  >
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--error)]" />
                    <p className="text-sm text-[var(--error)]">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleProviderRedirect}
                  disabled={!canProceed}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--primary)]/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CreditCard className="h-4 w-4" />
                  Continue with {provider?.name}
                </button>
              </div>
            )}

            {step === STEP_REDIRECT && (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)]/10">
                  <ExternalLink className="h-8 w-8 text-[var(--primary-light)]" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  Redirecting to {provider?.name}
                </h3>
                <p className="mb-4 text-sm text-[var(--text-muted)]">
                  You will be redirected to complete your purchase. Funds will
                  be sent to your C-address.
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
            <h3 className="mb-3 font-semibold">Supported Providers</h3>
            <div className="space-y-3">
              {providers.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg bg-[var(--surface-2)] p-3"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className="text-xs text-[var(--text-muted)]">
                      Fee: {p.fee}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {p.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h3 className="mb-3 font-semibold">Why Fiat Onramp?</h3>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li className="flex gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--primary-light)]" />
                <span>No G-address needed at all</span>
              </li>
              <li className="flex gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--primary-light)]" />
                <span>New users can go straight to Soroban dApps</span>
              </li>
              <li className="flex gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--primary-light)]" />
                <span>Credit/debit card, Apple Pay, Google Pay</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
