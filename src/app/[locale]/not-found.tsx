import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { translate, getLocalizedPath } from "@/lib/i18n";

export default function NotFound() {
  const { locale } = useLocale();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-8 h-8 text-[var(--primary-light)]" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{translate(locale, "error.title")}</h1>
        <p className="text-[var(--text-muted)] mb-6">
          {translate(locale, "error.fallback")}
        </p>
        <Link
          href={getLocalizedPath("/", locale)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary)]/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {translate(locale, "landing.ctaBridge")}
        </Link>
      </div>
    </div>
  );
}
