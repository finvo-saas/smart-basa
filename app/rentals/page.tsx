'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Layout } from '@/components/layout/Layout'
import {
  PageContainer,
  PageHeader,
  EmptyState,
  LoadingState,
} from '@/components/page'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMockQuery } from '@/hooks/useMockQuery'
import { fetchRentalSummariesForRenter } from '@/lib/api/rentals'
import { chatWithPath } from '@/lib/chat/link'
import { getStoredUserId } from '@/utils/auth-tokens'
import { useAppFormat } from '@/hooks/useAppFormat'
import type { RentalSummary } from '@/lib/api/rentals'
import {
  Building2,
  Calendar,
  MapPin,
  MessageCircle,
  Phone,
  Search,
} from 'lucide-react'
import Image from 'next/image'

export default function RentalsPage() {
  const t = useTranslations('portfolio.rentals')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useAppFormat()
  const renterId = getStoredUserId() || ''
  const load = useCallback(
    () => fetchRentalSummariesForRenter(renterId),
    [renterId]
  )
  const { data: summaries, loading, error, refetch } = useMockQuery(load)

  const phaseBadge = (phase: RentalSummary['phase']) => {
    const variants: Record<
      RentalSummary['phase'],
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      active: 'default',
      upcoming: 'secondary',
      pending: 'outline',
      past: 'secondary',
      declined: 'destructive',
    }
    return (
      <Badge variant={variants[phase]}>{t(`phases.${phase}`)}</Badge>
    )
  }

  return (
    <Layout>
      <PageContainer>
        <PageHeader
          title={t('title')}
          description={t('descriptionDemo')}
          actions={
            <Button asChild>
              <Link href="/search">
                <Search className="mr-2 h-4 w-4" />
                {t('findPlace')}
              </Link>
            </Button>
          }
        />

        {loading && (
          <LoadingState label={t('loading')} variant="skeleton" skeletonVariant="row" />
        )}
        {error && (
          <EmptyState
            title={t('errorTitle')}
            description={error}
            icon={Building2}
          >
            <Button onClick={() => refetch()}>{tc('retry')}</Button>
          </EmptyState>
        )}
        {!loading && !error && summaries && summaries.length === 0 && (
          <EmptyState
            title={t('emptyTitle')}
            description={t('emptyDesc')}
            icon={Building2}
          >
            <Button asChild>
              <Link href="/search">{tc('browseListings')}</Link>
            </Button>
          </EmptyState>
        )}
        {!loading && !error && summaries && summaries.length > 0 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {summaries.map(({ booking, phase }) => (
              <Card
                key={booking.id}
                className="overflow-hidden border-border/80"
              >
                <div className="relative h-40 w-full bg-muted">
                  {booking.propertyImage ? (
                    <Image
                      src={booking.propertyImage}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">
                      🏠
                    </div>
                  )}
                  <div className="absolute right-2 top-2">
                    {phaseBadge(phase)}
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-snug">
                      {booking.propertyName}
                    </CardTitle>
                    <Badge variant="outline" className="shrink-0 capitalize">
                      {booking.propertyType}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{booking.propertyAddress}</span>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {booking.moveInDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {t('moveIn', {
                            date: formatDate(booking.moveInDate, {
                              style: 'medium',
                            }),
                          })}
                        </span>
                      </div>
                    )}
                    <div className="font-semibold text-primary">
                      {formatCurrency(booking.rent)}
                      {t('perMonth')}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 border-t pt-3">
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={chatWithPath({
                          userId: booking.ownerId,
                          propertyId: booking.propertyId,
                          propertyName: booking.propertyName,
                        })}
                      >
                        <MessageCircle className="mr-1.5 h-4 w-4" />
                        {t('chat')}
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`tel:${booking.ownerPhone}`}>
                        <Phone className="mr-1.5 h-4 w-4" />
                        {t('owner')}
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/my-bookings">{t('bookingDetails')}</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>
    </Layout>
  )
}
