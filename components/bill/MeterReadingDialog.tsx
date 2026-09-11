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
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { fetchOwnerPortfolioSnapshot } from '@/lib/api/buildings'
import { getPreviousMeterReading } from '@/lib/api/bills'
import { ok } from '@/lib/api/http'
import { useMockQuery } from '@/hooks/useMockQuery'
import type { MeterReading } from '@/types/bill'

const optionalMeterValue = z.preprocess(
  value => {
    if (value === '' || value === null || value === undefined) return undefined
    const n = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(n) ? n : undefined
  },
  z.number().min(0).optional(),
)

const optionalId = z.preprocess(
  value => (value === null || value === '' ? undefined : value),
  z.string().optional(),
)

const meterReadingSchema = z
  .object({
    propertyId: z.string().min(1, 'Property is required'),
    propertyType: z.enum(['apartment', 'mess']),
    flatId: optionalId,
    seatId: optionalId,
    month: z.string().min(1, 'Month is required'),
    year: z.coerce.number().min(2020).max(2100),
    electricity: optionalMeterValue,
    gas: optionalMeterValue,
    water: optionalMeterValue,
  })
  .refine(
    data =>
      data.electricity !== undefined ||
      data.gas !== undefined ||
      data.water !== undefined,
    {
      message: 'Enter at least one meter reading',
      path: ['electricity'],
    },
  )

export type MeterReadingFormData = z.infer<typeof meterReadingSchema>

interface MeterReadingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (
    data: MeterReadingFormData & { id?: string },
  ) => void | Promise<void>
  reading?: MeterReading
}

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const currentYear = new Date().getFullYear()
const currentMonth = months[new Date().getMonth()]

const emptyDefaults: MeterReadingFormData = {
  propertyId: '',
  propertyType: 'apartment',
  month: currentMonth,
  year: currentYear,
  electricity: undefined,
  gas: undefined,
  water: undefined,
}

function defaultsFromReading(reading: MeterReading): MeterReadingFormData {
  return {
    propertyId: String(reading.propertyId),
    propertyType: reading.propertyType,
    flatId: reading.flatId ? String(reading.flatId) : undefined,
    seatId: reading.seatId ? String(reading.seatId) : undefined,
    month: reading.month,
    year: reading.year,
    electricity: reading.electricity ?? undefined,
    gas: reading.gas ?? undefined,
    water: reading.water ?? undefined,
  }
}

