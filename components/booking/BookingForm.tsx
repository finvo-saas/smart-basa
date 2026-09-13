'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Property } from '@/types/property'
import type { BookingFormData } from '@/types/booking'

const bookingSchema = z.object({
  moveInDate: z.date({ message: 'Move-in date is required' }),
  moveOutDate: z.date().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 month').optional(),
  message: z
    .string()
    .max(500, 'Message must be less than 500 characters')
    .optional(),
  specialRequests: z
    .string()
    .max(500, 'Special requests must be less than 500 characters')
    .optional(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
})

function toApiDate(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfToday(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

interface BookingFormProps {
  property: Property
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (
    data: BookingFormData & { moveInDate: string; moveOutDate?: string }
  ) => void
}

export function BookingForm({
  property,
  open,
  onOpenChange,
  onSubmit,
}: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      moveInDate: undefined,
      moveOutDate: undefined,
      duration: undefined,
      message: '',
      specialRequests: '',
      agreeToTerms: false,
    },
  })

  const handleSubmit = async (data: z.infer<typeof bookingSchema>) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit({
        moveInDate: toApiDate(data.moveInDate),
        moveOutDate: data.moveOutDate ? toApiDate(data.moveOutDate) : undefined,
        duration: data.duration,
        message: data.message,
        specialRequests: data.specialRequests,
        agreeToTerms: data.agreeToTerms,
      })
      form.reset()
      onOpenChange(false)
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : 'Could not complete this booking. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const moveInDate = form.watch('moveInDate')
  const moveOutDate = form.watch('moveOutDate')

  // Calculate duration if both dates are selected
  const calculateDuration = () => {
    if (moveInDate && moveOutDate) {
      const months = Math.ceil(
        (moveOutDate.getTime() - moveInDate.getTime()) /
          (1000 * 60 * 60 * 24 * 30)
      )
      if (months > 0) {
        form.setValue('duration', months)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(ownerSheetClass('sm:max-w-2xl'), 'gap-0')}>
        <DialogHeader className="shrink-0 space-y-1 border-b px-4 pb-3 pr-12 pt-4 text-left sm:px-6 sm:pt-5">
          <DialogTitle className="break-words text-lg leading-snug sm:text-xl">
            {property.instantBook ? 'Instant book' : 'Request to book'}{' '}
            {property.name}
          </DialogTitle>
          <DialogDescription className="break-words">
            {property.instantBook
              ? `Confirm details to instantly reserve this ${property.type}. You will get an approved booking right away.`
              : `Send a booking request for this ${property.type}. The owner typically responds within 24–48 hours.`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6"
          >
            {/* Property Summary */}
            <div className="rounded-lg border bg-muted/50 p-3 sm:p-4">
              <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
                <div className="min-w-0">
                  <p className="break-words font-semibold">{property.name}</p>
                  <p className="break-words text-sm text-muted-foreground">
                    {property.area}, {property.city}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Deposit:{' '}
                    ৳
                    {(
                      property.rent *
                      (property.depositMonths ??
                        (property.type === 'apartment' ? 2 : 1))
                    ).toLocaleString()}{' '}
                    ({property.depositMonths ?? (property.type === 'apartment' ? 2 : 1)}{' '}
                    month
                    {(property.depositMonths ??
                      (property.type === 'apartment' ? 2 : 1)) > 1
                      ? 's'
                      : ''}{' '}
                    rent)
                  </p>
                </div>
                <div className="min-w-0 min-[420px]:text-right">
                  <p className="break-all text-lg font-bold text-primary">
                    ৳{property.rent.toLocaleString()}/month
                  </p>
                  {property.mealIncluded && property.mealCost && (
                    <p className="text-xs text-muted-foreground">
                      + ৳{property.mealCost.toLocaleString()}/month for meals
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Move-in Date */}
            <FormField
              control={form.control}
              name="moveInDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Move-in Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Select move-in date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={date => {
                          field.onChange(date)
                          if (date && moveOutDate && date > moveOutDate) {
                            form.setValue('moveOutDate', undefined)
                          }
                        }}
                        disabled={date => date < startOfToday()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Select your preferred move-in date
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Move-out Date (Optional) */}
            <FormField
              control={form.control}
              name="moveOutDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Move-out Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Select move-out date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={date => {
                          field.onChange(date)
                          calculateDuration()
                        }}
                        disabled={date => {
                          if (!moveInDate) return true
                          return date <= moveInDate
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Select move-out date to calculate duration automatically
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Duration (Optional if move-out date not provided) */}
            {!moveOutDate && (
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (Months)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="e.g., 6"
                        {...field}
                        onChange={e =>
                          field.onChange(
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      How many months do you want to rent?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Message */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message to Owner</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell the owner about yourself and why you're interested..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Introduce yourself to the owner
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Special Requests */}
            <FormField
              control={form.control}
              name="specialRequests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Requests</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special requirements or requests..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Any special requirements
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Terms and Conditions */}
            <FormField
              control={form.control}
              name="agreeToTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>I agree to the terms and conditions</FormLabel>
                    <FormDescription>
                      I confirm the details are accurate and I understand the
                      deposit and cancellation rules for this listing.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Actions */}
            {submitError ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {submitError}
              </p>
            ) : null}

            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-10 w-full whitespace-normal"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-auto min-h-10 w-full whitespace-normal"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {property.instantBook ? 'Booking…' : 'Submitting…'}
                  </>
                ) : property.instantBook ? (
                  'Confirm instant booking'
                ) : (
                  'Submit booking request'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
