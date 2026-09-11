'use client'

import { Toaster } from 'sonner'
import { useTheme } from '@/components/theme/ThemeProvider'

export function ToastProvider() {
  const { theme } = useTheme()

  return (
    <Toaster
      richColors
      closeButton
      position="top-center"
      theme={theme === 'dark' ? 'dark' : 'light'}
      style={{ zIndex: 100000 }}
      toastOptions={{
        classNames: {
          toast:
            'group toast border border-border bg-background text-foreground shadow-lg',
          title: 'text-sm font-medium',
          description: 'text-sm text-muted-foreground',
        },
      }}
    />
  )
}
