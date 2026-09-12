'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Phone, MapPin, Video, MessageCircle, GitCompareArrows, Check } from 'lucide-react'
import { WhatsAppButton } from '@/components/contact/WhatsAppButton'
import { VerificationBadge } from '@/components/property/VerificationBadge'
import { FavoriteButton } from '@/components/favorites/FavoriteButton'
import { RatingDisplay } from '@/components/hotel/RatingDisplay'
import { AvailabilityBadge } from '@/components/shared/AvailabilityBadge'
import { InstantBookBadge } from '@/components/shared/InstantBookBadge'
import { OverlayBadge } from '@/components/shared/OverlayBadge'
import { FeaturedBadge, isListingFeatured } from '@/components/monetization/FeaturedBadge'
import { FreshnessBadge } from '@/components/discover/FreshnessBadge'
import { AIMatchScoreBadge } from '@/components/search/AIMatchScoreBadge'
import { useRouter } from 'next/navigation'
import type { Property } from '@/types/property'
import Image from 'next/image'
import { formatCurrency } from '@/lib/format/locale'
import { cn } from '@/lib/utils'
import { listingPath, messPath } from '@/lib/seo/slug'

function propertyDetailPath(property: Property): string {
  if (
    (property.type === 'mess' || property.type === 'hostel') &&
    property.messId
  ) {
    return messPath({
      id: property.messId,
      name: property.name,
      city: property.city,
    })
  }
  return listingPath(property)
}

interface PropertyCardProps {
  property: Property
  onViewDetails: (property: Property) => void
  onCall: (phone: string) => void
  compareSelected?: boolean
  onCompareToggle?: (property: Property) => void
  compareDisabled?: boolean
}

export function PropertyCard({
  property,
  onViewDetails,
  onCall,
  compareSelected,
  onCompareToggle,
  compareDisabled,
}: PropertyCardProps) {
  const [imageError, setImageError] = useState(false)
  const router = useRouter()

  const handleStartChat = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/messages?propertyId=${property.id}`)
  }

  return (
    <Card className="group overflow-hidden border-border/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-48 w-full overflow-hidden bg-muted sm:h-56">
        <Link href={propertyDetailPath(property)} className="absolute inset-0 z-0">
          <span className="sr-only">View {property.name}</span>
        </Link>
        {!imageError && property.images[0] ? (
          <Image
            src={property.images[0]}
            alt={property.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            onError={() => setImageError(true)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
            <span className="text-4xl">🏠</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute left-2 top-2 z-10 flex flex-wrap gap-1.5">
          {isListingFeatured(property) && (
            <FeaturedBadge className="pointer-events-auto" />
          )}
          <AvailabilityBadge available={property.available} tone="solid" />
          <FreshnessBadge
            lastConfirmedAt={property.lastConfirmedAt}
            confirmedHoursAgo={property.confirmedHoursAgo}
            stale={property.stale}
          />
          {property.aiMatchScore != null && (
            <AIMatchScoreBadge
              score={property.aiMatchScore}
              className="pointer-events-auto"
            />
          )}
          {property.instantBook && property.available && (
            <InstantBookBadge tone="solid" />
          )}
          {property.gender && (
            <OverlayBadge>
              {property.gender === 'male'
                ? 'Male'
                : property.gender === 'female'
                  ? 'Female'
                  : 'Mixed'}
            </OverlayBadge>
          )}
          {property.videos && property.videos.length > 0 && (
            <OverlayBadge>
              <Video className="mr-1 h-3 w-3" />
              Video
            </OverlayBadge>
          )}
        </div>
        <div className="absolute bottom-2 right-2 z-10">
          {(property.verified !== undefined || property.verificationStatus) && (
            <VerificationBadge
              verified={property.verified}
              verificationStatus={property.verificationStatus}
              verifiedAt={property.verifiedAt}
              verificationScore={property.verificationScore}
            />
          )}
        </div>
        {onCompareToggle && (
          <button
            type="button"
            role="checkbox"
            aria-checked={!!compareSelected}
            aria-label={compareSelected ? 'Remove from compare' : 'Add to compare'}
            className={cn(
              'absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-md border bg-background/95 px-2 py-1 text-xs font-medium shadow-sm backdrop-blur-sm',
              compareSelected && 'border-primary bg-primary/10 text-primary',
              compareDisabled && !compareSelected && 'opacity-50'
            )}
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              if (!compareDisabled || compareSelected) onCompareToggle(property)
            }}
            disabled={compareDisabled && !compareSelected}
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex h-3.5 w-3.5 items-center justify-center rounded-sm border border-primary',
                compareSelected && 'bg-primary text-primary-foreground'
              )}
            >
              {compareSelected ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
            </span>
            <GitCompareArrows className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      <CardContent className="p-4 sm:p-5">
        <div className="mb-3">
          <Link
            href={propertyDetailPath(property)}
            className="text-lg font-semibold leading-tight hover:text-primary sm:text-xl"
          >
            <span className="line-clamp-2">{property.name}</span>
          </Link>
          <p className="mt-0.5 text-xs capitalize text-muted-foreground sm:text-sm">
            {property.type}
          </p>
          {property.rating != null && property.reviewCount ? (
            <div className="mt-1.5">
              <RatingDisplay rating={property.rating} size="sm" />
              <span className="ml-1 text-xs text-muted-foreground">
                ({property.reviewCount})
              </span>
            </div>
          ) : null}
        </div>

        <div className="mb-3">
          <div className="flex flex-wrap items-baseline gap-1">
            <span className="text-2xl font-bold text-primary sm:text-3xl">
              {formatCurrency(property.rent)}
            </span>
            <span className="text-sm text-muted-foreground">/month</span>
          </div>
          {property.mealIncluded && property.mealCost && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              + {formatCurrency(property.mealCost)}/month for meals
            </p>
          )}
          {property.seatType && (
            <p className="mt-1 text-xs capitalize text-muted-foreground">
              {property.seatType} seat
            </p>
          )}
          {property.openSeats != null && (
            <p className="mt-1 text-xs text-muted-foreground">
              {property.openSeats} open
            </p>
          )}
        </div>

        <div className="mb-3 flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="line-clamp-1">
            {property.area}, {property.city}
          </span>
        </div>

        {property.facilities.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {property.facilities.slice(0, 3).map((facility, idx) => (
              <Badge key={idx} variant="outline" className="text-xs font-normal">
                {facility}
              </Badge>
            ))}
            {property.facilities.length > 3 && (
              <Badge variant="outline" className="text-xs font-normal">
                +{property.facilities.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <div className="flex min-w-0 flex-col gap-2">
          <div className="grid min-w-0 grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-10 w-full min-w-0 overflow-hidden px-2 text-sm font-medium"
              onClick={() => onViewDetails(property)}
            >
              <span className="truncate">Quick view</span>
            </Button>
            <Button
              className="h-10 w-full min-w-0 overflow-hidden px-2 text-sm font-medium"
              onClick={() => onCall(property.ownerPhone)}
            >
              <Phone className="h-4 w-4 shrink-0" />
              <span className="truncate">Call</span>
            </Button>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <WhatsAppButton
              number={property.ownerWhatsapp}
              message={`Hi, I found ${property.name} on Smart Living. Is it still available?`}
              className="h-10 min-w-0 flex-1 overflow-hidden px-2 text-sm font-medium"
              title="WhatsApp"
            />
            <FavoriteButton
              property={property}
              size="icon"
              className="h-10 w-10 shrink-0"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleStartChat}
              title="Start chat"
              aria-label="Start chat"
              className="h-10 w-10 shrink-0"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
