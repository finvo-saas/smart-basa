'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Home, User, Zap, Calculator, Clock, Wallet, Pencil } from 'lucide-react'
import type { Bill } from '@/types/bill'
import { DownloadBillButton } from '@/components/bill/DownloadBillButton'
import { ShareBillWhatsAppButton } from '@/components/bill/ShareBillWhatsAppButton'
import { RemindDueButton } from '@/components/bill/RemindDueButton'
import { formatCurrency } from '@/lib/format/locale'
import { cn } from '@/lib/utils'

interface BillCardProps {
  bill: Bill
  /** @deprecated Prefer built-in DownloadBillButton; kept for custom handlers */
  onDownload?: (bill: Bill) => void
  onMarkPaid?: (bill: Bill) => void
  onSchedulePayment?: (bill: Bill) => void
  /** Renter Pay Now checkout */
  onPayNow?: (bill: Bill) => void
  /** Owner: edit generated bill fields / line items */
  onEdit?: (bill: Bill) => void
  showTenantName?: boolean
  /** Hide download control */
  hideDownload?: boolean
  /** Owner: send bill PDF link via WhatsApp (tenant-wise) */
  enableWhatsAppShare?: boolean
  onWhatsAppShared?: (billId: string, sharedAt: string) => void
  /** Owner: due reminder (WhatsApp / SMS, no PDF) */
  enableDueRemind?: boolean
  onDueReminded?: (billId: string) => void
}

const statusConfig = {
  paid: {
    label: 'Paid',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800',
  },
  unpaid: {
    label: 'Unpaid',
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  },
  overdue: {
    label: 'Overdue',
    className:
      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800',
  },
}

export function BillCard({
  bill,
  onDownload,
  onMarkPaid,
  onSchedulePayment,
  onPayNow,
  onEdit,
  showTenantName = false,
  hideDownload = false,
  enableWhatsAppShare = false,
  onWhatsAppShared,
  enableDueRemind = false,
  onDueReminded,
}: BillCardProps) {
  const status = statusConfig[bill.status]
  const isOverdue =
    bill.status === 'overdue' ||
    (bill.status === 'unpaid' && new Date(bill.dueDate) < new Date())

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg sm:text-xl">
              {bill.month} {bill.year}
            </CardTitle>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Home className="h-3.5 w-3.5" />
                <span>{bill.propertyName}</span>
              </div>
              {(bill.flatNumber || bill.seatNumber) && (
                <span>• {bill.flatNumber || bill.seatNumber}</span>
              )}
            </div>
          </div>
          <Badge variant="outline" className={cn('shrink-0', status.className)}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tenant Name (for owner view) */}
        {showTenantName && (
          <div className="flex items-center gap-2 rounded-lg border p-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{bill.tenantName}</span>
          </div>
        )}

        {/* Amount */}
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Total Amount</span>
          <span className="text-2xl font-bold text-primary sm:text-3xl">
            {formatCurrency(bill.amount)}
          </span>
        </div>

        {/* Template Badge */}
        {bill.templateId && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary">
              Generated from Template
            </span>
          </div>
        )}

        {/* Bill Items */}
        {bill.items.length > 0 && (
          <div className="space-y-2 rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Bill Items
            </p>
            <div className="space-y-2">
              {bill.items.map(item => (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.description}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                  {/* Show calculation details for meter-based items */}
                  {item.calculationType === 'meter-based' &&
                    item.consumption !== undefined &&
                    item.unitRate && (
                      <div className="ml-2 rounded bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                        {item.previousReading !== undefined &&
                          item.currentReading !== undefined && (
                            <span>
                              {item.previousReading} → {item.currentReading} ={' '}
                              {item.consumption} units
                            </span>
                          )}
                        {item.unitRate && (
                          <span className="ml-1">
                            × {formatCurrency(item.unitRate)} = {formatCurrency(item.amount)}
                          </span>
                        )}
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meter Reading Summary */}
        {bill.meterReadings && (
          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">
                Meter Readings
              </p>
            </div>
            <div className="space-y-1.5 text-xs">
              {bill.meterReadings.electricity !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Electricity:</span>
                  <div className="flex items-center gap-2">
                    {bill.meterReadings.previousElectricity && (
                      <span className="text-muted-foreground">
                        {bill.meterReadings.previousElectricity} →
                      </span>
                    )}
                    <span className="font-medium">
                      {bill.meterReadings.electricity} units
                    </span>
                    {bill.meterReadings.electricityConsumption && (
                      <Badge variant="outline" className="text-xs">
                        +{bill.meterReadings.electricityConsumption}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              {bill.meterReadings.gas !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gas:</span>
                  <div className="flex items-center gap-2">
                    {bill.meterReadings.previousGas && (
                      <span className="text-muted-foreground">
                        {bill.meterReadings.previousGas} →
                      </span>
                    )}
                    <span className="font-medium">
                      {bill.meterReadings.gas} units
                    </span>
                    {bill.meterReadings.gasConsumption && (
                      <Badge variant="outline" className="text-xs">
                        +{bill.meterReadings.gasConsumption}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              {bill.meterReadings.water !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Water:</span>
                  <div className="flex items-center gap-2">
                    {bill.meterReadings.previousWater && (
                      <span className="text-muted-foreground">
                        {bill.meterReadings.previousWater} →
                      </span>
                    )}
                    <span className="font-medium">
                      {bill.meterReadings.water} units
                    </span>
                    {bill.meterReadings.waterConsumption && (
                      <Badge variant="outline" className="text-xs">
                        +{bill.meterReadings.waterConsumption}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Due Date</p>
              <p
                className={cn(
                  'font-medium',
                  isOverdue && 'text-red-600 dark:text-red-400'
                )}
              >
                {new Date(bill.dueDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          {bill.paidDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Paid Date</p>
                <p className="font-medium">
                  {new Date(bill.paidDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {onEdit && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onEdit(bill)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit bill
            </Button>
          )}
          {onPayNow && bill.status !== 'paid' && (
            <Button className="w-full" onClick={() => onPayNow(bill)}>
              <Wallet className="mr-2 h-4 w-4" />
              Pay Now
            </Button>
          )}
          <div className="flex gap-2">
            {!hideDownload &&
              (onDownload ? (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onDownload(bill)}
                >
                  Download
                </Button>
              ) : (
                <DownloadBillButton bill={bill} className="flex-1" />
              ))}
            {onMarkPaid && bill.status !== 'paid' && (
              <Button
                variant={onPayNow ? 'outline' : 'default'}
                className="flex-1"
                onClick={() => onMarkPaid(bill)}
              >
                Record cash
              </Button>
            )}
          </div>
          {onSchedulePayment && bill.status !== 'paid' && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onSchedulePayment(bill)}
            >
              <Clock className="mr-2 h-4 w-4" />
              Schedule Payment
            </Button>
          )}
          {enableDueRemind && bill.status !== 'paid' && (
            <RemindDueButton
              bill={bill}
              onReminded={() => onDueReminded?.(bill.id)}
            />
          )}
          {enableWhatsAppShare && (
            <ShareBillWhatsAppButton
              bill={bill}
              onShared={sharedAt => onWhatsAppShared?.(bill.id, sharedAt)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
