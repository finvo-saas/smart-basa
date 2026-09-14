'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { WhatsAppButton } from '@/components/contact/WhatsAppButton'
import { Layout } from '@/components/layout/Layout'
import {
  PageContainer,
  PageHeader,
  EmptyState,
  LoadingState,
} from '@/components/page'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageGallery } from '@/components/property/ImageGallery'
import { VideoPlayer } from '@/components/property/VideoPlayer'
import { VerificationBadge } from '@/components/property/VerificationBadge'
import { ReviewsSection } from '@/components/property/ReviewsSection'
import { PropertyRecommendations } from '@/components/property/PropertyRecommendations'
import { LivingCostCard } from '@/components/property/LivingCostCard'
import { VerificationScoreCard } from '@/components/property/VerificationScoreCard'
import {
  LivingConditionCard,
  SafetyScoreCard,
} from '@/components/property/ScoreCards'
import { VirtualTourViewer } from '@/components/property/VirtualTourViewer'
import { NearbyPOISection } from '@/components/map/NearbyPOISection'
import { ListingOverview } from '@/components/property/ListingOverview'
import { MessUtilitiesBoard } from '@/components/mess/MessUtilitiesBoard'
import {
  plainTextFromHtml,
  sanitizeListingHtml,
} from '@/components/ui/rich-text-editor'
import { BookingForm } from '@/components/booking/BookingForm'
import { BookingConfirmation } from '@/components/booking/BookingConfirmation'
import { FavoriteButton } from '@/components/favorites/FavoriteButton'
import { RatingDisplay } from '@/components/hotel/RatingDisplay'
import { AvailabilityBadge } from '@/components/shared/AvailabilityBadge'
import { GlanceFacts, type GlanceFact } from '@/components/shared/GlanceFacts'
import { InstantBookBadge } from '@/components/shared/InstantBookBadge'
import { useMockQuery } from '@/hooks/useMockQuery'
import { useAppFormat } from '@/hooks/useAppFormat'
import {
  fetchPropertyById,
  fetchRecommendations,
} from '@/lib/api/properties'
import {
  createPropertyReview,
  fetchPropertyReviews,
  fetchReviewSummary,
} from '@/lib/api/reviews'
import { createBooking } from '@/lib/api/bookings'
import { listingPath, messPath } from '@/lib/seo/slug'
import { chatWithPath } from '@/lib/chat/link'
import { getCurrentAccountUserId } from '@/lib/api/account'
import { reportDiscoverItem } from '@/lib/api/discover'
import { toast } from '@/lib/feedback/toast'
import { rememberAuthReturn } from '@/utils/auth'
import { hasAuthTokens } from '@/utils/auth-tokens'
import type { Booking, BookingFormData } from '@/types/booking'
import type { ReviewFormData } from '@/types/review'
import {
  ArrowLeft,
  Home,
  MapPin,
  MessageCircle,
  Phone,
  Shield,
  Utensils,
  Video,
  Zap,
} from 'lucide-react'

