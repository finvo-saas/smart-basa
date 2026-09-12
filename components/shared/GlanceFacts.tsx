import { cn } from '@/lib/utils'

export type GlanceFact = {
  id: string
  value: string
  label: string
  hint?: string
  tone?: 'good' | 'muted' | 'neutral'
  emphasis?: boolean
}

const PALETTE = [
  'bg-emerald-600 hover:bg-emerald-600',
  'bg-sky-600 hover:bg-sky-600',
  'bg-violet-600 hover:bg-violet-600',
  'bg-amber-500 hover:bg-amber-500',
  'bg-rose-600 hover:bg-rose-600',
  'bg-indigo-600 hover:bg-indigo-600',
]

const BY_ID: Record<string, string> = {
  seats: 'bg-emerald-600 hover:bg-emerald-600',
  status: 'bg-emerald-600 hover:bg-emerald-600',
  fee: 'bg-sky-600 hover:bg-sky-600',
  rent: 'bg-sky-600 hover:bg-sky-600',
  gender: 'bg-violet-600 hover:bg-violet-600',
  meals: 'bg-amber-500 hover:bg-amber-500',
  beds: 'bg-indigo-600 hover:bg-indigo-600',
  size: 'bg-teal-600 hover:bg-teal-600',
}

export function GlanceFacts({
  items,
  className,
}: {
  items: GlanceFact[]
  className?: string
}) {
  if (!items.length) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {items.map((item, index) => {
        const color =
          item.tone === 'muted'
            ? 'bg-slate-500 hover:bg-slate-500'
            : BY_ID[item.id] || PALETTE[index % PALETTE.length]
        const text = [item.value, item.label].filter(Boolean).join(' ')
        return (
          <span
            key={item.id}
            className={cn(
              'inline-flex items-center rounded-full border-0 px-3 py-1.5 text-xs font-semibold text-white',
              color,
            )}
          >
            {text}
            {item.hint ? (
              <span className="ml-1.5 font-medium text-white/85">{item.hint}</span>
            ) : null}
          </span>
        )
      })}
    </div>
  )
}
