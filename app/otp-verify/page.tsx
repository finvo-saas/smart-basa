'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { OtpInputGroup } from '@/components/a11y/OtpInputGroup'
import { SkipToContent } from '@/components/a11y/SkipToContent'
import { LanguageSwitcher } from '@/components/i18n'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { requestOtp, verifyOtp } from '@/lib/api/auth'
import { applyAuthSession, nextPathAfterAuth } from '@/utils/auth'
import {
  authStorageGet,
  authStorageRemove,
  authStorageSet,
} from '@/utils/auth-storage'

export default function OTPVerify() {
  const router = useRouter()
  const t = useTranslations('auth.otp')
  const tc = useTranslations('common')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [phone, setPhone] = useState<string | null>(null)
  const [hasAutoRead, setHasAutoRead] = useState(false)

  useEffect(() => {
    const stored = authStorageGet('loginPhone')
    if (!stored) {
      router.push('/login')
      return
    }
    setPhone(stored)
  }, [router])

  useEffect(() => {
    if (!phone || hasAutoRead) return
    const devOtp = authStorageGet('devOtp')
    // Only autofill when backend explicitly sent a console/dev OTP (no live SMS)
    if (!devOtp || !/^\d{6}$/.test(devOtp)) {
      authStorageRemove('devOtp')
      setHasAutoRead(true)
      return
    }
    const autoTimer = setTimeout(() => {
      setOtp(devOtp.split(''))
      setHasAutoRead(true)
    }, 400)
    return () => clearTimeout(autoTimer)
  }, [phone, hasAutoRead])

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [timer])

  const handleVerify = async (otpOverride?: string) => {
    const otpString = otpOverride ?? otp.join('')

    if (!phone) {
      router.push('/login')
      return
    }

    if (otpString.length !== 6) {
      setError(t('incomplete'))
      return
    }

    setLoading(true)
    setError('')

    const result = await verifyOtp({ phone, otp: otpString, purpose: 'login' })
    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      setOtp(['', '', '', '', '', ''])
      return
    }

    applyAuthSession(result.data)
    router.push(nextPathAfterAuth(result.data))
  }

  const handleResend = async () => {
    if (!phone) return
    setError('')
    setLoading(true)
    const result = await requestOtp({ phone, purpose: 'login' })
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    if (result.data.devOtp) {
      authStorageSet('devOtp', result.data.devOtp)
      setOtp(result.data.devOtp.split(''))
    } else {
      authStorageRemove('devOtp')
      setOtp(['', '', '', '', '', ''])
    }
    setTimer(60)
    setCanResend(false)
  }

  const handleChangeNumber = () => {
    authStorageRemove('loginPhone')
    authStorageRemove('devOtp')
    router.push('/login')
  }

  if (!phone) {
    return null
  }

  const displayPhone = `+${phone.slice(0, 3)} ${phone.slice(3)}`

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <SkipToContent targetId="otp-main" />
      <div className="w-full max-w-[480px]">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>

        <Card className="w-full">
          <CardHeader>
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
              className="mb-2 -ml-2"
              type="button"
            >
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              {tc('back')}
            </Button>
            <CardTitle className="text-2xl sm:text-3xl text-center">
              {t('title')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('subtitle')}
            </CardDescription>
            <p className="text-sm font-medium text-foreground text-center">
              {displayPhone}
            </p>
          </CardHeader>

          <CardContent id="otp-main" tabIndex={-1} className="space-y-6 outline-none">
            <OtpInputGroup
              value={otp}
              onChange={next => {
                setOtp(next)
                setError('')
              }}
              onComplete={code => handleVerify(code)}
              error={error || undefined}
              disabled={loading}
              label={t('title')}
              hint={t('hint')}
            />

            <Button
              onClick={() => handleVerify()}
              disabled={loading || otp.join('').length !== 6}
              className="w-full h-12 sm:h-14 text-base sm:text-lg"
              size="lg"
              type="button"
            >
              {loading ? tc('loading') : t('verify')}
            </Button>

            <div className="text-center space-y-2">
              {!canResend ? (
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  {t('resendIn')} {timer} {t('seconds')}
                </p>
              ) : (
                <Button
                  onClick={handleResend}
                  variant="link"
                  size="sm"
                  type="button"
                  disabled={loading}
                >
                  {t('resend')}
                </Button>
              )}
              <div className="pt-2">
                <Button onClick={handleChangeNumber} variant="ghost" size="sm" type="button">
                  {t('changeNumber')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
