'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { WhatsAppButton } from '@/components/contact/WhatsAppButton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ownerSheetClass,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  User,
  Phone,
  Mail,
  FileText,
  Calendar,
  DollarSign,
  Home,
  CheckCircle2,
  Clock,
  XCircle,
  Pencil,
  LogOut,
  Trash2,
  Megaphone,
  ExternalLink,
} from 'lucide-react'
import type { Flat } from '@/types/building'
import type { Bill } from '@/types/bill'
import { RenterHistoryDialog } from '@/components/renter/RenterHistoryDialog'
import { FlatStatusBadge } from '@/components/shared/FlatStatusBadge'
import { fetchBillsForOwner } from '@/lib/api/bills'
import { cn } from '@/lib/utils'
import { useAppFormat } from '@/hooks/useAppFormat'

interface FlatDetailDialogProps {
  flat: Flat | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssignRenter: (flat: Flat) => void
  onEditRenter?: (flat: Flat) => void
  onGenerateBill: (flat: Flat) => void
  onEditFlat?: (flat: Flat) => void
  onVacateFlat?: (flat: Flat) => void
  onDeleteFlat?: (flat: Flat) => void
  onPublishListing?: (flat: Flat) => void
  publishingListing?: boolean
  /** Building / property display name for the WhatsApp greeting. */
  propertyName?: string
}

const paymentStatusConfig = {
  paid: {
    icon: CheckCircle2,
    className: 'text-green-600 dark:text-green-400',
    label: 'Paid',
  },
  unpaid: {
    icon: Clock,
    className: 'text-yellow-600 dark:text-yellow-400',
    label: 'Unpaid',
  },
  overdue: {
    icon: XCircle,
    className: 'text-red-600 dark:text-red-400',
    label: 'Overdue',
  },
} as const

