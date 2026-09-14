'use client'

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type InstallListener = (event: BeforeInstallPromptEvent | null) => void

const listeners = new Set<InstallListener>()
let deferred: BeforeInstallPromptEvent | null = null
let listening = false

function readWindowEvent(): BeforeInstallPromptEvent | null {
  if (typeof window === 'undefined') return null
  return (
    (window as Window & { __pwaInstallEvent?: BeforeInstallPromptEvent | null })
      .__pwaInstallEvent ?? null
  )
}

function setDeferred(event: BeforeInstallPromptEvent | null) {
  deferred = event
  listeners.forEach(listener => listener(event))
}

export function captureInstallPrompt() {
  if (typeof window === 'undefined' || listening) return
  listening = true

  const existing = readWindowEvent()
  if (existing) setDeferred(existing)

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault()
    const promptEvent = event as BeforeInstallPromptEvent
    ;(window as Window & { __pwaInstallEvent?: BeforeInstallPromptEvent }).__pwaInstallEvent =
      promptEvent
    setDeferred(promptEvent)
  })

  window.addEventListener('appinstalled', () => {
    ;(window as Window & { __pwaInstallEvent?: BeforeInstallPromptEvent | null }).__pwaInstallEvent =
      null
    setDeferred(null)
  })

  window.addEventListener('pwa-install-ready', () => {
    const ready = readWindowEvent()
    if (ready) setDeferred(ready)
  })
}

export function getInstallEvent() {
  return deferred ?? readWindowEvent()
}

export function subscribeInstall(listener: InstallListener) {
  listeners.add(listener)
  listener(getInstallEvent())
  return () => listeners.delete(listener)
}

export function isStandaloneApp() {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    nav.standalone === true
  )
}

export function isIosSafari() {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  const ios = /iphone|ipad|ipod/i.test(ua)
  const iPadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return (ios || iPadOs) && !/crios|fxios|edgios/i.test(ua)
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const event = getInstallEvent()
  if (!event) return 'unavailable'
  await event.prompt()
  const { outcome } = await event.userChoice
  setDeferred(null)
  if (typeof window !== 'undefined') {
    ;(window as Window & { __pwaInstallEvent?: BeforeInstallPromptEvent | null }).__pwaInstallEvent =
      null
  }
  return outcome
}
