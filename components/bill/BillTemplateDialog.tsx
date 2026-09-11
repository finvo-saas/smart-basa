'use client'

import { useCallback, useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
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
import { Plus, Trash2 } from 'lucide-react'
import type { BillTemplate } from '@/types/bill'
import { fetchOwnerPortfolioSnapshot } from '@/lib/api/buildings'
import { ok } from '@/lib/api/http'
import { useMockQuery } from '@/hooks/useMockQuery'

const billTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  propertyId: z.string().min(1, 'Property is required'),
  propertyType: z.enum(['apartment', 'mess']),
  flatId: z.string().optional(),
  seatId: z.string().optional(),
  isActive: z.boolean(),
  items: z
    .array(
      z.object({
        description: z.string().min(1, 'Description is required'),
        type: z.enum(['rent', 'utility', 'maintenance', 'other']),
        calculationType: z.enum(['fixed', 'meter-based', 'percentage']),
        fixedAmount: z.coerce.number().min(0).optional(),
        unitRate: z.coerce.number().min(0).optional(),
        percentage: z.coerce.number().min(0).max(100).optional(),
        baseItemId: z.string().optional(),
        meterType: z.enum(['electricity', 'gas', 'water']).optional(),
        serviceCharge: z.coerce.number().min(0).optional(),
      }),
    )
    .min(1, 'At least one item is required'),
})

export type BillTemplateFormData = z.infer<typeof billTemplateSchema>

interface BillTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: BillTemplateFormData) => void | Promise<void>
  template?: BillTemplate
}

const emptyDefaults: BillTemplateFormData = {
  name: '',
  description: '',
  propertyId: '',
  propertyType: 'apartment',
  isActive: true,
  items: [
    {
      description: 'Monthly Rent',
      type: 'rent',
      calculationType: 'fixed',
      fixedAmount: 0,
    },
  ],
}

function defaultsFromTemplate(template: BillTemplate): BillTemplateFormData {
  return {
    name: template.name,
    description: template.description,
    propertyId: template.propertyId,
    propertyType: template.propertyType,
    flatId: template.flatId,
    seatId: template.seatId,
    isActive: template.isActive,
    items: template.items.map(item => ({
      description: item.description,
      type: item.type,
      calculationType: item.calculationType,
      fixedAmount: item.fixedAmount,
      unitRate: item.unitRate,
      percentage: item.percentage,
      baseItemId: item.baseItemId,
      meterType: item.meterType,
      serviceCharge: item.serviceCharge,
    })),
  }
}

