'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Flat } from '@/types/building'

const vacateSchema = z.object({
  advanceNote: z.string().max(2000).optional(),
  depositReturned: z
    .number()
    .min(0)
    .optional()
    .or(z.nan())
    .transform(v => (Number.isNaN(v) ? undefined : v)),
})

export type VacateFlatValues = {
  advanceNote?: string
  depositReturned?: number
}

interface VacateFlatDialogProps {
  flat: Flat | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onVacate: (flat: Flat, data: VacateFlatValues) => void | Promise<void>
}

export function VacateFlatDialog({
  flat,
  open,
  onOpenChange,
  onVacate,
}: VacateFlatDialogProps) {
  const t = useTranslations('portfolio.flats')

  const form = useForm<VacateFlatValues>({
    resolver: zodResolver(vacateSchema) as never,
    defaultValues: {
      advanceNote: '',
      depositReturned: undefined,
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      advanceNote: '',
      depositReturned: flat?.deposit ?? undefined,
    })
  }, [open, flat, form])

  const handleSubmit = async (data: VacateFlatValues) => {
    if (!flat) return
    await onVacate(flat, {
      advanceNote: data.advanceNote?.trim() || undefined,
      depositReturned: data.depositReturned,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('vacateTitle', { flat: flat?.flatNumber ?? '' })}
          </DialogTitle>
          <DialogDescription>
            {flat?.renter
              ? t('vacateDesc', { renter: flat.renter.name })
              : t('vacateDescGeneric')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="depositReturned"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.depositReturned')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder={
                        flat?.deposit != null
                          ? String(flat.deposit)
                          : t('form.depositReturnedPlaceholder')
                      }
                      value={field.value ?? ''}
                      onChange={e => {
                        const v = e.target.value
                        field.onChange(v === '' ? undefined : parseFloat(v))
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('form.depositReturnedHint')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="advanceNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.advanceNote')}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder={t('form.advanceNotePlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t('form.advanceNoteHint')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={form.formState.isSubmitting}
              >
                {t('confirmVacate')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
