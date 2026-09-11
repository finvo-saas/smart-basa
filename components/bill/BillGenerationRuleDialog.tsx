'use client'

import { useCallback, useEffect, useState } from 'react'
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
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { BillGenerationRule } from '@/types/bill'
import { fetchBillsBoard } from '@/lib/api/bills'
import { fetchOwnerPortfolioSnapshot } from '@/lib/api/buildings'
import { ok } from '@/lib/api/http'
import { useMockQuery } from '@/hooks/useMockQuery'

const optionalId = z.preprocess(
  value => (value === null || value === '' ? undefined : value),
  z.string().optional(),
)

const optionalPropertyType = z.preprocess(
  value => (value === null || value === '' || value === 'all' ? undefined : value),
  z.enum(['apartment', 'mess']).optional(),
)

const billRuleSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  description: z.preprocess(
    value => (value === null ? undefined : value),
    z.string().optional(),
  ),
  propertyId: optionalId,
  propertyType: optionalPropertyType,
  templateId: z.string().min(1, 'Template is required'),
  schedule: z.object({
    type: z.enum(['monthly', 'weekly', 'custom']),
    dayOfMonth: z.coerce.number().min(1).max(31).optional(),
    dayOfWeek: z.coerce.number().min(0).max(6).optional(),
    customDays: z.array(z.coerce.number()).optional(),
    generateBeforeDays: z.coerce.number().min(0).optional(),
    dueDateDay: z.coerce.number().min(1).max(31).optional(),
  }),
  isActive: z.boolean(),
})

export type BillRuleFormData = z.infer<typeof billRuleSchema>

interface BillGenerationRuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (
    data: BillRuleFormData & { id?: string },
  ) => void | Promise<void>
  rule?: BillGenerationRule
}

const daysOfWeek = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

const emptyDefaults: BillRuleFormData = {
  name: '',
  description: '',
  propertyId: undefined,
  propertyType: undefined,
  templateId: '',
  schedule: {
    type: 'monthly',
    dayOfMonth: 1,
    generateBeforeDays: 0,
    dueDateDay: 5,
  },
  isActive: true,
}

function defaultsFromRule(rule: BillGenerationRule): BillRuleFormData {
  return {
    name: rule.name,
    description: rule.description || undefined,
    propertyId: rule.propertyId ? String(rule.propertyId) : undefined,
    propertyType: rule.propertyType || undefined,
    templateId: String(rule.templateId),
    schedule: {
      type: rule.schedule?.type || 'monthly',
      dayOfMonth: rule.schedule?.dayOfMonth ?? 1,
      dayOfWeek: rule.schedule?.dayOfWeek,
      customDays: rule.schedule?.customDays,
      generateBeforeDays: rule.schedule?.generateBeforeDays ?? 0,
      dueDateDay: rule.schedule?.dueDateDay ?? 5,
    },
    isActive: rule.isActive,
  }
}

