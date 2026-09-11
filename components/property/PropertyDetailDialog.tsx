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
} from '@/components/ui/dialog'
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
  Wifi,
  Car,
  Shield,
  Zap,
  Home,
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
import { listingPath } from '@/lib/seo/slug'
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

const facilityIcons: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="h-4 w-4" />,
  Parking: <Car className="h-4 w-4" />,
  Security: <Shield className="h-4 w-4" />,
  Generator: <Zap className="h-4 w-4" />,
  AC: <Zap className="h-4 w-4" />,
  Lift: <Home className="h-4 w-4" />,
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
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">
            {property.name}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2 capitalize">
            <span>{property.type}</span>
            {property.rating != null && property.reviewCount ? (
              <span className="inline-flex items-center gap-1 normal-case">
                · <RatingDisplay rating={property.rating} size="sm" />
                <span className="text-muted-foreground">
                  ({property.reviewCount})
                </span>
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {(hasImages || hasVideos) && (
            <Tabs
              defaultValue={hasVideos ? 'video' : 'images'}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                {hasVideos && (
                  <TabsTrigger value="video" className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Video Walkthrough
                  </TabsTrigger>
                )}
                {hasImages && (
                  <TabsTrigger
                    value="images"
                    className="flex items-center gap-2"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Photos ({property.images.length})
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

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-primary sm:text-4xl">
                  ৳{property.rent.toLocaleString()}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
              {property.mealIncluded && (
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Utensils className="h-3.5 w-3.5" />
                  Meals included
                  {property.mealCost
                    ? ` (+৳${property.mealCost.toLocaleString()})`
                    : ''}
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

          <div className="flex items-start gap-2">
            <MapPin className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">{property.address}</p>
              <p className="text-sm text-muted-foreground">
                {property.area}, {property.city}
              </p>
            </div>
          </div>

          <div>
            <h4 className="mb-2 font-semibold">Description</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {property.description}
            </p>
          </div>

          <div>
            <h4 className="mb-3 font-semibold">Facilities</h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {property.facilities.map((facility, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-md border p-2"
                >
                  {facilityIcons[facility] || <Home className="h-4 w-4" />}
                  <span className="text-sm">{facility}</span>
                </div>
              ))}
            </div>
          </div>

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

          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Owner</p>
                <p className="font-medium">{property.ownerName}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleStartChat}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Chat
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCall(property.ownerPhone)}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Call
                </Button>
                <WhatsAppButton
                  size="sm"
                  number={property.ownerWhatsapp}
                  message={tContact('messageOwner', {
                    property:
                      property.name?.trim() || tContact('propertyFallback'),
                  })}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{property.ownerPhone}</p>
          </div>

          {bookingError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {bookingError}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1" asChild>
              <Link href={listingPath(property)} onClick={() => onOpenChange(false)}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Full listing page
              </Link>
            </Button>
            <FavoriteButton
              property={property}
              variant="outline"
              size="default"
            />
            <Button
              className="flex-1"
              onClick={handleBookingClick}
              disabled={!property.available}
            >
              {property.instantBook && <Zap className="mr-2 h-4 w-4" />}
              {bookLabel}
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
