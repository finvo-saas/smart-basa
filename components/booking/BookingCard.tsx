'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge'
import { Calendar, MapPin, Phone, User, X, Check, XCircle, Zap } from 'lucide-react'
import { format } from 'date-fns'
import Image from 'next/image'
import type { Booking } from '@/types/booking'
import { BookingCommissionInline } from '@/components/monetization'

interface BookingCardProps {
  booking: Booking
  onApprove?: (bookingId: string) => void
  onReject?: (bookingId: string) => void
  onCancel?: (bookingId: string) => void
  onViewDetails?: (booking: Booking) => void
  showActions?: boolean
}

export function BookingCard({
  booking,
  onApprove,
  onReject,
  onCancel,
  onViewDetails,
  showActions = false,
}: BookingCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        {booking.propertyImage && (
          <div className="relative h-48 w-full shrink-0 sm:h-auto sm:w-64 lg:w-96 xl:w-[28rem]">
            <Image
              src={booking.propertyImage}
              alt={booking.propertyName}
              fill
              className="object-cover"
              sizes="(max-width: 639px) 100vw, (max-width: 1024px) 256px, (max-width: 1280px) 384px, 448px"
            />
          </div>
        )}

        {/* Content */}
          <div className="flex-1 min-w-0">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <CardTitle className="break-words text-base sm:text-lg">
                  {booking.propertyName}
                </CardTitle>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">
                    {booking.propertyType}
                  </Badge>
                  <BookingStatusBadge status={booking.status} />
                  {booking.bookingMode === 'instant' && (
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="mr-1 h-3 w-3 text-amber-500" />
                      Instant
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Property Address */}
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <span className="text-muted-foreground line-clamp-2">
                {booking.propertyAddress}
              </span>
            </div>

            {/* Booking Dates */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  <strong>Move-in:</strong>{' '}
                  {booking.moveInDate
                    ? format(new Date(booking.moveInDate), 'MMM dd, yyyy')
                    : 'Not specified'}
                </span>
              </div>
              {booking.moveOutDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    <strong>Move-out:</strong>{' '}
                    {format(new Date(booking.moveOutDate), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}
              {booking.duration && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    <strong>Duration:</strong> {booking.duration} months
                  </span>
                </div>
              )}
            </div>

            {/* Renter/Owner Info */}
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {showActions ? 'Renter:' : 'Owner:'}{' '}
                <span className="font-medium text-foreground">
                  {showActions ? booking.renterName : booking.ownerName}
                </span>
              </span>
            </div>

            {/* Contact */}
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a
                href={`tel:${showActions ? booking.renterPhone : booking.ownerPhone}`}
                className="text-primary hover:underline"
              >
                {showActions ? booking.renterPhone : booking.ownerPhone}
              </a>
            </div>

            {/* Pricing */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Rent</p>
                <p className="text-lg font-bold">
                  ৳{booking.rent.toLocaleString()}
                </p>
              </div>
              {booking.deposit && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Deposit</p>
                  <p className="text-lg font-bold">
                    ৳{booking.deposit.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {showActions &&
              (booking.status === 'approved' ||
                booking.status === 'completed') && (
                <BookingCommissionInline totalAmount={booking.totalAmount} />
              )}

            {/* Message Preview */}
            {booking.message && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {booking.message}
                </p>
              </div>
            )}

            {/* Rejection Reason */}
            {booking.status === 'rejected' && booking.rejectionReason && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm font-medium text-destructive mb-1">
                  Rejection Reason:
                </p>
                <p className="text-sm text-destructive/80">
                  {booking.rejectionReason}
                </p>
              </div>
            )}

            {/* Actions */}
            {showActions && booking.status === 'pending' && (
              <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row">
                <Button
                  className="h-11 w-full px-4 sm:flex-1"
                  onClick={() => onApprove?.(booking.id)}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  className="h-11 w-full px-4 sm:flex-1"
                  onClick={() => onReject?.(booking.id)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            )}

            {!showActions && booking.status === 'pending' && (
              <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row">
                <Button
                  variant="outline"
                  className="h-11 w-full px-4 sm:flex-1"
                  onClick={() => onCancel?.(booking.id)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel Booking
                </Button>
                {onViewDetails && (
                  <Button
                    variant="outline"
                    className="h-11 w-full px-4 sm:flex-1"
                    onClick={() => onViewDetails(booking)}
                  >
                    View Details
                  </Button>
                )}
              </div>
            )}

            {!showActions &&
              booking.status !== 'pending' &&
              onViewDetails && (
                <div className="border-t pt-3">
                  <Button
                    variant="outline"
                    className="h-11 w-full px-4"
                    onClick={() => onViewDetails(booking)}
                  >
                    View details
                  </Button>
                </div>
              )}

            {showActions &&
              booking.status !== 'pending' &&
              onViewDetails && (
                <div className="border-t pt-3">
                  <Button
                    variant="outline"
                    className="h-11 w-full px-4"
                    onClick={() => onViewDetails(booking)}
                  >
                    View details
                  </Button>
                </div>
              )}
          </CardContent>
        </div>
      </div>
    </Card>
  )
}
