'use client'

import { useTranslations } from 'next-intl'
import type { Control, FieldValues, Path } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const FIELDS = ['electricityBill', 'gasBill', 'internetBill', 'waterBill'] as const

export type UtilityBills = {
  electricityBill?: number | null
  gasBill?: number | null
  internetBill?: number | null
  waterBill?: number | null
}

export function emptyToBill(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function UtilityBillFields<T extends FieldValues>({
  control,
  variant,
}: {
  control: Control<T>
  variant: 'mess' | 'flat'
}) {
  const t = useTranslations('living.cost')
  const hint = variant === 'mess' ? t('billsMessHint') : t('billsFlatHint')

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <div>
        <p className="text-sm font-medium">{t('billsTitle')}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {FIELDS.map(name => (
          <FormField
            key={name}
            control={control}
            name={name as Path<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t(name)}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="0"
                    value={field.value ?? ''}
                    onChange={event => field.onChange(emptyToBill(event.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{t('billsOptional')}</p>
    </div>
  )
}
