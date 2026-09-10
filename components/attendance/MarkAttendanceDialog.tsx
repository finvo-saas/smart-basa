'use client'

import { useEffect, useCallback } from 'react'
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Clock } from 'lucide-react'
import { fetchMessStudents } from '@/lib/api/mess'
import { ok } from '@/lib/api/http'
import { useMockQuery } from '@/hooks/useMockQuery'

const markAttendanceSchema = z
  .object({
    studentIds: z.array(z.string()).min(1, 'Select at least one student'),
    date: z.string().min(1, 'Date is required'),
    type: z.enum(['general', 'meal', 'both']),
    status: z.enum(['present', 'absent', 'late', 'excused']),
    mealStatus: z.enum(['meal_attended', 'meal_absent']),
    checkInTime: z.string().optional(),
    checkOutTime: z.string().optional(),
    mealCategory: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
    notes: z.string().optional(),
  })
  .refine(data => data.type === 'general' || Boolean(data.mealCategory), {
    message: 'Choose which meal this record covers',
    path: ['mealCategory'],
  })

interface MarkAttendanceDialogProps {
  messId: string
  date?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
}

export function MarkAttendanceDialog({
  messId,
  date,
  open,
  onOpenChange,
  onSubmit,
}: MarkAttendanceDialogProps) {
  const loadStudents = useCallback(
    () => (open ? fetchMessStudents(messId) : Promise.resolve(ok([]))),
    [open, messId]
  )
  const { data: students } = useMockQuery(loadStudents)
  const messStudents = (students ?? []).filter(s => s.seatNumber) // Only students with assigned seats

  const form = useForm({
    resolver: zodResolver(markAttendanceSchema),
    defaultValues: {
      studentIds: [] as string[],
      date: date || new Date().toISOString().split('T')[0],
      type: 'both',
      status: 'present',
      mealStatus: 'meal_attended',
      checkInTime: '',
      checkOutTime: '',
      mealCategory: undefined,
      notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      const today = date || new Date().toISOString().split('T')[0]
      form.reset({
        studentIds: [],
        date: today,
        type: 'both',
        status: 'present',
        mealStatus: 'meal_attended',
        checkInTime: '',
        checkOutTime: '',
        mealCategory: undefined,
        notes: '',
      })
    }
  }, [open, date, form])

  const handleSubmit = (data: any) => {
    onSubmit(data)
    form.reset()
    onOpenChange(false)
  }

  const selectedCount = (form.watch('studentIds') ?? []).length
  const attendanceType = form.watch('type')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-[50%] top-0 flex h-[100dvh] max-h-[100dvh] w-full max-w-full translate-x-[-50%] translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:top-[50%] sm:h-auto sm:max-h-[85vh] sm:w-[calc(100%-2rem)] sm:max-w-2xl sm:translate-y-[-50%] sm:rounded-lg sm:border sm:p-0">
        <DialogHeader className="shrink-0 space-y-1.5 px-3 pb-2 pt-5 pr-10 text-left sm:px-6 sm:pt-6 sm:pr-12">
          <DialogTitle className="text-balance text-base sm:text-lg">
            Mark Attendance
          </DialogTitle>
          <DialogDescription className="text-pretty text-xs sm:text-sm">
            Mark attendance for students on a specific date
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2 sm:px-6">
              <div className="space-y-4 pb-2">
                {/* Date */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Students Selection */}
                <FormField
                  control={form.control}
                  name="studentIds"
                  render={({ field }) => (
                    <FormItem>
                      <div className="mb-2 flex flex-col gap-2 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
                        <FormLabel className="mb-0">Select Students</FormLabel>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1 min-[380px]:flex-none"
                            onClick={() =>
                              field.onChange(messStudents.map(s => s.id))
                            }
                          >
                            Select All
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1 min-[380px]:flex-none"
                            onClick={() => field.onChange([])}
                          >
                            Deselect All
                          </Button>
                        </div>
                      </div>
                      <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-2 sm:p-4">
                        {messStudents.length === 0 ? (
                          <p className="py-4 text-center text-sm text-muted-foreground">
                            No students assigned to this mess
                          </p>
                        ) : (
                          messStudents.map(student => (
                            <div
                              key={student.id}
                              className="flex items-center space-x-2 rounded-lg border p-2 hover:bg-muted/50"
                            >
                              <Checkbox
                                id={`student-${student.id}`}
                                checked={field.value.includes(student.id)}
                                onCheckedChange={() =>
                                  field.onChange(
                                    field.value.includes(student.id)
                                      ? field.value.filter(
                                          (id: string) => id !== student.id
                                        )
                                      : [...field.value, student.id]
                                  )
                                }
                              />
                              <label
                                htmlFor={`student-${student.id}`}
                                className="min-w-0 flex-1 cursor-pointer text-sm"
                              >
                                <span className="break-words">
                                  {student.name}{' '}
                                  {student.seatNumber &&
                                    `(Seat ${student.seatNumber})`}
                                </span>
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Type */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attendance Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={value => {
                          field.onChange(value)
                          if (value === 'general') {
                            form.setValue('mealCategory', undefined)
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">
                            Stay Only (in the mess)
                          </SelectItem>
                          <SelectItem value="meal">Meal Only</SelectItem>
                          <SelectItem value="both">Stay &amp; Meal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Stay counts towards the attendance rate. Meal counts
                        towards the meal attendance rate.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Stay status */}
                {attendanceType !== 'meal' && (
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stay Status</FormLabel>
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
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="excused">Excused</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Meal status + category */}
                {attendanceType !== 'general' && (
                  <>
                    <FormField
                      control={form.control}
                      name="mealStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meal Status</FormLabel>
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
                              <SelectItem value="meal_attended">
                                Meal Attended
                              </SelectItem>
                              <SelectItem value="meal_absent">
                                Meal Absent
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mealCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meal Category</FormLabel>
                          <Select
                            value={field.value || ''}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select meal category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="breakfast">
                                Breakfast
                              </SelectItem>
                              <SelectItem value="lunch">Lunch</SelectItem>
                              <SelectItem value="dinner">Dinner</SelectItem>
                              <SelectItem value="snack">Snack</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {/* Check-in/Check-out Times */}
                <div
                  className={
                    attendanceType === 'meal'
                      ? 'hidden'
                      : 'grid grid-cols-1 gap-4 min-[380px]:grid-cols-2'
                  }
                >
                  <FormField
                    control={form.control}
                    name="checkInTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Check-in Time
                        </FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="checkOutTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Check-out Time
                        </FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="shrink-0 flex-col-reverse gap-2 border-t bg-background px-3 py-3 sm:flex-row sm:justify-end sm:space-x-0 sm:px-6">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full whitespace-normal sm:w-auto"
                disabled={selectedCount === 0}
              >
                Mark Attendance ({selectedCount} student
                {selectedCount !== 1 ? 's' : ''})
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
