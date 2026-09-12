'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layout } from '@/components/layout/Layout'
import { PageContainer, PageHeader } from '@/components/page'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { registerHotel } from '@/lib/api/hotels'
import { uploadMediaFile } from '@/lib/api/media'
import { OwnerMediaPicker } from '@/components/media/OwnerMediaPicker'
import { toast } from '@/lib/feedback/toast'
import { useOwnerFocus } from '@/hooks/useOwnerFocus'
import { VerticalLockedEmptyState } from '@/components/onboarding'
import { LoadingState } from '@/components/page'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

const AMENITIES = [
  'WiFi',
  'AC',
  'Parking',
  'Restaurant',
  'Gym',
  'Swimming Pool',
  'Spa',
  'Room Service',
  'Laundry',
  'Airport Shuttle',
]

const schema = z.object({
  name: z.string().min(3),
  type: z.enum(['hotel', 'guest-house', 'resort']),
  starRating: z.coerce.number().min(1).max(5).optional(),
  address: z.string().min(5),
  area: z.string().min(2),
  city: z.string().min(2),
  description: z.string().min(20),
  checkInTime: z.string().min(1),
  checkOutTime: z.string().min(1),
  minimumStay: z.coerce.number().min(1),
  licenseNumber: z.string().optional(),
  licenseDocumentName: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  weekendMultiplier: z.coerce.number().min(1).max(3),
  serviceChargePercent: z.coerce.number().min(0).max(30),
  vatPercent: z.coerce.number().min(0).max(30),
  freeCancellationHours: z.coerce.number().min(0).max(168),
  partialRefundPercent: z.coerce.number().min(0).max(100),
})

type FormValues = z.infer<typeof schema>

const STEPS = ['basics', 'licenseMedia', 'pricingPolicy'] as const