export function FlatDetailDialog({
  flat,
  open,
  onOpenChange,
  onAssignRenter,
  onEditRenter,
  onGenerateBill,
  onEditFlat,
  onVacateFlat,
  onDeleteFlat,
  onPublishListing,
  publishingListing,
  propertyName,
}: FlatDetailDialogProps) {
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [bills, setBills] = useState<Bill[]>([])
  const [billsLoading, setBillsLoading] = useState(false)
  const t = useTranslations('portfolio.flats')
  const tContact = useTranslations('contact')
  const { formatCurrency } = useAppFormat()

  const loadBills = useCallback(async () => {
    if (!flat || !open) return
    setBillsLoading(true)
    const result = await fetchBillsForOwner()
    if (result.ok) {
      const forFlat = result.data
        .filter(
          b =>
            b.propertyId === flat.buildingId &&
            (b.flatNumber || '').trim() === flat.flatNumber.trim(),
        )
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year
          return String(b.month).localeCompare(String(a.month))
        })
        .slice(0, 12)
      setBills(forFlat)
    } else {
      setBills([])
    }
    setBillsLoading(false)
  }, [flat, open])

  useEffect(() => {
    void loadBills()
  }, [loadBills])

  const occupancyRateLabel = useMemo(() => {
    if (!flat) return ''
    return flat.status === 'occupied'
      ? t('occupied')
      : flat.status === 'maintenance'
        ? t('maintenance')
        : t('available')
  }, [flat, t])

  if (!flat) return null

  const renterWhatsAppMessage = tContact('messageRenter', {
    property: propertyName?.trim() || tContact('propertyFallback'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={ownerSheetClass('sm:max-w-3xl')}>
        <DialogHeader className="shrink-0 space-y-1 border-b px-4 pb-3 pr-12 pt-4 text-left sm:px-6 sm:pt-5">
          <DialogTitle className="break-words text-lg sm:text-2xl">
            {t('flatNumber', { number: flat.flatNumber })}
          </DialogTitle>
          <DialogDescription className="break-words">
            {t('floorNumber', { number: flat.floor })} · {occupancyRateLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:space-y-6 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <FlatStatusBadge status={flat.status} className="text-sm" />
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{t('rent')}</p>
              <p className="break-all text-xl font-bold text-primary sm:text-2xl">
                {formatCurrency(flat.rent)}
              </p>
            </div>
          </div>

          {(flat.area || flat.bedrooms || flat.bathrooms || flat.deposit != null) && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
              {flat.area ? (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">{t('form.area')}</p>
                  <p className="text-lg font-semibold">{flat.area} sqft</p>
                </div>
              ) : null}
              {flat.bedrooms != null ? (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {t('form.bedrooms')}
                  </p>
                  <p className="text-lg font-semibold">{flat.bedrooms}</p>
                </div>
              ) : null}
              {flat.bathrooms != null ? (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {t('form.bathrooms')}
                  </p>
                  <p className="text-lg font-semibold">{flat.bathrooms}</p>
                </div>
              ) : null}
              {flat.deposit != null ? (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">{t('deposit')}</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(flat.deposit)}
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {flat.renter ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('renterInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="break-words font-medium">{flat.renter.name}</p>
                      <p className="text-sm text-muted-foreground">{t('name')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="break-all font-medium">{flat.renter.phone}</p>
                      <p className="text-sm text-muted-foreground">{t('phone')}</p>
                      <WhatsAppButton
                        className="mt-2"
                        size="sm"
                        number={flat.renter.whatsapp}
                        message={renterWhatsAppMessage}
                      />
                    </div>
                  </div>
                  {flat.renter.email ? (
                    <div className="flex items-start gap-3">
                      <Mail className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="break-all font-medium">{flat.renter.email}</p>
                        <p className="text-sm text-muted-foreground">Email</p>
                      </div>
                    </div>
                  ) : null}
                  {flat.renter.nid ? (
                    <div className="flex items-start gap-3">
                      <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="break-all font-medium">{flat.renter.nid}</p>
                        <p className="text-sm text-muted-foreground">NID</p>
                      </div>
                    </div>
                  ) : null}
                  {flat.renter.address ? (
                    <div className="flex items-start gap-3">
                      <Home className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="break-words font-medium">{flat.renter.address}</p>
                        <p className="text-sm text-muted-foreground">Address</p>
                      </div>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {new Date(flat.renter.joinedDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('joinedDate')}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsHistoryDialogOpen(true)}
                >
                  {t('viewHistory')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6 text-center">
                <User className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                <p className="mb-4 text-muted-foreground">{t('noRenter')}</p>
                <Button onClick={() => onAssignRenter(flat)}>
                  {t('assignRenter')}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg">{t('paymentHistory')}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="h-auto w-full whitespace-normal py-2 sm:w-auto"
                onClick={() => onGenerateBill(flat)}
              >
                <DollarSign className="mr-2 h-4 w-4 shrink-0" />
                {t('generateBill')}
              </Button>
            </CardHeader>
            <CardContent>
              {billsLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {t('loadingBills')}
                </div>
              ) : bills.length > 0 ? (
                <>
                  <div className="space-y-2 sm:hidden">
                    {bills.map(bill => {
                      const key =
                        bill.status === 'paid'
                          ? 'paid'
                          : bill.status === 'overdue'
                            ? 'overdue'
                            : 'unpaid'
                      const statusInfo = paymentStatusConfig[key]
                      const StatusIcon = statusInfo.icon
                      return (
                        <div key={bill.id} className="rounded-lg border p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium">
                                {bill.month} {bill.year}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {t('dueDate')}:{' '}
                                {new Date(bill.dueDate).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {t('paidDate')}:{' '}
                                {bill.paidDate
                                  ? new Date(bill.paidDate).toLocaleDateString()
                                  : '—'}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="font-semibold">
                                {formatCurrency(bill.amount)}
                              </p>
                              <div className="mt-1 flex items-center justify-end gap-1 text-xs">
                                <StatusIcon
                                  className={cn('h-3.5 w-3.5', statusInfo.className)}
                                />
                                <span>{statusInfo.label}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="hidden overflow-x-auto sm:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('month')}</TableHead>
                          <TableHead>{t('amount')}</TableHead>
                          <TableHead>{t('dueDate')}</TableHead>
                          <TableHead>{t('paidDate')}</TableHead>
                          <TableHead>{t('status')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bills.map(bill => {
                          const key =
                            bill.status === 'paid'
                              ? 'paid'
                              : bill.status === 'overdue'
                                ? 'overdue'
                                : 'unpaid'
                          const statusInfo = paymentStatusConfig[key]
                          const StatusIcon = statusInfo.icon
                          return (
                            <TableRow key={bill.id}>
                              <TableCell>
                                {bill.month} {bill.year}
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(bill.amount)}
                              </TableCell>
                              <TableCell>
                                {new Date(bill.dueDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {bill.paidDate
                                  ? new Date(bill.paidDate).toLocaleDateString()
                                  : '—'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <StatusIcon
                                    className={cn('h-4 w-4', statusInfo.className)}
                                  />
                                  <span>{statusInfo.label}</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  {t('noPaymentHistory')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="shrink-0 grid grid-cols-1 gap-2 border-t bg-background px-4 py-3 min-[420px]:grid-cols-2 sm:px-6">
            <Button
              variant="outline"
              className="h-auto w-full whitespace-normal px-3 py-2"
              onClick={() => onOpenChange(false)}
            >
              {t('close')}
            </Button>
            {onEditFlat ? (
              <Button
                variant="outline"
                className="h-auto w-full whitespace-normal px-3 py-2"
                onClick={() => onEditFlat(flat)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                {t('editFlat')}
              </Button>
            ) : null}
            {flat.status === 'available' && onPublishListing ? (
              flat.listingId ? (
                <Button
                  variant="outline"
                  className="h-auto w-full whitespace-normal px-3 py-2"
                  asChild
                >
                  <a href={`/listings/${flat.listingId}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t('viewListing')}
                  </a>
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="h-auto w-full whitespace-normal px-3 py-2"
                  disabled={publishingListing}
                  onClick={() => onPublishListing(flat)}
                >
                  <Megaphone className="mr-2 h-4 w-4" />
                  {publishingListing ? t('publishing') : t('publishListing')}
                </Button>
              )
            ) : null}
            {!flat.renter ? (
              <Button className="h-auto w-full whitespace-normal px-3 py-2" onClick={() => onAssignRenter(flat)}>
                {t('assignRenter')}
              </Button>
            ) : null}
            {flat.renter && onEditRenter ? (
              <Button
                variant="outline"
                className="h-auto w-full whitespace-normal px-3 py-2"
                onClick={() => onEditRenter(flat)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit renter
              </Button>
            ) : null}
            {flat.renter && onVacateFlat ? (
              <Button
                variant="destructive"
                className="h-auto w-full whitespace-normal px-3 py-2"
                onClick={() => onVacateFlat(flat)}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('vacate')}
              </Button>
            ) : null}
            {flat.renter ? (
              <Button
                variant="outline"
                className="h-auto w-full whitespace-normal px-3 py-2"
                onClick={() => onGenerateBill(flat)}
              >
                {t('generateBill')}
              </Button>
            ) : null}
            {!flat.renter && flat.status !== 'occupied' && onDeleteFlat ? (
              <Button
                variant="ghost"
                className="h-auto w-full whitespace-normal px-3 py-2 text-destructive hover:text-destructive"
                onClick={() => onDeleteFlat(flat)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('deleteFlat')}
              </Button>
            ) : null}
        </div>
      </DialogContent>

      {flat.renter ? (
        <RenterHistoryDialog
          renterId={flat.renter.id}
          renterName={flat.renter.name}
          open={isHistoryDialogOpen}
          onOpenChange={setIsHistoryDialogOpen}
        />
      ) : null}
    </Dialog>
  )
}
