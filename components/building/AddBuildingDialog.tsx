'use client'

import { useEffect, useRef, useState } from 'react'
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
import { createBuilding, fetchFloorsByBuilding, patchBuilding } from '@/lib/api/buildings'

const buildingSchema = z.object({
  name: z.string().min(1, 'Building name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  totalFloors: z.coerce.number().int().min(1, 'Must have at least 1 floor').max(100),
})

type BuildingFormData = z.infer<typeof buildingSchema>

interface FloorRow {
  floorNumber: number
  flatCount: number
  occupied: number
}

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
  const [layoutReady, setLayoutReady] = useState(false)
  const [floorRows, setFloorRows] = useState<FloorRow[]>([
    { floorNumber: 1, flatCount: 1, occupied: 0 },
  ])
  const floorRowsRef = useRef(floorRows)
  floorRowsRef.current = floorRows
  const form = useForm<BuildingFormData>({
    resolver: zodResolver(buildingSchema) as never,
    defaultValues: {
      name: '',
      address: '',
      city: 'Dhaka',
      totalFloors: 1,
    },
  })

  useEffect(() => {
    if (!open) return
    let cancelled = false

    const load = async () => {
      setLayoutReady(false)
      setError(null)
      if (!building) {
        form.reset({
          name: '',
          address: '',
          city: 'Dhaka',
          totalFloors: 1,
        })
        setFloorRows([{ floorNumber: 1, flatCount: 1, occupied: 0 }])
        floorRowsRef.current = [{ floorNumber: 1, flatCount: 1, occupied: 0 }]
        setLayoutReady(true)
        return
      }

      form.reset({
        name: building.name,
        address: building.address,
        city: building.city || 'Dhaka',
        totalFloors: Math.max(1, building.totalFloors || 1),
      })

      const floorsResult = await fetchFloorsByBuilding(building.id)
      if (cancelled) return
      const floors = floorsResult.ok ? floorsResult.data : []
      const byNumber = new Map(floors.map(floor => [floor.floorNumber, floor]))
      const highest = Math.max(
        building.totalFloors || 1,
        ...floors.map(floor => floor.floorNumber),
        1,
      )
      const numbers = new Set<number>()
      for (let number = 1; number <= highest; number += 1) numbers.add(number)
      floors.forEach(floor => numbers.add(floor.floorNumber))
      const rows = [...numbers]
        .sort((a, b) => a - b)
        .map(floorNumber => {
          const existing = byNumber.get(floorNumber)
          return {
            floorNumber,
            flatCount: existing?.totalFlats ?? (floors.length === 0 && floorNumber === 1
              ? Math.max(1, building.totalFlats || 1)
              : 1),
            occupied: existing?.occupiedFlats ?? 0,
          }
        })
      const nextRows = rows.length
        ? rows
        : [{ floorNumber: 1, flatCount: Math.max(1, building.totalFlats || 1), occupied: 0 }]
      setFloorRows(nextRows)
      floorRowsRef.current = nextRows
      form.setValue('totalFloors', nextRows.length)
      setLayoutReady(true)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open, building, form])

  const applyFloorRows = (next: FloorRow[], message: string | null = null) => {
    floorRowsRef.current = next
    setFloorRows(next)
    setError(message)
    form.setValue('totalFloors', next.length)
  }

  const resizeFloors = (count: number) => {
    const nextCount = Math.min(100, Math.max(1, count || 1))
    const current = floorRowsRef.current
    if (nextCount === current.length) {
      form.setValue('totalFloors', nextCount)
      return
    }
    if (nextCount > current.length) {
      const start = current.reduce((max, row) => Math.max(max, row.floorNumber), 0)
      const added = Array.from({ length: nextCount - current.length }, (_, index) => ({
        floorNumber: start + index + 1,
        flatCount: 1,
        occupied: 0,
      }))
      applyFloorRows([...current, ...added])
      return
    }
    const blocked = current.slice(nextCount).find(row => row.occupied > 0)
    if (blocked) {
      applyFloorRows(
        current,
        `Floor ${blocked.floorNumber} still has ${blocked.occupied} occupied flat${blocked.occupied === 1 ? '' : 's'}. Vacate them before removing that floor.`,
      )
      return
    }
    applyFloorRows(current.slice(0, nextCount))
  }

  const updateFlatCount = (floorNumber: number, value: number) => {
    setFloorRows(current => {
      const next = current.map(row => {
        if (row.floorNumber !== floorNumber) return row
        const count = Number.isFinite(value)
          ? Math.max(row.occupied, Math.min(50, value))
          : row.occupied
        return { ...row, flatCount: count }
      })
      floorRowsRef.current = next
      return next
    })
  }

  const totalFlats = floorRows.reduce((sum, row) => sum + row.flatCount, 0)

  const onSubmit = async (data: BuildingFormData) => {
    if (totalFlats < 1) {
      setError('Add at least one flat.')
      return
    }
    setSaving(true)
    setError(null)
    const payload = {
      ...data,
      totalFloors: floorRows.length,
      totalFlats,
      floorLayouts: floorRows.map(row => ({
        floorNumber: row.floorNumber,
        flatCount: row.flatCount,
      })),
    }
    if (isEdit && building) {
      const result = await patchBuilding(building.id, payload)
      setSaving(false)
      if (!result.ok) {
        setError(result.error)
        return
      }
      onUpdate?.(result.data)
      onOpenChange(false)
      return
    }
    const result = await createBuilding(payload)
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
              ? 'Update the building, then set how many flats each floor has. Occupied flats stay in place.'
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    <FormLabel>Total floors</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        name={field.name}
                        ref={field.ref}
                        value={field.value}
                        onBlur={() => {
                          const next = Math.min(
                            100,
                            Math.max(1, Number(field.value) || floorRows.length),
                          )
                          field.onChange(next)
                          resizeFloors(next)
                        }}
                        onChange={event => {
                          field.onChange(event.target.value)
                          const next = parseInt(event.target.value, 10)
                          if (!Number.isFinite(next)) return
                          if (Math.abs(next - floorRows.length) === 1) {
                            resizeFloors(next)
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Flats on each floor</p>
                <p className="text-xs text-muted-foreground">{totalFlats} total</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Floors can have different counts. New flats are added as available.
              </p>
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border p-2">
                {floorRows.map(row => (
                  <div
                    key={row.floorNumber}
                    className="grid grid-cols-[minmax(0,1fr)_6.5rem] items-center gap-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        Floor {row.floorNumber}
                      </p>
                      {row.occupied > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {row.occupied} occupied
                        </p>
                      )}
                    </div>
                    <Input
                      type="number"
                      min={row.occupied}
                      max={50}
                      aria-label={`Flats on floor ${row.floorNumber}`}
                      value={row.flatCount}
                      disabled={!layoutReady}
                      onChange={event =>
                        updateFlatCount(
                          row.floorNumber,
                          parseInt(event.target.value, 10),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
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
              <Button type="submit" disabled={saving || !layoutReady}>
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
