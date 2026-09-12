'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ownerSheetClass,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Booking } from '@/types/booking'
import type { Flat } from '@/types/building'
import { fetchAllFlats } from '@/lib/api/buildings'
import { useAppFormat } from '@/hooks/useAppFormat'
import { cn } from '@/lib/utils'

interface ApproveBookingFlatDialogProps {
  booking: Booking | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (booking: Booking, flatId: string) => void | Promise<void>
}

export function ApproveBookingFlatDialog({
  booking,
  open,
  onOpenChange,
  onConfirm,
}: ApproveBookingFlatDialogProps) {
  const t = useTranslations('portfolio.bookingRequests')
  const { formatCurrency } = useAppFormat()
  const [flats, setFlats] = useState<Flat[]>([])
  const [loading, setLoading] = useState(false)
  const [flatId, setFlatId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !booking) return
    setFlatId('')
    setLoadError(null)
    setLoading(true)
    void (async () => {
      const result = await fetchAllFlats()
      if (!result.ok) {
        setLoadError(result.error)
        setFlats([])
      } else {
        setFlats(result.data)
      }
      setLoading(false)
    })()
  }, [open, booking])

  const linkedFlat = useMemo(() => {
    if (!booking) return null
    return (
      flats.find(
        flat =>
          flat.listingId === booking.propertyId && flat.status === 'available',
      ) || null
    )
  }, [flats, booking])

  useEffect(() => {
    setFlatId(linkedFlat?.id || '')
  }, [linkedFlat])

  const handleConfirm = async () => {
    if (!booking || !flatId) return
    setSubmitting(true)
    try {
      await onConfirm(booking, flatId)
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(ownerSheetClass('sm:max-w-md'), 'gap-4 overflow-y-auto p-4 sm:p-6')}>
        <DialogHeader className="pr-8 text-left">
          <DialogTitle>{t('approveWithFlatTitle')}</DialogTitle>
          <DialogDescription>
            {booking
              ? t('approveLinkedDesc', {
                  renter: booking.renterName,
                  property: booking.propertyName,
                })
              : ''}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">{t('loadingFlats')}</p>
        ) : loadError ? (
          <p className="text-sm text-destructive">{loadError}</p>
        ) : !linkedFlat ? (
          <div className="space-y-2 text-sm">
            <p className="text-destructive">{t('noLinkedFlat')}</p>
            <p className="text-muted-foreground">{t('noLinkedFlatHint')}</p>
          </div>
        ) : (
          <div className="rounded-lg border p-3 text-sm">
            <p className="font-medium">
              {t('flatOption', {
                number: linkedFlat.flatNumber,
                floor: linkedFlat.floor,
                rent: formatCurrency(linkedFlat.rent),
                linked: t('linkedBadge'),
              })}
            </p>
            <p className="mt-1 text-muted-foreground">{t('approveLinkedNote')}</p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={() => void handleConfirm()}
            disabled={!linkedFlat || submitting}
          >
            {t('confirmApprove')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
