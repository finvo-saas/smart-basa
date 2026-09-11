'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { shareBillViaWhatsApp } from '@/lib/api/bills'
import { toast } from '@/lib/feedback/toast'
import { cn } from '@/lib/utils'
import type { Bill } from '@/types/bill'

type Props = {
  bill: Bill
  className?: string
  /** Called after a successful share open (e.g. refresh sharedAt). */
  onShared?: (sharedAt: string) => void
}

/**
 * Owner action: generate bill PDF link and open the owner's WhatsApp
 * chat with the tenant (free wa.me deep link — no Business API).
 */
export function ShareBillWhatsAppButton({ bill, className, onShared }: Props) {
  const t = useTranslations('bills.whatsappShare')
  const [loading, setLoading] = useState(false)

  const handleShare = async () => {
    setLoading(true)
    try {
      const result = await shareBillViaWhatsApp(bill.id)
      if (!result.ok) {
        toast.error(result.error || t('failed'))
        return
      }
      const url = result.data.whatsappUrl
      if (!url) {
        toast.error(t('noNumber'))
        return
      }
      window.open(url, '_blank', 'noopener,noreferrer')
      onShared?.(result.data.sharedAt)
      toast.success(t('opened'))
    } finally {
      setLoading(false)
    }
  }

  const lastSharedLabel =
    bill.whatsappSharedAt &&
    t('lastShared', {
      date: new Date(bill.whatsappSharedAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    })

  return (
    <div className={cn('w-full space-y-1', className)}>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={loading}
        onClick={() => void handleShare()}
      >
        <MessageCircle className="mr-2 h-4 w-4 text-[#25D366]" />
        {loading ? t('preparing') : t('send')}
      </Button>
      {lastSharedLabel ? (
        <p className="text-muted-foreground text-center text-xs">{lastSharedLabel}</p>
      ) : null}
    </div>
  )
}
