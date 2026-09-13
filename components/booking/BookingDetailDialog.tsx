'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ownerSheetClass,
} from '@/components/ui/dialog'
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge'
import { WhatsAppButton } from '@/components/contact/WhatsAppButton'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  MapPin,
  Phone,
  User,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
} from 'lucide-react'
import { format } from 'date-fns'
import type { Booking } from '@/types/booking'
import { cn } from '@/lib/utils'
import { BookingCommissionSummary } from '@/components/monetization'

interface BookingDetailDialogProps {
  booking: Booking | null
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: 'renter' | 'owner'
  onCancel?: (booking: Booking) => void
  onApprove?: (booking: Booking) => void
  onReject?: (booking: Booking) => void
  onComplete?: (booking: Booking) => void
}

function TimelineStep({
  label,
  date,
  active,
  tone = 'default',
}: {
  label: string
  date?: string
  active: boolean
  tone?: 'default' | 'success' | 'danger' | 'muted'
}) {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40'
      : tone === 'danger'
        ? 'border-red-500 bg-red-50 text-red-800 dark:bg-red-950/40'
        : tone === 'muted'
          ? 'border-muted-foreground/30 bg-muted text-muted-foreground'
          : 'border-primary bg-primary/5'

  return (
    <div
      className={cn(
        'rounded-lg border-l-4 px-3 py-2 text-sm',
        active ? toneClass : 'border-muted bg-muted/30 text-muted-foreground'
      )}
    >
      <p className="font-medium">{label}</p>
      {date && active && (
        <p className="text-xs opacity-80">
          {format(new Date(date), 'MMM dd, yyyy · h:mm a')}
        </p>
      )}
    </div>
  )
}

export function BookingDetailDialog({
  booking,
  open,
  onOpenChange,
  role = 'renter',
  onCancel,
  onApprove,
  onReject,
  onComplete,
}: BookingDetailDialogProps) {
  const tContact = useTranslations('contact')
  if (!booking) return null

  const isOwner = role === 'owner'
  const contactName = isOwner ? booking.renterName : booking.ownerName
  const contactPhone = isOwner ? booking.renterPhone : booking.ownerPhone
  const contactWhatsapp = isOwner
    ? booking.renterWhatsapp
    : booking.ownerWhatsapp
  const propertyLabel =
    booking.propertyName?.trim() || tContact('propertyFallback')
  const whatsappMessage = isOwner
    ? tContact('messageRenter', { property: propertyLabel })
    : tContact('messageOwner', { property: propertyLabel })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(ownerSheetClass('sm:max-w-lg'), 'gap-4 overflow-y-auto p-4 sm:p-6')}>
        <DialogHeader className="pr-8 text-left">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <DialogTitle className="break-words">{booking.propertyName}</DialogTitle>
              <DialogDescription className="capitalize">
                {booking.propertyType} booking
              </DialogDescription>
            </div>
            <BookingStatusBadge status={booking.status} />
          </div>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="capitalize">
              {booking.bookingMode === 'instant' ? (
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-500" /> Instant book
                </span>
              ) : (
                'Request to book'
              )}
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{booking.propertyAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Move-in:{' '}
                {booking.moveInDate
                  ? format(new Date(booking.moveInDate), 'PPP')
                  : 'Not set'}
              </span>
            </div>
            {booking.duration && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Duration: {booking.duration} months</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>
                {isOwner ? 'Renter' : 'Owner'}: {contactName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${contactPhone}`} className="text-primary hover:underline">
                {contactPhone}
              </a>
            </div>
            <WhatsAppButton
              size="sm"
              className="w-fit"
              number={contactWhatsapp}
              message={whatsappMessage}
              showNumber
            />
          </div>

          <div className="rounded-lg border p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly rent</span>
              <span className="font-semibold">৳{booking.rent.toLocaleString()}</span>
            </div>
            {booking.deposit != null && (
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-muted-foreground">Deposit</span>
                <span className="font-semibold">
                  ৳{booking.deposit.toLocaleString()}
                </span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t pt-2 text-sm">
              <span className="font-medium">Total due at move-in</span>
              <span className="text-lg font-bold text-primary">
                ৳{booking.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {isOwner &&
            (booking.status === 'approved' || booking.status === 'completed') && (
              <BookingCommissionSummary totalAmount={booking.totalAmount} />
            )}

          {booking.message && (
            <div>
              <p className="mb-1 text-sm font-medium">Message</p>
              <p className="rounded-md bg-muted/50 p-3 text-sm">{booking.message}</p>
            </div>
          )}

          {booking.specialRequests && (
            <div>
              <p className="mb-1 text-sm font-medium">Special requests</p>
              <p className="rounded-md bg-muted/50 p-3 text-sm">
                {booking.specialRequests}
              </p>
            </div>
          )}

          {booking.rejectionReason && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
              <p className="font-medium text-destructive">Rejection reason</p>
              <p>{booking.rejectionReason}</p>
            </div>
          )}

          {booking.cancellationReason && (
            <div className="rounded-lg border bg-muted/50 p-3 text-sm">
              <p className="font-medium">Cancellation reason</p>
              <p>{booking.cancellationReason}</p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-semibold">Status timeline</p>
            <TimelineStep
              label="Request submitted"
              date={booking.createdAt}
              active
            />
            <TimelineStep
              label="Approved"
              date={booking.approvedAt}
              active={Boolean(booking.approvedAt)}
              tone="success"
            />
            <TimelineStep
              label="Rejected"
              date={booking.rejectedAt}
              active={Boolean(booking.rejectedAt)}
              tone="danger"
            />
            <TimelineStep
              label="Cancelled"
              date={booking.cancelledAt}
              active={Boolean(booking.cancelledAt)}
              tone="muted"
            />
            <TimelineStep
              label="Completed"
              date={booking.completedAt}
              active={Boolean(booking.completedAt)}
              tone="success"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {!isOwner &&
              (booking.status === 'pending' || booking.status === 'approved') &&
              onCancel && (
                <Button
                  variant="outline"
                  className="h-11 flex-1 px-4"
                  onClick={() => onCancel(booking)}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Cancel booking
                </Button>
              )}
            {isOwner && booking.status === 'pending' && (
              <>
                <Button
                  className="h-11 flex-1 px-4"
                  onClick={() => onApprove?.(booking)}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  className="h-11 flex-1 px-4"
                  onClick={() => onReject?.(booking)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </>
            )}
            {isOwner && booking.status === 'approved' && onComplete && (
              <Button className="flex-1" onClick={() => onComplete(booking)}>
                Mark completed
              </Button>
            )}
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
