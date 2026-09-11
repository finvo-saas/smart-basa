'use client'

import { useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { CurrentRental } from './CurrentRental'
import { RecentBills } from './RecentBills'
import { ActionCard, type QuickAction } from './ActionCard'
import {
  AlertCircle,
  Bookmark,
  CalendarDays,
  CreditCard,
  FileText,
  Bell,
  Search,
  User,
  UtensilsCrossed,
  Wallet,
  BarChart3,
  FolderOpen,
  ChevronRight,
} from 'lucide-react'
import { fetchMyTenancies } from '@/lib/api/buildings'
import { fetchBillsForTenant } from '@/lib/api/bills'
import { fetchRenterProfile } from '@/lib/api/profile'
import { useMockQuery } from '@/hooks/useMockQuery'
import { useMessStudentSelf } from '@/hooks/useMessStudentSelf'
import { useAppFormat } from '@/hooks/useAppFormat'
import { ok } from '@/lib/api/http'
import { cn } from '@/lib/utils'

interface RenterDashboardProps {
  renterId: string
  name: string
  phone: string
  email?: string
  city: string
  area: string
  search: string
  onCityChange: (city: string) => void
  onAreaChange: (area: string) => void
  onSearchChange: (search: string) => void
  areasByCity: Record<string, string[]>
}

export function RenterDashboard({
  renterId,
  name,
  phone,
  email,
  city,
  area,
  search,
  onCityChange,
  onAreaChange,
  onSearchChange,
  areasByCity,
}: RenterDashboardProps) {
  const t = useTranslations('dashboard.renter')
  const { formatCurrency } = useAppFormat()
  const { student: messMembership } = useMessStudentSelf()

  const loadDashboard = useCallback(async () => {
    const [tenancies, bills, profile] = await Promise.all([
      fetchMyTenancies('active'),
      fetchBillsForTenant(renterId),
      fetchRenterProfile(renterId),
    ])
    if (!tenancies.ok) return tenancies
    if (!bills.ok) return bills
    if (!profile.ok) return profile
    return ok({
      tenancies: tenancies.data,
      bills: bills.data,
      profile: profile.data,
    })
  }, [renterId])

  const { data: dashboardData } = useMockQuery(loadDashboard)

  const activeTenancy = dashboardData?.tenancies?.[0] ?? null
  const renterBills = useMemo(
    () => dashboardData?.bills ?? [],
    [dashboardData?.bills],
  )
  const homeBills = useMemo(() => {
    if (!activeTenancy) return renterBills
    const flatNo = activeTenancy.flat.flatNumber
    const buildingId = activeTenancy.building.id
    const matched = renterBills.filter(
      b =>
        b.propertyId === buildingId ||
        (b.flatNumber || '').trim() === flatNo.trim(),
    )
    return matched.length > 0 ? matched : renterBills
  }, [activeTenancy, renterBills])
  const renterProfile = dashboardData?.profile ?? null

  const profileCompletion = useMemo(() => {
    if (!renterProfile) return 0
    let completed = 0
    const total = 6
    if (renterProfile.documents?.length) completed++
    if (renterProfile.jobInfo) completed++
    if (renterProfile.familyMembers?.length) completed++
    if (renterProfile.emergencyContacts?.length) completed++
    if (email) completed++
    if (activeTenancy) completed++
    return Math.round((completed / total) * 100)
  }, [renterProfile, email, activeTenancy])

  const { dueAmount, overdueCount } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const source = homeBills
    const overdueBills = source.filter(b => {
      if (b.status === 'paid') return false
      return new Date(b.dueDate) < today
    })
    const unpaid = source.filter(b => b.status !== 'paid')
    const amount = unpaid.reduce((sum, b) => sum + (b.amount || 0), 0)
    return {
      dueAmount: amount,
      overdueCount: overdueBills.length,
    }
  }, [homeBills])

  const firstName = name.trim().split(/\s+/)[0] || name
  const initials = name
    .split(/\s+/)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const primaryActions: QuickAction[] = [
    {
      title: t('actions.pay'),
      href: '/payments',
      icon: <CreditCard />,
      accentClass:
        'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
    },
    {
      title: t('actions.bills'),
      href: '/bills',
      icon: <FileText />,
      accentClass:
        'bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
    },
    {
      title: t('actions.mess'),
      href: '/mess/student-dashboard',
      icon: <UtensilsCrossed />,
      accentClass:
        'bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200',
    },
    {
      title: t('actions.bookings'),
      href: '/my-bookings',
      icon: <CalendarDays />,
      accentClass:
        'bg-sky-50 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200',
    },
  ]

  const moreActions: QuickAction[] = [
    {
      title: t('actions.findHome'),
      subtitle: t('actions.findHomeHint'),
      href: `/search?city=${encodeURIComponent(city)}&area=${encodeURIComponent(area)}`,
      icon: <Search />,
      accentClass:
        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    },
    {
      title: t('actions.saved'),
      subtitle: t('actions.savedHint'),
      href: '/saved-searches',
      icon: <Bookmark />,
    },
    {
      title: t('actions.reminders'),
      subtitle: t('actions.remindersHint'),
      href: '/reminders',
      icon: <Bell />,
    },
    {
      title: t('actions.documents'),
      subtitle: t('actions.documentsHint'),
      href: '/documents',
      icon: <FolderOpen />,
    },
    {
      title: t('actions.expenses'),
      subtitle: t('actions.expensesHint'),
      href: '/expenses',
      icon: <Wallet />,
    },
    {
      title: t('actions.reports'),
      subtitle: t('actions.reportsHint'),
      href: '/reports',
      icon: <BarChart3 />,
    },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-4 md:space-y-7">
      {/* Greeting — first viewport focus */}
      <header className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-100 via-teal-50/80 to-white p-4 dark:border-slate-800 dark:from-slate-900 dark:via-teal-950/30 dark:to-background sm:p-5">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-teal-200/30 blur-2xl dark:bg-teal-700/20" />
        <div className="relative flex items-start gap-3">
          <Avatar className="h-12 w-12 border border-white/70 shadow-sm dark:border-slate-700 sm:h-14 sm:w-14">
            <AvatarFallback className="bg-teal-700 text-sm font-semibold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground sm:text-sm">
              {t('greeting')}
            </p>
            <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
              {firstName}
            </h1>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {phone}
              {email ? ` · ${email}` : ''}
            </p>
            {profileCompletion > 0 && profileCompletion < 100 ? (
              <div className="mt-3 max-w-xs space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{t('profileCompletion')}</span>
                  <span>{profileCompletion}%</span>
                </div>
                <Progress value={profileCompletion} className="h-1.5" />
              </div>
            ) : null}
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/profile">
              <User className="mr-1.5 h-4 w-4" />
              {t('profile')}
            </Link>
          </Button>
        </div>
      </header>

      {/* Attention banner */}
      {dueAmount > 0 ? (
        <div
          className={cn(
            'flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between',
            overdueCount > 0
              ? 'border-red-200 bg-red-50 text-red-950 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100'
              : 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100',
          )}
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                {overdueCount > 0
                  ? t('overdueTitle', { count: overdueCount })
                  : t('dueTitle')}
              </p>
              <p className="mt-0.5 text-xs opacity-90">
                {t('dueAmount', { amount: formatCurrency(dueAmount) })}
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="w-full sm:w-auto">
            <Link href={overdueCount > 0 ? '/bills?status=overdue' : '/payments'}>
              {t('payNow')}
            </Link>
          </Button>
        </div>
      ) : null}

      {/* Current home */}
      <CurrentRental
        tenancy={activeTenancy}
        messMembership={messMembership}
      />

      {/* Primary shortcuts — mobile 2×2 */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          {t('shortcuts')}
        </h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {primaryActions.map(action => (
            <ActionCard key={action.href} action={action} variant="compact" />
          ))}
        </div>
      </section>

      {/* Recent bills next to home */}
      {homeBills.length > 0 ? (
        <RecentBills bills={homeBills} limit={3} />
      ) : (
        <section className="rounded-2xl border border-dashed p-4 text-center">
          <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">{t('noBillsTitle')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('noBillsDesc')}</p>
        </section>
      )}

      {/* Find home CTA */}
      <section className="rounded-2xl border bg-slate-50/90 p-4 dark:bg-slate-900/50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">{t('findSectionTitle')}</h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              {t('findSectionDesc')}
            </p>
          </div>
          <Search className="mt-0.5 h-5 w-5 shrink-0 text-teal-700 dark:text-teal-300" />
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button asChild className="w-full sm:flex-1">
            <Link
              href={`/search?city=${encodeURIComponent(city)}&area=${encodeURIComponent(area)}&q=${encodeURIComponent(search)}`}
            >
              {t('searchNearby', { area: area || city })}
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/search?type=mess">{t('browseMess')}</Link>
          </Button>
        </div>
        {/* Keep city/area controls accessible but secondary */}
        <details className="mt-3 group">
          <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-muted-foreground">
            {t('changeLocation')}
            <ChevronRight className="h-3.5 w-3.5 transition group-open:rotate-90" />
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="text-xs text-muted-foreground">
              {t('city')}
              <select
                className="mt-1 flex h-10 w-full rounded-md border bg-background px-2 text-sm"
                value={city}
                onChange={e => onCityChange(e.target.value)}
              >
                {Object.keys(areasByCity).map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              {t('area')}
              <select
                className="mt-1 flex h-10 w-full rounded-md border bg-background px-2 text-sm"
                value={area}
                onChange={e => onAreaChange(e.target.value)}
              >
                {(areasByCity[city] || []).map(a => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <label className="col-span-2 text-xs text-muted-foreground">
              {t('searchKeyword')}
              <input
                className="mt-1 flex h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={search}
                onChange={e => onSearchChange(e.target.value)}
                placeholder={t('searchPlaceholder')}
              />
            </label>
          </div>
        </details>
      </section>

      {/* More tools */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          {t('moreTools')}
        </h2>
        <div className="space-y-2">
          {moreActions.map(action => (
            <ActionCard key={action.href} action={action} />
          ))}
        </div>
      </section>
    </div>
  )
}
