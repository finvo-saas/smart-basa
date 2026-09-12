'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
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
import { Shield, ArrowLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { applyAuthSession, isAdminSession, hasCompleteSession } from '@/utils/auth'
import { hasAuthTokens } from '@/utils/auth-tokens'
import { loginWithPin, selectRole, startLogin, verifyOtp } from '@/lib/api/auth'
import type { AuthSession } from '@/lib/api/auth'
import type { ApiResult } from '@/lib/api/http'

/** Accept +880…, 880…, 01…, or 1… and return E.164, or null if incomplete/invalid. */
function normalizeBdPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (
    digits.startsWith('880') &&
    (digits.length === 13 || digits.length === 14) &&
    digits[3] === '1'
  ) {
    return `+${digits}`
  }
  if (
    digits.startsWith('0') &&
    (digits.length === 11 || digits.length === 12) &&
    digits[1] === '1'
  ) {
    return `+880${digits.slice(1)}`
  }
  if (digits.startsWith('1') && (digits.length === 10 || digits.length === 11)) {
    return `+880${digits}`
  }
  return null
}

async function establishAdminSession(
  phoneE164: string,
  otp: string,
): Promise<ApiResult<AuthSession>> {
  const verified = await verifyOtp({
    phone: phoneE164,
    otp,
    purpose: 'login',
    asAdmin: true,
  })
  if (!verified.ok) return verified

  let session = verified.data

  if (session.needsRoleSelection || !session.user.roleSelected) {
    const canBeAdmin =
      Boolean(session.adminRole) ||
      session.availableRoles.includes('admin')
    if (!canBeAdmin) {
      return {
        ok: false,
        error: 'This phone is not registered as a platform admin.',
        code: 'FORBIDDEN',
      }
    }
    const selected = await selectRole('admin')
    if (!selected.ok) return selected
    session = selected.data
  }

  if (session.user.role !== 'admin' || !session.adminRole) {
    return {
      ok: false,
      error: 'Admin access is not available for this account.',
      code: 'FORBIDDEN',
    }
  }

  applyAuthSession(session, { complete: !session.needsPinSetup })
  return { ok: true, data: session }
}

function AdminLoginForm() {
  const t = useTranslations('admin.login')
  const tc = useTranslations('common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/admin'

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [pin, setPin] = useState('')
  const [step, setStep] = useState<'phone' | 'otp' | 'pin'>('phone')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [devHint, setDevHint] = useState<string | null>(null)

  useEffect(() => {
    if (isAdminSession() && hasAuthTokens() && hasCompleteSession()) {
      router.replace(next)
    }
  }, [router, next])

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setDevHint(null)
    const phoneE164 = normalizeBdPhone(phone)
    if (!phoneE164) {
      setError(t('invalidPhone'))
      return
    }
    setLoading(true)
    const result = await startLogin({ phone: phoneE164, asAdmin: true })
    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    if (result.data.next === 'pin') {
      setStep('pin')
      setPin('')
      return
    }
    if (result.data.devOtp) {
      setDevHint(result.data.devOtp)
      setOtp(result.data.devOtp)
    }
    setStep('otp')
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (otp.length !== 6) {
      setError(t('invalidOtp'))
      return
    }

    setLoading(true)
    const phoneE164 = normalizeBdPhone(phone)
    if (!phoneE164) {
      setLoading(false)
      setError(t('invalidPhone'))
      return
    }
    const result = await establishAdminSession(phoneE164, otp)
    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    router.replace(result.data.needsPinSetup ? '/set-pin' : next)
  }

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (pin.length < 4) {
      setError(t('invalidOtp'))
      return
    }
    setLoading(true)
    const phoneE164 = normalizeBdPhone(phone)
    if (!phoneE164) {
      setLoading(false)
      setError(t('invalidPhone'))
      return
    }
    const loggedIn = await loginWithPin({ phone: phoneE164, pin })
    setLoading(false)
    if (!loggedIn.ok) {
      setError(loggedIn.error)
      setPin('')
      return
    }
    let session = loggedIn.data
    if (session.needsRoleSelection || session.user.role !== 'admin') {
      if (!session.availableRoles.includes('admin') && !session.adminRole) {
        setError('This phone is not registered as a platform admin.')
        return
      }
      const selected = await selectRole('admin')
      if (!selected.ok) {
        setError(selected.error)
        return
      }
      session = selected.data
    }
    if (session.user.role !== 'admin' || !session.adminRole) {
      setError('Admin access is not available for this account.')
      return
    }
    applyAuthSession(session, { complete: !session.needsPinSetup })
    router.replace(session.needsPinSetup ? '/set-pin' : next)
  }

  const displayPhone = normalizeBdPhone(phone) || phone

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('platformStaff')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {step === 'phone'
                ? t('enterPhone')
                : step === 'pin'
                  ? t('enterPhone')
                  : t('verifyOtp')}
            </CardTitle>
            <CardDescription>
              {step === 'phone'
                ? t('phoneDesc')
                : step === 'pin'
                  ? displayPhone
                  : t('otpDesc', {
                      phone: displayPhone,
                      otp: devHint || '******',
                    })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 'phone' ? (
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-phone">{t('phoneLabel')}</Label>
                  <Input
                    id="admin-phone"
                    type="tel"
                    placeholder={t('phonePlaceholder')}
                    value={phone}
                    onChange={e => {
                      const next = e.target.value.replace(/[^\d+]/g, '')
                      const plus = next.startsWith('+') ? '+' : ''
                      setPhone(`${plus}${next.replace(/\D/g, '').slice(0, 14)}`)
                    }}
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('signingIn') : t('sendOtp')}
                </Button>
              </form>
            ) : step === 'pin' ? (
              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-pin">PIN</Label>
                  <Input
                    id="admin-pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onChange={e =>
                      setPin(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || pin.length < 4}
                >
                  {loading ? t('signingIn') : t('signInAdmin')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep('phone')
                    setPin('')
                    setError('')
                  }}
                >
                  {t('changeNumber')}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-otp">{t('otpLabel')}</Label>
                  <Input
                    id="admin-otp"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={e =>
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? t('signingIn') : t('signInAdmin')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep('phone')
                    setOtp('')
                    setError('')
                    setDevHint(null)
                  }}
                >
                  {t('changeNumber')}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Button asChild variant="ghost" className="w-full">
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToUserLogin')}
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  const tc = useTranslations('common')
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          {tc('loading')}
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  )
}
