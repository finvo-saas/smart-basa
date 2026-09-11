'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import type { Mess } from '@/types/mess'
import { createMess, updateMess } from '@/lib/api/mess'

const FACILITY_OPTIONS = [
  'WiFi',
  'AC',
  'Generator',
  'Security',
  'CCTV',
  'Laundry',
  'Common Kitchen',
  'Parking',
  'Attached Bath',
]

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  monthlyFee: z.coerce.number().min(500, 'Minimum fee is ৳500'),
  gender: z.enum(['male', 'female', 'mixed']),
  totalSeats: z.coerce.number().min(0).max(200),
  description: z.string().optional(),
  imageUrl: z.union([z.string().url(), z.literal('')]).optional(),
  facilities: z.array(z.string()),
  publishListing: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface AddMessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (mess: Mess) => void
  mess?: Mess | null
}

export function AddMessDialog({
  open,
  onOpenChange,
  onSaved,
  mess = null,
}: AddMessDialogProps) {
  const isEdit = Boolean(mess)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      name: '',
      address: '',
      city: 'Dhaka',
      monthlyFee: 4000,
      gender: 'male',
      totalSeats: 8,
      description: '',
      imageUrl: '',
      facilities: ['WiFi', 'Security'],
      publishListing: true,
    },
  })

  useEffect(() => {
    if (!open) return
    if (mess) {
      form.reset({
        name: mess.name,
        address: mess.address,
        city: mess.city || 'Dhaka',
        monthlyFee: mess.monthlyFee,
        gender: mess.gender,
        totalSeats: mess.totalSeats,
        description: mess.description || '',
        imageUrl: mess.images?.[0] || '',
        facilities: mess.facilities?.length ? mess.facilities : ['WiFi'],
        publishListing: Boolean(mess.listingId),
      })
    } else {
      form.reset({
        name: '',
        address: '',
        city: 'Dhaka',
        monthlyFee: 4000,
        gender: 'male',
        totalSeats: 8,
        description: '',
        imageUrl: '',
        facilities: ['WiFi', 'Security'],
        publishListing: true,
      })
    }
    setError(null)
  }, [open, mess, form])

  const facilities = form.watch('facilities')

  const toggleFacility = (f: string) => {
    const current = form.getValues('facilities')
    form.setValue(
      'facilities',
      current.includes(f) ? current.filter(x => x !== f) : [...current, f],
    )
  }

  const onSubmit = async (values: FormValues) => {
    setSaving(true)
    setError(null)
    const images = values.imageUrl ? [values.imageUrl] : mess?.images || []
    const payload = {
      name: values.name.trim(),
      address: values.address.trim(),
      city: values.city.trim(),
      monthlyFee: values.monthlyFee,
      gender: values.gender,
      totalSeats: values.totalSeats,
      description: values.description?.trim() || '',
      facilities: values.facilities,
      images,
      publishListing: values.publishListing,
    }

    const result =
      isEdit && mess
        ? await updateMess(mess.id, payload)
        : await createMess(payload)

    setSaving(false)
    if (!result.ok) {
      setError(
        result.code === 'UNAUTHORIZED'
          ? 'Session expired. Sign out and sign in again, then retry.'
          : result.error,
      )
      return
    }
    onSaved(result.data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit mess / hostel' : 'Add mess / hostel'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update profile, seat capacity, and public listing.'
              : 'Create your mess ops profile. Optionally publish it for seekers.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mess name</FormLabel>
                  <FormControl>
                    <Input placeholder="Green Valley Mess" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Dhaka" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full address</FormLabel>
                  <FormControl>
                    <Input placeholder="House, road, area" {...field} />
                  </FormControl>
                  <FormDescription>
                    Used for map / “Around this place” when published.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="monthlyFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly fee (৳)</FormLabel>
                    <FormControl>
                      <Input type="number" min={500} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalSeats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seat capacity</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={200} {...field} />
                    </FormControl>
                    <FormDescription>
                      Creates empty seats you can assign to renters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Meals, rules, nearby universities…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover photo URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://…"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label className="mb-2 block">Facilities</Label>
              <div className="flex flex-wrap gap-2">
                {FACILITY_OPTIONS.map(f => (
                  <Badge
                    key={f}
                    variant={facilities.includes(f) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleFacility(f)}
                  >
                    {f}
                  </Badge>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="publishListing"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5 pr-4">
                    <FormLabel>Publish on marketplace</FormLabel>
                    <FormDescription>
                      Show this mess in public search so seekers can find seats.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? 'Saving…'
                  : isEdit
                    ? 'Save changes'
                    : 'Create mess'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
