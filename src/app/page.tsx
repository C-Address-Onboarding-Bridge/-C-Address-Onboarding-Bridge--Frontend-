import Link from 'next/link';
import {
  ArrowRight,
  Shield,
  Zap,
  CreditCard,
  Building2,
  Globe,
  Code,
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'G → C Bridge',
    description:
      'Instantly fund C-addresses from existing G-addresses with a single transaction.',
    href: '/bridge',
  },
  {
    icon: CreditCard,
    title: 'Fiat Onramp',
    description:
      'Buy crypto with credit card via Moonpay or Transak and send directly to a C-address.',
    href: '/onramp',
  },
  {
    icon: Building2,
    title: 'CEX Withdrawal',
    description:
      'Route exchange withdrawals directly to your Soroban smart account.',
    href: '/cex',
  },
  {
    icon: Shield,
    title: 'Soroban Native',
    description:
      'Built on Soroban smart contracts for trustless G-to-C address routing.',
    href: '/bridge',
  },
];

const steps = [
  {
    step: '01',
    title: 'Connect Wallet',
    description: 'Connect your Freighter wallet or enter any Stellar address.',
  },
  {
    step: '02',
    title: 'Choose Funding Source',
    description: 'Select from G-address, fiat onramp, or CEX withdrawal.',
  },
  {
    step: '03',
    title: 'Enter C-Address',
    description: 'Paste the Soroban smart account address you want to fund.',
  },
  {
    step: '04',
    title: 'Confirm & Fund',
    description: 'Review the details and confirm the transaction.',
  },
];

export default function LandingPage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)]/5 via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl px-4 pt-20 pb-32 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/10 px-3 py-1 text-sm text-[var(--primary-light)]">
              <Globe className="h-4 w-4" />
              Stellar Soroban Onboarding Protocol
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              The Onboarding Layer for{' '}
              <span className="gradient-text">Soroban dApps</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-[var(--text-muted)]">
              Fund any Soroban smart account (C-address) directly — from a CEX
              withdrawal, a credit card, or an existing G-address. No account
              model knowledge required.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/bridge"
                className="glow inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--primary)]/90"
              >
                Start Bridging
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-6 py-3 font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)]"
              >
                <Code className="h-4 w-4" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold">
            One Protocol,{' '}
            <span className="gradient-text">Three Funding Methods</span>
          </h2>
          <p className="mx-auto max-w-xl text-[var(--text-muted)]">
            Choose how you want to fund your Soroban smart account. No technical
            knowledge required.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.title}
                href={feature.href}
                className="feature-card group relative rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary)]/10 transition-colors group-hover:bg-[var(--primary)]/20">
                  <Icon className="h-5 w-5 text-[var(--primary-light)]" />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  {feature.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold">How It Works</h2>
            <p className="mx-auto max-w-xl text-[var(--text-muted)]">
              Four simple steps to fund any C-address
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {steps.map((step, i) => (
              <div key={step.step} className="relative">
                {i < steps.length - 1 && (
                  <div className="absolute top-6 left-[60%] hidden h-px w-[80%] bg-gradient-to-r from-[var(--primary)]/40 to-transparent md:block" />
                )}
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/10">
                    <span className="text-sm font-bold text-[var(--primary-light)]">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="mb-2 font-semibold">{step.title}</h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--primary)]/5 via-[var(--secondary)]/5 to-transparent p-12 text-center">
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-[var(--primary)]/5 blur-3xl" />
          <h2 className="relative mb-4 text-3xl font-bold">Ready to Bridge?</h2>
          <p className="relative mx-auto mb-8 max-w-lg text-[var(--text-muted)]">
            Start funding Soroban smart accounts directly. No G-address required
            for new users.
          </p>
          <Link
            href="/bridge"
            className="glow relative inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--primary)]/90"
          >
            Launch Bridge
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
