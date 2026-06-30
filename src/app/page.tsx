import Link from "next/link";
import { ArrowRight, Shield, Zap, CreditCard, Building2, Globe, Code } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "G → C Bridge",
    description: "Instantly fund C-addresses from existing G-addresses with a single transaction.",
    href: "/bridge",
  },
  {
    icon: CreditCard,
    title: "Fiat Onramp",
    description: "Buy crypto with credit card via Moonpay or Transak and send directly to a C-address.",
    href: "/onramp",
  },
  {
    icon: Building2,
    title: "CEX Withdrawal",
    description: "Route exchange withdrawals directly to your Soroban smart account.",
    href: "/cex",
  },
  {
    icon: Shield,
    title: "Soroban Native",
    description: "Built on Soroban smart contracts for trustless G-to-C address routing.",
    href: "/bridge",
  },
];

const steps = [
  {
    step: "01",
    title: "Connect Wallet",
    description: "Connect your Freighter wallet or enter any Stellar address.",
  },
  {
    step: "02",
    title: "Choose Funding Source",
    description: "Select from G-address, fiat onramp, or CEX withdrawal.",
  },
  {
    step: "03",
    title: "Enter C-Address",
    description: "Paste the Soroban smart account address you want to fund.",
  },
  {
    step: "04",
    title: "Confirm & Fund",
    description: "Review the details and confirm the transaction.",
  },
];

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pt-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:py-28" aria-labelledby="hero-title">
        <div className="max-w-7xl mx-auto text-center">
          <h1 id="hero-title" className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Bridge to{" "}
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
              C-Addresses
            </span>
          </h1>
          <p className="mt-6 text-xl text-[var(--text-muted)] max-w-2xl mx-auto">
            Fund Soroban smart accounts from any Stellar G-address, fiat onramp, or CEX withdrawal.
            <br />
            <span className="text-sm">Built on Soroban for trustless G-to-C address routing.</span>
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/bridge"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary)]/90 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
              aria-label="Get started with bridging"
            >
              Get Started <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-[var(--border)] text-[var(--foreground)] font-medium hover:bg-[var(--surface-2)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
              aria-label="Go to dashboard"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 bg-[var(--surface)]" aria-labelledby="features-title">
        <div className="max-w-7xl mx-auto">
          <h2 id="features-title" className="text-3xl font-bold text-center mb-12">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.title}
                  href={feature.href}
                  className="group p-6 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                  aria-label={`${feature.title}: ${feature.description}`}
                >
                  <div className="w-12 h-12 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[var(--primary)]" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-[var(--text-muted)]">{feature.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="px-4 py-20" aria-labelledby="steps-title">
        <div className="max-w-7xl mx-auto">
          <h2 id="steps-title" className="text-3xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div
                key={step.step}
                className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
                role="article"
                aria-label={`Step ${step.step}: ${step.title}`}
              >
                <div className="text-3xl font-bold text-[var(--primary)] mb-3" aria-hidden="true">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-[var(--text-muted)]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}