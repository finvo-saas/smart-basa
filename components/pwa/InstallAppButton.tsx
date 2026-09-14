'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { runInstallFromMenu } from '@/components/pwa/InstallPrompt'
import {
  captureInstallPrompt,
  isStandaloneApp,
  subscribeInstall,
} from '@/lib/pwa/install'

export function InstallAppButton({
  className,
  onDone,
}: {
  className?: string
  onDone?: () => void
}) {
  const t = useTranslations('seo.pwa')
  const [installed, setInstalled] = useState(true)

  useEffect(() => {
    captureInstallPrompt()
    setInstalled(isStandaloneApp())
    return subscribeInstall(() => {
      setInstalled(isStandaloneApp())
    })
  }, [])

  if (installed) return null

  return (
    <Button
      type="button"
      className={className}
      onClick={() => {
        onDone?.()
        void runInstallFromMenu()
      }}
    >
      <Download className="mr-2 h-4 w-4 shrink-0" />
      {t('download')}
    </Button>
  )
}
