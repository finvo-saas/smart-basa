'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { MessManageLinks } from '@/components/mess/MessManageLinks'
import { Users, DollarSign, MapPin, Phone, UserPlus } from 'lucide-react'
import type { Mess } from '@/types/mess'

interface MessOverviewCardProps {
  mess: Mess
  onAssignRenter: (mess: Mess) => void
  /** Show owner management links (meals, attendance, etc.) */
  showManageLinks?: boolean
}

export function MessOverviewCard({
  mess,
  onAssignRenter,
  showManageLinks = true,
}: MessOverviewCardProps) {
  const [imageError, setImageError] = useState(false)
  const occupied = mess.totalSeats - mess.availableSeats
  const occupancyRate =
    mess.totalSeats > 0 ? (occupied / mess.totalSeats) * 100 : 0

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <div className="relative h-48 w-full overflow-hidden bg-muted sm:h-52">
        {!imageError && mess.images[0] ? (
          <Image
            src={mess.images[0]}
            alt={mess.name}
            fill
            className="object-cover transition-transform hover:scale-105"
            onError={() => setImageError(true)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
            <span className="text-5xl">🏠</span>
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
            {mess.availableSeats} seats free
          </Badge>
        </div>
        <div className="absolute right-2 top-2">
          <Badge
            variant="outline"
            className="bg-background/95 font-semibold capitalize shadow-sm backdrop-blur"
          >
            {mess.gender}
          </Badge>
        </div>
      </div>

      <CardHeader className="space-y-1 px-3 pb-2 sm:px-6">
        <CardTitle className="text-balance text-lg sm:text-2xl">
          {mess.name}
        </CardTitle>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">
            {mess.address}, {mess.city}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-3 sm:px-6">
        <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:gap-3">
          <div className="rounded-lg border p-2.5 sm:p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5 shrink-0" />
              Occupied
            </div>
            <p className="mt-1 break-words text-lg font-bold sm:text-xl">
              {occupied}
              <span className="text-sm font-normal text-muted-foreground">
                /{mess.totalSeats}
              </span>
            </p>
          </div>
          <div className="rounded-lg border p-2.5 sm:p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5 shrink-0" />
              Monthly fee
            </div>
            <p className="mt-1 break-words text-lg font-bold text-primary sm:text-xl">
              ৳{mess.monthlyFee.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Occupancy</span>
            <span className="font-medium">{occupancyRate.toFixed(0)}%</span>
          </div>
          <Progress value={occupancyRate} className="h-2" />
        </div>

        {mess.facilities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {mess.facilities.slice(0, 4).map(facility => (
              <Badge key={facility} variant="outline" className="text-xs">
                {facility}
              </Badge>
            ))}
            {mess.facilities.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{mess.facilities.length - 4}
              </Badge>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 rounded-lg border p-3 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Owner</p>
            <p className="truncate text-sm font-medium">{mess.ownerName}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="w-full shrink-0 min-[360px]:w-auto"
          >
            <a href={`tel:${mess.ownerPhone}`}>
              <Phone className="mr-1.5 h-3.5 w-3.5" />
              Call
            </a>
          </Button>
        </div>

        {showManageLinks && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Manage</p>
            <MessManageLinks mess={mess} variant="compact" />
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="outline" className="w-full" asChild>
            <Link href={`/mess/${mess.id}/members`}>
              <Users className="mr-2 h-4 w-4" />
              Renters
            </Link>
          </Button>
          {/* Enabled even when full: a renter can wait without a seat. */}
          <Button className="w-full" onClick={() => onAssignRenter(mess)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Assign renter
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