export function ListingDetailClient({ id }: { id: string }) {
  const t = useTranslations('property.detail')
  const tg = useTranslations('living.glance')
  const tContact = useTranslations('contact')
  const { formatCurrency } = useAppFormat()
  const router = useRouter()
  const currentUserId = getCurrentAccountUserId()
  const [showBooking, setShowBooking] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [lastBooking, setLastBooking] = useState<Booking | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [reviewTick, setReviewTick] = useState(0)

  const loadProperty = useCallback(() => fetchPropertyById(id), [id])
  const loadReviews = useCallback(() => fetchPropertyReviews(id), [id, reviewTick])
  const loadSummary = useCallback(() => fetchReviewSummary(id), [id, reviewTick])
  const loadRecs = useCallback(() => fetchRecommendations(id, 4), [id])

  const {
    data: property,
    loading,
    error,
    refetch,
  } = useMockQuery(loadProperty)
  const { data: reviews } = useMockQuery(loadReviews)
  const { data: summary } = useMockQuery(loadSummary)
  const { data: recommendations } = useMockQuery(loadRecs)

  useEffect(() => {
    if (!property || typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('book') !== '1' || !hasAuthTokens()) return
    setShowBooking(true)
    params.delete('book')
    const next = params.toString()
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}${next ? `?${next}` : ''}`,
    )
  }, [property])

  const onCall = (phone: string) => {
    window.location.href = `tel:${phone.replace(/\s/g, '')}`
  }

  const handleBooking = async (
    data: BookingFormData & { moveInDate: string; moveOutDate?: string }
  ) => {
    if (!property) return
    setBookingError(null)
    const result = await createBooking(property, data)
    if (!result.ok) {
      setBookingError(result.error)
      throw new Error(result.error)
    }
    setLastBooking(result.data)
    setShowBooking(false)
    setShowConfirmation(true)
  }

  const handleReview = async (data: ReviewFormData) => {
    const result = await createPropertyReview(id, data)
    if (!result.ok) throw new Error(result.error)
    setReviewTick(tick => tick + 1)
    refetch()
  }

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <LoadingState label={t('loading')} />
        </PageContainer>
      </Layout>
    )
  }

  if (error || !property) {
    return (
      <Layout>
        <PageContainer>
          <EmptyState
            title={t('notFoundTitle')}
            description={error || t('notFoundAltDesc')}
            icon={Home}
          >
            <Button asChild>
              <Link href="/search">{t('backToSearch')}</Link>
            </Button>
          </EmptyState>
        </PageContainer>
      </Layout>
    )
  }

  const bookLabel = property.instantBook
    ? t('instantBookNow')
    : property.type === 'mess' || property.type === 'hostel'
      ? t('requestSeat')
      : t('requestFlat')

  const startRequest = () => {
    if (!property.available) return
    if (!hasAuthTokens()) {
      const next = `${listingPath(property)}?book=1`
      rememberAuthReturn(next)
      router.push(`/login?next=${encodeURIComponent(next)}`)
      return
    }
    setShowBooking(true)
  }

  const submitTakenReport = async () => {
    setReporting(true)
    const result = await reportDiscoverItem('listing', property.id)
    setReporting(false)
    setShowReport(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(
      result.data.alreadyPending ? t('alreadyRentedPending') : t('alreadyRentedSent'),
    )
  }

  const depositAmount =
    property.rent *
    (property.depositMonths ?? (property.type === 'apartment' ? 2 : 1))

  const isSeatHouse = property.type === 'mess' || property.type === 'hostel'
  const seatsOpen = isSeatHouse && (property.openSeats ?? 0) > 0
  const genderLabel =
    property.gender === 'female'
      ? tg('genderFemale')
      : property.gender === 'mixed'
        ? tg('genderMixed')
        : property.gender === 'male'
          ? tg('genderMale')
          : null
  const glance: GlanceFact[] = []
  if (isSeatHouse && property.openSeats != null) {
    glance.push({
      id: 'seats',
      value: seatsOpen ? String(property.openSeats) : tg('full'),
      label: seatsOpen ? tg('seatsOpen') : tg('noSeats'),
      tone: seatsOpen ? 'good' : 'muted',
      emphasis: true,
    })
  } else {
    glance.push({
      id: 'status',
      value: property.available ? tg('availableNow') : tg('notAvailable'),
      label: tg('status'),
      tone: property.available ? 'good' : 'muted',
      emphasis: true,
    })
  }
  glance.push({
    id: 'rent',
    value: formatCurrency(property.rent),
    label: tg('perMonth'),
  })
  if (genderLabel) {
    glance.push({
      id: 'gender',
      value: genderLabel,
      label: tg('whoStays'),
    })
  }
  if (isSeatHouse) {
    glance.push({
      id: 'meals',
      value: property.mealIncluded ? tg('mealsYes') : tg('mealsNo'),
      label: tg('meals'),
    })
  } else if (property.bedrooms != null) {
    glance.push({
      id: 'beds',
      value: String(property.bedrooms),
      label: tg('bedrooms'),
    })
  } else if (property.sizeSqft != null) {
    glance.push({
      id: 'size',
      value: `${property.sizeSqft}`,
      label: tg('size'),
    })
  }

  return (
    <Layout>
      <PageContainer>
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
          <Link href="/search">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToSearch')}
          </Link>
        </Button>

        <PageHeader
          title={property.name}
          description={`${property.area}, ${property.city} · ${property.type}`}
          actions={
            <div className="flex flex-wrap gap-2">
              <FavoriteButton
                property={property}
                variant="outline"
              />
              <Button
                variant="outline"
                onClick={() => {
                  if (currentUserId && currentUserId === property.ownerId) {
                    router.push('/messages')
                    return
                  }
                  router.push(
                    chatWithPath({
                      userId: property.ownerId,
                      propertyId: property.id,
                      propertyName: property.name,
                    }),
                  )
                }}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                {t('chatOwner')}
              </Button>
              <Button
                onClick={startRequest}
                disabled={!property.available}
              >
                {property.instantBook && <Zap className="mr-2 h-4 w-4" />}
                {bookLabel}
              </Button>
            </div>
          }
        />

        <GlanceFacts items={glance} className="mb-4" />

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <AvailabilityBadge available={property.available} />
          {property.instantBook && (
            <InstantBookBadge tone="soft" label={t('instantBook')} />
          )}
          {property.gender && (
            <Badge variant="outline" className="capitalize">
              {t('genderOnly', { gender: property.gender })}
            </Badge>
          )}
          <VerificationBadge
            verified={property.verified}
            verificationStatus={property.verificationStatus}
            verifiedAt={property.verifiedAt}
            verificationScore={property.verificationScore}
          />
          {property.rating != null && property.reviewCount ? (
            <span className="inline-flex items-center gap-1 text-sm">
              <RatingDisplay rating={property.rating} size="sm" />
              <span className="text-muted-foreground">
                ({t('reviews', { count: property.reviewCount })})
              </span>
            </span>
          ) : null}
        </div>

        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-8">
            <Tabs defaultValue="photos" className="min-w-0">
              <TabsList>
                <TabsTrigger value="photos">{t('photos')}</TabsTrigger>
                {property.tourImages && property.tourImages.length > 0 && (
                  <TabsTrigger value="tour">360°</TabsTrigger>
                )}
                {property.videos && property.videos.length > 0 && (
                  <TabsTrigger value="video">
                    <Video className="mr-1 h-4 w-4" />
                    {t('video')}
                  </TabsTrigger>
                )}
                <TabsTrigger value="reviews">
                  {t('reviewsTab', { count: summary?.totalReviews ?? 0 })}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="photos" className="mt-4 min-w-0">
                <ImageGallery
                  images={property.images}
                  propertyName={property.name}
                />
              </TabsContent>
              {property.tourImages && property.tourImages.length > 0 && (
                <TabsContent value="tour" className="mt-4">
                  <VirtualTourViewer images={property.tourImages} />
                </TabsContent>
              )}
              {property.videos && property.videos.length > 0 && (
                <TabsContent value="video" className="mt-4 space-y-4">
                  {property.videos.map((url, i) => (
                    <VideoPlayer
                      key={i}
                      videoUrl={url}
                      thumbnail={i === 0 ? property.videoThumbnail : undefined}
                      propertyName={property.name}
                    />
                  ))}
                </TabsContent>
              )}
              <TabsContent value="reviews" className="mt-4">
                <ReviewsSection
                  reviews={reviews || []}
                  summary={
                    summary || {
                      averageRating: 0,
                      totalReviews: 0,
                      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                    }
                  }
                  onSubmitReview={handleReview}
                />
              </TabsContent>
            </Tabs>

            <ListingOverview property={property} />

            <section>
              <h2 className="mb-2 text-lg font-semibold">{t('aboutPlace')}</h2>
              {/<[a-z][\s\S]*>/i.test(property.description) ? (
                <div
                  className="max-w-none space-y-2 leading-relaxed text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:mb-2"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeListingHtml(property.description),
                  }}
                />
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                  {plainTextFromHtml(property.description) ||
                    property.description}
                </p>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold">{t('facilities')}</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {property.facilities.map(f => (
                  <div
                    key={f}
                    className="rounded-md border px-3 py-2 text-sm"
                  >
                    {f}
                  </div>
                ))}
              </div>
            </section>

            {property.nearbyFacilities && property.nearbyFacilities.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-semibold">{t('nearby')}</h2>
                <div className="flex flex-wrap gap-2">
                  {property.nearbyFacilities.map(f => (
                    <Badge key={f} variant="secondary">
                      {f}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            <NearbyPOISection
              lat={property.latitude}
              lng={property.longitude}
            />

            {property.utilities ? (
              <MessUtilitiesBoard utilities={property.utilities} />
            ) : null}

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 shrink-0 text-primary" />
                <div className="text-sm">
                  <p className="font-semibold">{t('staySafeTitle')}</p>
                  <p className="mt-1 text-muted-foreground">
                    {t('staySafeDesc')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border p-5 shadow-sm">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-primary">
                  {formatCurrency(property.rent)}
                </span>
                <span className="text-muted-foreground">{t('perMonthLong')}</span>
              </div>
              {property.rentNegotiable && (
                <p className="mt-1 text-sm font-medium text-amber-700 dark:text-amber-400">
                  {t('negotiable')}
                </p>
              )}
              {property.serviceCharge != null && property.serviceCharge > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('serviceChargeLine', {
                    amount: formatCurrency(property.serviceCharge),
                  })}
                </p>
              )}
              {property.mealIncluded && (
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Utensils className="h-3.5 w-3.5" />
                  {t('mealsIncluded')}
                  {property.mealCost
                    ? ` ${t('mealsExtra', {
                        amount: formatCurrency(property.mealCost),
                      })}`
                    : ''}
                </p>
              )}
              {isSeatHouse && property.openSeats != null && (
                <span
                  className={
                    seatsOpen
                      ? 'mt-3 inline-flex items-center rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white'
                      : 'mt-3 inline-flex items-center rounded-full bg-slate-500 px-3 py-1.5 text-xs font-semibold text-white'
                  }
                >
                  {seatsOpen ? property.openSeats : tg('full')}{' '}
                  {seatsOpen ? tg('seatsOpen') : tg('noSeats')}
                </span>
              )}
              {property.messId &&
                (property.type === 'mess' || property.type === 'hostel') && (
                <Button
                  className="mt-3 h-11 w-full rounded-full shadow-md shadow-primary/25"
                  asChild
                >
                  <Link
                    href={messPath({
                      id: property.messId,
                      name: property.name,
                      city: property.city,
                    })}
                  >
                    <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-200 opacity-90" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-100" />
                    </span>
                    {t('viewMessHouse')}
                  </Link>
                </Button>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                {t('deposit', { amount: formatCurrency(depositAmount) })}
              </p>

              <div className="mt-4 flex items-start gap-2 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>
                  {property.address}, {property.area}, {property.city}
                </span>
              </div>

              {bookingError && (
                <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {bookingError}
                </p>
              )}

              <Button
                className="mt-4 w-full"
                size="lg"
                disabled={!property.available}
                onClick={startRequest}
              >
                {property.instantBook && <Zap className="mr-2 h-4 w-4" />}
                {bookLabel}
              </Button>
              <Button
                variant="outline"
                className="mt-2 w-full"
                onClick={() => onCall(property.ownerPhone)}
              >
                <Phone className="mr-2 h-4 w-4" />
                {t('callOwner', { name: property.ownerName })}
              </Button>
              <WhatsAppButton
                className="mt-2 w-full"
                number={property.ownerWhatsapp}
                message={tContact('messageOwner', {
                  property:
                    property.name?.trim() || tContact('propertyFallback'),
                })}
                label={tContact('whatsappOwner')}
              />
              <Button
                variant="ghost"
                className="mt-1 w-full text-muted-foreground"
                onClick={() => setShowReport(true)}
              >
                {t('alreadyRented')}
              </Button>
            </div>

            {property.livingCost && (
              <LivingCostCard cost={property.livingCost} />
            )}

            {property.livingConditionScore && (
              <LivingConditionCard score={property.livingConditionScore} />
            )}

            {property.safetyScore && (
              <SafetyScoreCard score={property.safetyScore} />
            )}

            {property.verificationScore && (
              <VerificationScoreCard score={property.verificationScore} />
            )}

            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">{t('listedBy')}</p>
              <p className="font-semibold">{property.ownerName}</p>
              <p className="text-sm text-muted-foreground">
                {property.ownerPhone}
              </p>
              <WhatsAppButton
                className="mt-3 w-full"
                size="sm"
                number={property.ownerWhatsapp}
                message={tContact('messageOwner', {
                  property:
                    property.name?.trim() || tContact('propertyFallback'),
                })}
                showNumber
              />
            </div>
          </aside>
        </div>

        {recommendations && recommendations.length > 0 && (
          <div className="mt-12">
            <PropertyRecommendations
              properties={recommendations}
              onViewDetails={p => router.push(listingPath(p))}
              onCall={onCall}
            />
          </div>
        )}
      </PageContainer>

      <BookingForm
        property={property}
        open={showBooking}
        onOpenChange={setShowBooking}
        onSubmit={handleBooking}
      />
      <BookingConfirmation
        booking={lastBooking}
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        onViewBookings={() => {
          setShowConfirmation(false)
          router.push('/my-bookings')
        }}
      />
      <AlertDialog open={showReport} onOpenChange={setShowReport}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('alreadyRented')}</AlertDialogTitle>
            <AlertDialogDescription>{t('alreadyRentedConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reporting}>{t('alreadyRentedKeep')}</AlertDialogCancel>
            <AlertDialogAction disabled={reporting} onClick={(event) => {
              event.preventDefault()
              void submitTakenReport()
            }}>
              {t('alreadyRentedSend')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  )
}