function parseOptionalNumber(value: string): number | undefined {
  if (value === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

export function MeterReadingDialog({
  open,
  onOpenChange,
  onSubmit,
  reading,
}: MeterReadingDialogProps) {
  const [selectedPropertyType, setSelectedPropertyType] = useState<
    'apartment' | 'mess'
  >(reading?.propertyType || 'apartment')
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    reading?.propertyId || '',
  )
  const [previousReading, setPreviousReading] = useState<
    MeterReading | undefined
  >()
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

  const form = useForm<MeterReadingFormData>({
    resolver: zodResolver(meterReadingSchema) as never,
    defaultValues: emptyDefaults,
  })

  useEffect(() => {
    if (!open) return
    const next = reading ? defaultsFromReading(reading) : { ...emptyDefaults }
    setSelectedPropertyType(next.propertyType)
    setSelectedPropertyId(next.propertyId)
    setPreviousReading(undefined)
    form.reset(next)
  }, [open, reading, form])

  // Mess-only owners should default to Mess property type.
  useEffect(() => {
    if (!open || reading || portfolioLoading) return
    const hasMess = (portfolio?.messList?.length ?? 0) > 0
    const hasBuildings = (portfolio?.buildings?.length ?? 0) > 0
    if (hasMess && !hasBuildings && form.getValues('propertyType') !== 'mess') {
      setSelectedPropertyType('mess')
      form.setValue('propertyType', 'mess')
      form.setValue('propertyId', '')
      setSelectedPropertyId('')
    }
  }, [open, reading, portfolio, portfolioLoading, form])

  const propertyId = form.watch('propertyId')
  const flatId = form.watch('flatId')
  const month = form.watch('month')
  const year = form.watch('year')
  const electricity = form.watch('electricity')
  const gas = form.watch('gas')
  const water = form.watch('water')

  useEffect(() => {
    if (!open || !propertyId || !month || !year) {
      setPreviousReading(undefined)
      return
    }
    let cancelled = false
    getPreviousMeterReading(
      propertyId,
      flatId || undefined,
      undefined,
      month,
      Number(year),
    ).then(prev => {
      if (!cancelled) setPreviousReading(prev)
    })
    return () => {
      cancelled = true
    }
  }, [open, propertyId, flatId, month, year])

  const handleSubmit = async (data: MeterReadingFormData) => {
    setSubmitting(true)
    try {
      await onSubmit({
        ...data,
        flatId: data.flatId || undefined,
        seatId: data.seatId || undefined,
        ...(reading?.id ? { id: reading.id } : {}),
      })
    } finally {
      setSubmitting(false)
    }
  }

  const properties =
    selectedPropertyType === 'apartment'
      ? (portfolio?.buildings ?? [])
      : (portfolio?.messList ?? [])
  const availableFlats = selectedPropertyId
    ? (portfolio?.flats ?? []).filter(f => f.buildingId === selectedPropertyId)
    : []

  const electricityConsumption =
    electricity !== undefined && previousReading?.electricity !== undefined
      ? electricity - previousReading.electricity
      : undefined
  const gasConsumption =
    gas !== undefined && previousReading?.gas !== undefined
      ? gas - previousReading.gas
      : undefined
  const waterConsumption =
    water !== undefined && previousReading?.water !== undefined
      ? water - previousReading.water
      : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-1rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-4rem)]">
        <DialogHeader className="shrink-0 space-y-1 border-b px-4 py-4 text-left sm:px-6">
          <DialogTitle className="pr-8 text-lg sm:text-xl">
            {reading ? 'Edit Meter Reading' : 'Add Meter Reading'}
          </DialogTitle>
          <DialogDescription className="text-pretty text-sm">
            {reading
              ? 'Update the meter reading information'
              : 'Record meter readings for utility bill calculation'}
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
                          form.setValue('flatId', '')
                          setSelectedPropertyId('')
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

                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property</FormLabel>
                      <Select
                        value={field.value || undefined}
                        onValueChange={value => {
                          field.onChange(value)
                          setSelectedPropertyId(value)
                          form.setValue('flatId', '')
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select property" />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {selectedPropertyType === 'apartment' &&
                availableFlats.length > 0 && (
                  <FormField
                    control={form.control}
                    name="flatId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Flat</FormLabel>
                        <Select
                          value={field.value || undefined}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select flat" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableFlats.map(flat => (
                              <SelectItem key={flat.id} value={flat.id}>
                                {flat.flatNumber} - Floor {flat.floor}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Month</FormLabel>
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
                          {months.map(monthName => (
                            <SelectItem key={monthName} value={monthName}>
                              {monthName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {previousReading && (
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Previous Reading
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {previousReading.electricity !== undefined && (
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">
                          Electricity:
                        </span>
                        <span className="font-medium">
                          {previousReading.electricity} units
                        </span>
                      </div>
                    )}
                    {previousReading.gas !== undefined && (
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Gas:</span>
                        <span className="font-medium">
                          {previousReading.gas} units
                        </span>
                      </div>
                    )}
                    {previousReading.water !== undefined && (
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Water:</span>
                        <span className="font-medium">
                          {previousReading.water} units
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  Current Meter Readings
                </Label>

                <FormField
                  control={form.control}
                  name="electricity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Electricity (units)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="Enter current reading"
                          value={field.value ?? ''}
                          onChange={e =>
                            field.onChange(parseOptionalNumber(e.target.value))
                          }
                        />
                      </FormControl>
                      {electricityConsumption !== undefined && (
                        <FormDescription>
                          Consumption:{' '}
                          <Badge variant="outline">
                            {electricityConsumption} units
                          </Badge>
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gas (units)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="Enter current reading"
                          value={field.value ?? ''}
                          onChange={e =>
                            field.onChange(parseOptionalNumber(e.target.value))
                          }
                        />
                      </FormControl>
                      {gasConsumption !== undefined && (
                        <FormDescription>
                          Consumption:{' '}
                          <Badge variant="outline">
                            {gasConsumption} units
                          </Badge>
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="water"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Water (units)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="Enter current reading"
                          value={field.value ?? ''}
                          onChange={e =>
                            field.onChange(parseOptionalNumber(e.target.value))
                          }
                        />
                      </FormControl>
                      {waterConsumption !== undefined && (
                        <FormDescription>
                          Consumption:{' '}
                          <Badge variant="outline">
                            {waterConsumption} units
                          </Badge>
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                disabled={submitting || portfolioLoading}
              >
                {submitting
                  ? 'Saving…'
                  : reading
                    ? 'Update Reading'
                    : 'Save Reading'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
