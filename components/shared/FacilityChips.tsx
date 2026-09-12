import {
  Bus,
  Car,
  Droplets,
  Home,
  Shield,
  Shirt,
  Sparkles,
  Utensils,
  Wifi,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const TONES = [
  'bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-800',
  'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800',
  'bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-200 dark:ring-violet-800',
  'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800',
  'bg-teal-50 text-teal-800 ring-teal-200 dark:bg-teal-950/40 dark:text-teal-200 dark:ring-teal-800',
  'bg-indigo-50 text-indigo-800 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200 dark:ring-indigo-800',
  'bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-800',
] as const

const MATCHERS: Array<{ test: RegExp; icon: LucideIcon; tone: string }> = [
  { test: /wifi|broadband|internet/i, icon: Wifi, tone: TONES[0] },
  { test: /meal|kitchen|dining|food/i, icon: Utensils, tone: TONES[3] },
  { test: /water|filter/i, icon: Droplets, tone: TONES[4] },
  { test: /generator|ips|electric|backup|ac\b/i, icon: Zap, tone: TONES[3] },
  { test: /security|cctv|guard|police/i, icon: Shield, tone: TONES[2] },
  { test: /parking|car/i, icon: Car, tone: TONES[5] },
  { test: /laundry|housekeep|clean/i, icon: Shirt, tone: TONES[1] },
  { test: /bus|metro|lift|balcony|hospital|clinic|light/i, icon: Bus, tone: TONES[0] },
  { test: /bath|room/i, icon: Home, tone: TONES[6] },
]

export function FacilityChips({
  items,
  className,
}: {
  items: string[]
  className?: string
}) {
  if (!items.length) return null

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {items.map((item, index) => {
        const match = MATCHERS.find(row => row.test.test(item))
        const Icon = match?.icon ?? Sparkles
        const tone = match?.tone ?? TONES[index % TONES.length]
        return (
          <span
            key={item}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset',
              tone,
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
            {item}
          </span>
        )
      })}
    </div>
  )
}
