"use client";

import { Languages } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { locales, translate, type Locale } from "@/lib/i18n";

const localeLabels: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  ar: "العربية",
};

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1">
      <Languages className="h-4 w-4 text-[var(--text-muted)]" />
      <select
        aria-label={translate(locale, "nav.language")}
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className="bg-transparent px-1 py-1 text-sm text-[var(--foreground)] outline-none"
      >
        {locales.map((option) => (
          <option key={option} value={option}>
            {localeLabels[option]}
          </option>
        ))}
      </select>
    </div>
  );
}
