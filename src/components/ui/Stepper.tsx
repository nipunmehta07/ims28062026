"use client";

import { HTMLAttributes, forwardRef, ReactNode } from "react";
import { Check } from "lucide-react";
import { Button } from "./Button";

export interface StepperStep {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  status?: "pending" | "active" | "complete" | "error";
}

export interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  steps: StepperStep[];
  currentStep?: string;
  orientation?: "horizontal" | "vertical";
  showNavigation?: boolean;
  onNext?: () => void;
  onBack?: () => void;
  onComplete?: () => void;
  nextLabel?: string;
  backLabel?: string;
  completeLabel?: string;
  canNext?: boolean;
  canBack?: boolean;
}

const statusStyles = {
  pending: {
    circle: "bg-gray-100 dark:bg-zinc-800 text-gray-400 border-2 border-gray-200 dark:border-zinc-700",
    line: "bg-gray-200 dark:bg-zinc-700",
    title: "text-gray-400",
    description: "text-gray-400",
  },
  active: {
    circle: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/20",
    line: "bg-gradient-to-r from-emerald-500 to-teal-500",
    title: "text-gray-900 dark:text-white",
    description: "text-gray-500 dark:text-gray-400",
  },
  complete: {
    circle: "bg-emerald-500 text-white",
    line: "bg-emerald-500",
    title: "text-gray-900 dark:text-white",
    description: "text-gray-500 dark:text-gray-400",
  },
  error: {
    circle: "bg-rose-500 text-white",
    line: "bg-rose-500",
    title: "text-rose-500",
    description: "text-rose-500/70",
  },
};

export const Stepper = forwardRef<HTMLDivElement, StepperProps>(
  ({
    steps,
    currentStep,
    orientation = "horizontal",
    showNavigation = true,
    onNext,
    onBack,
    onComplete,
    nextLabel = "Next",
    backLabel = "Back",
    completeLabel = "Complete",
    canNext = true,
    canBack = true,
    className = "",
    ...props
  }, ref) => {
    const activeIndex = steps.findIndex((s) => s.id === currentStep);

    const getStepStatus = (index: number): NonNullable<StepperStep["status"]> => {
      const step = steps[index];
      if (!step) return "pending";
      if (step.status) return step.status;
      if (index < activeIndex) return "complete";
      if (index === activeIndex) return "active";
      return "pending";
    };

    const isLastStep = activeIndex === steps.length - 1;
    const isFirstStep = activeIndex === 0;

    if (orientation === "vertical") {
      return (
        <div ref={ref} className={`w-full ${className}`} {...props}>
          <div className="space-y-0">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const isLast = index === steps.length - 1;
              
              return (
                <div key={step.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        w-11 h-11 rounded-full flex items-center justify-center
                        transition-all duration-300
                        ${statusStyles[status].circle}
                      `}
                    >
                      {status === "complete" ? (
                        <Check size={20} strokeWidth={3} />
                      ) : status === "error" ? (
                        <span className="text-[12px] font-bold">!</span>
                      ) : step.icon ? (
                        step.icon
                      ) : (
                        <span className="text-[12px] font-bold">{index + 1}</span>
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className={`
                          w-0.5 flex-1 my-2 transition-all duration-500
                          ${statusStyles[status].line}
                          ${status === "active" ? "bg-gradient-to-b from-emerald-500 to-teal-500" : ""}
                        `}
                      />
                    )}
                  </div>
                  <div className={`flex-1 pb-8 ${status === "active" ? "pt-0.5" : ""}`}>
                    <h4 className={`text-[11px] font-bold uppercase tracking-wider ${statusStyles[status].title}`}>
                      {step.title}
                    </h4>
                    {step.description && (
                      <p className={`mt-1 text-[11px] ${statusStyles[status].description}`}>
                        {step.description}
                      </p>
                    )}
                    {status === "active" && step.description && (
                      <div className="mt-4 p-5 bg-gradient-to-br from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-900/50 rounded-xl border border-gray-100 dark:border-zinc-800">
                        {/* Step content rendered here by parent */}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {showNavigation && (
            <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-zinc-800 bg-gradient-to-r from-transparent via-gray-50/50 to-transparent dark:via-zinc-900/50">
              <Button
                variant="ghost"
                onClick={onBack}
                disabled={isFirstStep || !canBack}
              >
                {backLabel}
              </Button>
              <div className="flex-1" />
              <Button
                variant={isLastStep ? "gradient" : "secondary"}
                onClick={isLastStep ? onComplete : onNext}
                disabled={isLastStep ? false : !canNext}
              >
                {isLastStep ? completeLabel : nextLabel}
              </Button>
            </div>
          )}
        </div>
      );
    }

    // Horizontal stepper
    return (
      <div ref={ref} className={`w-full ${className}`} {...props}>
        <div className="flex items-start">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const isLast = index === steps.length - 1;
            
            return (
              <div key={step.id} className="flex flex-1">
                <div className="flex flex-col items-center">
                  {/* Step circle with glow effect for active state */}
                  <div
                    className={`
                      w-11 h-11 rounded-full flex items-center justify-center
                      transition-all duration-300
                      ${statusStyles[status].circle}
                      ${status === "active" ? "scale-110" : ""}
                    `}
                  >
                    {status === "complete" ? (
                      <Check size={20} strokeWidth={3} />
                    ) : status === "error" ? (
                      <span className="text-[12px] font-bold">!</span>
                    ) : step.icon ? (
                      step.icon
                    ) : (
                      <span className="text-[12px] font-bold">{index + 1}</span>
                    )}
                  </div>
                  
                  <div className="mt-3 text-center max-w-[120px]">
                    <h4 className={`text-[10px] font-bold uppercase tracking-wider leading-tight ${statusStyles[status].title}`}>
                      {step.title}
                    </h4>
                    {step.description && (
                      <p className="mt-1 text-[9px] text-gray-500 dark:text-gray-400 hidden sm:block">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Connector line with gradient for completed steps */}
                {!isLast && (
                  <div
                    className={`
                      flex-1 h-0.5 mt-5 mx-3 transition-all duration-500
                      ${index < activeIndex 
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500" 
                        : statusStyles.pending.line
                      }
                    `}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Active step content with glass effect */}
        {activeIndex >= 0 && (
          <div className="mt-8 p-6 bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-zinc-900/80 dark:to-zinc-900/50 backdrop-blur-xl rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            {steps[activeIndex]?.description && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-4">
                {steps[activeIndex].description}
              </p>
            )}
          </div>
        )}

        {showNavigation && (
          <div className="flex items-center gap-3 mt-8">
            <Button
              variant="ghost"
              onClick={onBack}
              disabled={isFirstStep || !canBack}
            >
              {backLabel}
            </Button>
            <div className="flex-1" />
            <Button
              variant={isLastStep ? "gradient" : "secondary"}
              onClick={isLastStep ? onComplete : onNext}
              disabled={isLastStep ? false : !canNext}
            >
              {isLastStep ? completeLabel : nextLabel}
            </Button>
          </div>
        )}
      </div>
    );
  }
);

Stepper.displayName = "Stepper";

export const StepperStep = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  )
);

StepperStep.displayName = "StepperStep";