'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { WhatsAppButton } from '@/components/contact/WhatsAppButton'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MapPin,
  Phone,
  Mail,
  Star,
  Verified,
  Wifi,
  Car,
  Utensils,
  Dumbbell,
  Waves,
} from 'lucide-react'
import { RatingDisplay } from '@/components/hotel/RatingDisplay'
import { ReviewCard } from '@/components/hotel/ReviewCard'
import { RoomCard } from '@/components/hotel/RoomCard'
import { CancellationPolicyCard } from '@/components/hotel/CancellationPolicyCard'
import {
  fetchHotelById,
  fetchHotelRooms,
  fetchHotelReviews,
} from '@/lib/api/hotels'
import { useMockQuery } from '@/hooks/useMockQuery'
import { extractEntityId, hotelPath } from '@/lib/seo/slug'
import { LoadingState } from '@/components/page'
import { NearbyPOISection } from '@/components/map/NearbyPOISection'
import Image from 'next/image'
import Link from 'next/link'

const amenityIcons: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="h-4 w-4" />,
  Parking: <Car className="h-4 w-4" />,
  Restaurant: <Utensils className="h-4 w-4" />,
  Gym: <Dumbbell className="h-4 w-4" />,
  'Swimming Pool': <Waves className="h-4 w-4" />,
}

export function HotelDetailClient() {
  const t = useTranslations('hotels')
  const tc = useTranslations('common')
  const tContact = useTranslations('contact')
  const params = useParams()
  const router = useRouter()
  const hotelId = extractEntityId(params.hotelId)

  const loadHotel = useCallback(() => fetchHotelById(hotelId), [hotelId])
  const { data: hotel, loading: hotelLoading } = useMockQuery(loadHotel)

  const loadRooms = useCallback(() => fetchHotelRooms(hotelId), [hotelId])
  const { data: rooms } = useMockQuery(loadRooms)

  const loadReviews = useCallback(() => fetchHotelReviews(hotelId), [hotelId])
  const { data: reviews } = useMockQuery(loadReviews)

  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  if (hotelLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <LoadingState label={t('detail.notFoundTitle')} />
        </div>
      </Layout>
    )
  }

  if (!hotel) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg font-semibold text-muted-foreground">
                {t('detail.notFoundTitle')}
              </p>
              <Button
                variant="outline"
                onClick={() => router.push('/hotels')}
                className="mt-4"
              >
                {t('detail.backToHotels')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          ← {tc('back')}
        </Button>

        {/* Image Gallery */}
        <div className="mb-6">
          <div className="relative h-64 w-full overflow-hidden rounded-lg bg-muted sm:h-96">
            {hotel.images[selectedImageIndex] ? (
              <Image
                src={hotel.images[selectedImageIndex]}
                alt={hotel.name}
                fill
                className="object-cover"
                sizes="100vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-6xl">🏨</span>
              </div>
            )}
          </div>
          {hotel.images.length > 1 && (
            <div className="mt-2 grid grid-cols-4 gap-2">
              {hotel.images.slice(0, 4).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative h-20 overflow-hidden rounded ${
                    selectedImageIndex === idx ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${hotel.name} ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 25vw, 150px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hotel Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-2xl font-bold">{hotel.name}</h1>
                      {hotel.verified && (
                        <Badge variant="default">
                          <Verified className="mr-1 h-3 w-3" />
                          {t('detail.verified')}
                        </Badge>
                      )}
                      {hotel.featured && (
                        <Badge variant="default" className="bg-yellow-500">
                          {t('detail.featured')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {hotel.area}, {hotel.city}
                        </span>
                      </div>
                      {hotel.starRating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>
                            {t('detail.starRating', {
                              count: hotel.starRating,
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-4">
                  <RatingDisplay rating={hotel.averageRating} size="md" />
                  <span className="text-sm text-muted-foreground">
                    ({t('detail.reviews', { count: hotel.totalReviews })})
                  </span>
                </div>

                <p className="mb-4 text-foreground">{hotel.description}</p>

                {/* Amenities */}
                <div>
                  <h3 className="mb-3 font-semibold">
                    {t('detail.amenities')}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {hotel.amenities.map((amenity, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm"
                      >
                        {amenityIcons[amenity] || (
                          <span className="h-4 w-4">•</span>
                        )}
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rooms */}
            <Card>
              <CardHeader>
                <CardTitle>{t('detail.availableRooms')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(rooms ?? [])
                    .filter(r => r.available)
                    .map(room => (
                      <RoomCard key={room.id} room={room} />
                    ))}
                  {(rooms ?? []).filter(r => r.available).length === 0 && (
                    <p className="text-center text-muted-foreground">
                      {t('detail.noRoomsAvailable')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <CancellationPolicyCard policy={hotel.cancellationPolicy} />

            <NearbyPOISection lat={hotel.latitude} lng={hotel.longitude} />

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {t('detail.reviewsTitle', { count: reviews?.length ?? 0 })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(reviews ?? []).map(review => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                  {(reviews ?? []).length === 0 && (
                    <p className="text-center text-muted-foreground">
                      {t('detail.noReviews')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>{t('detail.bookNow')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('detail.startingFrom')}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    ৳{(rooms?.length
                      ? Math.min(...rooms.map(r => r.basePrice))
                      : 0
                    ).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('detail.perNight')}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t('book.checkIn')}:
                    </span>
                    <span className="font-medium">{hotel.checkInTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t('book.checkOut')}:
                    </span>
                    <span className="font-medium">{hotel.checkOutTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t('detail.minimumStay')}
                    </span>
                    <span className="font-medium">
                      {t('detail.minimumStayNights', {
                        count: hotel.minimumStay,
                      })}
                    </span>
                  </div>
                </div>

                <Button className="w-full" asChild>
                  <Link href={`${hotelPath(hotel)}/book`}>
                    {t('detail.bookNow')}
                  </Link>
                </Button>

                <div className="pt-4 border-t">
                  <h4 className="mb-2 font-semibold text-sm">
                    {t('detail.contact')}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${hotel.ownerPhone}`}
                        className="text-primary hover:underline"
                      >
                        {hotel.ownerPhone}
                      </a>
                    </div>
                    {hotel.ownerEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${hotel.ownerEmail}`}
                          className="text-primary hover:underline"
                        >
                          {hotel.ownerEmail}
                        </a>
                      </div>
                    )}
                    <WhatsAppButton
                      className="w-full"
                      size="sm"
                      number={hotel.ownerWhatsapp}
                      message={tContact('messageOwner', {
                        property:
                          hotel.name?.trim() || tContact('propertyFallback'),
                      })}
                      showNumber
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
}
