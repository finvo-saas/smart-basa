'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  RichTextEditor,
  plainTextFromHtml,
} from '@/components/ui/rich-text-editor'
import { Loader2, CheckCircle2 } from 'lucide-react'
import type { Property, PropertyListingInput } from '@/types/property'
import { cn } from '@/lib/utils'
import { uploadMediaFile } from '@/lib/api/properties'

const NEARBY_OPTIONS = [
  'Bus Stop',
  'Metro Station',
  'Hospital',
  'University',
  'Market',
  'Shopping Mall',
  'School',
]

const FACILITY_OPTIONS = [
  'WiFi',
  'AC',
  'Generator',
  'Security',
  'Parking',
  'Lift',
  'Balcony',
  'Common Room',
  'CCTV',
  'Water Filter',
]

const schema = z.object({
  name: z.string().min(3, 'Name is required'),
  type: z.enum(['mess', 'apartment', 'hostel', 'hotel']),
  rent: z.coerce.number().min(500, 'Minimum rent is ৳500'),
  city: z.string().min(2, 'City is required'),
  area: z.string().min(2, 'Area is required'),
  address: z.string().min(5, 'Address is required'),
  description: z
    .string()
    .refine(v => plainTextFromHtml(v).length >= 20, {
      message: 'Write at least 20 characters',
    }),
  gender: z.enum(['male', 'female', 'mixed']).optional().nullable(),
  seatType: z.enum(['single', 'shared']).optional().nullable(),
  mealIncluded: z.boolean().optional(),
  mealCost: z.coerce.number().optional(),
  depositMonths: z.coerce.number().min(0).max(6),
  instantBook: z.boolean(),
  parking: z.boolean().optional(),
  security: z.boolean().optional(),
  furnishing: z
    .enum(['furnished', 'unfurnished', 'semi-furnished'])
    .optional()
    .nullable(),
  bedrooms: z.coerce.number().min(0).max(20).optional().nullable(),
  bathrooms: z.coerce.number().min(0).max(20).optional().nullable(),
  kitchens: z.coerce.number().min(0).max(10).optional().nullable(),
  livingRooms: z.coerce.number().min(0).max(10).optional().nullable(),
  balconies: z.coerce.number().min(0).max(10).optional().nullable(),
  sizeSqft: z.coerce.number().min(0).optional().nullable(),
  floorLevel: z.coerce.number().min(0).optional().nullable(),
  unitNumber: z.string().max(40).optional(),
  propertyFace: z
    .enum([
      'north',
      'south',
      'east',
      'west',
      'north-east',
      'north-west',
      'south-east',
      'south-west',
    ])
    .optional()
    .nullable(),
  serviceCharge: z.coerce.number().min(0).optional().nullable(),
  parkingCount: z.coerce.number().min(0).max(20).optional().nullable(),
  availableFrom: z.string().optional().nullable(),
  rentNegotiable: z.boolean().optional(),
  tenantType: z
    .enum(['family', 'bachelor', 'office', 'any'])
    .optional()
    .nullable(),
  imageUrl: z.union([z.string().url(), z.literal('')]).optional(),
  facilities: z.array(z.string()),
  nearbyFacilities: z.array(z.string()),
  publishNow: z.boolean(),
})

type FormValues = z.infer<typeof schema>

const STEPS = ['Basics', 'Details', 'Photos & publish']

interface PublishListingWizardProps {
  initial?: Property
  onSubmit: (input: PropertyListingInput) => Promise<void>
  onCancel?: () => void
}

