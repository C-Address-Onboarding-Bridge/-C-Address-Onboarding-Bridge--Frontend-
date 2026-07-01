import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/wallet-provider";
import { FeatureFlagProvider } from "@/contexts/FeatureFlagContext";
import { FeatureFlagPanel } from "@/components/FeatureFlagPanel";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "C-Address Bridge | Soroban Onboarding Protocol",
  description:
    "Fund any Soroban smart account (C-address) directly — from a CEX withdrawal, a credit card, or an existing G-address.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">
        <FeatureFlagProvider>
          <WalletProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1 pt-16">{children}</main>
              <Footer />
            </div>
            <FeatureFlagPanel />
          </WalletProvider>
        </FeatureFlagProvider>
      </body>
    </html>
  );
}
