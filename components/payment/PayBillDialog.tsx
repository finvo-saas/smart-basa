'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { DownloadBillButton } from '@/components/bill/DownloadBillButton'
import { ReceiptViewDialog } from '@/components/payment/ReceiptViewDialog'
import type { Bill } from '@/types/bill'
import type { PaymentMethod, PaymentTransaction } from '@/types/payment'
import { payBill } from '@/lib/api/payments'
import { getDemoTenantId } from '@/lib/api/demoUser'
import { useAppFormat } from '@/hooks/useAppFormat'
import { Wallet, Smartphone } from 'lucide-react'
import { PaymentMethodSelector, getPaymentMethodOption } from '@/components/payment/PaymentMethodSelector'
import { PaymentProcessingState } from '@/components/payment/PaymentProcessingState'
import {
  PaymentResultView,
  PaymentResultBackButton,
  PaymentHistoryLink,
  paymentResultHref,
} from '@/components/payment/PaymentResultView'

type Step = 'method' | 'confirm' | 'processing' | 'result'

interface PayBillDialogProps {
  bill: Bill | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (bill: Bill, transaction: PaymentTransaction) => void
  userId?: string
}

export function PayBillDialog({
  bill,
  open,
  onOpenChange,
  onSuccess,
  userId,
}: PayBillDialogProps) {
  const t = useTranslations('payments.payBill')
  const tc = useTranslations('common')
  const { formatCurrency } = useAppFormat()
  const [step, setStep] = useState<Step>('method')
  const [method, setMethod] = useState<PaymentMethod>('bKash')
  const [accountNumber, setAccountNumber] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(
    null
  )
  const [receiptOpen, setReceiptOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setStep('method')
    setMethod('bKash')
    setAccountNumber('')
    setError(null)
    setTransaction(null)
    setReceiptOpen(false)
  }, [open, bill?.id])

  if (!bill) return null

  const selected = getPaymentMethodOption(method)
  const billName = `${bill.month} ${bill.year} — ${bill.propertyName}`
  const tenantId = userId || getDemoTenantId()
  const amountDue = Math.max(0, bill.amount - (bill.amountPaid ?? 0))

  const submitPayment = async () => {
    setError(null)
    if (selected?.needsAccount) {
      const digits = accountNumber.replace(/\D/g, '')
      if (digits.length < 11) {
        setError(t('invalidWallet'))
        return
      }
    }
    if (amountDue <= 0) {
      setError(t('alreadyPaid'))
      return
    }

    setStep('processing')
    const result = await payBill({
      billId: bill.id,
      billName,
      propertyName: bill.propertyName,
      tenantName: bill.tenantName,
      amount: amountDue,
      paymentMethod: method,
      accountNumber: selected?.needsAccount ? accountNumber.trim() : undefined,
      userId: tenantId,
    })

    if (!result.ok) {
      setError(result.error)
      setStep('confirm')
      return
    }

    setTransaction(result.data)
    setStep('result')

    if (result.data.status === 'completed') {
      onSuccess?.(
        {
          ...bill,
          status: 'paid',
          paidDate: new Date().toISOString().split('T')[0],
          amountPaid: bill.amount,
        },
        result.data
      )
    } else if (result.data.status === 'pending') {
      // Cash claim submitted — bill stays unpaid until owner confirms.
      onSuccess?.(bill, result.data)
    }
  }

  const resultVariant =
    transaction?.status === 'completed'
      ? 'completed'
      : transaction?.status === 'pending'
        ? 'pending'
        : 'failed'

  const statusLabel =
    bill.status === 'overdue' ? tc('status.overdue') : tc('status.unpaid')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {bill.month} {bill.year} · {bill.propertyName}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm text-muted-foreground">{t('amountDue')}</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(amountDue)}
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                bill.status === 'overdue'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
              }
            >
              {statusLabel}
            </Badge>
          </div>
        </div>

        {step === 'method' && (
          <div className="space-y-4">
            <PaymentMethodSelector value={method} onChange={setMethod} />
            <Button className="w-full" onClick={() => setStep('confirm')}>
              {tc('continue')}
            </Button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <PaymentResultBackButton onClick={() => setStep('method')} />

            <div className="rounded-lg border p-3 text-sm">
              <p className="text-muted-foreground">{t('payingWith')}</p>
              <p className="font-semibold">{method}</p>
            </div>

            {selected?.needsAccount && (
              <div className="space-y-2">
                <Label htmlFor="wallet">{t('walletLabel')}</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="wallet"
                    className="pl-9"
                    placeholder="01XXXXXXXXX"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    inputMode="numeric"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t('walletHint')}</p>
              </div>
            )}

            {method === 'Cash' && (
              <p className="text-sm text-muted-foreground">{t('cashPending')}</p>
            )}

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button className="w-full" onClick={submitPayment}>
              {method === 'Cash'
                ? t('submitCashClaim', { amount: formatCurrency(amountDue) })
                : t('payAmount', { amount: formatCurrency(amountDue) })}
            </Button>
          </div>
        )}

        {step === 'processing' && (
          <PaymentProcessingState methodLabel={method} />
        )}

        {step === 'result' && transaction && (
          <PaymentResultView
            variant={resultVariant}
            transactionId={transaction.transactionId}
            methodLabel={transaction.paymentMethod}
            failureReason={transaction.failureReason}
            onRetry={() => {
              setTransaction(null)
              setStep('confirm')
            }}
            onDone={() => onOpenChange(false)}
            receiptAction={
              transaction.status === 'completed' ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setReceiptOpen(true)}
                  >
                    {t('viewReceipt')}
                  </Button>
                  <DownloadBillButton
                    bill={{
                      ...bill,
                      status: 'paid',
                      paidDate: new Date().toISOString().split('T')[0],
                    }}
                    className="w-full"
                  />
                </div>
              ) : undefined
            }
            secondaryAction={
              <>
                <PaymentHistoryLink onClick={() => onOpenChange(false)} />
                <Button variant="link" className="w-full" asChild>
                  <Link
                    href={paymentResultHref(
                      transaction.transactionId,
                      transaction.status
                    )}
                    onClick={() => onOpenChange(false)}
                  >
                    {t('openStatusPage')}
                  </Link>
                </Button>
              </>
            }
          />
        )}
      </DialogContent>

      <ReceiptViewDialog
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        bill={{
          ...bill,
          status: transaction?.status === 'completed' ? 'paid' : bill.status,
          paidDate:
            transaction?.status === 'completed'
              ? new Date().toISOString().split('T')[0]
              : bill.paidDate,
        }}
        payment={transaction}
      />
    </Dialog>
  )
}
