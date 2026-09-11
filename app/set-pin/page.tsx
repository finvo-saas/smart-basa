'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { setPin } from '@/lib/api/auth'
import { applyAuthSession, nextPathAfterAuth, needsPinSetup, isPinResetFlow } from '@/utils/auth'
import { authStorageRemove } from '@/utils/auth-storage'
import { hasAuthTokens } from '@/utils/auth-tokens'

export default function SetPinPage() {
  const router = useRouter()
  const t = useTranslations('auth.pin')
  const tc = useTranslations('common')
  const [pin, setPinValue] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!hasAuthTokens()) {
      router.replace('/login')
      return
    }
    if (!needsPinSetup() && !isPinResetFlow()) {
      router.replace('/role-selection')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (pin.length < 4 || pin.length > 6) {
      setError(t('invalid'))
      return
    }
    if (pin !== confirmPin) {
      setError(t('mismatch'))
      return
    }

    setLoading(true)
    const result = await setPin({ pin, confirmPin })
    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    applyAuthSession(result.data)
    authStorageRemove('pinReset')
    router.push(nextPathAfterAuth(result.data))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-[480px]">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl sm:text-3xl">{t('title')}</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {t('subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="new-pin">{t('label')}</Label>
                <Input
                  id="new-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  maxLength={6}
                  value={pin}
                  onChange={e => {
                    setPinValue(e.target.value.replace(/\D/g, '').slice(0, 6))
                    setError('')
                  }}
                  placeholder={t('placeholder')}
                  className="text-center text-2xl tracking-[0.4em] h-14"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-pin">{t('confirmLabel')}</Label>
                <Input
                  id="confirm-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  maxLength={6}
                  value={confirmPin}
                  onChange={e => {
                    setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))
                    setError('')
                  }}
                  placeholder={t('placeholder')}
                  className="text-center text-2xl tracking-[0.4em] h-14"
                  required
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <Button
                type="submit"
                disabled={loading || pin.length < 4 || confirmPin.length < 4}
                className="w-full text-base sm:text-lg h-12 sm:h-14"
                size="lg"
              >
                {loading ? tc('loading') : t('save')}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                {t('hint')}
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
