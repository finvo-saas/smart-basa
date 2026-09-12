'use client'

import { useEffect } from 'react'
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
  ownerSheetClass,
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
import { Textarea } from '@/components/ui/textarea'
import type { Floor, FloorFormData } from '@/types/floor'
import { cn } from '@/lib/utils'

const floorSchema = z.object({
  floorNumber: z.number().min(0, 'Floor number must be 0 or greater'),
  name: z.string().optional(),
  notes: z.string().optional(),
})

interface FloorDialogProps {
  floor?: Floor | null
  buildingId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: FloorFormData) => void
}

export function FloorDialog({
  floor,
  buildingId,
  open,
  onOpenChange,
  onSubmit,
}: FloorDialogProps) {
  const form = useForm<FloorFormData>({
    resolver: zodResolver(floorSchema),
    defaultValues: {
      floorNumber: floor?.floorNumber || 0,
      name: floor?.name || '',
      notes: floor?.notes || '',
    },
  })

  useEffect(() => {
    if (floor) {
      form.reset({
        floorNumber: floor.floorNumber,
        name: floor.name || '',
        notes: floor.notes || '',
      })
    } else {
      form.reset({
        floorNumber: 0,
        name: '',
        notes: '',
      })
    }
  }, [floor, form])

  const handleSubmit = (data: FloorFormData) => {
    onSubmit(data)
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(ownerSheetClass('sm:max-w-md'), 'gap-4 overflow-y-auto p-4 sm:p-6')}>
        <DialogHeader className="pr-8 text-left">
          <DialogTitle>{floor ? 'Edit Floor' : 'Add New Floor'}</DialogTitle>
          <DialogDescription>
            {floor
              ? 'Update floor information and details'
              : 'Add a new floor to this building'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="floorNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Floor Number</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={e =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Floor Name (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Ground Floor, First Floor"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this floor..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">{floor ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
