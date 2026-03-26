import * as React from 'react'
import { cn } from '@/lib/utils'
import { Check, ChevronRight } from 'lucide-react'

interface Step {
  id: string
  title: string
  description?: string
  status: 'pending' | 'active' | 'completed' | 'error'
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (stepIndex: number) => void
  className?: string
}

function Stepper({ steps, currentStep, onStepClick, className }: StepperProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center">
              <button
                onClick={() => onStepClick?.(index)}
                disabled={step.status === 'pending'}
                className={cn(
                  'relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                  step.status === 'completed'
                    ? 'bg-primary border-primary text-primary-foreground'
                    : step.status === 'active'
                    ? 'border-primary text-primary'
                    : step.status === 'error'
                    ? 'border-destructive text-destructive'
                    : 'border-muted-foreground text-muted-foreground',
                  onStepClick && step.status !== 'pending' && 'cursor-pointer hover:opacity-80'
                )}
              >
                {step.status === 'completed' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </button>
              <div className="ml-4 text-left hidden sm:block">
                <div
                  className={cn(
                    'text-sm font-medium',
                    step.status === 'active'
                      ? 'text-primary'
                      : step.status === 'completed'
                      ? 'text-primary'
                      : step.status === 'error'
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </div>
                {step.description && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </div>
                )}
              </div>
            </div>
            {index < steps.length - 1 && (
              <ChevronRight
                className={cn(
                  'w-5 h-5 mx-2 flex-shrink-0',
                  index < currentStep ? 'text-primary' : 'text-muted-foreground'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

interface StepContentProps {
  children: React.ReactNode
  title: string
  description?: string
  isActive: boolean
  isCompleted: boolean
  hasError?: boolean
}

function StepContent({ children, title, description, isActive, isCompleted, hasError }: StepContentProps) {
  return (
    <div
      className={cn(
        'space-y-4',
        !isActive && !isCompleted && 'opacity-50 pointer-events-none'
      )}
    >
      <div className="border-b pb-4">
        <h3 className={cn(
          'text-lg font-semibold',
          hasError ? 'text-destructive' : isActive ? 'text-primary' : 'text-muted-foreground'
        )}>
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="min-h-[200px]">
        {children}
      </div>
    </div>
  )
}

export { Stepper, StepContent, type Step }
