'use client'

import { Building2, Hotel, LayoutGrid, School, UtensilsCrossed } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DiscoverCategory = 'all' | 'mess' | 'apartment' | 'hostel' | 'hotel'

const TABS: {
  id: DiscoverCategory
  icon: typeof LayoutGrid
}[] = [
  { id: 'all', icon: LayoutGrid },
  { id: 'mess', icon: UtensilsCrossed },
  { id: 'apartment', icon: Building2 },
  { id: 'hostel', icon: School },
  { id: 'hotel', icon: Hotel },
]

export function DiscoverCategoryTabs({
  value,
  onChange,
  labels,
}: {
  value: DiscoverCategory
  onChange: (next: DiscoverCategory) => void
  labels: Record<DiscoverCategory, string>
}) {
  return (
    <div
      role="tablist"
      aria-label="Search category"
      className="flex w-full min-w-0 flex-wrap gap-2"
    >
      {TABS.map(tab => {
        const Icon = tab.icon
        const active = value === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
              active
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {labels[tab.id]}
          </button>
        )
      })}
    </div>
  )
}
