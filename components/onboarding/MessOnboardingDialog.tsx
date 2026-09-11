'use client'

import Link from 'next/link'
import { UtensilsCrossed, Users, ClipboardCheck } from 'lucide-react'
import { OnboardingWizard } from './OnboardingWizard'
import { Button } from '@/components/ui/button'
import { useOnboarding } from '@/hooks/useOnboarding'

export function MessOnboardingDialog({
  onAddMess,
}: {
  onAddMess?: () => void
}) {
  const { shouldShow, complete } = useOnboarding('mess')

  return (
    <OnboardingWizard
      open={shouldShow}
      onOpenChange={open => {
        if (!open) complete()
      }}
      title="Welcome to Mess management"
      subtitle="Run your mess or hostel smoothly with these essentials."
      onComplete={complete}
      onSkip={complete}
      steps={[
        {
          title: 'Create your mess profile',
          description:
            'Set up mess name, location, seat capacity, and monthly fee. Optionally publish so seekers can find open seats.',
          icon: <UtensilsCrossed className="h-6 w-6" />,
          content: (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                complete()
                onAddMess?.()
              }}
            >
              Add mess / hostel
            </Button>
          ),
        },
        {
          title: 'Add students & seats',
          description:
            'Assign students to seats, track meal preferences, and manage check-in. Keep your occupancy up to date.',
          icon: <Users className="h-6 w-6" />,
          content: (
            <Button asChild size="sm" variant="secondary">
              <Link href="/mess">Manage renters</Link>
            </Button>
          ),
        },
        {
          title: 'Meals & attendance',
          description:
            'Plan weekly menus, mark daily attendance, and send SMS notices. Parents and students stay informed automatically.',
          icon: <ClipboardCheck className="h-6 w-6" />,
          content: (
            <Button asChild size="sm" variant="secondary">
              <Link href="/mess">Open mess dashboard</Link>
            </Button>
          ),
        },
      ]}
    />
  )
}
