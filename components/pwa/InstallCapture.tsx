'use client'

import { captureInstallPrompt } from '@/lib/pwa/install'

captureInstallPrompt()

/** Mounted once so the install event is captured as soon as the app bundle runs. */
export function InstallCapture() {
  return null
}
