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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Flat, FlatStatus } from '@/types/building'

const flatSchema = z.object({
  flatNumber: z.string().min(1, 'Flat number is required'),
  floor: z.number().min(0, 'Floor must be 0 or greater'),
  rent: z.number().min(0, 'Rent must be zero or positive'),
  status: z.enum(['available', 'occupied', 'maintenance']),
  area: z.number().min(0).optional().or(z.nan()).transform(v => (Number.isNaN(v) ? undefined : v)),
  bedrooms: z
    .number()
    .min(0)
    .optional()
    .or(z.nan())
    .transform(v => (Number.isNaN(v) ? undefined : v)),
  bathrooms: z
    .number()
    .min(0)
    .optional()
    .or(z.nan())
    .transform(v => (Number.isNaN(v) ? undefined : v)),
})

export type FlatFormValues = {
  flatNumber: string
  floor: number
  rent: number
  status: FlatStatus
  area?: number
  bedrooms?: number
  bathrooms?: number
}

interface FlatFormDialogProps {
  flat?: Flat | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: FlatFormValues) => void | Promise<void>
  /** When editing occupied flats, status stays occupied unless vacated. */
  lockOccupiedStatus?: boolean
  defaultFloor?: number
}

export function FlatFormDialog({
  flat,
  open,
  onOpenChange,
  onSubmit,
  lockOccupiedStatus = false,
  defaultFloor = 1,
}: FlatFormDialogProps) {
  const t = useTranslations('portfolio.flats')
  const isEdit = Boolean(flat)

  const form = useForm<FlatFormValues>({
    resolver: zodResolver(flatSchema) as never,
    defaultValues: {
      flatNumber: '',
      floor: defaultFloor,
      rent: 0,
      status: 'available',
      area: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
    },
  })

  useEffect(() => {
    if (!open) return
    if (flat) {
      form.reset({
        flatNumber: flat.flatNumber,
        floor: flat.floor,
        rent: flat.rent,
        status: flat.status,
        area: flat.area,
        bedrooms: flat.bedrooms,
        bathrooms: flat.bathrooms,
      })
    } else {
      form.reset({
        flatNumber: '',
        floor: defaultFloor,
        rent: 0,
        status: 'available',
        area: undefined,
        bedrooms: undefined,
        bathrooms: undefined,
      })
    }
  }, [flat, open, defaultFloor, form])

  const handleSubmit = async (data: FlatFormValues) => {
    const payload: FlatFormValues = {
      ...data,
      status:
        lockOccupiedStatus && flat?.status === 'occupied'
          ? 'occupied'
          : data.status === 'occupied' && !isEdit
            ? 'available'
            : data.status,
    }
    await onSubmit(payload)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('editFlat') : t('addFlat')}</DialogTitle>
          <DialogDescription>
            {isEdit ? t('editFlatDesc') : t('addFlatDesc')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="flatNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.flatNumber')}</FormLabel>
                  <FormControl>
                    <Input placeholder="A-1 / 3B" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="floor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.floor')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value ?? ''}
                        onChange={e =>
                          field.onChange(parseInt(e.target.value, 10) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.rent')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value ?? ''}
                        onChange={e =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.status')}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={lockOccupiedStatus && flat?.status === 'occupied'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="available">{t('available')}</SelectItem>
                      <SelectItem value="maintenance">
                        {t('maintenance')}
                      </SelectItem>
                      {flat?.status === 'occupied' ? (
                        <SelectItem value="occupied">{t('occupied')}</SelectItem>
                      ) : null}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.bedrooms')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value ?? ''}
                        onChange={e => {
                          const v = e.target.value
                          field.onChange(v === '' ? undefined : parseInt(v, 10))
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bathrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.bathrooms')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value ?? ''}
                        onChange={e => {
                          const v = e.target.value
                          field.onChange(v === '' ? undefined : parseInt(v, 10))
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.area')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value ?? ''}
                        onChange={e => {
                          const v = e.target.value
                          field.onChange(v === '' ? undefined : parseInt(v, 10))
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {isEdit ? t('saveFlat') : t('createFlat')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
