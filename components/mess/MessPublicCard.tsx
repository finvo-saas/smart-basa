'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { WhatsAppButton } from '@/components/contact/WhatsAppButton'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Phone, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/format/locale'
import { messPath } from '@/lib/seo/slug'
import { FreshnessBadge } from '@/components/discover/FreshnessBadge'
import type { Mess } from '@/types/mess'

interface MessPublicCardProps {
  mess: Mess
}

export function MessPublicCard({ mess }: MessPublicCardProps) {
  const [imageError, setImageError] = useState(false)
  const tContact = useTranslations('contact')
  const hasSeats = mess.availableSeats > 0

  return (
    <Card className="group overflow-hidden border-border/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-48 w-full overflow-hidden bg-muted sm:h-56">
        <Link href={messPath(mess)} className="absolute inset-0 z-0">
          <span className="sr-only">View {mess.name}</span>
        </Link>
        {!imageError && mess.images[0] ? (
          <Image
            src={mess.images[0]}
            alt={mess.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            onError={() => setImageError(true)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-500/20 to-primary/10">
            <span className="text-4xl">🏘️</span>
          </div>
        )}
        <div className="absolute left-2 top-2 z-10 flex flex-wrap gap-1.5">
          <Badge
            className={
              hasSeats
                ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                : 'bg-background/90 text-foreground'
            }
          >
            {hasSeats
              ? `${mess.availableSeats} seats open`
              : 'Currently full'}
          </Badge>
          <Badge
            variant="outline"
            className="bg-background/90 capitalize backdrop-blur"
          >
            {mess.gender}
          </Badge>
          <FreshnessBadge
            lastConfirmedAt={mess.lastConfirmedAt}
            confirmedHoursAgo={mess.confirmedHoursAgo}
            stale={mess.stale}
          />
        </div>
      </div>

      <CardContent className="p-4 sm:p-5">
        <Link
          href={messPath(mess)}
          className="text-lg font-semibold leading-tight hover:text-primary sm:text-xl"
        >
          <span className="line-clamp-2">{mess.name}</span>
        </Link>
        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">Mess</p>

        <div className="mt-3 flex flex-wrap items-baseline gap-1">
          <span className="text-2xl font-bold text-primary sm:text-3xl">
            {formatCurrency(mess.monthlyFee)}
          </span>
          <span className="text-sm text-muted-foreground">/month</span>
        </div>

        <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="line-clamp-1">
            {mess.address}, {mess.city}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4 shrink-0" />
          <span>
            {mess.availableSeats} / {mess.totalSeats} seats free
          </span>
        </div>

        {mess.facilities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {mess.facilities.slice(0, 3).map(facility => (
              <Badge key={facility} variant="outline" className="text-xs font-normal">
                {facility}
              </Badge>
            ))}
            {mess.facilities.length > 3 && (
              <Badge variant="outline" className="text-xs font-normal">
                +{mess.facilities.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 min-[360px]:flex min-[360px]:flex-wrap">
          <Button variant="outline" className="min-w-0 flex-1" asChild>
            <Link href={messPath(mess)} className="truncate">
              View details
            </Link>
          </Button>
          <Button className="min-w-0 flex-1" asChild>
            <a href={`tel:${mess.ownerPhone}`} className="truncate">
              <Phone className="mr-1.5 h-4 w-4 shrink-0" />
              Call
            </a>
          </Button>
          <WhatsAppButton
            size="icon"
            className="col-span-2 w-full min-[360px]:col-span-1 min-[360px]:w-auto"
            number={mess.ownerWhatsapp}
            message={tContact('messageOwner', {
              property: mess.name?.trim() || tContact('propertyFallback'),
            })}
            label=""
            aria-label={tContact('whatsapp')}
          />
        </div>
      </CardContent>
    </Card>
  )
}
