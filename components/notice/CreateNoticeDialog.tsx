'use client'

import { useEffect, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  CalendarIcon,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Notice } from '@/types/mess'
import { toast } from '@/lib/feedback/toast'
import { getAcceptAttribute, validateFile } from '@/lib/security/file-upload'

const noticeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  content: z.string().min(1, 'Content is required'),
  priority: z.enum(['high', 'medium', 'low']),
  category: z.enum([
    'general',
    'payment',
    'maintenance',
    'event',
    'announcement',
    'rule',
    'other',
  ]),
  expiryDate: z.date().optional(),
})

type NoticeFormData = z.infer<typeof noticeSchema>

interface CreateNoticeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  messId?: string
  messes?: { id: string; name: string }[]
  buildings?: { id: string; name: string }[]
  defaultTargetId?: string
  notice?: Notice | null
  onSubmit: (
    data: NoticeFormData & {
      pdfFile?: File
      imageFiles?: File[]
      targetType: 'mess' | 'building'
      targetId: string
      noticeId?: string
    },
  ) => void
}

const categoryOptions = [
  { value: 'general', label: 'General' },
  { value: 'payment', label: 'Payment' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'event', label: 'Event' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'rule', label: 'Rule' },
  { value: 'other', label: 'Other' },
]

export function CreateNoticeDialog({
  open,
  onOpenChange,
  messId,
  messes = [],
  buildings = [],
  defaultTargetId,
  notice = null,
  onSubmit,
}: CreateNoticeDialogProps) {
  const isEdit = Boolean(notice)
  const [pdfFile, setPdfFile] = useState<File | undefined>()
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [pdfPreview, setPdfPreview] = useState<string | undefined>()
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const targetOptions = [
    ...messes.map(m => ({
      value: `mess:${m.id}`,
      label: `Mess · ${m.name}`,
    })),
    ...buildings.map(b => ({
      value: `building:${b.id}`,
      label: `Building · ${b.name}`,
    })),
  ]
  const initialTarget =
    (defaultTargetId &&
      targetOptions.find(o => o.value.endsWith(`:${defaultTargetId}`))
        ?.value) ||
    (messId ? `mess:${messId}` : targetOptions[0]?.value) ||
    ''
  const [targetValue, setTargetValue] = useState(initialTarget)
  const form = useForm<NoticeFormData>({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      title: '',
      content: '',
      priority: 'medium',
      category: 'general',
      expiryDate: undefined,
    },
  })

  useEffect(() => {
    if (!open) return
    if (notice) {
      const scopeType =
        notice.scopeType === 'building' || notice.source === 'building'
          ? 'building'
          : 'mess'
      const scopeId =
        notice.scopeId || notice.buildingId || notice.messId || ''
      setTargetValue(`${scopeType}:${scopeId}`)
      form.reset({
        title: notice.title,
        content: notice.content,
        priority: notice.priority,
        category: (notice.category as NoticeFormData['category']) || 'general',
        expiryDate: notice.expiryDate
          ? new Date(notice.expiryDate)
          : undefined,
      })
    } else {
      setTargetValue(initialTarget)
      form.reset({
        title: '',
        content: '',
        priority: 'medium',
        category: 'general',
        expiryDate: undefined,
      })
    }
    setPdfFile(undefined)
    setImageFiles([])
    setPdfPreview(undefined)
    setImagePreviews([])
  }, [open, notice, form, initialTarget])

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const result = validateFile(file, 'pdf')
    if (!result.valid) {
      toast.error('Please select a valid PDF under 5 MB')
      e.target.value = ''
      return
    }
    setPdfFile(result.file)
    setPdfPreview(URL.createObjectURL(result.file))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validImages: File[] = []
    for (const file of files) {
      const result = validateFile(file, 'image')
      if (result.valid) validImages.push(result.file)
    }
    if (validImages.length !== files.length) {
      toast.warning('Some files were skipped (invalid type or too large)')
    }
    setImageFiles(prev => [...prev, ...validImages])
    validImages.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        setImagePreviews(prev => [...prev, ev.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const handleFormSubmit = (data: NoticeFormData) => {
    const [targetType, targetId] = (targetValue || '').split(':') as [
      'mess' | 'building',
      string,
    ]
    if (!targetId) {
      toast.error('Select a mess or building')
      return
    }
    onSubmit({
      ...data,
      pdfFile,
      imageFiles: imageFiles.length ? imageFiles : undefined,
      targetType,
      targetId,
      noticeId: notice?.id,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Notice' : 'Create Notice'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update notice content, priority, and expiry'
              : 'Publish a notice to tenants in a mess or building'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4"
          >
            {!isEdit && (
              <div className="space-y-2">
                <Label>Target</Label>
                <Select value={targetValue} onValueChange={setTargetValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mess or building" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter notice title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write the notice details…"
                      className="min-h-[120px]"
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
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expiry date (optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
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
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Leave empty for notices that stay active indefinitely
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>PDF attachment (optional)</Label>
              <Input
                type="file"
                accept={getAcceptAttribute('pdf')}
                onChange={handlePdfChange}
              />
              {pdfPreview && (
                <div className="flex items-center gap-2 rounded border p-2 text-sm">
                  <FileText className="h-4 w-4" />
                  <span className="flex-1 truncate">{pdfFile?.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setPdfFile(undefined)
                      setPdfPreview(undefined)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Images (optional)</Label>
              <Input
                type="file"
                accept={getAcceptAttribute('image')}
                multiple
                onChange={handleImageChange}
              />
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {imagePreviews.map((src, i) => (
                    <div
                      key={i}
                      className="relative h-16 w-16 overflow-hidden rounded border"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute right-0 top-0 bg-background/80 p-0.5"
                        onClick={() => {
                          setImageFiles(prev => prev.filter((_, idx) => idx !== i))
                          setImagePreviews(prev =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {isEdit ? 'Save changes' : 'Publish notice'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
