'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Download, Share, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  captureInstallPrompt,
  getInstallEvent,
  isIosSafari,
  isStandaloneApp,
  promptInstall,
  subscribeInstall,
} from '@/lib/pwa/install'

const DISMISS_KEY = 'pwa-install-dismissed-until'

function isPopupDismissed() {
  if (typeof window === 'undefined') return true
  const raw = localStorage.getItem(DISMISS_KEY)
  if (!raw) return false
  const until = Number(raw)
  if (!Number.isFinite(until)) return false
  return Date.now() < until
}

function dismissPopup() {
  localStorage.setItem(DISMISS_KEY, String(Date.now() + 3 * 24 * 60 * 60 * 1000))
}

export function InstallPrompt() {
  const t = useTranslations('seo.pwa')
  const [canInstall, setCanInstall] = useState(false)
  const [iosGuide, setIosGuide] = useState(false)
  const [popupOpen, setPopupOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)

  useEffect(() => {
    captureInstallPrompt()
    if (isStandaloneApp()) return

    const ios = isIosSafari()
    setIosGuide(ios)
    if (ios && !isPopupDismissed()) setPopupOpen(true)

    return subscribeInstall(event => {
      const ready = Boolean(event)
      setCanInstall(ready)
      if (ready && !isPopupDismissed() && !isStandaloneApp()) setPopupOpen(true)
    })
  }, [])

  useEffect(() => {
    const openGuide = () => setGuideOpen(true)
    window.addEventListener('pwa-show-install-guide', openGuide)
    return () => window.removeEventListener('pwa-show-install-guide', openGuide)
  }, [])

  const closePopup = () => {
    dismissPopup()
    setPopupOpen(false)
  }

  const install = async () => {
    const outcome = await promptInstall()
    if (outcome === 'accepted' || outcome === 'dismissed') setPopupOpen(false)
    if (outcome === 'unavailable') setGuideOpen(true)
  }

  if (isStandaloneApp()) return null

  const showBanner = popupOpen && (canInstall || iosGuide)
  const showGuide = guideOpen

  if (!showBanner && !showGuide) return null

  return (
    <>
      {showBanner && (
        <div
          role="dialog"
          aria-labelledby="pwa-install-title"
          className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border bg-card p-4 shadow-lg md:bottom-6 md:left-auto md:right-6"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Download className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p id="pwa-install-title" className="font-semibold">
                {t('installTitle')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {iosGuide && !canInstall ? t('iosHint') : t('installDescription')}
              </p>
              <div className="mt-3 flex gap-2">
                {canInstall ? (
                  <Button size="sm" onClick={() => void install()}>
                    {t('installAction')}
                  </Button>
                ) : null}
                <Button size="sm" variant="ghost" onClick={closePopup}>
                  {t('dismiss')}
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={closePopup}
              aria-label={t('dismiss')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {showGuide && (
        <div
          role="dialog"
          aria-labelledby="pwa-guide-title"
          className="fixed bottom-20 left-4 right-4 z-[60] mx-auto max-w-md rounded-xl border bg-card p-4 shadow-lg md:bottom-6 md:left-auto md:right-6"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Share className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p id="pwa-guide-title" className="font-semibold">
                {t('installTitle')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {iosGuide ? t('iosHint') : t('chromeHint')}
              </p>
              <Button size="sm" className="mt-3" onClick={() => setGuideOpen(false)}>
                {t('dismiss')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export async function runInstallFromMenu() {
  captureInstallPrompt()
  if (isStandaloneApp()) return
  if (getInstallEvent()) {
    await promptInstall()
    return
  }
  window.dispatchEvent(new Event('pwa-show-install-guide'))
}
