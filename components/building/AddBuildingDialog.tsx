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
  ownerSheetClass,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Building } from '@/types/building'
import { cn } from '@/lib/utils'
import { createBuilding, patchBuilding } from '@/lib/api/buildings'

const buildingSchema = z.object({
  name: z.string().min(1, 'Building name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  totalFloors: z.coerce.number().min(1, 'Must have at least 1 floor'),
  totalFlats: z.coerce.number().min(1, 'Must have at least 1 flat'),
})

type BuildingFormData = z.infer<typeof buildingSchema>

interface AddBuildingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (building: Building) => void
  /** When set, dialog edits this building instead of creating. */
  building?: Building | null
  onUpdate?: (building: Building) => void
}

export function AddBuildingDialog({
  open,
  onOpenChange,
  onAdd,
  building = null,
  onUpdate,
}: AddBuildingDialogProps) {
  const isEdit = Boolean(building)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const form = useForm<BuildingFormData>({
    resolver: zodResolver(buildingSchema) as never,
    defaultValues: {
      name: '',
      address: '',
      city: 'Dhaka',
      totalFloors: 1,
      totalFlats: 1,
    },
  })

  useEffect(() => {
    if (!open) return
    if (building) {
      form.reset({
        name: building.name,
        address: building.address,
        city: building.city || 'Dhaka',
        totalFloors: building.totalFloors || 1,
        totalFlats: Math.max(1, building.totalFlats || 1),
      })
    } else {
      form.reset({
        name: '',
        address: '',
        city: 'Dhaka',
        totalFloors: 1,
        totalFlats: 1,
      })
    }
    setError(null)
  }, [open, building, form])

  const onSubmit = async (data: BuildingFormData) => {
    setSaving(true)
    setError(null)
    if (isEdit && building) {
      const result = await patchBuilding(building.id, data)
      setSaving(false)
      if (!result.ok) {
        setError(result.error)
        return
      }
      onUpdate?.(result.data)
      onOpenChange(false)
      return
    }
    const result = await createBuilding(data)
    setSaving(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onAdd(result.data)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(ownerSheetClass('sm:max-w-lg'), 'gap-4 overflow-y-auto p-4 sm:p-6')}>
        <DialogHeader className="pr-8 text-left">
          <DialogTitle>{isEdit ? 'Edit Building' : 'Add New Building'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update building name, address, and capacity'
              : 'Enter the details of your new building'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Building Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Green Valley Apartments"
                      {...field}
                    />
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
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., House 45, Road 7, Block C, Mirpur-10"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                name="totalFloors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Floors</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalFlats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Flats</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => {
                  setError(null)
                  onOpenChange(false)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? 'Saving…'
                  : isEdit
                    ? 'Save changes'
                    : 'Add Building'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
