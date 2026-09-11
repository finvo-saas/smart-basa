'use client'

import { useEffect } from 'react'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import type { EmergencyContact } from '@/types/renterProfile'

const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  relation: z.string().min(1, 'Relation is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  isPrimary: z.boolean().default(false),
})

type EmergencyContactFormData = z.infer<typeof emergencyContactSchema>

interface EmergencyContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: EmergencyContact
  onSubmit: (data: EmergencyContactFormData) => void
}

export function EmergencyContactDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: EmergencyContactDialogProps) {
  const form = useForm<EmergencyContactFormData>({
    resolver: zodResolver(emergencyContactSchema),
    defaultValues: {
      name: initialData?.name || '',
      relation: initialData?.relation || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      address: initialData?.address || '',
      isPrimary: initialData?.isPrimary || false,
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      name: initialData?.name || '',
      relation: initialData?.relation || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      address: initialData?.address || '',
      isPrimary: initialData?.isPrimary || false,
    })
  }, [open, initialData, form])

  const handleSubmit = (data: EmergencyContactFormData) => {
    onSubmit(data)
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
          </DialogTitle>
          <DialogDescription>Add an emergency contact person</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Relation */}
            <FormField
              control={form.control}
              name="relation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relation</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Spouse, Brother, Friend"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Primary Contact */}
            <FormField
              control={form.control}
              name="isPrimary"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Primary Contact</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Mark as primary emergency contact
                    </p>
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

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {initialData ? 'Update' : 'Add'} Contact
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