export function BillGenerationRuleDialog({
  open,
  onOpenChange,
  onSubmit,
  rule,
}: BillGenerationRuleDialogProps) {
  const [selectedPropertyType, setSelectedPropertyType] = useState<
    'apartment' | 'mess' | 'all'
  >(rule?.propertyType || 'all')
  const [submitting, setSubmitting] = useState(false)

  const loadBoard = useCallback(
    () =>
      open
        ? fetchBillsBoard()
        : Promise.resolve(
            ok({
              bills: [],
              templates: [],
              rules: [],
              meterReadings: [],
              buildings: [],
              flats: [],
              renters: [],
              messList: [],
            }),
          ),
    [open],
  )
  const { data: billsBoard, loading: boardLoading } = useMockQuery(loadBoard)

  const loadPortfolio = useCallback(
    () =>
      open
        ? fetchOwnerPortfolioSnapshot()
        : Promise.resolve(ok({ buildings: [], flats: [], messList: [] })),
    [open],
  )
  const { data: portfolio, loading: portfolioLoading } =
    useMockQuery(loadPortfolio)

  const form = useForm<BillRuleFormData>({
    resolver: zodResolver(billRuleSchema) as never,
    defaultValues: emptyDefaults,
  })

  useEffect(() => {
    if (!open) return
    const next = rule ? defaultsFromRule(rule) : { ...emptyDefaults }
    setSelectedPropertyType(next.propertyType || 'all')
    form.reset(next)
  }, [open, rule, form])

  // Mess-only owners: default property type to Mess so templates filter usefully.
  useEffect(() => {
    if (!open || rule || portfolioLoading) return
    const hasMess = (portfolio?.messList?.length ?? 0) > 0
    const hasBuildings = (portfolio?.buildings?.length ?? 0) > 0
    if (
      hasMess &&
      !hasBuildings &&
      form.getValues('propertyType') === undefined
    ) {
      setSelectedPropertyType('mess')
      form.setValue('propertyType', 'mess')
    }
  }, [open, rule, portfolio, portfolioLoading, form])

  const scheduleType = form.watch('schedule.type')
  const propertyType = form.watch('propertyType')

  const handleSubmit = async (data: BillRuleFormData) => {
    setSubmitting(true)
    try {
      await onSubmit({
        ...data,
        description: data.description || undefined,
        propertyId: data.propertyId || undefined,
        propertyType: data.propertyType || undefined,
        ...(rule?.id ? { id: rule.id } : {}),
      })
    } finally {
      setSubmitting(false)
    }
  }

  const buildings = portfolio?.buildings?.length
    ? portfolio.buildings
    : (billsBoard?.buildings ?? [])
  const messList = portfolio?.messList?.length
    ? portfolio.messList
    : (billsBoard?.messList ?? [])
  const properties =
    selectedPropertyType === 'all'
      ? []
      : selectedPropertyType === 'apartment'
        ? buildings
        : messList

  const availableTemplates = (billsBoard?.templates ?? []).filter(t => {
    if (!t.isActive) return false
    if (propertyType && t.propertyType !== propertyType) return false
    return true
  })

  const loading = boardLoading || portfolioLoading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-1rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-4rem)]">
        <DialogHeader className="shrink-0 space-y-1 border-b px-4 py-4 text-left sm:px-6">
          <DialogTitle className="pr-8 text-lg sm:text-xl">
            {rule ? 'Edit Generation Rule' : 'Create Generation Rule'}
          </DialogTitle>
          <DialogDescription className="text-pretty text-sm">
            {rule
              ? 'Update the automated bill generation rule'
              : 'Set up rules for automatic bill generation'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rule Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Monthly Auto Bill Generation"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bill Template</FormLabel>
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableTemplates.map(template => (
                            <SelectItem
                              key={template.id}
                              value={template.id}
                            >
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {availableTemplates.length === 0 && (
                        <FormDescription>
                          {loading
                            ? 'Loading templates…'
                            : 'Create an active bill template first'}
                        </FormDescription>
                      )}
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this rule does..."
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Type (Optional)</FormLabel>
                      <Select
                        value={field.value || 'all'}
                        onValueChange={value => {
                          const val =
                            value === 'all'
                              ? undefined
                              : (value as 'apartment' | 'mess')
                          field.onChange(val)
                          setSelectedPropertyType(
                            value as 'apartment' | 'mess' | 'all',
                          )
                          form.setValue('propertyId', undefined)
                          form.setValue('templateId', '')
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="mess">Mess</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Leave as &quot;All Types&quot; to apply to all properties
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedPropertyType !== 'all' && (
                  <FormField
                    control={form.control}
                    name="propertyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property (Optional)</FormLabel>
                        <Select
                          value={field.value || 'all'}
                          onValueChange={value =>
                            field.onChange(value === 'all' ? undefined : value)
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">All Properties</SelectItem>
                            {properties.map(prop => (
                              <SelectItem key={prop.id} value={prop.id}>
                                {prop.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Leave as &quot;All Properties&quot; to apply to all of
                          this type
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="space-y-4 rounded-lg border p-3 sm:p-4">
                <Label className="text-base font-semibold">
                  Schedule Configuration
                </Label>

                <FormField
                  control={form.control}
                  name="schedule.type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schedule Type</FormLabel>
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
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {scheduleType === 'monthly' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="schedule.dayOfMonth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Day of Month</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min={1}
                              max={31}
                              placeholder="1-31"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Day of month to generate bills
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="schedule.generateBeforeDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Generate Before (Days)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              placeholder="0"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Generate bills X days before the scheduled date
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {scheduleType === 'weekly' && (
                  <FormField
                    control={form.control}
                    name="schedule.dayOfWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day of Week</FormLabel>
                        <Select
                          value={
                            field.value === undefined || field.value === null
                              ? undefined
                              : String(field.value)
                          }
                          onValueChange={value =>
                            field.onChange(parseInt(value, 10))
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select day" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {daysOfWeek.map(day => (
                              <SelectItem
                                key={day.value}
                                value={day.value.toString()}
                              >
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="schedule.dueDateDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date Day</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={31}
                          placeholder="5"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Day of month when bills are due (default: 5)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between gap-3 rounded-lg border p-3 sm:p-4">
                    <div className="min-w-0 space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Only active rules will run automatically
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
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={submitting}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={submitting || loading}
              >
                {submitting
                  ? 'Saving…'
                  : rule
                    ? 'Update Rule'
                    : 'Create Rule'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
