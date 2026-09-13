'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { WhatsAppButton } from '@/components/contact/WhatsAppButton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ownerSheetClass,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VerificationBadge } from '@/components/property/VerificationBadge'
import { ImageGallery } from '@/components/property/ImageGallery'
import { VideoPlayer } from '@/components/property/VideoPlayer'
import { RatingDisplay } from '@/components/hotel/RatingDisplay'
import {
  Phone,
  MapPin,
  Zap,
  Video,
  Image as ImageIcon,
  MessageCircle,
  ExternalLink,
  Utensils,
} from 'lucide-react'
import { BookingForm } from '@/components/booking/BookingForm'
import { FavoriteButton } from '@/components/favorites/FavoriteButton'
import { AvailabilityBadge } from '@/components/shared/AvailabilityBadge'
import { InstantBookBadge } from '@/components/shared/InstantBookBadge'
import { useRouter } from 'next/navigation'
import type { Property } from '@/types/property'
import { FacilityChips } from '@/components/shared/FacilityChips'
import {
  plainTextFromHtml,
  sanitizeListingHtml,
} from '@/components/ui/rich-text-editor'
import { listingPath } from '@/lib/seo/slug'
import { rememberAuthReturn } from '@/utils/auth'
import { hasAuthTokens } from '@/utils/auth-tokens'
import type { BookingFormData } from '@/types/booking'

interface PropertyDetailDialogProps {
  property: Property | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRequest?: (property: Property) => void
  onBookingSubmit?: (
    property: Property,
    data: BookingFormData & { moveInDate: string; moveOutDate?: string }
  ) => Promise<void> | void
  onCall: (phone: string) => void
  bookingError?: string | null
}

