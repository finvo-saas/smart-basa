'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Home, ArrowRight, BedDouble, MapPin } from 'lucide-react'
import type { MyTenancy } from '@/types/building'
import type { Student } from '@/types/mess'
import { useAppFormat } from '@/hooks/useAppFormat'
import { cn } from '@/lib/utils'
import { WhatsAppButton } from '@/components/contact/WhatsAppButton'

interface CurrentRentalProps {
  tenancy?: MyTenancy | null
  messMembership?: Student
  className?: string
}

export function CurrentRental({
  tenancy,
  messMembership,
  className,
}: CurrentRentalProps) {
  const t = useTranslations('dashboard.renter')
  const { formatCurrency } = useAppFormat()

  if (tenancy) {
    const { flat, building, owner } = tenancy
    return (
      <section
        className={cn(
          'rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50/90 via-white to-slate-50 p-4 dark:border-teal-900/50 dark:from-teal-950/40 dark:via-background dark:to-background',
          className,
        )}
      >
        <div className="mb-3 flex items-center gap-2 text-teal-800 dark:text-teal-200">
          <Home className="h-4 w-4" />
          <p className="text-xs font-semibold uppercase tracking-wide">
            {t('currentHome')}
          </p>
        </div>
        <p className="text-lg font-semibold leading-snug">
          {building.name || t('propertyFallback')}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('flatFloor', { flat: flat.flatNumber, floor: flat.floor })}
        </p>
        {(building.address || building.city) && (
          <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              {[building.address, building.city].filter(Boolean).join(', ')}
            </span>
          </p>
        )}
        {owner?.phone || owner?.whatsapp ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {t('ownerLabel', { name: owner.name || t('ownerFallback') })}
            </p>
            {(owner.whatsapp || owner.phone) && (
              <WhatsAppButton
                size="sm"
                number={owner.whatsapp || owner.phone}
                message={t('ownerWhatsAppMessage', {
                  building: building.name,
                  flat: flat.flatNumber,
                })}
              />
            )}
          </div>
        ) : null}
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-teal-200/60 pt-3 dark:border-teal-900/40">
          <div>
            <p className="text-xs text-muted-foreground">{t('monthlyRent')}</p>
            <p className="text-xl font-bold tabular-nums text-teal-800 dark:text-teal-200">
              {formatCurrency(flat.rent)}
            </p>
            {tenancy.deposit != null ? (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {t('depositOnFile', { amount: formatCurrency(tenancy.deposit) })}
              </p>
            ) : null}
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link href="/bills">
              {t('viewBills')}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    )
  }

  if (messMembership) {
    return (
      <section
        className={cn(
          'rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50/90 via-white to-slate-50 p-4 dark:border-teal-900/50 dark:from-teal-950/40 dark:via-background dark:to-background',
          className,
        )}
      >
        <div className="mb-3 flex items-center gap-2 text-teal-800 dark:text-teal-200">
          <BedDouble className="h-4 w-4" />
          <p className="text-xs font-semibold uppercase tracking-wide">
            {t('currentMess')}
          </p>
        </div>
        <p className="text-lg font-semibold leading-snug">
          {messMembership.messName || t('messFallback')}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {messMembership.seatNumber
            ? t('seatLabel', { seat: messMembership.seatNumber })
            : t('noSeatYet')}
        </p>
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-teal-200/60 pt-3 dark:border-teal-900/40">
          <div>
            <p className="text-xs text-muted-foreground">{t('monthlyFee')}</p>
            <p className="text-xl font-bold tabular-nums text-teal-800 dark:text-teal-200">
              {formatCurrency(messMembership.monthlyFee || 0)}
            </p>
          </div>
          <Button asChild size="sm" className="shrink-0">
            <Link href="/mess/student-dashboard">
              {t('openMess')}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section
      className={cn(
        'rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-5 text-center dark:border-slate-700 dark:bg-slate-900/40',
        className,
      )}
    >
      <Home className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
      <p className="text-sm font-semibold">{t('noHomeTitle')}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t('noHomeDesc')}</p>
      <Button asChild size="sm" className="mt-4">
        <Link href="/search">{t('findHome')}</Link>
      </Button>
    </section>
  )
}
