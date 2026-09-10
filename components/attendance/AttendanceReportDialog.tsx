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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Download } from 'lucide-react'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  formatISO,
} from 'date-fns'

const attendanceReportSchema = z.object({
  reportType: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
})

interface AttendanceReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
}

export function AttendanceReportDialog({
  open,
  onOpenChange,
  onSubmit,
}: AttendanceReportDialogProps) {
  const form = useForm({
    resolver: zodResolver(attendanceReportSchema),
    defaultValues: {
      reportType: 'monthly' as const,
      startDate: '',
      endDate: '',
    },
  })

  useEffect(() => {
    if (open) {
      const today = new Date()
      const monthStart = formatISO(startOfMonth(today), {
        representation: 'date',
      })
      const monthEnd = formatISO(endOfMonth(today), { representation: 'date' })

      form.reset({
        reportType: 'monthly',
        startDate: monthStart,
        endDate: monthEnd,
      })
    }
  }, [open, form])

  const handleReportTypeChange = (type: string) => {
    const today = new Date()
    let startDate = ''
    let endDate = ''

    switch (type) {
      case 'daily': {
        const todayStr = formatISO(today, { representation: 'date' })
        startDate = todayStr
        endDate = todayStr
        break
      }
      case 'weekly':
        startDate = formatISO(startOfWeek(today, { weekStartsOn: 6 }), {
          representation: 'date',
        })
        endDate = formatISO(endOfWeek(today, { weekStartsOn: 6 }), {
          representation: 'date',
        })
        break
      case 'monthly':
        startDate = formatISO(startOfMonth(today), { representation: 'date' })
        endDate = formatISO(endOfMonth(today), { representation: 'date' })
        break
      case 'custom':
        startDate =
          form.getValues('startDate') ||
          formatISO(today, { representation: 'date' })
        endDate =
          form.getValues('endDate') ||
          formatISO(today, { representation: 'date' })
        break
    }

    form.setValue('reportType', type as any)
    form.setValue('startDate', startDate)
    form.setValue('endDate', endDate)
  }

  const handleSubmit = (data: any) => {
    onSubmit(data)
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-2xl gap-4 overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:w-[calc(100%-2rem)] sm:p-6">
        <DialogHeader className="pr-6 text-left sm:pr-8">
          <DialogTitle className="text-balance text-base sm:text-lg">
            Generate Attendance Report
          </DialogTitle>
          <DialogDescription className="text-pretty text-xs sm:text-sm">
            Generate attendance reports for analysis and record-keeping
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5 sm:space-y-6"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="reportType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={value => {
                          field.onChange(value)
                          handleReportTypeChange(value)
                        }}
                        className="grid grid-cols-2 gap-2 sm:gap-4"
                      >
                        <div className="flex items-center space-x-2 rounded-md border p-2 sm:border-0 sm:p-0">
                          <RadioGroupItem value="daily" id="daily" />
                          <label htmlFor="daily" className="cursor-pointer text-sm">
                            Daily
                          </label>
                        </div>
                        <div className="flex items-center space-x-2 rounded-md border p-2 sm:border-0 sm:p-0">
                          <RadioGroupItem value="weekly" id="weekly" />
                          <label htmlFor="weekly" className="cursor-pointer text-sm">
                            Weekly
                          </label>
                        </div>
                        <div className="flex items-center space-x-2 rounded-md border p-2 sm:border-0 sm:p-0">
                          <RadioGroupItem value="monthly" id="monthly" />
                          <label htmlFor="monthly" className="cursor-pointer text-sm">
                            Monthly
                          </label>
                        </div>
                        <div className="flex items-center space-x-2 rounded-md border p-2 sm:border-0 sm:p-0">
                          <RadioGroupItem value="custom" id="custom" />
                          <label htmlFor="custom" className="cursor-pointer text-sm">
                            Custom
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 min-[380px]:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          disabled={form.watch('reportType') !== 'custom'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          disabled={form.watch('reportType') !== 'custom'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
