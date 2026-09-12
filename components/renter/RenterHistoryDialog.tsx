'use client'

import { useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ownerSheetClass,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Home,
  Calendar,
  DollarSign,
  AlertCircle,
  Star,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Phone,
  Mail,
  TrendingUp,
  Award,
} from 'lucide-react'
import { fetchRenterHistory } from '@/lib/api/profile'
import { useMockQuery } from '@/hooks/useMockQuery'
import { LoadingState } from '@/components/page'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface RenterHistoryDialogProps {
  renterId: string
  renterName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusConfig = {
  completed: {
    label: 'Completed',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  },
  ongoing: {
    label: 'Ongoing',
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  },
  terminated: {
    label: 'Terminated',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  },
}

const paymentStatusConfig = {
  paid: {
    label: 'Paid',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    icon: CheckCircle2,
  },
  pending: {
    label: 'Pending',
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    icon: Clock,
  },
  overdue: {
    label: 'Overdue',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    icon: XCircle,
  },
  partial: {
    label: 'Partial',
    className:
      'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    icon: Clock,
  },
}

const complaintStatusConfig = {
  open: {
    label: 'Open',
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  },
  in_progress: {
    label: 'In Progress',
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  },
  resolved: {
    label: 'Resolved',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  },
  closed: {
    label: 'Closed',
    className:
      'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  },
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={cn(
            'h-4 w-4',
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
          )}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  )
}

export function RenterHistoryDialog({
  renterId,
  renterName,
  open,
  onOpenChange,
}: RenterHistoryDialogProps) {
  const loadHistory = useCallback(
    () => fetchRenterHistory(renterId),
    [renterId]
  )
  const { data: history, loading } = useMockQuery(loadHistory)

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <LoadingState label="Loading renter history…" />
        </DialogContent>
      </Dialog>
    )
  }

  if (!history) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renter History</DialogTitle>
            <DialogDescription>
              No history found for this renter
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(ownerSheetClass('sm:max-w-3xl'), 'gap-4 overflow-y-auto p-4 sm:p-6')}>
        <DialogHeader className="pr-8 text-left">
          <DialogTitle className="break-words text-lg sm:text-2xl">
            Renter History
          </DialogTitle>
          <DialogDescription>{renterName}</DialogDescription>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Total Rentals</p>
              </div>
              <p className="mt-1 text-2xl font-bold">{history.totalRentals}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Avg Rating</p>
              </div>
              <p className="mt-1 text-2xl font-bold">
                {history.averageRating.toFixed(1)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Complaints</p>
              </div>
              <p className="mt-1 text-2xl font-bold">
                {history.totalComplaints}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
              <p className="mt-1 text-2xl font-bold">
                {history.resolvedComplaints}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="rentals" className="w-full">
          <TabsList className="h-auto w-full justify-start">
            <TabsTrigger value="rentals">Rentals</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
            <TabsTrigger value="references">References</TabsTrigger>
            <TabsTrigger value="ratings">Ratings</TabsTrigger>
          </TabsList>

          {/* Rental History Tab */}
          <TabsContent value="rentals" className="space-y-4">
            {history.rentalHistories.map(rental => {
              const status = statusConfig[rental.status]
              return (
                <Card key={rental.id}>
                  <CardHeader>
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="break-words text-base sm:text-lg">
                          {rental.propertyName}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {rental.propertyAddress}
                          {rental.flatNumber && ` • Flat ${rental.flatNumber}`}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn('shrink-0', status.className)}
                      >
                        {status.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Monthly Rent
                        </p>
                        <p className="text-lg font-semibold">
                          ৳{rental.monthlyRent.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Move In</p>
                        <p className="text-sm font-medium">
                          {format(new Date(rental.moveInDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      {rental.moveOutDate && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Move Out
                          </p>
                          <p className="text-sm font-medium">
                            {format(
                              new Date(rental.moveOutDate),
                              'MMM dd, yyyy'
                            )}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Duration
                        </p>
                        <p className="text-sm font-medium">
                          {rental.moveOutDate
                            ? Math.ceil(
                                (new Date(rental.moveOutDate).getTime() -
                                  new Date(rental.moveInDate).getTime()) /
                                  (1000 * 60 * 60 * 24 * 30)
                              )
                            : Math.ceil(
                                (Date.now() -
                                  new Date(rental.moveInDate).getTime()) /
                                  (1000 * 60 * 60 * 24 * 30)
                              )}{' '}
                          months
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Owner
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{rental.ownerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {rental.ownerPhone}
                          </p>
                        </div>
                      </div>
                    </div>
                    {rental.terminationReason && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
                        <p className="text-xs font-medium text-red-800 dark:text-red-300">
                          Termination Reason
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-400">
                          {rental.terminationReason}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="payments" className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Month/Year</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Paid Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.paymentHistories.map(payment => {
                    const rental = history.rentalHistories.find(
                      rh => rh.id === payment.rentalHistoryId
                    )
                    const statusInfo = paymentStatusConfig[payment.status]
                    const StatusIcon = statusInfo.icon
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {rental?.propertyName || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {payment.month} {payment.year}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ৳{payment.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {format(new Date(payment.dueDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {payment.paidDate
                            ? format(new Date(payment.paidDate), 'MMM dd, yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {payment.paymentMethod ? (
                            <Badge variant="outline" className="text-xs">
                              {payment.paymentMethod}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon
                              className={cn('h-4 w-4', statusInfo.className)}
                            />
                            <Badge
                              variant="outline"
                              className={cn('text-xs', statusInfo.className)}
                            >
                              {statusInfo.label}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Complaint History Tab */}
          <TabsContent value="complaints" className="space-y-4">
            {history.complaintHistories.map(complaint => {
              const rental = history.rentalHistories.find(
                rh => rh.id === complaint.rentalHistoryId
              )
              const status = complaintStatusConfig[complaint.status]
              return (
                <Card key={complaint.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {complaint.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {rental?.propertyName || 'N/A'}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn('shrink-0', status.className)}
                      >
                        {status.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Category
                      </p>
                      <Badge variant="outline">{complaint.category}</Badge>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Description
                      </p>
                      <p className="text-sm">{complaint.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Created</p>
                        <p className="text-sm font-medium">
                          {format(
                            new Date(complaint.createdAt),
                            'MMM dd, yyyy'
                          )}
                        </p>
                      </div>
                      {complaint.resolvedAt && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Resolved
                          </p>
                          <p className="text-sm font-medium">
                            {format(
                              new Date(complaint.resolvedAt),
                              'MMM dd, yyyy'
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                    {complaint.resolution && (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
                        <p className="text-xs font-medium text-green-800 dark:text-green-300 mb-1">
                          Resolution
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-400">
                          {complaint.resolution}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>

          {/* Owner References Tab */}
          <TabsContent value="references" className="space-y-4">
            {history.ownerReferences.map(reference => {
              const rental = history.rentalHistories.find(
                rh => rh.id === reference.rentalHistoryId
              )
              return (
                <Card key={reference.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {reference.ownerName}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {reference.propertyName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StarRating rating={reference.rating} />
                        {reference.verified && (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm leading-relaxed">
                      {reference.referenceText}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{reference.ownerPhone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">Would rent again: </span>
                        <span>{reference.wouldRentAgain ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(reference.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>

          {/* Owner Ratings Tab */}
          <TabsContent value="ratings" className="space-y-4">
            {history.ownerRatings.map(rating => {
              const rental = history.rentalHistories.find(
                rh => rh.id === rating.rentalHistoryId
              )
              return (
                <Card key={rating.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {rating.ownerName}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {rental?.propertyName || 'N/A'}
                        </p>
                      </div>
                      <StarRating rating={rating.overallRating} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Punctuality
                        </p>
                        <StarRating rating={rating.punctualityRating} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Cleanliness
                        </p>
                        <StarRating rating={rating.cleanlinessRating} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Behavior
                        </p>
                        <StarRating rating={rating.behaviorRating} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Communication
                        </p>
                        <StarRating rating={rating.communicationRating} />
                      </div>
                    </div>
                    {rating.comment && (
                      <div className="rounded-lg border p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Comment
                        </p>
                        <p className="text-sm">{rating.comment}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(rating.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
