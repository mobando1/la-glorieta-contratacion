"use client";

interface StepInfo {
  id: string;
  title: string;
  shortTitle: string;
}

export function StepIndicator({
  steps,
  currentStep,
}: {
  steps: StepInfo[];
  currentStep: number;
}) {
  return (
    <div className="w-full">
      {/* Desktop: full step circles with labels */}
      <div className="hidden sm:flex sm:items-center sm:justify-between">
        {steps.map((step, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;

          return (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isCompleted
                      ? "bg-primary-600 text-white"
                      : isCurrent
                        ? "bg-primary-100 text-primary-700 ring-2 ring-primary-600 ring-offset-2"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isCompleted ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`mt-1.5 text-[10px] font-medium ${
                    isCurrent ? "text-primary-700" : isCompleted ? "text-primary-600" : "text-gray-400"
                  }`}
                >
                  {step.shortTitle}
                </span>
              </div>
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="mx-1 h-0.5 flex-1">
                  <div
                    className={`h-full rounded-full transition-colors ${
                      i < currentStep ? "bg-primary-600" : "bg-gray-200"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: compact step counter */}
      <div className="flex items-center justify-between sm:hidden">
        <span className="text-sm font-medium text-primary-700">
          Paso {currentStep + 1} de {steps.length}
        </span>
        <span className="text-sm text-gray-500">
          {steps[currentStep]?.title}
        </span>
      </div>

      {/* Mobile: progress bar */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 sm:hidden">
        <div
          className="h-full rounded-full bg-primary-600 transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
