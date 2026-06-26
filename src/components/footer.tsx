"use client";

import { Wallet, HelpCircle } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { getLocalizedPath, translate } from "@/lib/i18n";

function RestartTourButton() {
  const { locale } = useLocale();

  const handleRestartTour = () => {
    localStorage.removeItem("hasSeenOnboardingTour");
    window.location.reload();
  };

  return (
    <button
      onClick={handleRestartTour}
      className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
    >
      <HelpCircle className="w-4 h-4" />
      {translate(locale, "footer.restartTour")}
    </button>
  );
}

export default function Footer() {
  const { locale } = useLocale();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]" aria-label="Site footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-lg">C-Address Bridge</span>
            </div>
            <p className="text-sm text-[var(--text-muted)] max-w-md">
              {translate(locale, "landing.heroSubtitle")}
            </p>
          </div>

          <nav aria-label="Protocol links">
            <h3 className="text-sm font-semibold mb-3">{translate(locale, "footer.protocol")}</h3>
            <ul className="space-y-2">
              <li><a href={getLocalizedPath("/bridge", locale)} className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)]">{translate(locale, "landing.featureBridgeTitle")}</a></li>
              <li><a href={getLocalizedPath("/onramp", locale)} className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)]">{translate(locale, "landing.featureOnrampTitle")}</a></li>
              <li><a href={getLocalizedPath("/cex", locale)} className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)]">{translate(locale, "landing.featureCexTitle")}</a></li>
            </ul>
          </nav>

          <div>
            <h3 className="text-sm font-semibold mb-3">{translate(locale, "footer.support")}</h3>
            <ul className="space-y-2">
              <li><RestartTourButton /></li>
              <li><a href="https://soroban.stellar.org" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)]">{translate(locale, "footer.sorobanDocs")}</a></li>
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)]">{translate(locale, "footer.github")}</a></li>
              <li><a href="https://stellar.org" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)]">{translate(locale, "footer.stellar")}</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-muted)]">
            {translate(locale, "footer.copyright")}
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[var(--text-muted)]">{translate(locale, "footer.protocolName")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
