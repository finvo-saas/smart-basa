'use client'

import { LanguageSwitcher } from '@/components/i18n'
import { BrandIcon, BrandWordmark } from '@/components/layout/BrandLogo'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginWithPin, requestOtp, startLogin } from '@/lib/api/auth'
import { applyAuthSession, nextPathAfterAuth, rememberAuthReturn } from '@/utils/auth'
import { authStorageRemove, authStorageSet } from '@/utils/auth-storage'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Login() {
  const router = useRouter()
  const t = useTranslations('auth.login')
  const tc = useTranslations('common')
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [step, setStep] = useState<'phone' | 'pin'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get('next')
    if (next) rememberAuthReturn(next)
  }, [])

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.startsWith('880')) {
      return digits.slice(0, 13)
    }
    if (digits.startsWith('0')) {
      return '880' + digits.slice(1, 11)
    }
    return '880' + digits.slice(0, 10)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
    setError('')
  }

  const goToOtp = (devOtp?: string) => {
    authStorageSet('loginPhone', phone)
    if (devOtp) {
      authStorageSet('devOtp', devOtp)
    } else {
      authStorageRemove('devOtp')
    }
    router.push('/otp-verify')
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (phone.length !== 13) {
      setError(t('invalidPhone'))
      return
    }

    setLoading(true)
    const result = await startLogin({ phone })
    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    authStorageSet('loginPhone', phone)
    if (result.data.next === 'pin') {
      setStep('pin')
      setPin('')
      return
    }

    goToOtp(result.data.devOtp)
  }

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (pin.length < 4 || pin.length > 6) {
      setError(t('invalidPin'))
      return
    }

    setLoading(true)
    const result = await loginWithPin({ phone, pin })
    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      setPin('')
      return
    }

    applyAuthSession(result.data)
    router.push(nextPathAfterAuth(result.data))
  }

  const handleForgotPin = async () => {
    setError('')
    setLoading(true)
    const result = await requestOtp({ phone, purpose: 'login' })
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    authStorageSet('pinReset', 'true')
    goToOtp(result.data.devOtp)
  }

  const displayPhone = phone ? `+${phone.slice(0, 3)} ${phone.slice(3)}` : ''

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-3 dark:bg-gray-900 sm:p-4">
      <div className="w-full max-w-[480px]">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2"
            aria-label="SmartBasa home"
          >
            <BrandIcon className="h-9 w-9" priority />
            <BrandWordmark className="h-4 sm:h-5" />
          </Link>
          <LanguageSwitcher />
        </div>

        <Card className="w-full overflow-hidden">
          <CardHeader className="space-y-3 pb-4 text-center sm:space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                SmartBasa
              </p>
              <CardTitle className="text-balance bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
                {t('title')}
              </CardTitle>
              <div
                className="mx-auto h-1 w-12 rounded-full bg-primary/80"
                aria-hidden
              />
              <CardDescription className="mx-auto max-w-sm text-pretty text-sm leading-relaxed sm:text-base">
                {t('brandDescription')}
              </CardDescription>
              <p className="text-sm font-medium text-muted-foreground">
                {step === 'pin' ? t('pinSubtitle') : t('subtitle')}
              </p>
            </div>
            {step === 'pin' && (
              <p className="pt-1 text-sm font-medium text-foreground">
                {displayPhone}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {step === 'phone' ? (
              <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('phoneLabel')}</Label>
                  <Input
                    type="tel"
                    id="phone"
                    inputMode="tel"
                    autoComplete="tel"
                    value={displayPhone}
                    onChange={handlePhoneChange}
                    placeholder={t('phonePlaceholder')}
                    className="h-12 text-left text-base tracking-normal sm:h-14 sm:text-lg"
                    maxLength={17}
                    required
                  />
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={loading || phone.length !== 13}
                  className="h-12 w-full text-base sm:h-14 sm:text-lg"
                  size="lg"
                >
                  {loading ? tc('loading') : t('continue')}
                </Button>

                <p className="text-center text-xs text-muted-foreground sm:text-sm">
                  {t('terms')}{' '}
                  <Link href="/terms" className="text-link hover:underline">
                    {t('termsLink')}
                  </Link>{' '}
                  {t('and')}{' '}
                  <Link href="/privacy" className="text-link hover:underline">
                    {t('privacyLink')}
                  </Link>
                </p>
                <p className="text-center text-xs text-muted-foreground">
                  <Link
                    href="/account/recover"
                    className="text-link hover:underline"
                  >
                    {t('forgotAccess')}
                  </Link>
                </p>
              </form>
            ) : (
              <form onSubmit={handlePinSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="pin">{t('pinLabel')}</Label>
                  <Input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    autoComplete="current-password"
                    maxLength={6}
                    value={pin}
                    onChange={e => {
                      setPin(e.target.value.replace(/\D/g, '').slice(0, 6))
                      setError('')
                    }}
                    placeholder={t('pinPlaceholder')}
                    className="h-14 text-center text-2xl tracking-[0.4em]"
                    required
                  />
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={loading || pin.length < 4}
                  className="h-12 w-full text-base sm:h-14 sm:text-lg"
                  size="lg"
                >
                  {loading ? tc('loading') : t('signIn')}
                </Button>

                <div className="flex flex-col items-center gap-2">
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    disabled={loading}
                    onClick={handleForgotPin}
                  >
                    {t('forgotPin')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStep('phone')
                      setPin('')
                      setError('')
                    }}
                  >
                    {t('changeNumber')}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {tc('copyright', { year: new Date().getFullYear() })}
        </p>
      </div>
    </div>
  )
}
