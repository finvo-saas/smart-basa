'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Phone, Star, Verified } from 'lucide-react'
import { WhatsAppButton } from '@/components/contact/WhatsAppButton'
import { hasWhatsApp } from '@/lib/contact/whatsapp'
import { FeaturedBadge } from '@/components/monetization/FeaturedBadge'
import { FreshnessBadge } from '@/components/discover/FreshnessBadge'
import { RatingDisplay } from './RatingDisplay'
import type { Hotel } from '@/types/hotel'
import { hotelPath } from '@/lib/seo/slug'
import Image from 'next/image'
import Link from 'next/link'

interface HotelCardProps {
  hotel: Hotel
  onViewDetails?: (hotel: Hotel) => void
}

export function HotelCard({ hotel, onViewDetails }: HotelCardProps) {
  const [imageError, setImageError] = useState(false)

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(hotel)
    }
  }

  return (
    <Card className="group overflow-hidden border-border/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden bg-muted sm:h-56">
        {!imageError && hotel.images[0] ? (
          <Image
            src={hotel.images[0]}
            alt={hotel.name}
            fill
            className="object-cover transition-transform hover:scale-105"
            onError={() => setImageError(true)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
            <span className="text-4xl">🏨</span>
          </div>
        )}
        <div className="absolute right-2 top-2 flex flex-col gap-2">
          {hotel.verified && (
            <Badge className="border-emerald-600/20 bg-emerald-600 text-white hover:bg-emerald-600">
              <Verified className="mr-1 h-3 w-3" />
              Verified
            </Badge>
          )}
          {hotel.featured && <FeaturedBadge />}
          <FreshnessBadge
            lastConfirmedAt={hotel.lastConfirmedAt}
            confirmedHoursAgo={hotel.confirmedHoursAgo}
            stale={hotel.stale}
          />
        </div>
        {hotel.starRating && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-background/90 px-2 py-1 backdrop-blur">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-semibold">{hotel.starRating}</span>
          </div>
        )}
      </div>

      <CardContent className="p-4 sm:p-5">
        {/* Title and Type */}
        <div className="mb-2">
          <h3 className="text-lg font-semibold leading-tight sm:text-xl">
            {hotel.name}
          </h3>
          <p className="text-xs text-muted-foreground capitalize sm:text-sm">
            {hotel.type.replace('-', ' ')}
          </p>
        </div>

        {/* Rating */}
        <div className="mb-3 flex items-center gap-2">
          <RatingDisplay rating={hotel.averageRating} size="sm" />
          <span className="text-xs text-muted-foreground">
            ({hotel.totalReviews} reviews)
          </span>
        </div>

        {/* Location */}
        <div className="mb-4 flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="line-clamp-1">
            {hotel.area}, {hotel.city}
          </span>
        </div>

        {/* Amenities (first 3) */}
        {hotel.amenities.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {hotel.amenities.slice(0, 3).map((amenity, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {amenity}
              </Badge>
            ))}
            {hotel.amenities.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{hotel.amenities.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Availability */}
        <div className="mb-4 text-sm">
          <span className="text-muted-foreground">Available Rooms: </span>
          <span className="font-semibold">
            {hotel.availableRooms} / {hotel.totalRooms}
          </span>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <div className="grid min-w-0 grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-10 w-full min-w-0 overflow-hidden px-2 text-sm font-medium"
              onClick={handleViewDetails}
              asChild
            >
              <Link href={hotelPath(hotel)}>
                <span className="truncate">View details</span>
              </Link>
            </Button>
            <Button
              className="h-10 w-full min-w-0 overflow-hidden px-2 text-sm font-medium"
              asChild
            >
              <Link href={`${hotelPath(hotel)}/book`}>
                <span className="truncate">Book now</span>
              </Link>
            </Button>
          </div>
          {hotel.ownerPhone || hasWhatsApp(hotel.ownerWhatsapp) ? (
            <div className="flex min-w-0 items-center gap-2">
              {hotel.ownerPhone ? (
                <Button
                  variant="outline"
                  className="h-10 min-w-0 flex-1 overflow-hidden px-2 text-sm font-medium"
                  asChild
                >
                  <a href={`tel:${hotel.ownerPhone}`}>
                    <Phone className="h-4 w-4 shrink-0" />
                    <span className="truncate">Call</span>
                  </a>
                </Button>
              ) : null}
              <WhatsAppButton
                number={hotel.ownerWhatsapp}
                message={`Hi, I found ${hotel.name} on Smart Living. Do you have a room available?`}
                className="h-10 min-w-0 flex-1 overflow-hidden px-2 text-sm font-medium"
                title="WhatsApp"
              />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
