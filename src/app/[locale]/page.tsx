"use client";

import Link from "next/link";
import { ArrowRight, Shield, Zap, CreditCard, Building2, Globe, Code } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { getLocalizedPath, translate } from "@/lib/i18n";

const features = [
  {
    icon: Zap,
    titleKey: "landing.featureBridgeTitle",
    descriptionKey: "landing.featureBridgeDescription",
    href: "/bridge",
  },
  {
    icon: CreditCard,
    titleKey: "landing.featureOnrampTitle",
    descriptionKey: "landing.featureOnrampDescription",
    href: "/onramp",
  },
  {
    icon: Building2,
    titleKey: "landing.featureCexTitle",
    descriptionKey: "landing.featureCexDescription",
    href: "/cex",
  },
  {
    icon: Shield,
    titleKey: "landing.featureSorobanTitle",
    descriptionKey: "landing.featureSorobanDescription",
    href: "/bridge",
  },
];

const steps = [
  {
    step: "01",
    titleKey: "landing.stepConnectTitle",
    descriptionKey: "landing.stepConnectDescription",
  },
  {
    step: "02",
    titleKey: "landing.stepChooseTitle",
    descriptionKey: "landing.stepChooseDescription",
  },
  {
    step: "03",
    titleKey: "landing.stepAddressTitle",
    descriptionKey: "landing.stepAddressDescription",
  },
  {
    step: "04",
    titleKey: "landing.stepConfirmTitle",
    descriptionKey: "landing.stepConfirmDescription",
  },
];

export default function LandingPage() {
  const { locale } = useLocale();

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)]/5 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-sm text-[var(--primary-light)] mb-6">
              <Globe className="w-4 h-4" />
              {translate(locale, "landing.badge")}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              {translate(locale, "landing.heroTitle")}
            </h1>
            <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto mb-10">
              {translate(locale, "landing.heroSubtitle")}
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href={getLocalizedPath("/bridge", locale)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary)]/90 transition-colors glow"
              >
                {translate(locale, "landing.ctaBridge")}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={getLocalizedPath("/dashboard", locale)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--border)] text-[var(--foreground)] font-medium hover:bg-[var(--surface-2)] transition-colors"
              >
                <Code className="w-4 h-4" />
                {translate(locale, "landing.ctaDashboard")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">
            {translate(locale, "landing.featuresHeading")}
          </h2>
          <p className="text-[var(--text-muted)] max-w-xl mx-auto">
            {translate(locale, "landing.featuresSubheading")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.titleKey}
                href={getLocalizedPath(feature.href, locale)}
                className="feature-card group relative p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)]"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--primary)]/20 transition-colors">
                  <Icon className="w-5 h-5 text-[var(--primary-light)]" />
                </div>
                <h3 className="font-semibold mb-2">{translate(locale, feature.titleKey)}</h3>
                <p className="text-sm text-[var(--text-muted)]">{translate(locale, feature.descriptionKey)}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">{translate(locale, "landing.stepsHeading")}</h2>
            <p className="text-[var(--text-muted)] max-w-xl mx-auto">
              {translate(locale, "landing.stepsSubheading")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={step.step} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-px bg-gradient-to-r from-[var(--primary)]/40 to-transparent" />
                )}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center mb-4">
                    <span className="text-sm font-bold text-[var(--primary-light)]">{step.step}</span>
                  </div>
                  <h3 className="font-semibold mb-2">{translate(locale, step.titleKey)}</h3>
                  <p className="text-sm text-[var(--text-muted)]">{translate(locale, step.descriptionKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="relative p-12 rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--primary)]/5 via-[var(--secondary)]/5 to-transparent overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 rounded-full blur-3xl" />
          <h2 className="text-3xl font-bold mb-4 relative">
            {translate(locale, "landing.readyTitle")}
          </h2>
          <p className="text-[var(--text-muted)] max-w-lg mx-auto mb-8 relative">
            {translate(locale, "landing.readyText")}
          </p>
          <Link
            href={getLocalizedPath("/bridge", locale)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary)]/90 transition-colors glow relative"
          >
            {translate(locale, "landing.readyCta")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
