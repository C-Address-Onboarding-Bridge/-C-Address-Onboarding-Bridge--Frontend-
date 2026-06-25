"use client";

import { useEffect, useState, useCallback, useLayoutEffect } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  position?: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "landing",
    title: "Welcome to C-Address Bridge",
    description:
      "This is a protocol for funding Soroban smart accounts (C-addresses) directly from CEX, credit card, or existing G-address wallets.",
    position: "bottom",
  },
  {
    id: "bridge",
    title: "Bridge Stellar Assets",
    description:
      "Send XLM or other Stellar assets from a G-address wallet directly to a C-address.",
    target: "Bridge",
    position: "bottom",
  },
  {
    id: "wallet",
    title: "Connect Your Wallet",
    description:
      "Click the Connect Wallet button to authenticate with Freighter or Lobstr and start bridging.",
    target: "Connect Wallet",
    position: "bottom",
  },
  {
    id: "onramp",
    title: "Onramp with Moonpay/Transak",
    description:
      "Fund your C-address directly with fiat currency through our integrated onramp partners.",
    target: "Onramp",
    position: "bottom",
  },
  {
    id: "cex",
    title: "CEX Withdrawal Routes",
    description:
      "Check available CEX partners and withdrawal addresses for your account.",
    target: "CEX",
    position: "bottom",
  },
  {
    id: "dashboard",
    title: "Monitor Your Activity",
    description:
      "View transaction history and account balances on your dashboard.",
    target: "Dashboard",
    position: "bottom",
  },
];

interface OnboardingTourProps {
  onComplete?: () => void;
  restartKey?: number;
}

export default function OnboardingTour({ onComplete, restartKey }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("hasSeenOnboardingTour");
    if (!hasSeenTour) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVisible(true);
      localStorage.setItem("hasSeenOnboardingTour", "true");
    }
  }, [restartKey]);

  const updatePosition = useCallback(() => {
    const step = TOUR_STEPS[currentStep];
    if (!step.target) {
      setHighlightRect(null);
      return;
    }

    const element = step.target && document.body.innerText.includes(step.target)
      ? Array.from(document.querySelectorAll("*")).find(
          (el) => {
            const htmlEl = el as HTMLElement;
            return (
              htmlEl.textContent?.includes(step.target!) &&
              htmlEl.offsetHeight > 0 &&
              htmlEl.offsetWidth > 0
            );
          }
        )
      : null;

    if (element) {
      const rect = (element as HTMLElement).getBoundingClientRect();
      setHighlightRect(rect);

      const offset = 16;
      let top = rect.bottom + offset;
      let left = rect.left + rect.width / 2;

      if (step.position === "top") {
        top = rect.top - 200 - offset;
      } else if (step.position === "left") {
        left = rect.left - 320 - offset;
        top = rect.top + rect.height / 2 - 100;
      } else if (step.position === "right") {
        left = rect.right + offset;
        top = rect.top + rect.height / 2 - 100;
      }

      left = Math.max(16, Math.min(left - 160, window.innerWidth - 320 - 16));
      top = Math.max(80, Math.min(top, window.innerHeight - 300));

      setPosition({ top, left });
    }
  }, [currentStep]);

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [updatePosition]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete?.();
  };

  const step = TOUR_STEPS[currentStep];

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed inset-0 z-[90] pointer-events-none">
        {highlightRect && (
          <>
            <div
              className="fixed bg-black/50 pointer-events-auto cursor-default"
              style={{
                top: 0,
                left: 0,
                right: 0,
                height: `${highlightRect.top}px`,
              }}
              onClick={() => {}}
            />
            <div
              className="fixed bg-black/50 pointer-events-auto cursor-default"
              style={{
                top: `${highlightRect.bottom}px`,
                left: 0,
                right: 0,
                bottom: 0,
              }}
              onClick={() => {}}
            />
            <div
              className="fixed bg-black/50 pointer-events-auto cursor-default"
              style={{
                top: `${highlightRect.top}px`,
                left: 0,
                width: `${highlightRect.left}px`,
                height: `${highlightRect.height}px`,
              }}
              onClick={() => {}}
            />
            <div
              className="fixed bg-black/50 pointer-events-auto cursor-default"
              style={{
                top: `${highlightRect.top}px`,
                left: `${highlightRect.right}px`,
                right: 0,
                height: `${highlightRect.height}px`,
              }}
              onClick={() => {}}
            />
            <div
              className="fixed border-2 border-[var(--primary)] rounded-lg pointer-events-none"
              style={{
                top: `${highlightRect.top - 4}px`,
                left: `${highlightRect.left - 4}px`,
                width: `${highlightRect.width + 8}px`,
                height: `${highlightRect.height + 8}px`,
              }}
            />
          </>
        )}
      </div>

      <div
        className="fixed z-[95] w-80 bg-[var(--background)] rounded-lg border border-[var(--border)] shadow-2xl animate-in fade-in slide-in-from-bottom-2"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="text-xs font-medium text-[var(--primary)] mb-2">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </div>
              <h3 className="text-lg font-bold text-[var(--foreground)]">
                {step.title}
              </h3>
            </div>
            <button
              onClick={handleComplete}
              className="flex-shrink-0 p-1 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-[var(--text-muted)] mb-6">
            {step.description}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="p-2 rounded-lg bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-3)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex-1 flex gap-1 justify-center">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentStep
                      ? "bg-[var(--primary)] w-6"
                      : i < currentStep
                        ? "bg-[var(--primary)]/50 w-1.5"
                        : "bg-[var(--border)] w-1.5"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="p-2 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleComplete}
            className="w-full mt-4 px-3 py-2 text-sm font-medium rounded-lg bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[var(--surface-3)] transition-colors"
          >
            Skip Tour
          </button>
        </div>
      </div>
    </>
  );
}

export function useOnboardingTour() {
  const [restartKey, setRestartKey] = useState(0);

  const restartTour = useCallback(() => {
    localStorage.removeItem("hasSeenOnboardingTour");
    setRestartKey((k) => k + 1);
  }, []);

  return { restartTour, restartKey };
}
