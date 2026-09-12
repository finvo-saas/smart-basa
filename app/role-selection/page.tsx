'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/i18n'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Check, Shield } from 'lucide-react'
import { UserRole } from '@/types'
import { ADMIN_ROLE_LABELS } from '@/lib/admin/permissions'
import { selectRole } from '@/lib/api/auth'
import {
  applyAuthSession,
  getAvailableRolesFromSession,
  getLoginPhone,
  getPendingAdminRole,
  hasCompleteSession,
  nextPathAfterAuth,
  isOtpVerified,
  needsPinSetup,
} from '@/utils/auth'
import { hasAuthTokens } from '@/utils/auth-tokens'

export default function RoleSelection() {
  const router = useRouter()
  const t = useTranslations('auth.role')
  const tc = useTranslations('common')
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginPhone, setLoginPhone] = useState<string | null>(null)
  const [availableRoles, setAvailableRoles] = useState<UserRole[]>([
    'renter',
    'owner',
  ])
  const [adminRoleLabel, setAdminRoleLabel] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (hasCompleteSession()) {
      router.replace('/dashboard')
      return
    }

    const otpOk = isOtpVerified()
    if (!otpOk || !hasAuthTokens()) {
      router.push('/otp-verify')
      return
    }
    if (needsPinSetup()) {
      router.replace('/set-pin')
      return
    }

    setLoginPhone(getLoginPhone())
    setAvailableRoles(getAvailableRolesFromSession())
    const pending = getPendingAdminRole()
    if (pending) {
      setAdminRoleLabel(ADMIN_ROLE_LABELS[pending])
    }
  }, [router])

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    setError('')
  }

  const handleContinue = async () => {
    if (!selectedRole) return

    setLoading(true)
    setError('')
    const result = await selectRole(selectedRole)
    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    applyAuthSession(result.data, { complete: true })

    router.push(nextPathAfterAuth(result.data))
  }

  const showAdmin = availableRoles.includes('admin') && Boolean(adminRoleLabel)

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
            {loginPhone && (
              <p className="text-center text-sm font-medium text-primary pt-2">
                +{loginPhone.slice(0, 3)} {loginPhone.slice(3)}
              </p>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => handleRoleSelect('renter')}
                className={`w-full p-4 sm:p-6 rounded-xl border-2 transition-all text-left ${
                  selectedRole === 'renter'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start">
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${
                      selectedRole === 'renter'
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/50'
                    }`}
                  >
                    {selectedRole === 'renter' && (
                      <Check className="w-4 h-4 text-primary-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-semibold mb-1">
                      {t('student')}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {t('studentDesc')}
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('owner')}
                className={`w-full p-4 sm:p-6 rounded-xl border-2 transition-all text-left ${
                  selectedRole === 'owner'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start">
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${
                      selectedRole === 'owner'
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/50'
                    }`}
                  >
                    {selectedRole === 'owner' && (
                      <Check className="w-4 h-4 text-primary-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-semibold mb-1">
                      {t('owner')}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {t('ownerDesc')}
                    </p>
                  </div>
                </div>
              </button>

              {showAdmin && (
                <button
                  type="button"
                  onClick={() => handleRoleSelect('admin')}
                  className={`w-full p-4 sm:p-6 rounded-xl border-2 transition-all text-left ${
                    selectedRole === 'admin'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start">
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${
                        selectedRole === 'admin'
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground/50'
                      }`}
                    >
                      {selectedRole === 'admin' && (
                        <Check className="w-4 h-4 text-primary-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-semibold mb-1 flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        {t('admin')}
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        {t('adminDesc', { role: adminRoleLabel ?? '' })}
                      </p>
                    </div>
                  </div>
                </button>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive text-center" role="alert">
                {error}
              </p>
            )}

            <p className="text-center text-xs text-muted-foreground">
              {t('staffAdmin')}{' '}
              <Link href="/admin/login" className="text-link hover:underline">
                {t('adminSignIn')}
              </Link>
            </p>

            <Button
              onClick={handleContinue}
              disabled={!selectedRole || loading}
              className="w-full h-12 sm:h-14 text-base sm:text-lg"
              size="lg"
            >
              {loading ? tc('loading') : t('continue')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
