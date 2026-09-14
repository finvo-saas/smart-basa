'use client'

import { useEffect } from 'react'

/**
 * Register the install/push worker in every environment.
 * The worker does not cache pages or scripts, so a reload still shows
 * the current app. Unregistering it in development also blocked the
 * mobile install prompt.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const hadController = Boolean(navigator.serviceWorker.controller)
    const onControllerChange = () => {
      if (!hadController) return
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    void navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .catch(() => undefined)

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [])

  return null
}
