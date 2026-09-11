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
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { JobInfo } from '@/types/renterProfile'

const jobInfoSchema = z.object({
  type: z.enum(['employed', 'student', 'unemployed', 'self_employed']),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  instituteName: z.string().optional(),
  studentId: z.string().optional(),
  department: z.string().optional(),
  employmentStartDate: z.date().optional(),
})

type JobInfoFormData = z.infer<typeof jobInfoSchema>

interface JobInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: JobInfo
  onSubmit: (data: JobInfoFormData) => void
}

export function JobInfoDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: JobInfoDialogProps) {
  const form = useForm<JobInfoFormData>({
    resolver: zodResolver(jobInfoSchema),
    defaultValues: {
      type: initialData?.type || 'student',
      jobTitle: initialData?.jobTitle || '',
      company: initialData?.company || '',
      instituteName: initialData?.instituteName || '',
      studentId: initialData?.studentId || '',
      department: initialData?.department || '',
      employmentStartDate: initialData?.employmentStartDate
        ? new Date(initialData.employmentStartDate)
        : undefined,
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      type: initialData?.type || 'student',
      jobTitle: initialData?.jobTitle || '',
      company: initialData?.company || '',
      instituteName: initialData?.instituteName || '',
      studentId: initialData?.studentId || '',
      department: initialData?.department || '',
      employmentStartDate: initialData?.employmentStartDate
        ? new Date(initialData.employmentStartDate)
        : undefined,
    })
  }, [open, initialData, form])

  const jobType = form.watch('type')

  const handleSubmit = (data: JobInfoFormData) => {
    onSubmit(data)
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Job / Institute Information</DialogTitle>
          <DialogDescription>
            Add your employment or educational information
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="employed">Employed</SelectItem>
                      <SelectItem value="self_employed">
                        Self Employed
                      </SelectItem>
                      <SelectItem value="unemployed">Unemployed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Student Fields */}
            {jobType === 'student' && (
              <>
                <FormField
                  control={form.control}
                  name="instituteName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institute Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter institute name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter student ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter department" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Employed Fields */}
            {jobType === 'employed' && (
              <>
                <FormField
                  control={form.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter job title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter department" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employmentStartDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Employment Start Date</FormLabel>
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
                                <span>Select date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={date => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Self Employed Fields */}
            {jobType === 'self_employed' && (
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Occupation</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter occupation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                Save
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
