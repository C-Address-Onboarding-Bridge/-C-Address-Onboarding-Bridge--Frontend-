import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { LocaleProvider } from "@/components/locale-provider";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { KeyboardShortcutsInfo } from "@/components/keyboard-shortcuts-info";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "es" }, { locale: "fr" }, { locale: "ar" }];
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  return {
    title: "C-Address Bridge | Soroban Onboarding Protocol",
    description:
      "Fund any Soroban smart account (C-address) directly — from a CEX withdrawal, a credit card, or an existing G-address.",
  };
}

export default function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const validLocale = ["en", "es", "fr", "ar"].includes(params.locale) ? params.locale : "en";

  return (
    <LocaleProvider initialLocale={validLocale as "en" | "es" | "fr" | "ar"}>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16">{children}</main>
        <Footer />
        <KeyboardShortcutsInfo />
      </div>
    </LocaleProvider>
  );
}
