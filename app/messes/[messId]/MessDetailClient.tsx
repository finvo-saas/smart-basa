'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { WhatsAppButton } from '@/components/contact/WhatsAppButton'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/page'
import {
  ensureMessListing,
  fetchMessById,
  fetchMessMealCalendar,
  fetchMessSeats,
  updateMessLiveStatus,
} from '@/lib/api/mess'
import { useMockQuery } from '@/hooks/useMockQuery'
import { extractEntityId, listingPath, messPath } from '@/lib/seo/slug'
import { useSSE } from '@/hooks/useSSE'
import { formatCurrency } from '@/lib/format/locale'
import { ArrowRight, CalendarCheck, MapPin, Phone, Users, UtensilsCrossed } from 'lucide-react'
import { GlanceFacts, type GlanceFact } from '@/components/shared/GlanceFacts'
import { FacilityChips } from '@/components/shared/FacilityChips'
import { MessLiveStatusBoard } from '@/components/mess/MessLiveStatusBoard'
import { MessPublicMealCalendar } from '@/components/mess/MessPublicMealCalendar'
import { MessUtilitiesBoard } from '@/components/mess/MessUtilitiesBoard'
import {
  plainTextFromHtml,
  sanitizeListingHtml,
} from '@/components/ui/rich-text-editor'
import { NearbyPOISection } from '@/components/map/NearbyPOISection'
import { LivingCostCard } from '@/components/property/LivingCostCard'
import {
  LivingConditionCard,
  SafetyScoreCard,
} from '@/components/property/ScoreCards'
import { VerificationScoreCard } from '@/components/property/VerificationScoreCard'
import { fetchPropertyById } from '@/lib/api/properties'
import type { Property } from '@/types/property'
import { getStoredRole, rememberAuthReturn } from '@/utils/auth'
import { toast } from '@/lib/feedback/toast'
import { hasAuthTokens } from '@/utils/auth-tokens'