export function PublishListingWizard({
  initial,
  onSubmit,
  onCancel,
}: PublishListingWizardProps) {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)

  const form = useForm<FormValues>({
    // Zod v4 + RHF resolver typings are loose project-wide
    resolver: zodResolver(schema) as never,
    defaultValues: {
      name: initial?.name || '',
      type: initial?.type || 'mess',
      rent: initial?.rent || 5000,
      city: initial?.city || 'Dhaka',
      area: initial?.area || '',
      address: initial?.address || '',
      description: initial?.description || '',
      gender: initial?.gender || null,
      seatType: initial?.seatType || null,
      mealIncluded: initial?.mealIncluded || false,
      mealCost: initial?.mealCost || undefined,
      depositMonths: initial?.depositMonths ?? 1,
      instantBook: initial?.instantBook || false,
      parking: initial?.parking || false,
      security: initial?.security ?? true,
      furnishing: initial?.furnishing || null,
      bedrooms: initial?.bedrooms ?? undefined,
      bathrooms: initial?.bathrooms ?? undefined,
      kitchens: initial?.kitchens ?? undefined,
      livingRooms: initial?.livingRooms ?? undefined,
      balconies: initial?.balconies ?? undefined,
      sizeSqft: initial?.sizeSqft ?? undefined,
      floorLevel: initial?.floorLevel ?? undefined,
      unitNumber: initial?.unitNumber || '',
      propertyFace: initial?.propertyFace || null,
      serviceCharge: initial?.serviceCharge ?? undefined,
      parkingCount: initial?.parkingCount ?? undefined,
      availableFrom: initial?.availableFrom || '',
      rentNegotiable: initial?.rentNegotiable || false,
      tenantType: initial?.tenantType || null,
      imageUrl: initial?.images?.[0] || '',
      facilities: initial?.facilities || ['WiFi', 'Security'],
      nearbyFacilities: initial?.nearbyFacilities || [],
      publishNow: initial?.published ?? true,
    },
  })

  const propertyType = form.watch('type')
  const facilities = form.watch('facilities')

  const nearbyFacilities = form.watch('nearbyFacilities')

  const toggleFacility = (f: string) => {
    const current = form.getValues('facilities')
    form.setValue(
      'facilities',
      current.includes(f) ? current.filter(x => x !== f) : [...current, f]
    )
  }

  const toggleNearby = (f: string) => {
    const current = form.getValues('nearbyFacilities')
    form.setValue(
      'nearbyFacilities',
      current.includes(f) ? current.filter(x => x !== f) : [...current, f]
    )
  }

  const validateStep = async () => {
    if (step === 0) {
      return form.trigger(['name', 'type', 'rent', 'city', 'area', 'address'])
    }
    if (step === 1) {
      return form.trigger(['description', 'depositMonths'])
    }
    const url = form.getValues('imageUrl')
    if (imageFile || (url && url.length > 8) || (initial?.images?.length ?? 0) > 0) {
      return true
    }
    form.setError('imageUrl', {
      message: 'Upload a cover photo or paste an image URL',
    })
    return false
  }

  const next = async () => {
    const ok = await validateStep()
    if (ok) setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  const handleFinal = form.handleSubmit(async values => {
    setSubmitting(true)
    setError(null)
    try {
      let images = values.imageUrl ? [values.imageUrl] : [...(initial?.images || [])]
      let videos = [...(initial?.videos || [])]

      if (imageFile) {
        const uploaded = await uploadMediaFile(imageFile, 'property')
        if (!uploaded.ok) throw new Error(uploaded.error)
        images = [uploaded.data.url, ...images.filter(url => url !== uploaded.data.url)]
      }
      if (videoFile) {
        const uploaded = await uploadMediaFile(videoFile, 'property_video')
        if (!uploaded.ok) throw new Error(uploaded.error)
        videos = [...videos.filter(url => url !== uploaded.data.url), uploaded.data.url]
      }
      if (!images.length) {
        throw new Error('Add a cover photo (upload a file or paste a URL)')
      }

      const input: PropertyListingInput = {
        name: values.name,
        type: values.type,
        rent: values.rent,
        city: values.city,
        area: values.area,
        address: values.address,
        description: values.description,
        available: true,
        gender: values.gender || null,
        seatType: values.seatType || null,
        mealIncluded: values.mealIncluded,
        mealCost: values.mealCost,
        depositMonths: values.depositMonths,
        instantBook: values.instantBook,
        parking:
          values.type === 'apartment' && values.parkingCount != null
            ? values.parkingCount > 0
            : values.parking,
        security: values.security,
        furnishing: values.furnishing || null,
        bedrooms: values.type === 'apartment' ? values.bedrooms ?? null : null,
        bathrooms: values.type === 'apartment' ? values.bathrooms ?? null : null,
        kitchens: values.type === 'apartment' ? values.kitchens ?? null : null,
        livingRooms:
          values.type === 'apartment' ? values.livingRooms ?? null : null,
        balconies: values.type === 'apartment' ? values.balconies ?? null : null,
        sizeSqft: values.type === 'apartment' ? values.sizeSqft ?? null : null,
        floorLevel:
          values.type === 'apartment' ? values.floorLevel ?? null : null,
        unitNumber:
          values.type === 'apartment' ? values.unitNumber?.trim() || '' : '',
        propertyFace:
          values.type === 'apartment' ? values.propertyFace || null : null,
        serviceCharge:
          values.type === 'apartment' ? values.serviceCharge ?? null : null,
        parkingCount:
          values.type === 'apartment' ? values.parkingCount ?? null : null,
        availableFrom:
          values.type === 'apartment' && values.availableFrom
            ? values.availableFrom
            : null,
        rentNegotiable:
          values.type === 'apartment' ? !!values.rentNegotiable : false,
        tenantType:
          values.type === 'apartment' ? values.tenantType || 'any' : null,
        images,
        videos,
        nearbyFacilities: values.nearbyFacilities,
        facilities: values.facilities,
        published: values.publishNow,
        listingStatus: values.publishNow ? 'published' : 'draft',
      }
      await onSubmit(input)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save listing')
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                i < step
                  ? 'bg-primary text-primary-foreground'
                  : i === step
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className="text-center text-xs text-muted-foreground">
              {label}
            </span>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleFinal} className="space-y-4">
              {step === 0 && (
                <>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Listing title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Green Valley Mess, Mirpur"
                            {...field}
                          />
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
                          <FormLabel>Type</FormLabel>
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
                              <SelectItem value="mess">Mess</SelectItem>
                              <SelectItem value="hostel">Hostel</SelectItem>
                              <SelectItem value="apartment">
                                Apartment
                              </SelectItem>
                              <SelectItem value="hotel">Hotel</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly rent (৳)</FormLabel>
                          <FormControl>
                            <Input type="number" min={500} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                      name="area"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Area</FormLabel>
                          <FormControl>
                            <Input placeholder="Mirpur-10" {...field} />
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
                        <FormLabel>Full address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="House, road, block"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {step === 1 && (
                <>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Flat details</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Describe rooms, furnishing, rules, nearby landmarks…"
                          />
                        </FormControl>
                        <FormDescription>
                          Use the toolbar for headings, bold, and lists — shown
                          on the public listing page.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {(propertyType === 'mess' || propertyType === 'hostel') && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select
                              value={field.value || undefined}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select" />
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
                      <FormField
                        control={form.control}
                        name="seatType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Seat type</FormLabel>
                            <Select
                              value={field.value || undefined}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="single">Single</SelectItem>
                                <SelectItem value="shared">Shared</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {propertyType === 'apartment' && (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="bedrooms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bedrooms (BHK)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="2"
                                  value={field.value ?? ''}
                                  onChange={e => {
                                    const v = e.target.value
                                    field.onChange(
                                      v === '' ? null : parseInt(v, 10),
                                    )
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bathrooms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bathrooms</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="2"
                                  value={field.value ?? ''}
                                  onChange={e => {
                                    const v = e.target.value
                                    field.onChange(
                                      v === '' ? null : parseInt(v, 10),
                                    )
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="sizeSqft"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Size (sqft)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="1100"
                                  value={field.value ?? ''}
                                  onChange={e => {
                                    const v = e.target.value
                                    field.onChange(
                                      v === '' ? null : parseInt(v, 10),
                                    )
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="floorLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Floor</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="3"
                                  value={field.value ?? ''}
                                  onChange={e => {
                                    const v = e.target.value
                                    field.onChange(
                                      v === '' ? null : parseInt(v, 10),
                                    )
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="kitchens"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Kitchens</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="1"
                                  value={field.value ?? ''}
                                  onChange={e => {
                                    const v = e.target.value
                                    field.onChange(
                                      v === '' ? null : parseInt(v, 10),
                                    )
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="livingRooms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Living rooms</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="1"
                                  value={field.value ?? ''}
                                  onChange={e => {
                                    const v = e.target.value
                                    field.onChange(
                                      v === '' ? null : parseInt(v, 10),
                                    )
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="balconies"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Balconies</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="1"
                                  value={field.value ?? ''}
                                  onChange={e => {
                                    const v = e.target.value
                                    field.onChange(
                                      v === '' ? null : parseInt(v, 10),
                                    )
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="unitNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit / flat no.</FormLabel>
                              <FormControl>
                                <Input placeholder="A-5" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="propertyFace"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Facing</FormLabel>
                              <Select
                                value={field.value || undefined}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="north">North</SelectItem>
                                  <SelectItem value="south">South</SelectItem>
                                  <SelectItem value="east">East</SelectItem>
                                  <SelectItem value="west">West</SelectItem>
                                  <SelectItem value="north-east">
                                    North-East
                                  </SelectItem>
                                  <SelectItem value="north-west">
                                    North-West
                                  </SelectItem>
                                  <SelectItem value="south-east">
                                    South-East
                                  </SelectItem>
                                  <SelectItem value="south-west">
                                    South-West
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="serviceCharge"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Service charge (৳/mo)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="5000"
                                  value={field.value ?? ''}
                                  onChange={e => {
                                    const v = e.target.value
                                    field.onChange(
                                      v === '' ? null : parseInt(v, 10),
                                    )
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="parkingCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Parking spaces</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="1"
                                  value={field.value ?? ''}
                                  onChange={e => {
                                    const v = e.target.value
                                    field.onChange(
                                      v === '' ? null : parseInt(v, 10),
                                    )
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="availableFrom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Available from</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  value={field.value || ''}
                                  onChange={e =>
                                    field.onChange(e.target.value || null)
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="rentNegotiable"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div>
                                <FormLabel>Rent negotiable</FormLabel>
                                <FormDescription>
                                  Show as negotiable on the listing
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={!!field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="tenantType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred for</FormLabel>
                            <Select
                              value={field.value || 'any'}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="family">Family</SelectItem>
                                <SelectItem value="bachelor">
                                  Bachelor
                                </SelectItem>
                                <SelectItem value="office">Office</SelectItem>
                                <SelectItem value="any">Anyone</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Matches how Dhaka renters search (family /
                              bachelor).
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="depositMonths"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deposit (months of rent)</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} max={6} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="furnishing"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Furnishing</FormLabel>
                          <Select
                            value={field.value || undefined}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="furnished">
                                Furnished
                              </SelectItem>
                              <SelectItem value="semi-furnished">
                                Semi-furnished
                              </SelectItem>
                              <SelectItem value="unfurnished">
                                Unfurnished
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">Facilities</Label>
                    <div className="flex flex-wrap gap-2">
                      {FACILITY_OPTIONS.map(f => (
                        <Badge
                          key={f}
                          variant={
                            facilities.includes(f) ? 'default' : 'outline'
                          }
                          className="cursor-pointer"
                          onClick={() => toggleFacility(f)}
                        >
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">
                      Nearby (bus, metro, hospital…)
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {NEARBY_OPTIONS.map(f => (
                        <Badge
                          key={f}
                          variant={
                            nearbyFacilities?.includes(f) ? 'default' : 'outline'
                          }
                          className="cursor-pointer"
                          onClick={() => toggleNearby(f)}
                        >
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="instantBook"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <FormLabel>Instant book</FormLabel>
                          <FormDescription>
                            Auto-approve bookings without manual review
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
                </>
              )}

              {step === 2 && (
                <>
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover photo</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={e =>
                              setImageFile(e.target.files?.[0] ?? null)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          {imageFile
                            ? imageFile.name
                            : 'Upload a JPEG/PNG (max 5 MB), or paste a URL below.'}
                        </FormDescription>
                        <FormControl>
                          <Input
                            placeholder="https://… (optional if you uploaded a file)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <Label>Video walkthrough (optional)</Label>
                    <Input
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={e =>
                        setVideoFile(e.target.files?.[0] ?? null)
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      {videoFile
                        ? videoFile.name
                        : initial?.videos?.length
                          ? `${initial.videos.length} video(s) already saved. Upload another MP4/WebM (max 50 MB).`
                          : 'MP4 or WebM, max 50 MB. Shown on the listing page.'}
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="publishNow"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <FormLabel>Publish to search</FormLabel>
                          <FormDescription>
                            Visible to renters across Bangladesh
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
                  <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                    After publishing, your listing appears in Search. Verified
                    badge is assigned after admin review of documents.
                  </div>
                </>
              )}

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex gap-2 pt-2">
                {onCancel && step === 0 && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
                {step > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(s => s - 1)}
                  >
                    Back
                  </Button>
                )}
                <div className="flex-1" />
                {step < STEPS.length - 1 ? (
                  <Button type="button" onClick={next}>
                    Continue
                  </Button>
                ) : (
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : initial ? (
                      'Save changes'
                    ) : (
                      'Create listing'
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
