'use client'

import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useTranslations } from 'next-intl'
import { Loader2, Upload, X } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MemberAvatar } from '@/components/mess/MemberAvatar'
import {
  OCCUPANT_TYPES,
  showsInstitutionFields,
  showsWorkFields,
} from '@/components/mess/occupantType'
import type { Mess, MessMember, Seat } from '@/types/mess'
import type { MessMemberInput } from '@/lib/api/mess'
import { fetchMessSeats } from '@/lib/api/mess'
import { uploadMediaFile } from '@/lib/api/media'
import { OwnerMediaPicker } from '@/components/media/OwnerMediaPicker'
import { ok } from '@/lib/api/http'
import { useMockQuery } from '@/hooks/useMockQuery'
import { toast } from '@/lib/feedback/toast'

/** Sentinel because a Radix SelectItem cannot hold an empty value. */
const NO_SEAT = '__none__'

const memberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  whatsappNumber: z.string().optional(),
  occupantType: z.enum(['student', 'job_holder', 'business', 'family', 'other']),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  studentId: z.string().optional(),
  university: z.string().optional(),
  organization: z.string().optional(),
  designation: z.string().optional(),
  seatNumber: z.string().optional(),
  joinedDate: z.string().optional(),
  monthlyFee: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  nidNumber: z.string().optional(),
  permanentAddress: z.string().optional(),
  notes: z.string().optional(),
})

type MemberFormData = z.infer<typeof memberSchema>

interface MemberFormDialogProps {
  mess: Mess | null
  /** Present = edit an existing renter; absent = assign a new one. */
  member?: MessMember | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Return true when the save succeeded so the dialog can close itself. */
  onSubmit: (input: MessMemberInput) => Promise<boolean>
}

function toFormValues(
  member: MessMember | null | undefined,
  mess: Mess | null
): MemberFormData {
  return {
    name: member?.name ?? '',
    phone: member?.phone ?? '',
    whatsappNumber: member?.whatsappNumber ?? '',
    occupantType: member?.occupantType ?? 'student',
    email: member?.email ?? '',
    studentId: member?.studentId ?? '',
    university: member?.university ?? '',
    organization: member?.organization ?? '',
    designation: member?.designation ?? '',
    seatNumber: member?.seatNumber ?? '',
    joinedDate:
      member?.joinedDate ?? new Date().toISOString().split('T')[0],
    monthlyFee: String(member?.monthlyFee ?? mess?.monthlyFee ?? ''),
    emergencyContactName: member?.emergencyContactName ?? '',
    emergencyContactPhone: member?.emergencyContactPhone ?? '',
    nidNumber: member?.nidNumber ?? '',
    permanentAddress: member?.permanentAddress ?? '',
    notes: member?.notes ?? '',
  }
}

