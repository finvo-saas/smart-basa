'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'
import {
  OwnerFocusDialog,
  OwnerOnboardingDialog,
} from '@/components/onboarding'
import { FreeTierLimitBanner } from '@/components/monetization'
import {
  AccountOverviewSection,
  ApartmentOverviewSection,
  HotelOverviewSection,
  MessOverviewSection,
} from './owner'
import { useMockQuery } from '@/hooks/useMockQuery'
import { useOwnerFocus } from '@/hooks/useOwnerFocus'
import { fetchOwnerUsageStatus } from '@/lib/api/subscriptions'
import { ok } from '@/lib/api/http'
import type { OwnerUsageStatus } from '@/types/subscription'
import {
  OWNER_VERTICALS,
  OWNER_VERTICAL_META,
  type OwnerVertical,
} from '@/lib/owner-focus'

interface OwnerDashboardProps {
  ownerId: string
}

const SECTION_ID: Record<OwnerVertical, string> = {
  mess: 'mess-overview',
  apartment: 'apartment-overview',
  hotel: 'hotel-overview',
}

export function OwnerDashboard({ ownerId }: OwnerDashboardProps) {
  const {
    hasVertical,
    focusSelected,
    enabledVerticals,
    primaryFocus,
    needsFocusSelection,
  } = useOwnerFocus()
  const [manageFocusOpen, setManageFocusOpen] = useState(false)

  const loadUsage = useCallback(
    () =>
      focusSelected
        ? fetchOwnerUsageStatus(ownerId)
        : Promise.resolve(ok(null as OwnerUsageStatus | null)),
    [focusSelected, ownerId]
  )
  const { data: usage } = useMockQuery(loadUsage)

  // Primary business first, remaining features in a stable order below it.
  const orderedVerticals = OWNER_VERTICALS.filter(v =>
    enabledVerticals.includes(v)
  ).sort((a, b) => {
    if (a === primaryFocus) return -1
    if (b === primaryFocus) return 1
    return 0
  })

  const lockedVerticals = OWNER_VERTICALS.filter(
    v => !enabledVerticals.includes(v)
  )

  const renderSection = (vertical: OwnerVertical) => {
    switch (vertical) {
      case 'mess':
        return <MessOverviewSection />
      case 'apartment':
        return <ApartmentOverviewSection ownerId={ownerId} />
      case 'hotel':
        return <HotelOverviewSection ownerId={ownerId} />
    }
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <OwnerFocusDialog />
      {hasVertical('apartment') && <OwnerOnboardingDialog />}
      {usage && focusSelected && (
        <FreeTierLimitBanner
          usage={usage}
          verticals={enabledVerticals}
          compact
        />
      )}

      {focusSelected && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="space-y-3 p-3 pb-2 sm:p-6 sm:pb-2">
            <CardTitle className="flex flex-col gap-2 text-base min-[360px]:flex-row min-[360px]:flex-wrap min-[360px]:items-center min-[360px]:justify-between">
              <span className="flex min-w-0 items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                Your business focus
              </span>
              <Button
                size="sm"
                variant="outline"
                className="w-full shrink-0 min-[360px]:w-auto"
                onClick={() => setManageFocusOpen(true)}
              >
                Edit / expand
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 px-3 pb-3 text-sm sm:px-6 sm:pb-6">
            {orderedVerticals.map(v => (
              <Link
                key={v}
                href={`#${SECTION_ID[v]}`}
                className="rounded-md border bg-background px-3 py-1.5 hover:bg-muted"
              >
                {OWNER_VERTICAL_META[v].label}
                {primaryFocus === v ? ' · primary' : ''}
              </Link>
            ))}
            {lockedVerticals.length > 0 && (
              <p className="w-full text-xs text-muted-foreground">
                Hidden for now:{' '}
                {lockedVerticals
                  .map(v => OWNER_VERTICAL_META[v].label)
                  .join(', ')}
                . Use Edit / expand to add them.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {!needsFocusSelection && (
        <div className="space-y-6 md:space-y-8">
          {orderedVerticals.map(v => (
            <div key={v} id={SECTION_ID[v]} className="scroll-mt-24">
              {renderSection(v)}
            </div>
          ))}
          <AccountOverviewSection ownerId={ownerId} />
        </div>
      )}

      <OwnerFocusDialog
        mode="manage"
        open={manageFocusOpen}
        onOpenChange={setManageFocusOpen}
      />
    </div>
  )
}