export function MessDetailClient() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('mess.publicDetail')
  const tg = useTranslations('living.glance')
  const tc = useTranslations('common')
  const tContact = useTranslations('contact')
  const messId = extractEntityId(params.messId)
  const [imageIndex, setImageIndex] = useState(0)
  const [booking, setBooking] = useState(false)
  const [liveOverride, setLiveOverride] = useState<{
    status: Record<string, string>
    updatedAt?: string | null
  } | null>(null)
  const role = getStoredRole()
  const canEditStatus = role === 'owner' || role === 'admin'

  const loadMess = useCallback(() => fetchMessById(messId), [messId])
  const loadSeats = useCallback(() => fetchMessSeats(messId), [messId])
  const loadCalendar = useCallback(
    () => fetchMessMealCalendar(messId, 7),
    [messId],
  )
  const { data: mess, loading, refetch } = useMockQuery(loadMess)
  const { data: seats } = useMockQuery(loadSeats)
  const { data: mealCalendar } = useMockQuery(loadCalendar)
  const [listing, setListing] = useState<Property | null>(null)

  useEffect(() => {
    const listingId = mess?.listingId
    if (!listingId) {
      setListing(null)
      return
    }
    let cancelled = false
    void fetchPropertyById(listingId).then(result => {
      if (cancelled) return
      setListing(result.ok ? result.data : null)
    })
    return () => {
      cancelled = true
    }
  }, [mess?.listingId])

  useSSE(
    messId ? `/mess/${messId}/live-status/stream/` : null,
    {
      onEvent: (event, data) => {
        if (event === 'live_status' && data && typeof data === 'object') {
          setLiveOverride(
            data as { status: Record<string, string>; updatedAt?: string | null },
          )
        }
      },
    },
    Boolean(messId),
  )

  const handleBookSeat = async () => {
    const dest = listing
      ? `${listingPath(listing)}?book=1`
      : messPath({ id: messId, name: mess?.name, city: mess?.city })
    if (!hasAuthTokens()) {
      rememberAuthReturn(dest)
      router.push(`/login?next=${encodeURIComponent(dest)}`)
      return
    }
    if (listing) {
      router.push(`${listingPath(listing)}?book=1`)
      return
    }
    if (mess?.bookUrl || mess?.listingId) {
      router.push(mess.bookUrl || `/listings/${mess.listingId}`)
      return
    }
    setBooking(true)
    const result = await ensureMessListing(messId)
    setBooking(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    router.push(result.data.bookUrl)
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <LoadingState label={t('loading')} />
        </div>
      </Layout>
    )
  }

  if (!mess) {
    return (
      <Layout>
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <Card>
            <CardContent className="flex flex-col items-center py-16">
              <UtensilsCrossed className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-lg font-semibold">{t('notFound')}</p>
              <Button className="mt-4" variant="outline" asChild>
                <Link href="/messes">{t('backToBrowse')}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  const images = mess.images?.length ? mess.images : []
  const openSeats = (seats ?? []).filter(s => s.status === 'available')
  const liveStatus = liveOverride || mess.liveStatus
  const utilities = mess.utilities
  const hasSeats = mess.availableSeats > 0
  const genderLabel =
    mess.gender === 'female'
      ? tg('genderFemale')
      : mess.gender === 'mixed'
        ? tg('genderMixed')
        : tg('genderMale')
  const glance: GlanceFact[] = [
    {
      id: 'seats',
      value: hasSeats ? String(mess.availableSeats) : tg('full'),
      label: hasSeats ? tg('seatsOpen') : tg('noSeats'),
      hint: mess.totalSeats > 0 ? tg('ofTotal', { total: mess.totalSeats }) : undefined,
      tone: hasSeats ? 'good' : 'muted',
      emphasis: true,
    },
    {
      id: 'fee',
      value: formatCurrency(mess.monthlyFee),
      label: tg('perMonth'),
    },
    {
      id: 'gender',
      value: genderLabel,
      label: tg('whoStays'),
    },
  ]
  if (mess.mealSystem && mess.mealSystem.mealsPerDay > 0) {
    glance.push({
      id: 'meals',
      value: String(mess.mealSystem.mealsPerDay),
      label: tg('mealsADay'),
    })
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
          ← {tc('back')}
        </Button>

        <div className="mb-6">
          <div className="relative h-64 w-full overflow-hidden rounded-xl bg-muted sm:h-96">
            {images[imageIndex] ? (
              <Image
                src={images[imageIndex]}
                alt={mess.name}
                fill
                className="object-cover"
                sizes="100vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl">
                🏘️
              </div>
            )}
            <div
              className={
                hasSeats
                  ? 'absolute bottom-3 left-3 inline-flex items-center rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md'
                  : 'absolute bottom-3 left-3 inline-flex items-center rounded-full bg-slate-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md'
              }
            >
              {hasSeats ? mess.availableSeats : tg('full')}{' '}
              {hasSeats ? tg('seatsOpen') : tg('noSeats')}
            </div>
          </div>
          {images.length > 1 && (
            <div className="mt-2 grid grid-cols-4 gap-2">
              {images.slice(0, 4).map((img, idx) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setImageIndex(idx)}
                  className={`relative h-20 overflow-hidden rounded-lg ${
                    imageIndex === idx ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="150px" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold sm:text-3xl">{mess.name}</h1>
                    <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {mess.address}, {mess.city}
                    </p>
                  </div>
                </div>
                <GlanceFacts items={glance} className="mt-4" />
              </CardHeader>
              <CardContent className="space-y-4">
                {mess.description && plainTextFromHtml(mess.description) ? (
                  /<\/?[a-z][\s\S]*>/i.test(mess.description) ? (
                    <div
                      className="prose prose-sm max-w-none text-muted-foreground"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeListingHtml(mess.description),
                      }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-muted-foreground">
                      {mess.description}
                    </p>
                  )
                ) : (
                  <p className="text-muted-foreground">{t('noDescription')}</p>
                )}
                {mess.facilities.length > 0 && (
                  <div>
                    <h2 className="mb-2 font-semibold">{t('facilities')}</h2>
                    <FacilityChips items={mess.facilities} />
                  </div>
                )}
              </CardContent>
            </Card>

            {listing ? (
              <Link
                href={listingPath(listing)}
                className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl bg-primary px-5 py-4 text-primary-foreground shadow-lg shadow-primary/30 transition hover:brightness-110"
              >
                <span className="relative flex min-w-0 items-center gap-3">
                  <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-200 opacity-90" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-100" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-semibold">
                      {t('viewListing')}
                    </span>
                    <span className="block text-sm text-primary-foreground/85">
                      {t('viewListingHint')}
                    </span>
                  </span>
                </span>
                <ArrowRight className="relative h-5 w-5 shrink-0 transition group-hover:translate-x-1" />
              </Link>
            ) : null}

            {mealCalendar ? <MessPublicMealCalendar calendar={mealCalendar} /> : null}
            {utilities ? <MessUtilitiesBoard utilities={utilities} /> : null}

            <NearbyPOISection lat={mess.latitude} lng={mess.longitude} />

            {liveStatus ? (
              <MessLiveStatusBoard
                status={liveStatus.status || {}}
                updatedAt={liveStatus.updatedAt}
                editable={canEditStatus}
                onChange={async (key, value) => {
                  const next = {
                    ...(liveStatus?.status || {}),
                    [key]: value,
                  } as Record<string, 'ok' | 'warn' | 'down'>
                  const result = await updateMessLiveStatus(messId, next)
                  if (!result.ok) {
                    toast.error(result.error)
                    return
                  }
                  setLiveOverride(result.data)
                  refetch()
                }}
              />
            ) : canEditStatus ? (
              <MessLiveStatusBoard
                status={{
                  water: 'ok',
                  electricity: 'ok',
                  wifi: 'ok',
                  breakfast: 'ok',
                  lunch: 'ok',
                  dinner: 'ok',
                }}
                editable
                onChange={async (key, value) => {
                  const result = await updateMessLiveStatus(messId, {
                    [key]: value,
                  } as Record<string, 'ok' | 'warn' | 'down'>)
                  if (!result.ok) {
                    toast.error(result.error)
                    return
                  }
                  setLiveOverride(result.data)
                  refetch()
                }}
              />
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  {t('seatsTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  {t('seatsSummary', {
                    open: mess.availableSeats,
                    total: mess.totalSeats,
                  })}
                </p>
                {openSeats.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {openSeats.map(seat => (
                      <Badge key={seat.id} variant="secondary">
                        {seat.roomNumber} · {seat.seatNumber}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('noOpenSeats')}</p>
                )}
              </CardContent>
            </Card>

            {listing ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('trustTitle')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t('trustBody')}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {listing.livingConditionScore ? (
                    <LivingConditionCard score={listing.livingConditionScore} />
                  ) : null}
                  {listing.safetyScore ? (
                    <SafetyScoreCard score={listing.safetyScore} />
                  ) : null}
                  {listing.verificationScore ? (
                    <VerificationScoreCard score={listing.verificationScore} />
                  ) : null}
                </CardContent>
              </Card>
            ) : canEditStatus && !mess.listingId ? (
              <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
                {t('trustPending')}
              </p>
            ) : null}
          </div>

          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Card className="border-primary/20 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">{t('monthlyFee')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(mess.monthlyFee)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /month
                  </span>
                </p>
                <span
                  className={
                    hasSeats
                      ? 'inline-flex items-center rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white'
                      : 'inline-flex items-center rounded-full bg-slate-500 px-3 py-1.5 text-xs font-semibold text-white'
                  }
                >
                  {hasSeats ? mess.availableSeats : tg('full')}{' '}
                  {hasSeats ? tg('seatsOpen') : tg('noSeats')}
                  {mess.totalSeats > 0
                    ? ` · ${tg('ofTotal', { total: mess.totalSeats })}`
                    : ''}
                </span>
                {mess.livingCost ? (
                  <LivingCostCard cost={mess.livingCost} />
                ) : null}
                {listing ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{t('trustTitle')}</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        [t('scoreLiving'), listing.livingConditionScore?.score, 'bg-teal-600'],
                        [t('scoreSafety'), listing.safetyScore?.score, 'bg-sky-600'],
                        [t('scoreTrust'), listing.verificationScore?.score, 'bg-amber-500'],
                      ].map(([label, value, color]) => (
                        <span
                          key={label}
                          className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold text-white ${color}`}
                        >
                          {label} {value ?? '—'}
                          {value != null ? '%' : ''}
                        </span>
                      ))}
                    </div>
                    <Button variant="link" className="h-auto p-0 text-sm" asChild>
                      <Link href={listingPath(listing)}>{t('viewListing')}</Link>
                    </Button>
                  </div>
                ) : null}
                {mess.mealSystem?.guestMealPrice != null ? (
                  <p className="text-sm text-muted-foreground">
                    {t('guestMeal', {
                      price: formatCurrency(mess.mealSystem.guestMealPrice),
                    })}
                  </p>
                ) : null}
                <p className="text-sm text-muted-foreground">
                  {t('owner')}: {mess.ownerName}
                </p>
                <Button
                  className="w-full"
                  disabled={booking || mess.availableSeats <= 0}
                  onClick={handleBookSeat}
                >
                  <CalendarCheck className="mr-2 h-4 w-4" />
                  {booking ? t('preparingBook') : t('bookSeat')}
                </Button>
                <Button className="w-full" variant="outline" asChild>
                  <a href={`tel:${mess.ownerPhone}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    {t('callOwner')}
                  </a>
                </Button>
                <WhatsAppButton
                  className="w-full"
                  number={mess.ownerWhatsapp}
                  message={tContact('messageOwner', {
                    property: mess.name?.trim() || tContact('propertyFallback'),
                  })}
                  label={tContact('whatsappOwner')}
                />
                {!hasAuthTokens() ? (
                  <p className="text-center text-xs text-muted-foreground">
                    {t('loginHint')}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
}