export function MemberFormDialog({
  mess,
  member,
  open,
  onOpenChange,
  onSubmit,
}: MemberFormDialogProps) {
  const t = useTranslations('mess.members')
  const tc = useTranslations('common')
  const tContact = useTranslations('contact')
  const isEdit = Boolean(member)

  const loadSeats = useCallback(
    () =>
      open && mess ? fetchMessSeats(mess.id) : Promise.resolve(ok([] as Seat[])),
    [open, mess]
  )
  const { data: seatsData } = useMockQuery(loadSeats)

  const [photoUrl, setPhotoUrl] = useState(member?.photoUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: toFormValues(member, mess),
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(member, mess))
      setPhotoUrl(member?.photoUrl ?? '')
    }
  }, [open, member, mess, form])

  const occupantType = form.watch('occupantType')
  const name = form.watch('name')

  // A renter keeps their own seat in the list so editing doesn't drop it.
  const seatOptions = (seatsData ?? [])
    .filter(
      s =>
        s.messId === mess?.id &&
        (s.status === 'available' || s.seatNumber === member?.seatNumber)
    )
    .map(s => s.seatNumber)

  const handlePhoto = async (file?: File) => {
    if (!file) return
    setUploading(true)
    // Linked system users store photos on the account (profile);
    // unlinked members keep photos on the membership row.
    const kind = member?.userId ? 'profile' : 'mess_member'
    const uploaded = await uploadMediaFile(file, kind)
    setUploading(false)
    if (!uploaded.ok) {
      toast.error(uploaded.error)
      return
    }
    setPhotoUrl(uploaded.data.url)
  }

  const handleSubmit = async (data: MemberFormData) => {
    const fee = data.monthlyFee?.trim()
    const input: MessMemberInput = {
      name: data.name,
      phone: data.phone,
      whatsappNumber: data.whatsappNumber?.trim() || '',
      email: data.email || '',
      occupantType: data.occupantType,
      photoUrl,
      // Institution and work fields are kept exclusive so a type change
      // doesn't leave a stale university on a job holder.
      studentId: showsInstitutionFields(data.occupantType)
        ? data.studentId || ''
        : '',
      university: showsInstitutionFields(data.occupantType)
        ? data.university || ''
        : '',
      organization: showsWorkFields(data.occupantType)
        ? data.organization || ''
        : '',
      designation: showsWorkFields(data.occupantType)
        ? data.designation || ''
        : '',
      seatNumber: data.seatNumber || '',
      joinedDate: data.joinedDate || undefined,
      monthlyFee: fee ? Number(fee) : undefined,
      emergencyContactName: data.emergencyContactName || '',
      emergencyContactPhone: data.emergencyContactPhone || '',
      nidNumber: data.nidNumber || '',
      permanentAddress: data.permanentAddress || '',
      notes: data.notes || '',
    }
    setSaving(true)
    const saved = await onSubmit(input)
    setSaving(false)
    if (saved) {
      onOpenChange(false)
    }
  }

  if (!mess) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-[50%] top-0 flex h-[100dvh] max-h-[100dvh] w-full max-w-full translate-x-[-50%] translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:top-[50%] sm:h-auto sm:max-h-[85vh] sm:w-[calc(100%-2rem)] sm:max-w-2xl sm:translate-y-[-50%] sm:rounded-lg sm:border sm:p-0">
        <DialogHeader className="shrink-0 space-y-1.5 px-4 pb-2 pr-12 pt-5 text-left sm:px-6 sm:pt-6">
          <DialogTitle className="text-base sm:text-lg">
            {isEdit ? t('form.editTitle') : t('form.addTitle', { mess: mess.name })}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isEdit ? t('form.editDesc') : t('form.addDesc')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-2 sm:px-6">
              <div className="flex items-center gap-4 rounded-lg border p-3">
                <MemberAvatar
                  name={name || '?'}
                  photoUrl={photoUrl}
                  className="h-16 w-16"
                />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Label htmlFor="member-photo">{t('form.photo')}</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      id="member-photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="max-w-xs"
                      disabled={uploading}
                      onChange={event => void handlePhoto(event.target.files?.[0])}
                    />
                    {uploading && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {photoUrl && !uploading && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPhotoUrl('')}
                      >
                        <X className="mr-1.5 h-3.5 w-3.5" />
                        {t('form.removePhoto')}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {member?.userId || member?.isSystemUser
                      ? 'This member has an account — photo updates their profile too.'
                      : 'Not a system user yet — photo is saved on this membership only.'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <Upload className="mr-1 inline h-3 w-3" />
                    {t('form.photoOptional')}
                  </p>
                </div>
              </div>
              <OwnerMediaPicker
                selected={photoUrl ? [photoUrl] : []}
                onSelect={asset => setPhotoUrl(asset.url)}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.name')} *</FormLabel>
                      <FormControl>
                        <Input placeholder="Rahim Uddin" {...field} />
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
                      <FormLabel>{t('form.phone')} *</FormLabel>
                      <FormControl>
                        <Input placeholder="+8801712345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="occupantType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.type')} *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {OCCUPANT_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {t(`type.${type}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>{t('form.typeHint')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.email')}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="rahim@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0"
                        onClick={() =>
                          form.setValue(
                            'whatsappNumber',
                            form.getValues('phone'),
                            { shouldDirty: true }
                          )
                        }
                      >
                        {tContact('sameAsPhone')}
                      </Button>
                    </div>
                    <FormDescription>
                      {tContact('whatsappRenterHint')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showsInstitutionFields(occupantType) && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.studentId')}</FormLabel>
                        <FormControl>
                          <Input placeholder="STU-2024-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="university"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.university')}</FormLabel>
                        <FormControl>
                          <Input placeholder="Dhaka University" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {showsWorkFields(occupantType) && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="organization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {occupantType === 'business'
                            ? t('form.businessName')
                            : t('form.organization')}
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Brain Station 23" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="designation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.designation')}</FormLabel>
                        <FormControl>
                          <Input placeholder="Software Engineer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="seatNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.seat')}</FormLabel>
                      <Select
                        onValueChange={value =>
                          field.onChange(value === NO_SEAT ? '' : value)
                        }
                        value={field.value || NO_SEAT}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NO_SEAT}>
                            {t('form.noSeat')}
                          </SelectItem>
                          {seatOptions.map(seat => (
                            <SelectItem key={seat} value={seat}>
                              {seat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>{t('form.seatHint')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="joinedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.joinedDate')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monthlyFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.monthlyFee')}</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="emergencyContactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.emergencyName')}</FormLabel>
                      <FormControl>
                        <Input placeholder="Guardian name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergencyContactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.emergencyPhone')}</FormLabel>
                      <FormControl>
                        <Input placeholder="+8801812345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="nidNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.nid')}</FormLabel>
                      <FormControl>
                        <Input placeholder="1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="permanentAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.permanentAddress')}</FormLabel>
                      <FormControl>
                        <Input placeholder="Village, Upazila, District" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.notes')}</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="shrink-0 border-t bg-background px-4 py-3 sm:px-6">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {tc('cancel')}
                </Button>
                <Button type="submit" disabled={saving || uploading}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEdit ? t('form.save') : t('form.assign')}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
