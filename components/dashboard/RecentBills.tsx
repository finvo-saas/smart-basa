'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DownloadBillButton } from '@/components/bill/DownloadBillButton'
import { FileText } from 'lucide-react'
import type { Bill } from '@/types/bill'
import { useAppFormat } from '@/hooks/useAppFormat'

interface RecentBillsProps {
  bills: Bill[]
  limit?: number
  showViewAll?: boolean
}

export function RecentBills({
  bills,
  limit = 3,
  showViewAll = true,
}: RecentBillsProps) {
  const t = useTranslations('dashboard')
  const { formatCurrency, formatDate } = useAppFormat()
  if (bills.length === 0) return null

  const recentBills = bills.slice(0, limit)

  return (
    <Card className="overflow-hidden rounded-2xl shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-teal-700 dark:text-teal-300" />
          {t('bills')}
        </CardTitle>
        {showViewAll && (
          <Button asChild variant="ghost" size="sm" className="h-8 px-2">
            <Link href="/bills">View all</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-4 sm:px-6">
        {recentBills.map(bill => {
          const isOverdue =
            bill.status === 'unpaid' && new Date(bill.dueDate) < new Date()
          return (
            <div
              key={bill.id}
              className="flex items-center gap-3 rounded-xl border bg-background p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">
                    {bill.month} {bill.year}
                  </p>
                  <Badge
                    variant="outline"
                    className={
                      bill.status === 'paid'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : isOverdue
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-amber-200 bg-amber-50 text-amber-800'
                    }
                  >
                    {bill.status === 'paid'
                      ? 'Paid'
                      : isOverdue
                        ? 'Overdue'
                        : 'Due'}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {bill.propertyName}
                  {bill.flatNumber || bill.seatNumber
                    ? ` · ${bill.flatNumber || bill.seatNumber}`
                    : ''}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Due {formatDate(bill.dueDate)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <p className="text-base font-bold tabular-nums">
                  {formatCurrency(bill.amount)}
                </p>
                <div className="flex gap-1.5">
                  <DownloadBillButton bill={bill} size="sm" simple label="PDF" />
                  {bill.status !== 'paid' && (
                    <Button asChild size="sm" className="h-8 px-3 text-xs">
                      <Link href="/payments">Pay</Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
