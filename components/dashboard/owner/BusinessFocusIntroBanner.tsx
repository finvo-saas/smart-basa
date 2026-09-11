'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useOwnerFocus } from '@/hooks/useOwnerFocus'
import {
  dismissBusinessFocusIntro,
  isBusinessFocusIntroDismissed,
} from '@/lib/owner-focus-banner'
import {
  OWNER_VERTICAL_META,
  type OwnerVertical,
} from '@/lib/owner-focus'

const SECTION_ID: Record<OwnerVertical, string> = {
  mess: 'mess-overview',
  apartment: 'apartment-overview',
  hotel: 'hotel-overview',
}

interface BusinessFocusIntroBannerProps {
  onEdit: () => void
}

/** First-time dashboard tip; after dismiss it never returns. */
export function BusinessFocusIntroBanner({
  onEdit,
}: BusinessFocusIntroBannerProps) {
  const { focusSelected, enabledVerticals, primaryFocus } = useOwnerFocus()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(focusSelected && !isBusinessFocusIntroDismissed())
  }, [focusSelected])

  if (!visible || !focusSelected) return null

  const active =
    (primaryFocus && enabledVerticals.includes(primaryFocus)
      ? primaryFocus
      : enabledVerticals[0]) || null

  const close = () => {
    dismissBusinessFocusIntro()
    setVisible(false)
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="space-y-3 p-3 pb-2 sm:p-6 sm:pb-2">
        <CardTitle className="flex items-start justify-between gap-2 text-base">
          <span className="flex min-w-0 items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            Your business type
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label="Dismiss"
            onClick={close}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-3 pb-3 text-sm sm:px-6 sm:pb-6">
        <p className="text-muted-foreground">
          Your dashboard is focused on one business. Jump to it below, or switch
          anytime from your account menu.
        </p>
        {active ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`#${SECTION_ID[active]}`}
              className="rounded-md border bg-background px-3 py-1.5 hover:bg-muted"
            >
              {OWNER_VERTICAL_META[active].label}
            </Link>
          </div>
        ) : null}
        <div className="flex flex-col gap-2 min-[360px]:flex-row">
          <Button
            size="sm"
            variant="outline"
            className="w-full min-[360px]:w-auto"
            onClick={onEdit}
          >
            Change business type
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="w-full min-[360px]:w-auto"
            onClick={close}
          >
            Got it
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
