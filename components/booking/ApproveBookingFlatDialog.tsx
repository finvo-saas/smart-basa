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
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Booking } from '@/types/booking'
import type { Flat } from '@/types/building'
import { fetchAllFlats } from '@/lib/api/buildings'
import { useAppFormat } from '@/hooks/useAppFormat'

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

  const candidates = useMemo(() => {
    if (!booking) return []
    return flats.filter(f => {
      if (f.status !== 'available') return false
      if (f.listingId && f.listingId === booking.propertyId) return true
      if (!f.listingId) return true
      return false
    })
  }, [flats, booking])

  const linkedFirst = useMemo(() => {
    if (!booking) return candidates
    const linked = candidates.filter(f => f.listingId === booking.propertyId)
    const rest = candidates.filter(f => f.listingId !== booking.propertyId)
    return [...linked, ...rest]
  }, [candidates, booking])

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('approveWithFlatTitle')}</DialogTitle>
          <DialogDescription>
            {booking
              ? t('approveWithFlatDesc', {
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
        ) : linkedFirst.length === 0 ? (
          <div className="space-y-2 text-sm">
            <p className="text-destructive">{t('noVacantFlats')}</p>
            <p className="text-muted-foreground">{t('noVacantFlatsHint')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>{t('selectFlat')}</Label>
            <Select value={flatId} onValueChange={setFlatId}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectFlatPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {linkedFirst.map(flat => (
                  <SelectItem key={flat.id} value={flat.id}>
                    {t('flatOption', {
                      number: flat.flatNumber,
                      floor: flat.floor,
                      rent: formatCurrency(flat.rent),
                      linked:
                        flat.listingId === booking?.propertyId
                          ? t('linkedBadge')
                          : '',
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={() => void handleConfirm()}
            disabled={!flatId || submitting || linkedFirst.length === 0}
          >
            {t('confirmApprove')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