export default function RegisterHotelPage() {
  const t = useTranslations('hotels')
  const tc = useTranslations('common')
  const router = useRouter()
  const { hasVertical, hydrated, needsFocusSelection } = useOwnerFocus()
  const [step, setStep] = useState(0)
  const [amenities, setAmenities] = useState<string[]>(['WiFi', 'AC'])
  const [createdId, setCreatedId] = useState<string | null>(null)

  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [licenseFile, setLicenseFile] = useState<File | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      name: '',
      type: 'guest-house',
      starRating: 3,
      address: '',
      area: '',
      city: 'Dhaka',
      description: '',
      checkInTime: '14:00',
      checkOutTime: '12:00',
      minimumStay: 1,
      licenseNumber: '',
      licenseDocumentName: '',
      imageUrl: '',
      weekendMultiplier: 1.15,
      serviceChargePercent: 10,
      vatPercent: 15,
      freeCancellationHours: 48,
      partialRefundPercent: 50,
    },
  })

  const toggleAmenity = (a: string) => {
    setAmenities(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    )
  }

  const next = async () => {
    const fields: (keyof FormValues)[][] = [
      ['name', 'type', 'address', 'area', 'city', 'description'],
      ['checkInTime', 'checkOutTime', 'minimumStay'],
      [
        'weekendMultiplier',
        'serviceChargePercent',
        'vatPercent',
        'freeCancellationHours',
        'partialRefundPercent',
      ],
    ]
    const ok = await form.trigger(fields[step])
    if (ok) setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  const onSubmit = form.handleSubmit(async values => {
    let imageUrl = values.imageUrl || undefined
    if (coverFile) {
      const uploaded = await uploadMediaFile(coverFile, 'hotel')
      if (!uploaded.ok) {
        toast.error(uploaded.error)
        return
      }
      imageUrl = uploaded.data.url
    }
    let licenseDocumentName = values.licenseDocumentName || undefined
    let licenseDocumentKey: string | undefined
    if (licenseFile) {
      const uploaded = await uploadMediaFile(licenseFile, 'document')
      if (!uploaded.ok) {
        toast.error(uploaded.error)
        return
      }
      // Licenses stay private: keep the key, the API signs a URL per read.
      licenseDocumentKey = uploaded.data.key
      licenseDocumentName = licenseFile.name
    }
    const result = await registerHotel({
      ...values,
      amenities,
      imageUrl,
      licenseNumber: values.licenseNumber || undefined,
      licenseDocumentName: licenseDocumentName || 'license.pdf',
      licenseDocumentKey,
    })
    if (result.ok) setCreatedId(result.data.id)
    else toast.error(result.error)
  })

  if (!hydrated || needsFocusSelection) {
    return (
      <Layout>
        <PageContainer>
          <LoadingState />
        </PageContainer>
      </Layout>
    )
  }

  if (!hasVertical('hotel')) {
    return (
      <Layout>
        <PageContainer>
          <VerticalLockedEmptyState vertical="hotel" />
        </PageContainer>
      </Layout>
    )
  }

  if (createdId) {
    return (
      <Layout>
        <PageContainer>
          <div className="mx-auto max-w-md space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h1 className="text-2xl font-bold">{t('register.successTitle')}</h1>
            <p className="text-muted-foreground">{t('register.successDesc')}</p>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href={`/my-hotels/${createdId}/rooms`}>
                  {t('register.manageRooms')}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/my-hotels/${createdId}/pricing`}>
                  {t('register.pricingRules')}
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/my-hotels">{t('register.myHotelsLink')}</Link>
              </Button>
            </div>
          </div>
        </PageContainer>
      </Layout>
    )
  }

  return (
    <Layout>
      <PageContainer>
        <PageHeader
          title={t('register.title')}
          description={t('register.descriptionLong')}
        />

        <div className="mb-6 flex gap-2">
          {STEPS.map((stepKey, i) => (
            <Badge
              key={stepKey}
              variant={i === step ? 'default' : i < step ? 'secondary' : 'outline'}
            >
              {i + 1}. {t(`register.steps.${stepKey}`)}
            </Badge>
          ))}
        </div>

        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>{t(`register.steps.${STEPS[step]}`)}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-4">
                {step === 0 && (
                  <>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('register.fields.propertyName')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('register.fields.type')}</FormLabel>
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
                                <SelectItem value="hotel">
                                  {t('register.types.hotel')}
                                </SelectItem>
                                <SelectItem value="guest-house">
                                  {t('register.types.guestHouse')}
                                </SelectItem>
                                <SelectItem value="resort">
                                  {t('register.types.resort')}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="starRating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('register.fields.starRating')}</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} max={5} {...field} />
                            </FormControl>
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
                          <FormLabel>{t('register.fields.address')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="area"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('register.fields.area')}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('register.fields.city')}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('register.fields.description')}</FormLabel>
                          <FormControl>
                            <Textarea rows={4} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div>
                      <Label className="mb-2 block">
                        {t('register.fields.amenities')}
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {AMENITIES.map(a => (
                          <Badge
                            key={a}
                            variant={
                              amenities.includes(a) ? 'default' : 'outline'
                            }
                            className="cursor-pointer"
                            onClick={() => toggleAmenity(a)}
                          >
                            {a}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="checkInTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('register.fields.checkInTime')}</FormLabel>
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
                            <FormLabel>{t('register.fields.checkOutTime')}</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="minimumStay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('register.fields.minimumStay')}</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="licenseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('register.fields.licenseNumber')}</FormLabel>
                          <FormControl>
                            <Input placeholder="HTL-2024-XXX" {...field} />
                          </FormControl>
                          <FormDescription>
                            {t('register.fields.licenseNumberDesc')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="licenseDocumentName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('register.fields.licenseDocumentName')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="license_scan.pdf"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {t('register.fields.licenseDocumentDesc')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('register.fields.coverImageUrl')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://… (or upload a file below)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <Label>Cover photo file</Label>
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={event =>
                          setCoverFile(event.target.files?.[0] ?? null)
                        }
                      />
                    </div>
                    <OwnerMediaPicker
                      selected={
                        form.watch('imageUrl') ? [String(form.watch('imageUrl'))] : []
                      }
                      onSelect={asset => {
                        form.setValue('imageUrl', asset.url, { shouldValidate: true })
                        setCoverFile(null)
                      }}
                    />
                    <div className="space-y-2">
                      <Label>License document</Label>
                      <Input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png"
                        onChange={event =>
                          setLicenseFile(event.target.files?.[0] ?? null)
                        }
                      />
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <FormField
                      control={form.control}
                      name="weekendMultiplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('register.fields.weekendMultiplier')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.05"
                              min={1}
                              max={3}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {t('register.fields.weekendMultiplierDesc')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="serviceChargePercent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('register.fields.serviceChargePercent')}
                            </FormLabel>
                            <FormControl>
                              <Input type="number" min={0} max={30} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="vatPercent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('register.fields.vatPercent')}</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} max={30} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="freeCancellationHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('register.fields.freeCancellationHours')}
                            </FormLabel>
                            <FormControl>
                              <Input type="number" min={0} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="partialRefundPercent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('register.fields.partialRefundPercent')}
                            </FormLabel>
                            <FormControl>
                              <Input type="number" min={0} max={100} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-2">
                  {step > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(s => s - 1)}
                    >
                      {tc('back')}
                    </Button>
                  )}
                  <div className="flex-1" />
                  {step < STEPS.length - 1 ? (
                    <Button type="button" onClick={next}>
                      {tc('continue')}
                    </Button>
                  ) : (
                    <Button type="submit">{t('register.submit')}</Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </PageContainer>
    </Layout>
  )
}
