'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { WhatsAppButton } from '@/components/contact/WhatsAppButton'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Users, Phone, Mail, Check, X, MessageCircle } from 'lucide-react'
import { chatWithPath } from '@/lib/chat/link'
import {
  fetchHotelBookings,
  fetchHotelById,
  patchHotelBookingStatus,
} from '@/lib/api/hotels'
import { useMockQuery } from '@/hooks/useMockQuery'
import { format } from 'date-fns'
import type { Booking, BookingStatus } from '@/types/hotel'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useConfirm } from '@/components/feedback'
import { toast } from '@/lib/feedback/toast'

export default function BookingManagementPage() {
  const t = useTranslations('hotels')
  const tc = useTranslations('common')
  const { confirm } = useConfirm()
  const params = useParams()
  const router = useRouter()
  const hotelId = params.hotelId as string

  const loadHotel = useCallback(() => fetchHotelById(hotelId), [hotelId])
  const { data: hotel } = useMockQuery(loadHotel)

  const loadBookings = useCallback(() => fetchHotelBookings(hotelId), [hotelId])
  const { data: allBookings, refetch: refetchBookings } = useMockQuery(loadBookings)

  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all')

  const bookings = useMemo(() => {
    let filtered = [...(allBookings ?? [])]

    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter)
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [statusFilter, allBookings])

  const handleStatusChange = async (
    bookingId: string,
    newStatus: BookingStatus
  ) => {
    const ok = await confirm({
      title: t('bookings.changeStatusTitle', { status: newStatus }),
    })
    if (!ok) return
    const result = await patchHotelBookingStatus(bookingId, newStatus)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    await refetchBookings()
    toast.success(t('bookings.statusUpdated'))
  }

  const statusColors: Record<BookingStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
    'checked-in': 'bg-purple-100 text-purple-800',
    'checked-out': 'bg-gray-100 text-gray-800',
  }

  if (!hotel) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg font-semibold text-muted-foreground">
                {t('pricing.notFoundTitle')}
              </p>
              <Button
                variant="outline"
                onClick={() => router.push('/my-hotels')}
                className="mt-4"
              >
                {t('myHotels.backToHotels')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-2"
          >
            ← {tc('back')}
          </Button>
          <h1 className="text-2xl font-bold mb-2">{t('bookings.title')}</h1>
          <p className="text-muted-foreground">{hotel.name}</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Select
            value={statusFilter}
            onValueChange={value => setStatusFilter(value as any)}
          >
            <SelectTrigger className="w-auto min-w-[7.5rem] flex-1 sm:w-[180px] sm:flex-none">
              <SelectValue placeholder={tc('filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('bookings.allBookings')}</SelectItem>
              <SelectItem value="pending">{tc('status.pending')}</SelectItem>
              <SelectItem value="confirmed">{tc('status.confirmed')}</SelectItem>
              <SelectItem value="checked-in">{tc('status.checkedIn')}</SelectItem>
              <SelectItem value="checked-out">
                {t('bookings.statusCheckedOut')}
              </SelectItem>
              <SelectItem value="completed">
                {t('bookings.statusCompleted')}
              </SelectItem>
              <SelectItem value="cancelled">{tc('status.cancelled')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bookings Table */}
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg font-semibold text-muted-foreground">
                {t('bookings.emptyTitle')}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {statusFilter === 'all'
                  ? t('bookings.emptyAll')
                  : t('bookings.emptyFiltered', { status: statusFilter })}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('bookings.columns.guest')}</TableHead>
                      <TableHead>{t('bookings.columns.room')}</TableHead>
                      <TableHead>{t('bookings.columns.checkIn')}</TableHead>
                      <TableHead>{t('bookings.columns.checkOut')}</TableHead>
                      <TableHead>{t('bookings.columns.guests')}</TableHead>
                      <TableHead>{t('bookings.columns.amount')}</TableHead>
                      <TableHead>{t('bookings.columns.status')}</TableHead>
                      <TableHead>{t('bookings.columns.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map(booking => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{booking.guestName}</p>
                            <p className="text-xs text-muted-foreground">
                              {booking.guestPhone}
                            </p>
                            <WhatsAppButton
                              size="sm"
                              variant="ghost"
                              className="h-7 px-1.5 text-xs"
                              number={booking.guestWhatsapp}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          {booking.roomNumber
                            ? t('book.roomLabel', { number: booking.roomNumber })
                            : t('bookings.columns.room')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(booking.checkIn), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(booking.checkOut), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>{booking.guests}</TableCell>
                        <TableCell className="font-semibold">
                          ৳{booking.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[booking.status]}>
                            {booking.status.replace('-', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={chatWithPath({ userId: booking.userId })}>
                                <MessageCircle className="mr-1 h-3 w-3" />
                                Message
                              </Link>
                            </Button>
                            {booking.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleStatusChange(booking.id, 'confirmed')
                                  }
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  {t('bookings.actions.confirm')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleStatusChange(booking.id, 'cancelled')
                                  }
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  {tc('cancel')}
                                </Button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleStatusChange(booking.id, 'checked-in')
                                }
                              >
                                {t('bookings.actions.checkIn')}
                              </Button>
                            )}
                            {booking.status === 'checked-in' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleStatusChange(booking.id, 'checked-out')
                                }
                              >
                                {t('bookings.actions.checkOut')}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