export function BillTemplateDialog({
  open,
  onOpenChange,
  onSubmit,
  template,
}: BillTemplateDialogProps) {
  const [selectedPropertyType, setSelectedPropertyType] = useState<
    'apartment' | 'mess'
  >(template?.propertyType || 'apartment')
  const [submitting, setSubmitting] = useState(false)

  const loadPortfolio = useCallback(
    () =>
      open
        ? fetchOwnerPortfolioSnapshot()
        : Promise.resolve(ok({ buildings: [], flats: [], messList: [] })),
    [open],
  )
  const { data: portfolio, loading: portfolioLoading } =
    useMockQuery(loadPortfolio)

  const form = useForm<BillTemplateFormData>({
    resolver: zodResolver(billTemplateSchema) as never,
    defaultValues: emptyDefaults,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  useEffect(() => {
    if (!open) return
    const next = template ? defaultsFromTemplate(template) : { ...emptyDefaults }
    setSelectedPropertyType(next.propertyType)
    form.reset(next)
  }, [open, template, form])

  // After portfolio loads: mess-only owners should see Mess type by default.
  useEffect(() => {
    if (!open || template || portfolioLoading) return
    const hasMess = (portfolio?.messList?.length ?? 0) > 0
    const hasBuildings = (portfolio?.buildings?.length ?? 0) > 0
    if (hasMess && !hasBuildings && form.getValues('propertyType') !== 'mess') {
      setSelectedPropertyType('mess')
      form.setValue('propertyType', 'mess')
      form.setValue('propertyId', '')
    }
  }, [open, template, portfolio, portfolioLoading, form])

  const handleSubmit = async (data: BillTemplateFormData) => {
    setSubmitting(true)
    try {
      await onSubmit({
        ...data,
        flatId: data.flatId || undefined,
        seatId: data.seatId || undefined,
        description: data.description || undefined,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const properties =
    selectedPropertyType === 'apartment'
      ? (portfolio?.buildings ?? [])
      : (portfolio?.messList ?? [])
  const items = form.watch('items')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-1rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-4rem)]">
        <DialogHeader className="shrink-0 space-y-1 border-b px-4 py-4 text-left sm:px-6">
          <DialogTitle className="pr-8 text-lg sm:text-xl">
            {template ? 'Edit Bill Template' : 'Create Bill Template'}
          </DialogTitle>
          <DialogDescription className="text-pretty text-sm">
            {template
              ? 'Update the bill template configuration'
              : 'Create a reusable template for automated bill generation'}
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
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Standard Apartment Bill"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={value => {
                          field.onChange(value)
                          setSelectedPropertyType(value as 'apartment' | 'mess')
                          form.setValue('propertyId', '')
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="mess">Mess</SelectItem>
                        </SelectContent>
                      </Select>
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
                        placeholder="Describe what this template is used for..."
                        {...field}
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property</FormLabel>
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                      disabled={portfolioLoading || properties.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              portfolioLoading
                                ? 'Loading properties…'
                                : properties.length === 0
                                  ? 'No properties found'
                                  : 'Select property'
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties.map(prop => (
                          <SelectItem key={prop.id} value={prop.id}>
                            {prop.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!portfolioLoading && properties.length === 0 ? (
                      <FormDescription>
                        {selectedPropertyType === 'mess'
                          ? 'No mess found for this account. Switch Property Type to Apartment, or create a mess first.'
                          : 'No buildings found for this account. Switch Property Type to Mess if you manage a mess, or add a building first.'}
                      </FormDescription>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-3 rounded-lg border p-3 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between sm:p-4">
                    <div className="min-w-0 space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription className="text-pretty">
                        Only active templates are used for automated bill
                        generation
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

              <div className="space-y-3">
                <div className="flex flex-col gap-2 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between">
                  <Label className="text-base font-semibold">Bill Items</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full min-[400px]:w-auto"
                    onClick={() =>
                      append({
                        description: '',
                        type: 'rent',
                        calculationType: 'fixed',
                        fixedAmount: 0,
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>

                {fields.map((field, index) => {
                  const calculationType = form.watch(
                    `items.${index}.calculationType`,
                  )

                  return (
                    <div
                      key={field.id}
                      className="space-y-3 rounded-lg border p-3 sm:p-4"
                    >
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Monthly Rent"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.type`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type</FormLabel>
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
                                  <SelectItem value="rent">Rent</SelectItem>
                                  <SelectItem value="utility">
                                    Utility
                                  </SelectItem>
                                  <SelectItem value="maintenance">
                                    Maintenance
                                  </SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`items.${index}.calculationType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Calculation Type</FormLabel>
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
                                <SelectItem value="fixed">
                                  Fixed Amount
                                </SelectItem>
                                <SelectItem value="meter-based">
                                  Meter Based
                                </SelectItem>
                                <SelectItem value="percentage">
                                  Percentage
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {calculationType === 'fixed' && (
                        <FormField
                          control={form.control}
                          name={`items.${index}.fixedAmount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fixed Amount (৳)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {calculationType === 'meter-based' && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.meterType`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Meter Type</FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select meter type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="electricity">
                                      Electricity
                                    </SelectItem>
                                    <SelectItem value="gas">Gas</SelectItem>
                                    <SelectItem value="water">Water</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.unitRate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Unit Rate (৳ per unit)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    step="0.01"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Amount charged per unit of consumption
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {calculationType === 'percentage' && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.percentage`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Percentage (%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    step="0.1"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.baseItemId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Base Item</FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select base item" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {items
                                      .filter(
                                        (_, idx) =>
                                          idx < index &&
                                          items[idx].type === 'rent',
                                      )
                                      .map((item, idx) => (
                                        <SelectItem
                                          key={idx}
                                          value={idx.toString()}
                                        >
                                          {item.description || `Item ${idx + 1}`}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Calculate percentage of this item
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
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
                disabled={submitting || properties.length === 0}
              >
                {submitting
                  ? 'Saving…'
                  : template
                    ? 'Update Template'
                    : 'Create Template'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
