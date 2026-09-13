'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Bell, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { remindBillDue } from '@/lib/api/bills'
import { toast } from '@/lib/feedback/toast'
import { cn } from '@/lib/utils'
import type { Bill } from '@/types/bill'

type Props = {
  bill: Bill
  className?: string
  onReminded?: () => void
}

/**
 * Owner action: open WhatsApp due reminder (no PDF) or send SMS.
 */
export function RemindDueButton({ bill, className, onReminded }: Props) {
  const t = useTranslations('bills.dueRemind')
  const [loading, setLoading] = useState<'whatsapp' | 'sms' | null>(null)

  if (bill.status === 'paid') return null

  const handleRemind = async (channel: 'whatsapp' | 'sms') => {
    setLoading(channel)
    try {
      const result = await remindBillDue(bill.id, channel)
      if (!result.ok) {
        toast.error(result.error || t('failed'))
        return
      }
      if (channel === 'whatsapp') {
        const url = result.data.whatsappUrl
        if (!url) {
          toast.error(t('noNumber'))
          return
        }
        window.open(url, '_blank', 'noopener,noreferrer')
        toast.success(t('openedWhatsapp'))
      } else {
        toast.success(
          result.data.delivered ? t('smsSent') : t('smsQueued'),
        )
      }
      onReminded?.()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className={cn('flex w-full min-w-0 flex-col gap-2', className)}>
      <Button
        type="button"
        variant="secondary"
        className="h-auto min-h-10 w-full whitespace-normal px-3 py-2"
        disabled={loading !== null}
        onClick={() => void handleRemind('whatsapp')}
      >
        <MessageCircle className="mr-2 h-4 w-4 shrink-0 text-[#25D366]" />
        <span className="text-center leading-snug">
          {loading === 'whatsapp' ? t('preparing') : t('whatsapp')}
        </span>
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-auto min-h-10 w-full whitespace-normal px-3 py-2"
        disabled={loading !== null}
        onClick={() => void handleRemind('sms')}
      >
        <Bell className="mr-2 h-4 w-4 shrink-0" />
        <span className="text-center leading-snug">
          {loading === 'sms' ? t('sendingSms') : t('sms')}
        </span>
      </Button>
    </div>
  )
}
