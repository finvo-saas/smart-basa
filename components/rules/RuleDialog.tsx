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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { MessRule } from '@/types/messRules'

const ruleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum([
    'general',
    'payment',
    'attendance',
    'meal',
    'behavior',
    'facility',
    'other',
  ]),
  severity: z.enum(['minor', 'moderate', 'major', 'critical']),
  penalty: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  requiresAcceptance: z.boolean(),
  effectiveDate: z.string().optional(),
  expiryDate: z.string().optional(),
})

interface RuleDialogProps {
  rule?: MessRule | null
  messId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
}

export function RuleDialog({
  rule,
  messId,
  open,
  onOpenChange,
  onSubmit,
}: RuleDialogProps) {
  const form = useForm({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'general' as const,
      severity: 'minor' as const,
      penalty: '',
      status: 'active' as const,
      requiresAcceptance: true,
      effectiveDate: '',
      expiryDate: '',
    },
  })

  useEffect(() => {
    if (rule && open) {
      form.reset({
        title: rule.title,
        description: rule.description,
        category: rule.category,
        severity: rule.severity,
        penalty: rule.penalty || '',
        status: rule.status === 'inactive' ? 'inactive' : 'active',
        requiresAcceptance: rule.requiresAcceptance,
        effectiveDate: rule.effectiveDate || '',
        expiryDate: rule.expiryDate || '',
      })
    } else if (!rule && open) {
      form.reset({
        title: '',
        description: '',
        category: 'general',
        severity: 'minor',
        penalty: '',
        status: 'active',
        requiresAcceptance: true,
        effectiveDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
      })
    }
  }, [rule, open, form])

  const handleSubmit = (data: any) => {
    onSubmit({
      ...data,
      messId,
    })
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-[50%] top-0 flex h-[100dvh] max-h-[100dvh] w-full max-w-full translate-x-[-50%] translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:top-[50%] sm:h-auto sm:max-h-[85vh] sm:w-[calc(100%-2rem)] sm:max-w-2xl sm:translate-y-[-50%] sm:rounded-lg sm:border sm:p-0">
        <DialogHeader className="shrink-0 space-y-1.5 px-4 pb-2 pr-12 pt-5 text-left sm:px-6 sm:pt-6">
          <DialogTitle className="text-base sm:text-lg">
            {rule ? 'Edit Rule' : 'Create Rule'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Define rules and regulations for your mess
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-2 sm:px-6">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Monthly Fee Payment"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the rule in detail..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category & Severity */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="payment">Payment</SelectItem>
                          <SelectItem value="attendance">Attendance</SelectItem>
                          <SelectItem value="meal">Meal</SelectItem>
                          <SelectItem value="behavior">Behavior</SelectItem>
                          <SelectItem value="facility">Facility</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="minor">Minor</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="major">Major</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Penalty */}
              <FormField
                control={form.control}
                name="penalty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Penalty (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Fine: ৳500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Inactive rules stay saved but are hidden from renters.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Requires Acceptance */}
              <FormField
                control={form.control}
                name="requiresAcceptance"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start justify-between gap-3 rounded-lg border p-3 sm:p-4">
                    <div className="min-w-0 space-y-0.5">
                      <FormLabel>Requires Student Acceptance</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Students must accept this rule before it applies to them
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        className="mt-0.5 shrink-0"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Dates */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="effectiveDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="shrink-0 flex-col-reverse gap-2 border-t bg-background px-4 py-3 sm:flex-row sm:justify-end sm:space-x-0 sm:px-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">{rule ? 'Update' : 'Create'} Rule</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
