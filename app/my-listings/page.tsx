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

export default function MyListingsPage() {
  const t = useTranslations('portfolio.listings')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useAppFormat()
  const router = useRouter()
  const [tick, setTick] = useState(0)
  const [boostTarget, setBoostTarget] = useState<Property | null>(null)
  const [boostOpen, setBoostOpen] = useState(false)

  const load = useCallback(() => fetchOwnerListings(), [tick])
  const loadLimit = useCallback(() => fetchFlatLimitStatus(), [tick])
  const { data: listings, loading, error, refetch } = useMockQuery(load)
  const { data: limitStatus } = useMockQuery(loadLimit)

  const togglePublish = async (listing: Property) => {
    const nextPublished = !listing.published
    const result = await updateListing(listing.id, {
      published: nextPublished,
      listingStatus: nextPublished ? 'published' : 'paused',
    })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setTick(n => n + 1)
    refetch()
  }

  const openBoost = (listing: Property) => {
    setBoostTarget(listing)
    setBoostOpen(true)
  }

  const confirmStillAvailable = async (listing: Property) => {
    await confirmDiscoverItem('listing', listing.id)
    refetch()
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
          {listings?.map(listing => {
            const featured = isListingFeatured(listing)
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
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold leading-tight">
                        {listing.name}
                      </h3>
                      <p className="text-sm capitalize text-muted-foreground">
                        {listing.type} · {listing.area}
                      </p>
                    </div>
                    <Badge
                      variant={listing.published ? 'default' : 'secondary'}
                    >
                      {listing.listingStatus ||
                        (listing.published ? 'published' : 'draft')}
                    </Badge>
                  </div>
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
                      onClick={() => confirmStillAvailable(listing)}
                    >
                      <CheckCircle className="mr-1 h-3.5 w-3.5" />
                      Still available
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
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
