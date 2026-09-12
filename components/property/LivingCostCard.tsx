'use client'

import { useTranslations } from 'next-intl'
import { useAppFormat } from '@/hooks/useAppFormat'
import type { LivingCost } from '@/types/living'

const ROWS: Array<keyof Pick<
  LivingCost,
  'rent' | 'serviceCharge' | 'electricity' | 'gas' | 'internet' | 'water' | 'transport' | 'meals'
>> = ['rent', 'serviceCharge', 'electricity', 'gas', 'internet', 'water', 'transport', 'meals']

export function LivingCostCard({ cost }: { cost: LivingCost }) {
  const t = useTranslations('living.cost')
  const { formatCurrency } = useAppFormat()

  return (
    <div className="rounded-xl border p-5">
      <p className="text-sm font-semibold">{t('title')}</p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {ROWS.map(key =>
          cost[key] ? (
            <li key={key} className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{t(key)}</span>
              <span>{formatCurrency(cost[key])}</span>
            </li>
          ) : null
        )}
      </ul>
      <div className="mt-3 flex items-baseline justify-between border-t pt-3">
        <span className="font-semibold">{t('total')}</span>
        <span className="text-xl font-bold text-primary">
          {formatCurrency(cost.total)}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{cost.note || t('note')}</p>
    </div>
  )
}
