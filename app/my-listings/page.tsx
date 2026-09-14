'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Layout } from '@/components/layout/Layout'
import {
  PageContainer,
  PageHeader,
  EmptyState,
  LoadingState,
} from '@/components/page'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  FeaturedBadge,
  BoostListingDialog,
  isListingFeatured,
} from '@/components/monetization'
import { useMockQuery } from '@/hooks/useMockQuery'
import { fetchOwnerListings, updateListing } from '@/lib/api/properties'
import { fetchFlatLimitStatus } from '@/lib/api/subscriptions'
import { listingPath } from '@/lib/seo/slug'
import { toast } from '@/lib/feedback/toast'
import { useAppFormat } from '@/hooks/useAppFormat'
import { confirmDiscoverItem } from '@/lib/api/discover'
import { Building2, Plus, Eye, Pencil, Pause, Play, Sparkles, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import type { Property } from '@/types/property'

function isOccupied(listing: Property) {
  if (listing.occupancy === 'occupied') return true
  if (listing.occupancy === 'vacant' || listing.occupancy === 'unlinked') {
    return false
  }
  return Boolean(listing.linkedFlatId) && listing.available === false
}

function occupancyLabel(listing: Property): 'occupied' | 'empty' {
  return isOccupied(listing) ? 'occupied' : 'empty'
}

export default function MyListingsPage() {
  const t = useTranslations('portfolio.listings')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useAppFormat()
  const router = useRouter()
  const [tick, setTick] = useState(0)
  const [patches, setPatches] = useState<Record<string, Partial<Property>>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [boostTarget, setBoostTarget] = useState<Property | null>(null)
  const [boostOpen, setBoostOpen] = useState(false)

  const load = useCallback(() => fetchOwnerListings(), [tick])
  const loadLimit = useCallback(() => fetchFlatLimitStatus(), [tick])
  const { data: listings, loading, error, refetch } = useMockQuery(load)
  const { data: limitStatus } = useMockQuery(loadLimit)
  const visibleListings = (listings ?? []).map(listing => ({
    ...listing,
    ...patches[listing.id],
  }))

  const applyPatch = (id: string, patch: Partial<Property>) => {
    setPatches(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  const togglePublish = async (listing: Property) => {
    const nextPublished = !listing.published
    setBusyId(listing.id)
    const result = await updateListing(listing.id, {
      published: nextPublished,
      listingStatus: nextPublished ? 'published' : 'paused',
    })
    setBusyId(null)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    const next = result.data
    const occupied = isOccupied(next.occupancy ? next : listing)
    applyPatch(listing.id, {
      published: next.published,
      listingStatus: next.listingStatus,
      available: next.available,
      occupancy: next.occupancy ?? listing.occupancy,
      unitLabel: next.unitLabel ?? listing.unitLabel,
      flatStatus: next.flatStatus ?? listing.flatStatus,
    })
    if (next.published && occupied) toast.warning(t('publishedOccupied'))
    else if (next.published) toast.success(t('publishedSuccess'))
    else toast.success(t('pausedSuccess'))
  }

  const openBoost = (listing: Property) => {
    setBoostTarget(listing)
    setBoostOpen(true)
  }

  const confirmStillAvailable = async (listing: Property) => {
    setBusyId(listing.id)
    const result = await confirmDiscoverItem('listing', listing.id)
    setBusyId(null)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    applyPatch(listing.id, {
      lastConfirmedAt: new Date().toISOString(),
      confirmedHoursAgo: 0,
    })
    toast.success(
      isOccupied(listing) ? t('stillAvailableOccupied') : t('stillAvailableSuccess'),
    )
  }

  return (
    <Layout userRole="owner">
      <PageContainer>
        <PageHeader
          title={t('title')}
          description={t('description')}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/subscription">{t('plansAndBoosts')}</Link>
              </Button>
              <Button asChild>
                <Link href="/my-listings/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('newListing')}
                </Link>
              </Button>
            </div>
          }
        />

        {limitStatus && limitStatus.planTier === 'free' && (
          <p className="mb-4 text-sm text-muted-foreground">
            {t('freePlanHint', { plan: limitStatus.planName })}{' '}
            <Link href="/subscription" className="text-primary underline">
              {t('comparePlans')}
            </Link>
          </p>
        )}

        {loading && <LoadingState label={t('loading')} />}
        {error && (
          <EmptyState
            title={t('errorTitle')}
            description={error}
            icon={Building2}
          >
            <Button onClick={() => refetch()}>{tc('retry')}</Button>
          </EmptyState>
        )}

        {!loading && !error && listings && listings.length === 0 && (
          <EmptyState
            title={t('emptyTitle')}
            description={t('emptyDesc')}
            icon={Building2}
          >
            <Button asChild>
              <Link href="/my-listings/new">{t('publish')}</Link>
            </Button>
          </EmptyState>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {!loading &&
            visibleListings.map(listing => {
            const featured = isListingFeatured(listing)
            const occupied = isOccupied(listing)
            const paused = !listing.published
            const confirmed =
              listing.confirmedHoursAgo === 0
                ? t('confirmedJustNow')
                : listing.lastConfirmedAt
                  ? t('confirmedAgo', {
                      when: formatDate(listing.lastConfirmedAt, { style: 'medium' }),
                    })
                  : null
            return (
              <Card key={listing.id} className="overflow-hidden">
                <div className="relative h-40 bg-muted">
                  {listing.images[0] && (
                    <Image
                      src={listing.images[0]}
                      alt={listing.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  )}
                  {featured && (
                    <div className="absolute left-2 top-2">
                      <FeaturedBadge />
                    </div>
                  )}
                </div>
                <CardContent className="space-y-3 p-4 pt-4 sm:p-4 sm:pt-4">
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-semibold leading-tight">
                        {listing.name}
                      </h3>
                      <p className="text-sm capitalize text-muted-foreground">
                        {listing.type} · {listing.area}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge
                        variant={occupied ? 'destructive' : 'outline'}
                        className={
                          occupied
                            ? undefined
                            : 'border-emerald-600/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                        }
                      >
                        {t(occupancyLabel(listing))}
                      </Badge>
                      <Badge variant={paused ? 'secondary' : 'default'}>
                        {paused ? t('statusPaused') : t('statusPublished')}
                      </Badge>
                    </div>
                  </div>
                  {listing.unitLabel && (
                    <p className="text-sm text-muted-foreground">{listing.unitLabel}</p>
                  )}
                  {!listing.unitLabel && listing.type === 'apartment' && !listing.linkedFlatId && (
                    <p className="text-sm text-muted-foreground">{t('notLinked')}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {occupied ? t('rentersHiddenOccupied') : t('rentersSeeEmpty')}
                    {paused ? ` · ${t('pausedHint')}` : ''}
                  </p>
                  {confirmed && (
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      {confirmed}
                    </p>
                  )}
                  {listing.featuredUntil && featured && (
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      {t('featuredUntil', {
                        date: formatDate(listing.featuredUntil, {
                          style: 'medium',
                        }),
                      })}
                    </p>
                  )}
                  <p className="font-bold text-primary">
                    {formatCurrency(listing.rent)}
                    <span className="text-sm font-normal text-muted-foreground">
                      {t('perMonth')}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(listingPath(listing))}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      {t('view')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        router.push(`/my-listings/${listing.id}/edit`)
                      }
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      {tc('edit')}
                    </Button>
                    <Button
                      size="sm"
                      variant={featured ? 'secondary' : 'default'}
                      onClick={() => openBoost(listing)}
                    >
                      <Sparkles className="mr-1 h-3.5 w-3.5" />
                      {featured ? t('extendBoost') : t('boost')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === listing.id}
                      onClick={() => confirmStillAvailable(listing)}
                    >
                      <CheckCircle className="mr-1 h-3.5 w-3.5" />
                      {t('stillAvailable')}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busyId === listing.id}
                      onClick={() => togglePublish(listing)}
                    >
                      {listing.published ? (
                        <>
                          <Pause className="mr-1 h-3.5 w-3.5" />
                          {t('pause')}
                        </>
                      ) : (
                        <>
                          <Play className="mr-1 h-3.5 w-3.5" />
                          {t('publishAction')}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-8 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{t('tipTitle')}</p>
          <p className="mt-1">
            {t('tipDesc')}{' '}
            <Link href="/my-properties/bookings" className="text-primary underline">
              {t('tipLink')}
            </Link>
            .
          </p>
        </div>
      </PageContainer>

      <BoostListingDialog
        listing={boostTarget}
        open={boostOpen}
        onOpenChange={setBoostOpen}
        onSuccess={() => {
          setTick(n => n + 1)
          refetch()
        }}
      />
    </Layout>
  )
}
