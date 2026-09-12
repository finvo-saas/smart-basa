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
  DialogHeader,
  DialogTitle,
  ownerSheetClass,
} from '@/components/ui/dialog'
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
import { Button } from '@/components/ui/button'
import type { Flat, Renter } from '@/types/building'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid phone is required'),
  whatsapp: z.string().optional(),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  nid: z.string().min(10, 'NID is required for BD rentals'),
  address: z.string().optional(),
  jobOrInstitute: z.string().optional(),
  deposit: z
    .number()
    .min(0)
    .optional()
    .or(z.nan())
    .transform(v => (Number.isNaN(v) ? undefined : v)),
})

type FormValues = z.infer<typeof schema>

export type AssignRenterPayload = Renter & { deposit?: number }

interface AssignRenterDialogProps {
  flat: Flat | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssign: (flat: Flat, renter: AssignRenterPayload) => void
  /** Edit existing tenancy details instead of assigning a new renter. */
  mode?: 'assign' | 'edit'
}

export function AssignRenterDialog({
  flat,
  open,
  onOpenChange,
  onAssign,
  mode = 'assign',
}: AssignRenterDialogProps) {
  const isEdit = mode === 'edit'
  const tContact = useTranslations('contact')
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      name: '',
      phone: '',
      whatsapp: '',
      email: '',
      nid: '',
      address: '',
      jobOrInstitute: '',
      deposit: undefined,
    },
  })

  useEffect(() => {
    if (!open || !flat) return
    if (isEdit && flat.renter) {
      form.reset({
        name: flat.renter.name || '',
        phone: flat.renter.phone || '',
        whatsapp: flat.renter.whatsapp || '',
        email: flat.renter.email || '',
        nid: flat.renter.nid || '',
        address: flat.renter.address || '',
        jobOrInstitute: '',
        deposit: flat.deposit ?? undefined,
      })
    } else {
      form.reset({
        name: '',
        phone: '',
        whatsapp: '',
        email: '',
        nid: '',
        address: '',
        jobOrInstitute: '',
        deposit: undefined,
      })
    }
  }, [open, flat, isEdit, form])

  const handleSubmit = (data: FormValues) => {
    if (!flat) return
    const renter: AssignRenterPayload = {
      id: flat.renter?.id || `renter-${Date.now()}`,
      name: data.name.trim(),
      phone: data.phone.trim(),
      whatsapp: data.whatsapp?.trim() || undefined,
      email: data.email?.trim() || undefined,
      nid: data.nid.trim(),
      address: data.address?.trim() || data.jobOrInstitute?.trim() || undefined,
      joinedDate:
        flat.renter?.joinedDate || new Date().toISOString().slice(0, 10),
      deposit: data.deposit,
    }
    onAssign(flat, renter)
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(ownerSheetClass('sm:max-w-lg'), 'gap-4 overflow-y-auto p-4 sm:p-6')}>
        <DialogHeader className="pr-8 text-left">
          <DialogTitle>
            {isEdit ? 'Edit renter' : 'Assign renter'}
            {flat ? ` · Flat ${flat.flatNumber}` : ''}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update contact, NID, and deposit for this tenancy.'
              : 'Capture NID and contact details for Bangladesh rental compliance.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input placeholder="Rahim Uddin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="017XXXXXXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NID number</FormLabel>
                    <FormControl>
                      <Input placeholder="13 or 17 digit NID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tContact('whatsappNumber')}</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder={tContact('whatsappNumberPlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0"
                      onClick={() =>
                        form.setValue('whatsapp', form.getValues('phone'), {
                          shouldDirty: true,
                        })
                      }
                    >
                      {tContact('sameAsPhone')}
                    </Button>
                  </div>
                  <FormDescription>
                    {tContact('whatsappRenterHint')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (optional)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="name@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Advance / deposit (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="e.g. 24000"
                      value={field.value ?? ''}
                      onChange={e => {
                        const v = e.target.value
                        field.onChange(v === '' ? undefined : parseFloat(v))
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Security deposit or advance rent collected at move-in.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="jobOrInstitute"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job / institute (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Company or university" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permanent address (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Village, district" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:flex-1">
                {isEdit ? 'Save changes' : 'Assign renter'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
