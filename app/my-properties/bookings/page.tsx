'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Layout } from '@/components/layout/Layout'
import {
  PageContainer,
  PageHeader,
  EmptyState,
  LoadingState,
} from '@/components/page'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookingCard } from '@/components/booking/BookingCard'
import { BookingDetailDialog } from '@/components/booking/BookingDetailDialog'
import { BookingCalendar } from '@/components/booking/BookingCalendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ownerSheetClass,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useMockQuery } from '@/hooks/useMockQuery'
import { ApproveBookingFlatDialog } from '@/components/booking/ApproveBookingFlatDialog'
import {
  fetchBookingsForOwner,
  patchBookingStatus,
} from '@/lib/api/bookings'
import {
  confirmTakenReport,
  dismissTakenReport,
  fetchTakenReports,
  type TakenReport,
} from '@/lib/api/discover'
import { cn } from '@/lib/utils'
import type { Booking, BookingStatus } from '@/types/booking'
import { Calendar, CheckCircle2, Clock, Plus } from 'lucide-react'

export default function OwnerBookingsPage() {
  const t = useTranslations('portfolio.bookingRequests')
  const tc = useTranslations('common')
  const scope = useSearchParams().get('scope')
  const messScope = scope === 'mess'
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | 'all'>(
    'all'
  )
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showApproveFlat, setShowApproveFlat] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const [takenReports, setTakenReports] = useState<TakenReport[]>([])

  const load = useCallback(
    () => fetchBookingsForOwner(),
    [tick]
  )
  const { data: bookings, loading, error, refetch } = useMockQuery(load)

  useEffect(() => {
    let cancelled = false
    void fetchTakenReports().then(result => {
      if (!cancelled && result.ok) setTakenReports(result.data)
    })
    return () => {
      cancelled = true
    }
  }, [tick])

  const visibleBookings = (bookings || []).filter(booking =>
    messScope
      ? booking.propertyType === 'mess' || booking.propertyType === 'hostel'
      : true,
  )
  const ownerBookings = visibleBookings.filter(b =>
    selectedStatus === 'all' ? true : b.status === selectedStatus,
  )

  const pendingBookings = visibleBookings.filter(b => b.status === 'pending')
  const approvedBookings = visibleBookings.filter(b => b.status === 'approved')
  const allBookings = visibleBookings

  const refresh = () => {
    setTick(t => t + 1)
    refetch()
  }

  const requestApprove = (bookingId: string) => {
    const booking =
      (bookings || []).find(b => b.id === bookingId) || selectedBooking
    if (!booking) return
    setSelectedBooking(booking)
    if (booking.propertyType === 'apartment') {
      setShowDetail(false)
      setShowApproveFlat(true)
      return
    }
    void handleApprove(bookingId)
  }

  const handleApprove = async (bookingId: string, flatId?: string) => {
    setActionError(null)
    const result = await patchBookingStatus(
      bookingId,
      'approved',
      undefined,
      flatId,
    )
    if (!result.ok) {
      setActionError(result.error)
      return
    }
    setShowDetail(false)
    setShowApproveFlat(false)
    refresh()
  }

  const handleApproveWithFlat = async (booking: Booking, flatId: string) => {
    await handleApprove(booking.id, flatId)
  }

  const handleRejectConfirm = async () => {
    if (!selectedBooking || !rejectionReason.trim()) return
    setActionError(null)
    const result = await patchBookingStatus(
      selectedBooking.id,
      'rejected',
      rejectionReason.trim()
    )
    if (!result.ok) {
      setActionError(result.error)
      return
    }
    setShowRejectDialog(false)
    setRejectionReason('')
    setSelectedBooking(null)
    setShowDetail(false)
    refresh()
  }

  const handleComplete = async (booking: Booking) => {
    const result = await patchBookingStatus(booking.id, 'completed')
    if (!result.ok) {
      setActionError(result.error)
      return
    }
    setShowDetail(false)
    refresh()
  }

  const respondToReport = async (report: TakenReport, action: 'confirm' | 'dismiss') => {
    const result = action === 'confirm'
      ? await confirmTakenReport(report.id)
      : await dismissTakenReport(report.id)
    if (!result.ok) {
      setActionError(result.error)
      return
    }
    toast.success(action === 'confirm' ? t('takenConfirmed') : t('takenDismissed'))
    refresh()
  }

  return (
    <Layout>
      <PageContainer>
        <PageHeader
          title={messScope ? t('seatTitle') : t('title')}
          description={messScope ? t('seatDescription') : t('manageDesc')}
          actions={
            <Button asChild variant="outline">
              <Link href={messScope ? '/mess' : '/my-listings'}>
                <Plus className="mr-2 h-4 w-4" />
                {messScope ? t('manageMess') : t('manageListings')}
              </Link>
            </Button>
          }
        />

        {actionError && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {actionError}
          </div>
        )}

        {takenReports.length > 0 && (
          <div className="mb-6 space-y-3">
            {takenReports.map(report => (
              <Card key={report.id} className="border-amber-300/70 bg-amber-50/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t('takenTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t('takenBody', { name: report.listingName })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void respondToReport(report, 'dismiss')}
                    >
                      {t('dismissTaken')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => void respondToReport(report, 'confirm')}
                    >
                      {t('confirmTaken')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('pending')}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingBookings.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('approved')}</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {approvedBookings.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('total')}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allBookings.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <Select
            value={selectedStatus}
            onValueChange={value =>
              setSelectedStatus(value as BookingStatus | 'all')
            }
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={tc('filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tc('allStatus')}</SelectItem>
              <SelectItem value="pending">{tc('status.pending')}</SelectItem>
              <SelectItem value="approved">{tc('status.approved')}</SelectItem>
              <SelectItem value="rejected">{tc('status.rejected')}</SelectItem>
              <SelectItem value="cancelled">{tc('status.cancelled')}</SelectItem>
              <SelectItem value="completed">{tc('status.completed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading && <LoadingState label={t('loading')} />}
        {error && (
          <EmptyState
            title={t('errorTitle')}
            description={error}
            icon={Calendar}
          >
            <Button onClick={() => refetch()}>{tc('retry')}</Button>
          </EmptyState>
        )}

        {!loading && !error && (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="h-auto w-full justify-start">
              <TabsTrigger value="pending">
                {t('pending')} ({pendingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                {t('approved')} ({approvedBookings.length})
              </TabsTrigger>
              <TabsTrigger value="calendar">{t('calendar')}</TabsTrigger>
              <TabsTrigger value="all">
                {t('all')} ({ownerBookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6 space-y-4">
              {pendingBookings.length === 0 ? (
                <EmptyState
                  title={t('emptyPendingTitle')}
                  description={t('emptyPendingAltDesc')}
                  icon={Clock}
                />
              ) : (
                pendingBookings.map(booking => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    showActions
                    onApprove={requestApprove}
                    onReject={id => {
                      const b = pendingBookings.find(x => x.id === id)
                      if (b) {
                        setSelectedBooking(b)
                        setShowRejectDialog(true)
                      }
                    }}
                    onViewDetails={b => {
                      setSelectedBooking(b)
                      setShowDetail(true)
                    }}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="approved" className="mt-6 space-y-4">
              {approvedBookings.map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onViewDetails={b => {
                    setSelectedBooking(b)
                    setShowDetail(true)
                  }}
                />
              ))}
            </TabsContent>

            <TabsContent value="calendar" className="mt-6">
              <BookingCalendar bookings={allBookings} />
            </TabsContent>

            <TabsContent value="all" className="mt-6 space-y-4">
              {ownerBookings.map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  showActions={booking.status === 'pending'}
                  onApprove={requestApprove}
                  onReject={id => {
                    const b = ownerBookings.find(x => x.id === id)
                    if (b) {
                      setSelectedBooking(b)
                      setShowRejectDialog(true)
                    }
                  }}
                  onViewDetails={b => {
                    setSelectedBooking(b)
                    setShowDetail(true)
                  }}
                />
              ))}
            </TabsContent>
          </Tabs>
        )}

        <BookingDetailDialog
          booking={selectedBooking}
          open={showDetail}
          onOpenChange={setShowDetail}
          role="owner"
          onApprove={b => requestApprove(b.id)}
          onReject={b => {
            setSelectedBooking(b)
            setShowDetail(false)
            setShowRejectDialog(true)
          }}
          onComplete={handleComplete}
        />

        <ApproveBookingFlatDialog
          booking={selectedBooking}
          open={showApproveFlat}
          onOpenChange={setShowApproveFlat}
          onConfirm={handleApproveWithFlat}
        />

        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent className={cn(ownerSheetClass('sm:max-w-md'), 'gap-4 overflow-y-auto p-4 sm:p-6')}>
            <DialogHeader className="pr-8 text-left">
              <DialogTitle>{t('rejectTitle')}</DialogTitle>
              <DialogDescription>{t('rejectDesc')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reason">{t('rejectReason')}</Label>
                <Textarea
                  id="reason"
                  placeholder={t('rejectReasonPlaceholder')}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowRejectDialog(false)
                    setRejectionReason('')
                  }}
                >
                  {tc('actions.cancel')}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleRejectConfirm}
                  disabled={!rejectionReason.trim()}
                >
                  {t('rejectBooking')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </Layout>
  )
}
