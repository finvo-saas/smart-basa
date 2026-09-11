'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Upload, X } from 'lucide-react'
import Image from 'next/image'
import { getAcceptAttribute, validateFile } from '@/lib/security/file-upload'
import { fetchMyTenancies } from '@/lib/api/buildings'
import { fetchMyMessMemberships } from '@/lib/api/mess'
import type { MyTenancy } from '@/types/building'
import type { MessMember } from '@/types/mess'
import type { ComplaintCategory } from '@/types/complaint'

const complaintSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  category: z.enum(['maintenance', 'billing', 'noise', 'other']),
  /** Format: `building:<buildingId>:<flatId>` or `mess:<messId>` */
  scopeKey: z.string().optional(),
  image: z.instanceof(File).optional(),
})

type ComplaintFormData = z.infer<typeof complaintSchema>

export type ComplaintFormSubmit = {
  title: string
  description: string
  category: ComplaintCategory
  scopeType?: 'mess' | 'building' | 'hotel'
  scopeId?: string
  targetId?: string
  buildingId?: string
  flatId?: string
  messId?: string
  image?: File
}

interface ComplaintFormProps {
  onSubmit: (data: ComplaintFormSubmit) => void
}

type ScopeOption = {
  key: string
  label: string
}

export function ComplaintForm({ onSubmit }: ComplaintFormProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [tenancies, setTenancies] = useState<MyTenancy[]>([])
  const [memberships, setMemberships] = useState<MessMember[]>([])

  const form = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'maintenance',
      scopeKey: '',
    },
  })

  useEffect(() => {
    void Promise.all([
      fetchMyTenancies('active'),
      fetchMyMessMemberships(),
    ]).then(([tenancyRes, messRes]) => {
      const nextTenancies = tenancyRes.ok ? tenancyRes.data : []
      const nextMess = messRes.ok ? messRes.data : []
      setTenancies(nextTenancies)
      setMemberships(nextMess)
      const firstKey =
        nextTenancies[0]
          ? `building:${nextTenancies[0].building.id}:${nextTenancies[0].flat.id}`
          : nextMess[0]
            ? `mess:${nextMess[0].messId}`
            : ''
      if (firstKey) form.setValue('scopeKey', firstKey)
    })
  }, [form])

  const scopeOptions = useMemo((): ScopeOption[] => {
    const opts: ScopeOption[] = tenancies.map(t => ({
      key: `building:${t.building.id}:${t.flat.id}`,
      label: `${t.building.name} · Flat ${t.flat.flatNumber}`,
    }))
    for (const m of memberships) {
      opts.push({
        key: `mess:${m.messId}`,
        label: `Mess · ${m.messName || m.messId}`,
      })
    }
    return opts
  }, [tenancies, memberships])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const result = validateFile(file, 'image')
    if (!result.valid) {
      form.setError('image', { message: 'Invalid image file' })
      e.target.value = ''
      return
    }

    form.setValue('image', result.file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(result.file)
  }

  const removeImage = () => {
    form.setValue('image', undefined)
    setPreview(null)
  }

  const handleSubmit = (data: ComplaintFormData) => {
    const parts = (data.scopeKey || '').split(':')
    const payload: ComplaintFormSubmit = {
      title: data.title,
      description: data.description,
      category: data.category,
      image: data.image,
    }
    if (parts[0] === 'building' && parts[1] && parts[2]) {
      payload.scopeType = 'building'
      payload.scopeId = parts[1]
      payload.targetId = parts[2]
      payload.buildingId = parts[1]
      payload.flatId = parts[2]
    } else if (parts[0] === 'mess' && parts[1]) {
      payload.scopeType = 'mess'
      payload.scopeId = parts[1]
      payload.messId = parts[1]
    }
    onSubmit(payload)
    form.reset({
      title: '',
      description: '',
      category: 'maintenance',
      scopeKey: scopeOptions[0]?.key || '',
    })
    setPreview(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit a maintenance ticket</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {scopeOptions.length > 0 && (
              <FormField
                control={form.control}
                name="scopeKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select flat or mess" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {scopeOptions.map(opt => (
                          <SelectItem key={opt.key} value={opt.key}>
                            {opt.label}
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="noise">Noise</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Water Leakage Issue" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the issue in detail..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Image (Optional)</FormLabel>
              {preview ? (
                <div className="relative">
                  <div className="relative h-48 w-full overflow-hidden rounded-lg border">
                    <Image
                      src={preview}
                      alt="Preview"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 transition-colors hover:border-muted-foreground/50">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Click to upload image</p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept={getAcceptAttribute('image')}
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>

            <Button type="submit" className="w-full">
              Submit ticket
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
