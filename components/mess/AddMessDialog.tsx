'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RichTextEditor, plainTextFromHtml } from '@/components/ui/rich-text-editor'
import type { Mess } from '@/types/mess'
import { createMess, updateMess } from '@/lib/api/mess'
import { deleteMediaFile, uploadMediaFile } from '@/lib/api/media'
import { OwnerMediaPicker } from '@/components/media/OwnerMediaPicker'
import { ListingFacilityPicker } from '@/components/property/ListingFacilityPicker'
import { UtilityBillFields } from '@/components/property/UtilityBillFields'
import { validateFile } from '@/lib/security/file-upload'
import { ImagePlus, Star, Trash2 } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  monthlyFee: z.coerce.number().min(500, 'Minimum fee is ৳500'),
  gender: z.enum(['male', 'female', 'mixed']),
  totalSeats: z.coerce.number().min(0).max(200),
  electricityBill: z.number().min(0).nullable().optional(),
  gasBill: z.number().min(0).nullable().optional(),
  internetBill: z.number().min(0).nullable().optional(),
  waterBill: z.number().min(0).nullable().optional(),
  description: z.string().optional(),
  facilities: z.array(z.string()),
  publishListing: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface AddMessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (mess: Mess) => void
  mess?: Mess | null
}

export function AddMessDialog({
  open,
  onOpenChange,
  onSaved,
  mess = null,
}: AddMessDialogProps) {
  const isEdit = Boolean(mess)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const coverInputRef = useRef<HTMLInputElement>(null)
  const moreInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      name: '',
      address: '',
      city: 'Dhaka',
      monthlyFee: 4000,
      gender: 'male',
      totalSeats: 8,
      electricityBill: null,
      gasBill: null,
      internetBill: null,
      waterBill: null,
      description: '',
      facilities: ['WiFi', 'Security'],
      publishListing: true,
    },
  })

  useEffect(() => {
    if (!open) return
    if (mess) {
      form.reset({
        name: mess.name,
        address: mess.address,
        city: mess.city || 'Dhaka',
        monthlyFee: mess.monthlyFee,
        gender: mess.gender,
        totalSeats: mess.totalSeats,
        electricityBill: mess.electricityBill ?? null,
        gasBill: mess.gasBill ?? null,
        internetBill: mess.internetBill ?? null,
        waterBill: mess.waterBill ?? null,
        description: mess.description || '',
        facilities: mess.facilities?.length ? mess.facilities : ['WiFi'],
        publishListing: Boolean(mess.listingId),
      })
      setImages(mess.images?.length ? [...mess.images] : [])
    } else {
      form.reset({
        name: '',
        address: '',
        city: 'Dhaka',
        monthlyFee: 4000,
        gender: 'male',
        totalSeats: 8,
        electricityBill: null,
        gasBill: null,
        internetBill: null,
        waterBill: null,
        description: '',
        facilities: ['WiFi', 'Security'],
        publishListing: true,
      })
      setImages([])
    }
    setError(null)
  }, [open, mess, form])

  const facilities = form.watch('facilities')

  const uploadFiles = async (files: FileList | null, mode: 'cover' | 'append') => {
    if (!files?.length) return
    setUploading(true)
    setError(null)
    try {
      const uploadedUrls: string[] = []
      for (const file of Array.from(files)) {
        const check = validateFile(file, 'image')
        if (!check.valid) {
          setError(
            check.errorKey === 'fileTooLarge'
              ? `Image is too large (max ${check.errorParams?.max || '5 MB'}).`
              : 'Use JPG, PNG, WebP, or GIF images.',
          )
          setUploading(false)
          return
        }
        const result = await uploadMediaFile(file, 'mess')
        if (!result.ok) {
          setError(result.error)
          setUploading(false)
          return
        }
        uploadedUrls.push(result.data.url)
      }
      setImages(prev => {
        if (mode === 'cover') {
          const rest = prev.filter(url => !uploadedUrls.includes(url))
          return [...uploadedUrls, ...rest]
        }
        const merged = [...prev]
        for (const url of uploadedUrls) {
          if (!merged.includes(url)) merged.push(url)
        }
        return merged
      })
    } finally {
      setUploading(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
      if (moreInputRef.current) moreInputRef.current.value = ''
    }
  }

  const removeImage = async (url: string) => {
    setError(null)
    // Best-effort Spaces delete. Still drop from the form if the object was
    // external / already gone.
    let deleted = await deleteMediaFile({ url, kind: 'mess' })
    if (!deleted.ok) {
      deleted = await deleteMediaFile({ url })
    }
    setImages(prev => prev.filter(item => item !== url))
  }

  const setAsCover = (url: string) => {
    setImages(prev => [url, ...prev.filter(item => item !== url)])
  }

  const onSubmit = async (values: FormValues) => {
    setSaving(true)
    setError(null)
    const payload = {
      name: values.name.trim(),
      address: values.address.trim(),
      city: values.city.trim(),
      monthlyFee: values.monthlyFee,
      gender: values.gender,
      totalSeats: values.totalSeats,
      electricityBill: values.electricityBill ?? null,
      gasBill: values.gasBill ?? null,
      internetBill: values.internetBill ?? null,
      waterBill: values.waterBill ?? null,
      description: values.description?.trim() || '',
      facilities: values.facilities,
      images,
      publishListing: values.publishListing,
    }

    const result =
      isEdit && mess
        ? await updateMess(mess.id, payload)
        : await createMess(payload)

    setSaving(false)
    if (!result.ok) {
      setError(
        result.code === 'UNAUTHORIZED'
          ? 'Session expired. Sign out and sign in again, then retry.'
          : result.error,
      )
      return
    }
    onSaved(result.data)
    onOpenChange(false)
  }

  const descriptionPlain = plainTextFromHtml(form.watch('description') || '')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit mess / hostel' : 'Add mess / hostel'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update profile, photos, seat capacity, and public listing.'
              : 'Create your mess ops profile. Optionally publish it for seekers.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mess name</FormLabel>
                  <FormControl>
                    <Input placeholder="Green Valley Mess" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
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
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full address</FormLabel>
                  <FormControl>
                    <Input placeholder="House, road, area" {...field} />
                  </FormControl>
                  <FormDescription>
                    Used for map / “Around this place” when published.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="monthlyFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly fee (৳)</FormLabel>
                    <FormControl>
                      <Input type="number" min={500} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalSeats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seat capacity</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={200} {...field} />
                    </FormControl>
                    <FormDescription>
                      Creates empty seats you can assign to renters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <UtilityBillFields control={form.control} variant="mess" />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Meals, rules, nearby universities…"
                      minHeight={140}
                    />
                  </FormControl>
                  <FormDescription>
                    {descriptionPlain.length >= 80
                      ? `${descriptionPlain.length} characters — counts toward the trust score.`
                      : `${descriptionPlain.length}/80 characters. A fuller description raises the trust score.`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div>
                <Label className="mb-1 block">Photos</Label>
                <p className="mb-2 text-xs text-muted-foreground">
                  Add at least 3 photos to raise the trust score. First photo is the cover. Uploads go to DigitalOcean Spaces
                  (mess/photos).
                </p>
              </div>

              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={e => uploadFiles(e.target.files, 'cover')}
              />
              <input
                ref={moreInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={e => uploadFiles(e.target.files, 'append')}
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading || saving}
                  onClick={() => coverInputRef.current?.click()}
                >
                  <ImagePlus className="mr-1.5 h-4 w-4" />
                  {images.length ? 'Replace cover' : 'Upload cover'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading || saving}
                  onClick={() => moreInputRef.current?.click()}
                >
                  <ImagePlus className="mr-1.5 h-4 w-4" />
                  Add photos
                </Button>
                {uploading ? (
                  <span className="self-center text-xs text-muted-foreground">
                    Uploading…
                  </span>
                ) : null}
              </div>

              <OwnerMediaPicker
                selected={images}
                onSelect={asset => {
                  setImages(prev =>
                    prev.includes(asset.url)
                      ? prev
                      : prev.length === 0
                        ? [asset.url]
                        : [...prev, asset.url],
                  )
                }}
              />

              {images.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {images.map((url, index) => (
                    <div
                      key={url}
                      className="group relative aspect-[4/3] overflow-hidden rounded-md border bg-muted"
                    >
                      <Image
                        src={url}
                        alt={index === 0 ? 'Cover photo' : `Photo ${index + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {index === 0 ? (
                        <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          Cover
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="absolute left-1.5 top-1.5 rounded bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                          title="Set as cover"
                          onClick={() => setAsCover(url)}
                        >
                          <Star className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="absolute right-1.5 top-1.5 rounded bg-destructive/90 p-1 text-destructive-foreground"
                        title="Remove from Spaces"
                        onClick={() => removeImage(url)}
                        disabled={uploading || saving}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                  No photos yet. Upload a cover to show on the public page.
                </p>
              )}
            </div>

            <ListingFacilityPicker
              value={facilities}
              onChange={next => form.setValue('facilities', next)}
            />

            <FormField
              control={form.control}
              name="publishListing"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5 pr-4">
                    <FormLabel>Publish on marketplace</FormLabel>
                    <FormDescription>
                      Show this mess in public search so seekers can find seats.
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

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving || uploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || uploading}>
                {saving
                  ? 'Saving…'
                  : isEdit
                    ? 'Save changes'
                    : 'Create mess'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
