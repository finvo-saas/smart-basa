'use client'

import { type ReactNode, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

export type OnboardingStep = {
  title: string
  description: string
  icon?: ReactNode
  content?: ReactNode
}

export function OnboardingWizard({
  open,
  onOpenChange,
  title,
  subtitle,
  steps,
  onComplete,
  onSkip,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  steps: OnboardingStep[]
  onComplete: () => void
  onSkip?: () => void
}) {
  const [stepIndex, setStepIndex] = useState(0)
  const step = steps[stepIndex]
  const progress = ((stepIndex + 1) / steps.length) * 100
  const isLast = stepIndex === steps.length - 1

  const handleNext = () => {
    if (isLast) {
      onComplete()
      onOpenChange(false)
      setStepIndex(0)
      return
    }
    setStepIndex(i => i + 1)
  }

  const handleSkip = () => {
    onSkip?.()
    onComplete()
    onOpenChange(false)
    setStepIndex(0)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={v => {
        if (!v) setStepIndex(0)
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-lg gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-4rem)] sm:w-[calc(100%-2rem)] sm:p-0">
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-3 pb-3 pt-5 sm:px-6 sm:pb-4 sm:pt-6">
          <DialogHeader className="space-y-1 pr-8 text-left">
            <div className="mb-1 flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span className="text-[11px] font-medium uppercase tracking-wide sm:text-xs">
                Getting started
              </span>
            </div>
            <DialogTitle className="text-balance text-lg leading-snug sm:text-xl">
              {title}
            </DialogTitle>
            {subtitle ? (
              <DialogDescription className="text-pretty text-xs sm:text-sm">
                {subtitle}
              </DialogDescription>
            ) : null}
          </DialogHeader>
          <div className="mt-3 space-y-2 sm:mt-4">
            <div className="flex flex-col gap-0.5 text-xs text-muted-foreground sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
              <span className="shrink-0 font-medium">
                Step {stepIndex + 1} of {steps.length}
              </span>
              <span className="min-w-0 truncate sm:text-right">{step.title}</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            {step.icon ? (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-12 sm:w-12">
                {step.icon}
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <h3 className="text-balance font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
              {step.content ? (
                <div className="mt-3 min-w-0 sm:mt-4">{step.content}</div>
              ) : null}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 border-t bg-muted/30 px-3 py-3 sm:flex-row sm:justify-between sm:px-6 sm:py-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'w-full sm:w-auto',
              stepIndex === 0 && 'hidden sm:invisible sm:inline-flex'
            )}
            onClick={() => setStepIndex(i => Math.max(0, i - 1))}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
            {onSkip ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={handleSkip}
              >
                Skip for now
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleNext}
            >
              {isLast ? 'Get started' : 'Next'}
              {!isLast ? <ChevronRight className="ml-1 h-4 w-4" /> : null}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
