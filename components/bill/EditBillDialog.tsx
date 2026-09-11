'use client'

import { useEffect, useState } from 'react'
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
import { Plus, Trash2 } from 'lucide-react'
import type { Bill } from '@/types/bill'
import { patchBill } from '@/lib/api/bills'

const schema = z.object({
  month: z.string().min(1),
  year: z.coerce.number().min(2020).max(2100),
  dueDate: z.string().min(1),
  status: z.enum(['paid', 'unpaid', 'overdue']),
  tenantName: z.string().min(1),
  amount: z.coerce.number().min(0),
  items: z
    .array(
      z.object({
        description: z.string().min(1),
        amount: z.coerce.number().min(0),
        type: z.enum(['rent', 'utility', 'maintenance', 'other']),
      }),
    )
    .min(1),
})

type FormData = z.infer<typeof schema>

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

interface EditBillDialogProps {
  bill: Bill | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (bill: Bill) => void
}

export function EditBillDialog({
  bill,
  open,
  onOpenChange,
  onSaved,
}: EditBillDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const form = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      month: 'January',
      year: new Date().getFullYear(),
      dueDate: '',
      status: 'unpaid',
      tenantName: '',
      amount: 0,
      items: [{ description: 'Rent', amount: 0, type: 'rent' }],
    },
  })
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  useEffect(() => {
    if (!open || !bill) return
    form.reset({
      month: bill.month,
      year: bill.year,
      dueDate: bill.dueDate?.slice(0, 10) || '',
      status: bill.status,
      tenantName: bill.tenantName || '',
      amount: bill.amount,
      items:
        bill.items?.length > 0
          ? bill.items.map(i => ({
              description: i.description,
              amount: i.amount,
              type: (i.type as FormData['items'][0]['type']) || 'other',
            }))
          : [{ description: 'Rent', amount: bill.amount, type: 'rent' }],
    })
    setError(null)
  }, [open, bill, form])

  const itemsWatch = form.watch('items')
  useEffect(() => {
    const total = (itemsWatch || []).reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0,
    )
    form.setValue('amount', total, { shouldDirty: true })
  }, [itemsWatch, form])

  const onSubmit = async (data: FormData) => {
    if (!bill) return
    setSaving(true)
    setError(null)
    const result = await patchBill(bill.id, {
      month: data.month,
      year: data.year,
      dueDate: data.dueDate,
      status: data.status,
      tenantName: data.tenantName,
      amount: data.amount,
      items: data.items.map((item, idx) => ({
        id: bill.items?.[idx]?.id || `tmp-${idx}`,
        description: item.description,
        amount: item.amount,
        type: item.type,
      })),
    })
    setSaving(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onSaved(result.data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit bill</DialogTitle>
          <DialogDescription>
            Update amount, due date, status, and line items for this bill.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tenantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tenant</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {months.map(m => (
                          <SelectItem key={m} value={m}>
                            {m}
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
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>Line items</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ description: '', amount: 0, type: 'other' })
                  }
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add
                </Button>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field: f }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Description" {...f} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.amount`}
                    render={({ field: f }) => (
                      <FormItem className="w-28">
                        <FormControl>
                          <Input type="number" min={0} {...f} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={fields.length <= 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total amount</FormLabel>
                  <FormControl>
                    <Input type="number" readOnly {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
