import { useState } from "react";

export function useStepper(totalSteps: number) {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => setCurrentStep((value) => Math.min(value + 1, totalSteps - 1));
  const prev = () => setCurrentStep((value) => Math.max(value - 1, 0));
  const goTo = (index: number) => {
    if (index < 0 || index >= totalSteps) {
      return;
    }
    setCurrentStep(index);
  };

  return {
    currentStep,
    next,
    prev,
    goTo,
    isFirst: currentStep === 0,
    isLast: currentStep === totalSteps - 1,
  };
}
