import { useState } from "react";

export interface Step<T extends string> {
  id: T;
}

export function useMultiStepForm<T extends string>(steps: T[], initial?: T) {
  const [currentStep, setCurrentStep] = useState<T>(initial ?? steps[0]);

  const currentIndex = steps.indexOf(currentStep);

  const goTo = (step: T) => setCurrentStep(step);

  const next = () => {
    if (currentIndex < steps.length - 1) setCurrentStep(steps[currentIndex + 1]);
  };

  const back = () => {
    if (currentIndex > 0) setCurrentStep(steps[currentIndex - 1]);
  };

  return {
    currentStep,
    goTo,
    next,
    back,
    isFirst: currentIndex === 0,
    isLast: currentIndex === steps.length - 1,
  };
}