export function PropertyDetailDialog({
  property,
  open,
  onOpenChange,
  onRequest,
  onBookingSubmit,
  onCall,
  bookingError,
}: PropertyDetailDialogProps) {
  const [showBookingForm, setShowBookingForm] = useState(false)
  const router = useRouter()
  const tContact = useTranslations('contact')

  if (!property) return null

  const hasVideos = property.videos && property.videos.length > 0
  const hasImages = property.images && property.images.length > 0
  const bookLabel = property.instantBook
    ? property.type === 'mess' || property.type === 'hostel'
      ? 'Instant book seat'
      : 'Instant book flat'
    : property.type === 'mess' || property.type === 'hostel'
      ? 'Request seat'
      : 'Request flat'

  const handleStartChat = () => {
    router.push(`/messages?propertyId=${property.id}`)
    onOpenChange(false)
  }

  const handleBookingClick = () => {
    if (!hasAuthTokens()) {
      const next = `${listingPath(property)}?book=1`
      rememberAuthReturn(next)
      onOpenChange(false)
      router.push(`/login?next=${encodeURIComponent(next)}`)
      return
    }
    if (onBookingSubmit) {
      setShowBookingForm(true)
    } else if (onRequest) {
      onRequest(property)
    }
  }

  const handleBookingSubmit = async (
    data: BookingFormData & { moveInDate: string; moveOutDate?: string }
  ) => {
    if (onBookingSubmit) {
      await onBookingSubmit(property, data)
      setShowBookingForm(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={ownerSheetClass('sm:max-w-4xl')}>
        <DialogHeader className="shrink-0 space-y-1 border-b px-4 pb-3 pr-12 pt-4 text-left sm:px-6 sm:pt-5">
          <DialogTitle className="break-words text-lg leading-snug sm:text-2xl">
            {property.name}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1 capitalize">
            <span>{property.type}</span>
            {property.rating != null && property.reviewCount ? (
              <span className="inline-flex min-w-0 items-center gap-1 normal-case">
                · <RatingDisplay rating={property.rating} size="sm" />
                <span className="text-muted-foreground">
                  ({property.reviewCount})
                </span>
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4 sm:space-y-6 sm:px-6">
          {(hasImages || hasVideos) && (
            <Tabs
              defaultValue={hasVideos ? 'video' : 'images'}
              className="w-full"
            >
              <TabsList
                className={cn(
                  'grid h-auto w-full',
                  hasVideos && hasImages ? 'grid-cols-2' : 'grid-cols-1',
                )}
              >
                {hasVideos && (
                  <TabsTrigger
                    value="video"
                    className="h-auto min-h-9 min-w-0 gap-1.5 px-2 text-xs sm:text-sm"
                  >
                    <Video className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      <span className="sm:hidden">Video</span>
                      <span className="hidden sm:inline">Video walkthrough</span>
                    </span>
                  </TabsTrigger>
                )}
                {hasImages && (
                  <TabsTrigger
                    value="images"
                    className="h-auto min-h-9 min-w-0 gap-1.5 px-2 text-xs sm:text-sm"
                  >
                    <ImageIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">Photos ({property.images.length})</span>
                  </TabsTrigger>
                )}
              </TabsList>
              {hasVideos && (
                <TabsContent value="video" className="mt-4">
                  <div className="space-y-4">
                    {property.videos?.map((videoUrl, idx) => (
                      <VideoPlayer
                        key={idx}
                        videoUrl={videoUrl}
                        thumbnail={
                          idx === 0 ? property.videoThumbnail : undefined
                        }
                        propertyName={property.name}
                      />
                    ))}
                  </div>
                </TabsContent>
              )}
              {hasImages && (
                <TabsContent value="images" className="mt-4">
                  <ImageGallery
                    images={property.images}
                    propertyName={property.name}
                    startIndex={0}
                  />
                </TabsContent>
              )}
            </Tabs>
          )}

          <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-1">
                <span className="break-all text-2xl font-bold text-primary sm:text-4xl">
                  ৳{property.rent.toLocaleString()}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
              {property.mealIncluded && (
                <p className="mt-1 flex items-start gap-1 text-sm text-muted-foreground">
                  <Utensils className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Meals included
                    {property.mealCost
                      ? ` (+৳${property.mealCost.toLocaleString()})`
                      : ''}
                  </span>
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <AvailabilityBadge available={property.available} />
              {property.instantBook && (
                <InstantBookBadge tone="soft" label="Instant book" />
              )}
              {property.gender && (
                <Badge variant="outline" className="capitalize">
                  {property.gender}
                </Badge>
              )}
              {(property.verified !== undefined ||
                property.verificationStatus) && (
                <VerificationBadge
                  verified={property.verified}
                  verificationStatus={property.verificationStatus}
                  verifiedAt={property.verifiedAt}
                />
              )}
            </div>
          </div>

          <div className="flex min-w-0 items-start gap-2">
            <MapPin className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="break-words font-medium">{property.address}</p>
              <p className="break-words text-sm text-muted-foreground">
                {property.area}, {property.city}
              </p>
            </div>
          </div>

          <div>
            <h4 className="mb-2 font-semibold">Description</h4>
            {plainTextFromHtml(property.description) ? (
              /<\/?[a-z][\s\S]*>/i.test(property.description) ? (
                <div
                  className="max-w-none break-words text-sm leading-relaxed text-muted-foreground [&_h2]:mb-1 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mb-1 [&_h3]:font-semibold [&_h3]:text-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeListingHtml(property.description),
                  }}
                />
              ) : (
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
                  {property.description}
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">No description yet.</p>
            )}
          </div>

          {property.facilities.length > 0 && (
            <div>
              <h4 className="mb-3 font-semibold">Facilities</h4>
              <FacilityChips items={property.facilities} />
            </div>
          )}

          {property.nearbyFacilities && property.nearbyFacilities.length > 0 && (
            <div>
              <h4 className="mb-2 font-semibold">Nearby</h4>
              <div className="flex flex-wrap gap-2">
                {property.nearbyFacilities.map(f => (
                  <Badge key={f} variant="secondary">
                    {f}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg border p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Owner</p>
                <p className="break-words font-medium">{property.ownerName}</p>
                <p className="break-all text-sm text-muted-foreground">
                  {property.ownerPhone}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-3 sm:shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-full min-w-0 px-2"
                  onClick={handleStartChat}
                >
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  Chat
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-full min-w-0 px-2"
                  onClick={() => onCall(property.ownerPhone)}
                >
                  <Phone className="h-4 w-4 shrink-0" />
                  Call
                </Button>
                <WhatsAppButton
                  size="sm"
                  className="col-span-2 h-9 w-full min-w-0 px-2 min-[420px]:col-span-1"
                  number={property.ownerWhatsapp}
                  message={tContact('messageOwner', {
                    property:
                      property.name?.trim() || tContact('propertyFallback'),
                  })}
                />
              </div>
            </div>
          </div>

          {bookingError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {bookingError}
            </div>
          )}

        </div>

        <div className="shrink-0 border-t bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          <div className="flex items-stretch gap-2">
            <Button
              variant="outline"
              className="h-auto min-h-10 min-w-0 flex-1 whitespace-normal px-2 text-sm"
              asChild
            >
              <Link href={listingPath(property)} onClick={() => onOpenChange(false)}>
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span className="truncate">Full listing</span>
              </Link>
            </Button>
            <FavoriteButton
              property={property}
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
            />
            <Button
              className="h-auto min-h-10 min-w-0 flex-1 whitespace-normal px-2 text-sm"
              onClick={handleBookingClick}
              disabled={!property.available}
            >
              {property.instantBook && <Zap className="h-4 w-4 shrink-0" />}
              <span className="truncate">{bookLabel}</span>
            </Button>
          </div>
        </div>
      </DialogContent>

      {onBookingSubmit && (
        <BookingForm
          property={property}
          open={showBookingForm}
          onOpenChange={setShowBookingForm}
          onSubmit={handleBookingSubmit}
        />
      )}
    </Dialog>
  )
}
