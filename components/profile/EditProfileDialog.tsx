'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
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
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { UserRole } from '@/types'
import {
  getAcceptAttribute,
  validateFile,
} from '@/lib/security/file-upload'
import { User } from 'lucide-react'

const profileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  phone: z.string().min(1, 'Phone number is required'),
  whatsappNumber: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileSchema>

export type EditProfileSavePayload = ProfileFormData & { photoFile?: File }

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: {
    name: string
    phone: string
    whatsappNumber?: string
    email?: string
    role: UserRole
    profilePhotoUrl?: string | null
  }
  /** Return true on success so the dialog can close. */
  onSave: (data: EditProfileSavePayload) => Promise<boolean>
}

export function EditProfileDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
}: EditProfileDialogProps) {
  const tContact = useTranslations('contact')
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData.name,
      phone: initialData.phone,
      whatsappNumber: initialData.whatsappNumber || '',
      email: initialData.email || '',
    },
  })
  const [photoFile, setPhotoFile] = useState<File | undefined>()
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    const justOpened = open && !wasOpenRef.current
    wasOpenRef.current = open
    if (!justOpened) return

    form.reset({
      name: initialData.name,
      phone: initialData.phone,
      whatsappNumber: initialData.whatsappNumber || '',
      email: initialData.email || '',
    })
    setPhotoFile(undefined)
    setPhotoPreview(null)
    setPhotoError(null)
    setSaving(false)
  }, [open, initialData, form])

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null)
      return
    }
    const url = URL.createObjectURL(photoFile)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photoFile])

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true)
    setPhotoError(null)
    try {
      const ok = await onSave({ ...data, photoFile })
      if (ok) onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const displayPhoto =
    photoPreview || initialData.profilePhotoUrl || null
  const initials =
    (initialData.name || 'U')
      .split(/\s+/)
      .map(p => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your profile information</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {displayPhoto ? (
                  <AvatarImage src={displayPhoto} alt={initialData.name} />
                ) : null}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor="profile-photo">Profile photo</Label>
                <Input
                  id="profile-photo"
                  type="file"
                  accept={getAcceptAttribute('image')}
                  disabled={saving}
                  onChange={event => {
                    const file = event.target.files?.[0]
                    setPhotoError(null)
                    if (!file) {
                      setPhotoFile(undefined)
                      return
                    }
                    const result = validateFile(file, 'image')
                    if (!result.valid) {
                      setPhotoFile(undefined)
                      setPhotoError(
                        result.errorKey === 'fileTooLarge'
                          ? `File is too large (max ${result.errorParams?.max}).`
                          : 'Use a JPEG, PNG, WebP, or GIF image.',
                      )
                      event.target.value = ''
                      return
                    }
                    setPhotoFile(result.file)
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG, WebP or GIF up to 5 MB.
                </p>
                {photoError && (
                  <p className="text-sm text-destructive">{photoError}</p>
                )}
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your full name"
                      disabled={saving}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} disabled readOnly className="bg-muted" />
                  </FormControl>
                  <FormDescription>
                    Phone is used for login.{' '}
                    <Link
                      href="/account/change-phone"
                      className="text-link font-medium"
                    >
                      Change phone number
                    </Link>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whatsappNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tContact('whatsappNumber')}</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder={tContact('whatsappNumberPlaceholder')}
                        disabled={saving}
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0"
                      disabled={saving}
                      onClick={() =>
                        form.setValue(
                          'whatsappNumber',
                          form.getValues('phone'),
                          { shouldDirty: true },
                        )
                      }
                    >
                      {tContact('sameAsPhone')}
                    </Button>
                  </div>
                  <FormDescription>
                    {tContact('whatsappOwnerHint')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      disabled={saving}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <p className="text-muted-foreground">Role</p>
              <p className="flex items-center gap-2 font-medium capitalize">
                <User className="h-4 w-4" />
                {initialData.role}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Switch role from the role selection screen after login if needed.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
