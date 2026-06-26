"use client";

import { useEffect, useState, useCallback, useLayoutEffect } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { useLocale } from "./locale-provider";
import { translate } from "@/lib/i18n";

interface TourStep {
  id: string;
  titleKey: string;
  descKey: string;
  targetKey?: string;
  position?: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "landing",
    titleKey: "tour.welcomeTitle",
    descKey: "tour.welcomeDesc",
    position: "bottom",
  },
  {
    id: "bridge",
    titleKey: "tour.bridgeTitle",
    descKey: "tour.bridgeDesc",
    targetKey: "tour.bridgeTarget",
    position: "bottom",
  },
  {
    id: "wallet",
    titleKey: "tour.walletTitle",
    descKey: "tour.walletDesc",
    targetKey: "tour.walletTarget",
    position: "bottom",
  },
  {
    id: "onramp",
    titleKey: "tour.onrampTitle",
    descKey: "tour.onrampDesc",
    targetKey: "tour.onrampTarget",
    position: "bottom",
  },
  {
    id: "cex",
    titleKey: "tour.cexTitle",
    descKey: "tour.cexDesc",
    targetKey: "tour.cexTarget",
    position: "bottom",
  },
  {
    id: "dashboard",
    titleKey: "tour.dashboardTitle",
    descKey: "tour.dashboardDesc",
    targetKey: "tour.dashboardTarget",
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
  const { locale } = useLocale();

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
    const targetText = step.targetKey ? translate(locale, step.targetKey) : undefined;
    if (!targetText) {
      setHighlightRect(null);
      return;
    }

    const element = document.body.innerText.includes(targetText)
      ? Array.from(document.querySelectorAll("*")).find(
          (el) => {
            const htmlEl = el as HTMLElement;
            return (
              htmlEl.textContent?.includes(targetText) &&
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
  }, [currentStep, locale]);

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
  const stepTitle = translate(locale, step.titleKey);
  const stepDesc = translate(locale, step.descKey);
  const stepOfText = translate(locale, "tour.stepOf", { current: currentStep + 1, total: TOUR_STEPS.length });
  const skipText = translate(locale, "tour.skip");

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
                {stepOfText}
              </div>
              <h3 className="text-lg font-bold text-[var(--foreground)]">
                {stepTitle}
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
            {stepDesc}
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
            {skipText}
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
