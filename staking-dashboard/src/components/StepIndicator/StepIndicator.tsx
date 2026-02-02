export interface StepIndicatorProps {
  /** Current active step (1-based) */
  currentStep: number
  /** Total number of steps */
  totalSteps: number
  /** Custom className */
  className?: string
  /** Callback when a completed step is clicked */
  onStepClick?: (step: number) => void
}

/**
 * Step indicator component for multi-step forms
 * Shows progress through numbered steps with connecting lines
 */
export const StepIndicator = ({
  currentStep,
  totalSteps,
  className = "",
  onStepClick
}: StepIndicatorProps) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)

  const isStepClickable = (step: number) => {
    return onStepClick && step < currentStep
  }

  return (
    <div className={`flex items-center w-full overflow-hidden ${className}`}>
      {steps.map((step, index) => (
        <div key={step} className="flex items-center min-w-0 flex-1 last:flex-none">
          {/* Step Number */}
          <button
            onClick={() => isStepClickable(step) && onStepClick!(step)}
            disabled={!isStepClickable(step)}
            className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 font-mono font-bold text-xs sm:text-sm transition-all flex-shrink-0 ${
              currentStep >= step
                ? "bg-chartreuse text-ink"
                : "bg-parchment/20 text-parchment/50"
            } ${isStepClickable(step) ? "cursor-pointer hover:bg-chartreuse/80" : "cursor-default"}`}
          >
            {step}
          </button>

          {/* Connecting Line (don't show after last step) */}
          {index < steps.length - 1 && (
            <div className={`flex-1 h-px mx-1 sm:mx-2 md:mx-4 transition-all min-w-0 ${
              currentStep > step
                ? "bg-chartreuse"
                : "bg-parchment/20"
            }`} />
          )}
        </div>
      ))}
    </div>
  )
};