'use client'

import type { ComponentType } from 'react'
import { useTranslations } from 'next-intl'
import {
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  Car,
  Compass,
  DoorOpen,
  Home,
  Maximize2,
  Sofa,
  UtensilsCrossed,
} from 'lucide-react'
import type { Property } from '@/types/property'
import { useAppFormat } from '@/hooks/useAppFormat'
import { cn } from '@/lib/utils'

const FACE_LABEL: Record<string, string> = {
  north: 'North',
  south: 'South',
  east: 'East',
  west: 'West',
  'north-east': 'North-East',
  'north-west': 'North-West',
  'south-east': 'South-East',
  'south-west': 'South-West',
}

const FURNISHING_LABEL: Record<string, string> = {
  furnished: 'Furnished',
  unfurnished: 'Unfurnished',
  'semi-furnished': 'Semi-furnished',
}

interface ListingOverviewProps {
  property: Property
  className?: string
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/20 px-3 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

/** Bproperty-style fact sheet for apartment (and rich) listings. */
export function ListingOverview({ property, className }: ListingOverviewProps) {
  const t = useTranslations('property.detail')
  const { formatCurrency } = useAppFormat()

  const facts: {
    icon: ComponentType<{ className?: string }>
    label: string
    value: string
  }[] = []

  if (property.bedrooms != null) {
    facts.push({
      icon: BedDouble,
      label: t('overview.bedrooms'),
      value: String(property.bedrooms),
    })
  }
  if (property.bathrooms != null) {
    facts.push({
      icon: Bath,
      label: t('overview.bathrooms'),
      value: String(property.bathrooms),
    })
  }
  if (property.kitchens != null) {
    facts.push({
      icon: UtensilsCrossed,
      label: t('overview.kitchens'),
      value: String(property.kitchens),
    })
  }
  if (property.livingRooms != null) {
    facts.push({
      icon: Sofa,
      label: t('overview.livingRooms'),
      value: String(property.livingRooms),
    })
  }
  if (property.balconies != null) {
    facts.push({
      icon: DoorOpen,
      label: t('overview.balconies'),
      value: String(property.balconies),
    })
  }
  if (property.sizeSqft != null) {
    facts.push({
      icon: Maximize2,
      label: t('overview.size'),
      value: `${property.sizeSqft} sqft`,
    })
  }
  if (property.floorLevel != null) {
    facts.push({
      icon: Building2,
      label: t('overview.floor'),
      value: String(property.floorLevel),
    })
  }
  if (property.unitNumber) {
    facts.push({
      icon: Home,
      label: t('overview.unit'),
      value: property.unitNumber,
    })
  }
  if (property.furnishing) {
    facts.push({
      icon: Sofa,
      label: t('overview.furnishing'),
      value: FURNISHING_LABEL[property.furnishing] || property.furnishing,
    })
  }
  if (property.propertyFace) {
    facts.push({
      icon: Compass,
      label: t('overview.facing'),
      value: FACE_LABEL[property.propertyFace] || property.propertyFace,
    })
  }
  if (property.parkingCount != null) {
    facts.push({
      icon: Car,
      label: t('overview.parking'),
      value: String(property.parkingCount),
    })
  } else if (property.parking != null) {
    facts.push({
      icon: Car,
      label: t('overview.parking'),
      value: property.parking ? t('overview.yes') : t('overview.no'),
    })
  }
  if (property.availableFrom) {
    facts.push({
      icon: CalendarDays,
      label: t('overview.availableFrom'),
      value: property.availableFrom,
    })
  }
  if (property.serviceCharge != null) {
    facts.push({
      icon: Home,
      label: t('overview.serviceCharge'),
      value: `${formatCurrency(property.serviceCharge)}/mo`,
    })
  }

  if (!facts.length) return null

  return (
    <section className={cn('space-y-3', className)}>
      <h2 className="text-lg font-semibold">{t('overview.title')}</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {facts.map(f => (
          <Fact key={f.label} icon={f.icon} label={f.label} value={f.value} />
        ))}
      </div>
    </section>
  )
}
