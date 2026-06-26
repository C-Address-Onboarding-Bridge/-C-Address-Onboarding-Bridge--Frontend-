"use client";

import { useState } from "react";
import { Check, AlertCircle, Loader, ArrowRight } from "lucide-react";
import { useWallet } from "./wallet-provider";
import { useLocale } from "./locale-provider";
import {
  initiateChallengeTransaction,
  verifyChallengeReceived,
  getChallenge,
  clearChallenge,
  type VerificationChallenge,
} from "@/lib/cex-verification";
import { DEFAULT_BRIDGE_ADDRESS } from "@/lib/types";
import { translate } from "@/lib/i18n";

export interface CEXVerificationProps {
  onVerified: () => void;
}

export function CEXAddressVerification({ onVerified }: CEXVerificationProps) {
  const { address, network } = useWallet();
  const { locale } = useLocale();
  const [step, setStep] = useState<"idle" | "initiating" | "pending" | "verifying" | "verified" | "error">("idle");
  const [challenge, setChallenge] = useState<VerificationChallenge | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleInitiateChallenge = async () => {
    if (!address) {
      setErrorMessage(translate(locale, "bridge.errorUnexpected"));
      setStep("error");
      return;
    }

    setStep("initiating");
    setErrorMessage("");

    try {
      const newChallenge = await initiateChallengeTransaction(
        address,
        DEFAULT_BRIDGE_ADDRESS,
        network
      );
      setChallenge(newChallenge);
      setStep("pending");

      setTimeout(() => {
        handleVerifyChallenge(newChallenge.id);
      }, 5000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : translate(locale, "bridge.errorGeneral"));
      setStep("error");
    }
  };

  const handleVerifyChallenge = async (challengeId: string) => {
    setStep("verifying");

    try {
      const verified = await verifyChallengeReceived(
        challengeId,
        DEFAULT_BRIDGE_ADDRESS,
        network
      );

      if (verified) {
        const verifiedChallenge = getChallenge(challengeId);
        if (verifiedChallenge) {
          setChallenge(verifiedChallenge);
          setStep("verified");
          onVerified();
        }
      } else {
        setErrorMessage(translate(locale, "bridge.errorUnexpected"));
        setStep("pending");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : translate(locale, "bridge.errorGeneral"));
      setStep("error");
    }
  };

  const handleRetry = () => {
    if (challenge) {
      clearChallenge(challenge.id);
    }
    setChallenge(null);
    setStep("idle");
    setErrorMessage("");
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h3 className="font-semibold mb-4">{translate(locale, "cex.howItWorks1")}</h3>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        {translate(locale, "cex.verifyDescription")}
      </p>

      {step === "idle" && (
        <button
          onClick={handleInitiateChallenge}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary)]/90 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          {translate(locale, "cex.howItWorks1")}
        </button>
      )}

      {step === "initiating" && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader className="w-4 h-4 animate-spin" />
          <span className="text-sm">{translate(locale, "bridge.reviewSimulating")}</span>
        </div>
      )}

      {step === "pending" && challenge && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
            <p className="text-sm font-medium mb-2">{translate(locale, "cex.exchangeDetails")}</p>
            <div className="space-y-2 text-xs text-[var(--text-muted)]">
              <div className="flex justify-between">
                <span>{translate(locale, "onramp.amount").replace(" (USD)", "")}:</span>
                <span className="font-mono">{challenge.amount} XLM</span>
              </div>
              <div className="flex justify-between">
                <span>{translate(locale, "cex.bridgedAddressLabel")}:</span>
                <span className="font-mono">{DEFAULT_BRIDGE_ADDRESS.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span>{translate(locale, "dashboard.loading")}:</span>
                <span className="text-[var(--warning)]">{translate(locale, "bridge.successPending")}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleVerifyChallenge(challenge.id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[var(--border)] font-medium hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {translate(locale, "bridge.reviewConfirmSign")}
          </button>
        </div>
      )}

      {step === "verified" && challenge && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/20">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-[var(--success)]" />
              <div>
                <p className="text-sm font-medium text-[var(--success)]">{translate(locale, "bridge.successConfirmed")}!</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {translate(locale, "cex.howItWorks4")}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            {translate(locale, "cex.openWithdrawal", { name: DEFAULT_BRIDGE_ADDRESS })}
          </p>
        </div>
      )}

      {step === "error" && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-[var(--error)] flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-[var(--error)]">{translate(locale, "bridge.transactionFailed")}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{errorMessage}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleRetry}
            className="w-full px-4 py-3 rounded-xl border border-[var(--border)] font-medium hover:bg-[var(--surface-2)] transition-colors"
          >
            {translate(locale, "bridge.errorTryAgain")}
          </button>
        </div>
      )}
    </div>
  );
}
