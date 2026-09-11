'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Download,
  Eye,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Pencil,
} from 'lucide-react'
import type { RentalAgreement } from '@/types/agreement'
import { format, differenceInDays } from 'date-fns'

interface AgreementCardProps {
  agreement: RentalAgreement
  onView?: (agreement: RentalAgreement) => void
  onDownload?: (agreement: RentalAgreement) => void
  onEdit?: (agreement: RentalAgreement) => void
}

export function AgreementCard({
  agreement,
  onView,
  onDownload,
  onEdit,
}: AgreementCardProps) {
  const daysUntilExpiry = differenceInDays(
    new Date(agreement.expiryDate),
    new Date()
  )
  const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0
  const isExpired = daysUntilExpiry < 0

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Card
      className={`transition-all hover:shadow-md ${isExpiringSoon ? 'border-yellow-500' : isExpired ? 'border-red-500' : ''}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <FileText className="h-5 w-5 text-primary" />
              {agreement.propertyName}
            </CardTitle>
            {agreement.flatNumber && (
              <p className="text-sm text-muted-foreground mt-1">
                Flat {agreement.flatNumber}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge
              variant="outline"
              className={
                agreement.status === 'active'
                  ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400'
                  : agreement.status === 'expired'
                    ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400'
                    : agreement.status === 'renewed'
                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400'
              }
            >
              {agreement.status.charAt(0).toUpperCase() +
                agreement.status.slice(1)}
            </Badge>
            {agreement.terms?.prcaCompliant && (
              <Badge className="bg-emerald-500 text-white">PRCA</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Agreement Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Monthly Rent</p>
            <p className="font-semibold">
              ৳{agreement.monthlyRent.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Security Deposit</p>
            <p className="font-semibold">
              ৳{agreement.securityDeposit.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Start Date</p>
            <p className="font-medium">
              {format(new Date(agreement.startDate), 'MMM dd, yyyy')}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">End Date</p>
            <p className="font-medium">
              {format(new Date(agreement.endDate), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>

        {/* Expiry Warning */}
        {isExpiringSoon && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Expires in {daysUntilExpiry} day
                {daysUntilExpiry !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}

        {isExpired && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Expired {Math.abs(daysUntilExpiry)} day
                {Math.abs(daysUntilExpiry) !== 1 ? 's' : ''} ago
              </p>
            </div>
          </div>
        )}

        {/* Document Info */}
        <div className="rounded-lg border p-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {agreement.documentName}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatFileSize(agreement.documentSize)} • Uploaded{' '}
                {format(new Date(agreement.uploadedAt), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onView(agreement)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
          )}
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit(agreement)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {onDownload && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onDownload(agreement)}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
