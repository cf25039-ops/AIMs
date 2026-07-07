import { cn } from "@/lib/utils";

type Step = {
  title: string;
  description?: string;
};

type StepperProps = {
  steps: Step[];
  currentStep: number;
  onStepClick?: (index: number) => void;
};

export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isComplete = index < currentStep;
        const isClickable = onStepClick && index < currentStep;

        return (
          <div
            key={step.title}
            onClick={isClickable ? () => onStepClick(index) : undefined}
            className={cn(
              "flex min-w-[180px] flex-1 items-center gap-3 rounded-2xl border px-4 py-3 transition",
              isActive && "border-primary bg-primary/5",
              isComplete && "border-emerald-500/20 bg-emerald-500/10",
              isClickable &&
                "cursor-pointer hover:border-primary/40 hover:bg-muted/30 active:scale-[0.99]",
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition",
                isComplete && "bg-emerald-500 text-white",
                isActive && "bg-primary text-primary-foreground",
                !isActive && !isComplete && "bg-muted text-muted-foreground",
              )}
            >
              {index + 1}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{step.title}</p>
              {step.description ? (
                <p className="text-xs text-muted-foreground">{step.description}</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
