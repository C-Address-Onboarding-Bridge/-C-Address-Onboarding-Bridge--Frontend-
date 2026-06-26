"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { translate } from "@/lib/i18n";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { locale } = useLocale();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--error)]/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-[var(--error)]" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{translate(locale, "error.title")}</h1>
        <p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">
          {error.message || translate(locale, "error.fallback")}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary)]/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {translate(locale, "error.retry")}
        </button>
      </div>
    </div>
  );
}
