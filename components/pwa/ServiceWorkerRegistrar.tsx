'use client'

import { useEffect } from 'react'

const DEV_CLEARED_KEY = 'sl_sw_dev_cleared'

async function clearAppCaches(): Promise<void> {
  if (!('caches' in window)) return
  const keys = await caches.keys()
  await Promise.all(keys.map(key => caches.delete(key)))
}

/** Drop a controlling worker and its stored pages/scripts. */
async function unregisterWorkers(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false
  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map(registration => registration.unregister()))
  await clearAppCaches()
  return registrations.length > 0 || Boolean(navigator.serviceWorker.controller)
}

/**
 * Production: register the push/offline worker, and never let the browser
 * keep an old copy of sw.js.
 * Development: remove any worker left from an earlier visit so design
 * changes show on a normal reload.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    if (process.env.NODE_ENV !== 'production') {
      if (sessionStorage.getItem(DEV_CLEARED_KEY) === '1') return
      void unregisterWorkers().then(hadWorker => {
        sessionStorage.setItem(DEV_CLEARED_KEY, '1')
        if (hadWorker) window.location.reload()
      })
      return
    }

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
