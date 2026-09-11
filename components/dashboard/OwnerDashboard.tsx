'use client'

import { useState } from 'react'
import {
  OwnerFocusDialog,
  OwnerOnboardingDialog,
} from '@/components/onboarding'
import {
  AccountOverviewSection,
  ApartmentOverviewSection,
  BusinessFocusIntroBanner,
  HotelOverviewSection,
  MessOverviewSection,
} from './owner'
import { useOwnerFocus } from '@/hooks/useOwnerFocus'
import {
  OWNER_VERTICALS,
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

  const orderedVerticals = OWNER_VERTICALS.filter(v =>
    enabledVerticals.includes(v),
  ).sort((a, b) => {
    if (a === primaryFocus) return -1
    if (b === primaryFocus) return 1
    return 0
  })

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

      {focusSelected && (
        <BusinessFocusIntroBanner
          onEdit={() => setManageFocusOpen(true)}
        />
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
