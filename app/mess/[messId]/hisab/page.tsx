'use client'

import { Layout } from '@/components/layout/Layout'
import { MessSubpageBackButton } from '@/components/mess/MessSubpageBackButton'
import { LoadingState } from '@/components/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMockQuery } from '@/hooks/useMockQuery'
import {
  addMemberDeposit,
  closeHisabMonth,
  createMealOffRequest,
  fetchHisabGrid,
  fetchHisabMonth,
  fetchMealOffRequests,
  fetchMemberDeposits,
  fetchMessById,
  fetchMessStudents,
  markAllHisabMeals,
  reopenHisabMonth,
  reviewMealOffRequest,
  saveHisabGrid,
  updateMessMealPricing,
  updateMessUtilities,
} from '@/lib/api/mess'
import { toast } from '@/lib/feedback/toast'
import { formatCurrency } from '@/lib/format/locale'
import type { HisabGridRow } from '@/types/mess'
import { getStoredRole } from '@/utils/auth'
import { format } from 'date-fns'
import { Calculator, Check, RotateCcw, Save } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

export default function MessHisabPage() {
  const t = useTranslations('mess.hisab')
  const params = useParams()
  const router = useRouter()
  const messId = String(params.messId || '')
  const role = getStoredRole()
  const isOwner = role === 'owner' || role === 'admin'

  const today = format(new Date(), 'yyyy-MM-dd')
  const [date, setDate] = useState(today)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [rows, setRows] = useState<HisabGridRow[]>([])
  const [saving, setSaving] = useState(false)
  const [guestPrice, setGuestPrice] = useState('')
  const [mealsPerDay, setMealsPerDay] = useState('3')
  const [depositStudentId, setDepositStudentId] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [depositMethod, setDepositMethod] = useState('Cash')
  const [depositTrx, setDepositTrx] = useState('')
  const [mealOffStudentId, setMealOffStudentId] = useState('')
  const [mealOffStart, setMealOffStart] = useState(today)
  const [mealOffEnd, setMealOffEnd] = useState(today)
  const [mealOffReason, setMealOffReason] = useState('')
  const [mealOffBreakfast, setMealOffBreakfast] = useState(true)
  const [mealOffLunch, setMealOffLunch] = useState(true)
  const [mealOffDinner, setMealOffDinner] = useState(true)
  const [mealOffSubmitting, setMealOffSubmitting] = useState(false)
  const [mealOffFormOpen, setMealOffFormOpen] = useState(false)
  const [waterAvail, setWaterAvail] = useState('24/7')
  const [powerAvail, setPowerAvail] = useState('24/7')
  const [waterSource, setWaterSource] = useState('wasa')
  const [loadShedding, setLoadShedding] = useState('rare')
  const [meterType, setMeterType] = useState('shared')
  const [billSplitMethod, setBillSplitMethod] = useState('equal')
  const [hasFilter, setHasFilter] = useState(false)
  const [separateDrinkingWater, setSeparateDrinkingWater] = useState(false)
  const [hasWaterBackup, setHasWaterBackup] = useState(false)
  const [hasIps, setHasIps] = useState(false)
  const [hasGenerator, setHasGenerator] = useState(false)
  const [liftBackup, setLiftBackup] = useState(false)
  const [commonAreaBackup, setCommonAreaBackup] = useState(false)
  const [emergencyLight, setEmergencyLight] = useState(false)
  const [showManualUtilities, setShowManualUtilities] = useState(false)
  const [waterSourceManual, setWaterSourceManual] = useState('')
  const [manualPairs, setManualPairs] = useState<
    { key: string; value: string }[]
  >([{ key: '', value: '' }])

  const loadMess = useCallback(() => fetchMessById(messId), [messId])
  const loadGrid = useCallback(
    () => fetchHisabGrid(messId, date),
    [messId, date]
  )
  const loadMonth = useCallback(
    () => fetchHisabMonth(messId, month, year),
    [messId, month, year]
  )
  const loadOff = useCallback(() => fetchMealOffRequests(messId), [messId])
  const loadDeposits = useCallback(() => fetchMemberDeposits(messId), [messId])
  const loadStudents = useCallback(() => fetchMessStudents(messId), [messId])

  const {
    data: mess,
    loading: messLoading,
    error: messError,
    refetch: refetchMess,
  } = useMockQuery(loadMess)
  const {
    data: grid,
    loading: gridLoading,
    error: gridError,
    refetch: refetchGrid,
  } = useMockQuery(loadGrid)
  const {
    data: monthData,
    loading: monthLoading,
    error: monthError,
    refetch: refetchMonth,
  } = useMockQuery(loadMonth)
  const {
    data: offs,
    error: offsError,
    refetch: refetchOff,
  } = useMockQuery(loadOff)
  const { data: deposits, refetch: refetchDep } = useMockQuery(loadDeposits)
  const { data: students, error: studentsError } = useMockQuery(loadStudents)

  const accessError = [gridError, monthError, offsError, studentsError].find(
    e =>
      e &&
      (/access|forbidden|owner|auth|sign in|log in|credential/i.test(e) ||
        e.toLowerCase().includes('not authenticated'))
  )

  useEffect(() => {
    if (grid?.rows) setRows(grid.rows)
  }, [grid])

  useEffect(() => {
    if (!mess) return
    setGuestPrice(
      mess.mealSystem?.guestMealPrice != null
        ? String(mess.mealSystem.guestMealPrice)
        : ''
    )
    setMealsPerDay(String(mess.mealSystem?.mealsPerDay || 3))
    const w = mess.utilities?.water?.profile
    const e = mess.utilities?.electricity?.profile
    if (w?.availability) setWaterAvail(w.availability)
    if (e?.availability) setPowerAvail(e.availability)
    if (w?.source) {
      const known = ['wasa', 'deep_tube_well', 'both', 'other']
      if (known.includes(w.source)) {
        setWaterSource(w.source)
        setWaterSourceManual('')
      } else {
        setWaterSource('other')
        setWaterSourceManual(w.source)
      }
    }
    if (e?.loadSheddingLevel) setLoadShedding(e.loadSheddingLevel)
    if (e?.meterType) setMeterType(e.meterType)
    if (e?.billSplitMethod) setBillSplitMethod(e.billSplitMethod)
    setHasFilter(Boolean(w?.hasFilter))
    setSeparateDrinkingWater(Boolean(w?.separateDrinkingWater))
    setHasWaterBackup(Boolean(w?.hasBackup))
    setHasIps(Boolean(e?.hasIps))
    setHasGenerator(Boolean(e?.hasGenerator))
    setLiftBackup(Boolean(e?.liftBackup))
    setCommonAreaBackup(Boolean(e?.commonAreaBackup))
    setEmergencyLight(Boolean(e?.emergencyLight))
    const manualRaw =
      w?.manual && typeof w.manual === 'object' && !Array.isArray(w.manual)
        ? w.manual
        : e?.manual && typeof e.manual === 'object' && !Array.isArray(e.manual)
          ? e.manual
          : null
    const pairs = manualRaw
      ? Object.entries(manualRaw).map(([key, value]) => ({
          key,
          value: value == null ? '' : String(value),
        }))
      : []
    setManualPairs(pairs.length ? pairs : [{ key: '', value: '' }])
    setShowManualUtilities(pairs.length > 0)
  }, [mess])

  const updateCell = (
    studentId: string,
    field: keyof HisabGridRow,
    value: number
  ) => {
    setRows(prev =>
      prev.map(r => (r.studentId === studentId ? { ...r, [field]: value } : r))
    )
  }

  const handleSaveGrid = async () => {
    setSaving(true)
    const result = await saveHisabGrid(
      messId,
      date,
      rows.map(r => ({
        studentId: r.studentId,
        breakfast: r.breakfast,
        lunch: r.lunch,
        dinner: r.dinner,
        guestBreakfast: r.guestBreakfast,
        guestLunch: r.guestLunch,
        guestDinner: r.guestDinner,
        notes: r.notes,
      }))
    )
    setSaving(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(t('saved'))
    refetchGrid()
    refetchMonth()
  }

  const handleMarkAll = async (on: boolean) => {
    const result = await markAllHisabMeals(messId, date, on)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    refetchGrid()
  }

  const handleClose = async () => {
    const result = await closeHisabMonth(messId, month, year)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(t('monthClosed'))
    refetchMonth()
  }

  const handleReopen = async () => {
    const result = await reopenHisabMonth(messId, month, year)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(t('monthReopened'))
    refetchMonth()
  }

  const handleSavePricing = async () => {
    const result = await updateMessMealPricing(messId, {
      mealsPerDay: Number(mealsPerDay) || 3,
      guestMealPrice: guestPrice === '' ? null : Number(guestPrice),
      vegetarianOption: Boolean(mess?.mealSystem?.vegetarianOption),
    })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(t('pricingSaved'))
    refetchMess()
  }

  const handleSaveUtilities = async () => {
    const sourceValue =
      waterSource === 'other'
        ? waterSourceManual.trim() || 'other'
        : waterSource
    const manual: Record<string, string> = {}
    if (showManualUtilities) {
      for (const pair of manualPairs) {
        const key = pair.key.trim()
        if (!key) continue
        manual[key] = pair.value
      }
    }

    const waterProfile: Record<string, unknown> = {
      availability: waterAvail,
      source: sourceValue,
      hasFilter,
      separateDrinkingWater,
      hasBackup: hasWaterBackup,
      manual,
    }

    const electricityProfile: Record<string, unknown> = {
      availability: powerAvail,
      loadSheddingLevel: loadShedding,
      hasIps,
      hasGenerator,
      liftBackup,
      commonAreaBackup,
      emergencyLight,
      meterType,
      billSplitMethod,
      manual,
    }

    const result = await updateMessUtilities(messId, {
      waterProfile,
      electricityProfile,
    })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(t('utilitiesSaved'))
    refetchMess()
  }

  const handleDeposit = async () => {
    if (!depositStudentId || !depositAmount) return
    const result = await addMemberDeposit(messId, {
      studentId: depositStudentId,
      amount: Number(depositAmount),
      date: today,
      paymentMethod: depositMethod,
      transactionId: depositTrx,
    })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setDepositAmount('')
    setDepositTrx('')
    toast.success(t('depositAdded'))
    refetchDep()
    refetchMonth()
  }

  const handleMealOffRequest = async () => {
    if (isOwner && !mealOffStudentId) {
      toast.error(t('selectMemberRequired'))
      return
    }
    if (!mealOffStart || !mealOffEnd) {
      toast.error(t('mealOffDatesRequired'))
      return
    }
    if (mealOffEnd < mealOffStart) {
      toast.error(t('mealOffEndBeforeStart'))
      return
    }
    if (!mealOffBreakfast && !mealOffLunch && !mealOffDinner) {
      toast.error(t('mealOffMealsRequired'))
      return
    }

    setMealOffSubmitting(true)
    const result = await createMealOffRequest(messId, {
      startDate: mealOffStart,
      endDate: mealOffEnd,
      reason: mealOffReason.trim() || undefined,
      studentId: isOwner ? mealOffStudentId : undefined,
      meals: {
        breakfast: mealOffBreakfast,
        lunch: mealOffLunch,
        dinner: mealOffDinner,
      },
    })
    setMealOffSubmitting(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    setMealOffReason('')
    setMealOffStart(today)
    setMealOffEnd(today)
    setMealOffBreakfast(true)
    setMealOffLunch(true)
    setMealOffDinner(true)
    if (isOwner) setMealOffStudentId('')
    setMealOffFormOpen(false)
    toast.success(t('mealOffCreated'))
    refetchOff()
  }

  const formatMealOffMeals = (meals: Record<string, boolean> | undefined) => {
    if (!meals) return t('meals')
    const parts: string[] = []
    if (meals.breakfast) parts.push(t('breakfast'))
    if (meals.lunch) parts.push(t('lunch'))
    if (meals.dinner) parts.push(t('dinner'))
    return parts.length ? parts.join(' · ') : t('meals')
  }

  if (messLoading && !mess) {
    return (
      <Layout>
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <LoadingState label={t('loading')} />
        </div>
      </Layout>
    )
  }

  if (messError || !mess) {
    return (
      <Layout>
        <div className="container mx-auto max-w-7xl space-y-4 px-4 py-6">
          <MessSubpageBackButton fallbackHref="/mess" />
          <Card>
            <CardContent className="space-y-3 py-10 text-center">
              <p className="font-medium">{t('loadFailed')}</p>
              <p className="text-sm text-muted-foreground">
                {messError || t('notFound')}
              </p>
              <Button onClick={() => refetchMess()}>{t('retry')}</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <MessSubpageBackButton fallbackHref="/mess" />
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Calculator className="h-6 w-6" />
              {t('title')}
            </h1>
            <p className="text-muted-foreground">
              {mess.name} · {t('subtitle')}
            </p>
          </div>
          {monthData ? (
            <Badge
              variant={monthData.status === 'closed' ? 'secondary' : 'default'}
            >
              {monthData.status === 'closed' ? t('closed') : t('open')} ·{' '}
              {formatCurrency(monthData.mealRate)}/{t('meal')}
            </Badge>
          ) : null}
        </div>

        {accessError ? (
          <Card className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40">
            <CardContent className="space-y-2 py-4 text-sm text-amber-950 dark:text-amber-100">
              <p className="font-medium">{t('accessDeniedTitle')}</p>
              <p>{accessError}</p>
              <p className="text-muted-foreground">{t('accessDeniedHint')}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push('/mess')}
                >
                  {t('backToMess')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    refetchGrid()
                    refetchMonth()
                    refetchOff()
                    refetchMess()
                  }}
                >
                  {t('retry')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Tabs defaultValue="grid">
          <TabsList className="flex h-auto flex-wrap gap-1">
            <TabsTrigger value="grid">{t('tabGrid')}</TabsTrigger>
            <TabsTrigger value="month">{t('tabMonth')}</TabsTrigger>
            <TabsTrigger value="deposits">{t('tabDeposits')}</TabsTrigger>
            <TabsTrigger value="mealOff">{t('tabMealOff')}</TabsTrigger>
            {isOwner ? (
              <TabsTrigger value="settings">{t('tabSettings')}</TabsTrigger>
            ) : null}
          </TabsList>

          <TabsContent value="grid" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
                <CardTitle className="text-lg">{t('dailyGrid')}</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-auto"
                  />
                  {isOwner ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAll(true)}
                      >
                        {t('markAllOn')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAll(false)}
                      >
                        {t('markAllOff')}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveGrid}
                        disabled={saving}
                      >
                        <Save className="mr-1 h-4 w-4" />
                        {t('save')}
                      </Button>
                    </>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                {gridLoading ? (
                  <LoadingState label={t('loading')} />
                ) : gridError ? (
                  <div className="space-y-3 py-8 text-center">
                    <p className="text-sm text-destructive">{gridError}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => refetchGrid()}
                    >
                      {t('retry')}
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="p-2">{t('member')}</th>
                          <th className="p-2">B</th>
                          <th className="p-2">L</th>
                          <th className="p-2">D</th>
                          <th className="p-2">G-B</th>
                          <th className="p-2">G-L</th>
                          <th className="p-2">G-D</th>
                          <th className="p-2">{t('total')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(row => (
                          <tr
                            key={row.studentId}
                            className="border-b border-muted/60"
                          >
                            <td className="p-2 font-medium">
                              {row.name}
                              {row.seatNumber ? (
                                <span className="ml-1 text-xs text-muted-foreground">
                                  · {row.seatNumber}
                                </span>
                              ) : null}
                            </td>
                            {(
                              [
                                'breakfast',
                                'lunch',
                                'dinner',
                                'guestBreakfast',
                                'guestLunch',
                                'guestDinner',
                              ] as const
                            ).map(field => (
                              <td key={field} className="p-1">
                                <Input
                                  type="number"
                                  min={0}
                                  max={field.startsWith('guest') ? 20 : 3}
                                  step={field.startsWith('guest') ? 1 : 0.5}
                                  className="h-8 w-16"
                                  disabled={
                                    !isOwner || monthData?.status === 'closed'
                                  }
                                  value={row[field]}
                                  onChange={e =>
                                    updateCell(
                                      row.studentId,
                                      field,
                                      Number(e.target.value) || 0
                                    )
                                  }
                                />
                              </td>
                            ))}
                            <td className="p-2 tabular-nums">
                              {Number(row.breakfast) +
                                Number(row.lunch) +
                                Number(row.dinner)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!rows.length ? (
                      <p className="py-8 text-center text-muted-foreground">
                        {t('noMembers')}
                      </p>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="month" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
                <CardTitle className="text-lg">{t('monthSummary')}</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="number"
                    className="w-20"
                    value={month}
                    min={1}
                    max={12}
                    onChange={e => setMonth(Number(e.target.value) || 1)}
                  />
                  <Input
                    type="number"
                    className="w-24"
                    value={year}
                    onChange={e => setYear(Number(e.target.value) || year)}
                  />
                  {isOwner && monthData?.status === 'open' ? (
                    <Button size="sm" onClick={handleClose}>
                      <Check className="mr-1 h-4 w-4" />
                      {t('closeMonth')}
                    </Button>
                  ) : null}
                  {isOwner && monthData?.status === 'closed' ? (
                    <Button size="sm" variant="outline" onClick={handleReopen}>
                      <RotateCcw className="mr-1 h-4 w-4" />
                      {t('reopenMonth')}
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {monthLoading ? (
                  <LoadingState label={t('loading')} />
                ) : monthError || !monthData ? (
                  <div className="space-y-3 py-8 text-center">
                    <p className="text-sm text-destructive">
                      {monthError || t('loadFailed')}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => refetchMonth()}
                    >
                      {t('retry')}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Stat
                        label={t('bazaar')}
                        value={formatCurrency(monthData.bazaarTotal)}
                      />
                      <Stat
                        label={t('fixed')}
                        value={formatCurrency(monthData.fixedTotal)}
                      />
                      <Stat
                        label={t('totalMeals')}
                        value={String(monthData.totalMeals)}
                      />
                      <Stat
                        label={t('mealRate')}
                        value={formatCurrency(monthData.mealRate)}
                      />
                    </div>
                    {monthData.paymentTodo ? (
                      <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        {t('paymentTodo')}
                      </p>
                    ) : null}
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="p-2">{t('member')}</th>
                            <th className="p-2">{t('meals')}</th>
                            <th className="p-2">{t('mealCost')}</th>
                            <th className="p-2">{t('guest')}</th>
                            <th className="p-2">{t('fixedShare')}</th>
                            <th className="p-2">{t('deposits')}</th>
                            <th className="p-2">{t('due')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthData.members.map(m => (
                            <tr key={m.studentId} className="border-b">
                              <td className="p-2 font-medium">
                                {isOwner ? (
                                  <Link
                                    className="hover:underline"
                                    href={`/mess/${messId}/members/${m.studentId}/meals?year=${monthData.year}&month=${monthData.month}`}
                                  >
                                    {m.name}
                                  </Link>
                                ) : (
                                  m.name
                                )}
                              </td>
                              <td className="p-2">{m.mealCount}</td>
                              <td className="p-2">
                                {formatCurrency(m.mealCost)}
                              </td>
                              <td className="p-2">
                                {formatCurrency(m.guestCost)}
                              </td>
                              <td className="p-2">
                                {formatCurrency(m.fixedShare)}
                              </td>
                              <td className="p-2">
                                {formatCurrency(m.deposits)}
                              </td>
                              <td className="p-2 font-semibold text-primary">
                                {formatCurrency(m.due)}
                                {m.credit > 0 ? (
                                  <span className="ml-1 text-xs text-emerald-700">
                                    (+{formatCurrency(m.credit)})
                                  </span>
                                ) : null}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {monthData.note}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deposits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('depositsTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isOwner ? (
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="h-10 rounded-md border px-3 text-sm"
                      value={depositStudentId}
                      onChange={e => setDepositStudentId(e.target.value)}
                    >
                      <option value="">{t('selectMember')}</option>
                      {(students || []).map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      placeholder={t('amount')}
                      className="w-32"
                      value={depositAmount}
                      onChange={e => setDepositAmount(e.target.value)}
                    />
                    <select
                      className="h-10 rounded-md border px-3 text-sm"
                      value={depositMethod}
                      onChange={e => setDepositMethod(e.target.value)}
                    >
                      <option value="Cash">Cash</option>
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Rocket">Rocket</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                    <Input
                      placeholder="TrxID"
                      className="w-40"
                      value={depositTrx}
                      onChange={e => setDepositTrx(e.target.value)}
                    />
                    <Button onClick={handleDeposit}>{t('addDeposit')}</Button>
                  </div>
                ) : null}
                <ul className="divide-y rounded-lg border">
                  {(deposits || []).map(d => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between px-3 py-2 text-sm"
                    >
                      <span>
                        {d.studentName} · {d.date}
                        {d.paymentMethod ? ` · ${d.paymentMethod}` : ''}
                        {d.transactionId ? ` · ${d.transactionId}` : ''}
                        {d.status && d.status !== 'confirmed'
                          ? ` · ${d.status}`
                          : ''}
                        {d.note ? (
                          <span className="text-muted-foreground">
                            {' '}
                            — {d.note}
                          </span>
                        ) : null}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(d.amount)}
                      </span>
                    </li>
                  ))}
                  {!deposits?.length ? (
                    <li className="px-3 py-6 text-center text-muted-foreground">
                      {t('noDeposits')}
                    </li>
                  ) : null}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mealOff" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="text-lg">{t('mealOffTitle')}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {isOwner ? t('mealOffOwnerHint') : t('mealOffMemberHint')}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={mealOffFormOpen ? 'outline' : 'default'}
                  onClick={() => setMealOffFormOpen(open => !open)}
                >
                  {mealOffFormOpen ? t('cancelRequest') : t('requestMealOff')}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {mealOffFormOpen ? (
                  <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-2 lg:grid-cols-3">
                    {isOwner ? (
                      <label className="block text-sm sm:col-span-2 lg:col-span-1">
                        <span className="mb-1 block font-medium">
                          {t('member')}
                        </span>
                        <select
                          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                          value={mealOffStudentId}
                          onChange={e => setMealOffStudentId(e.target.value)}
                        >
                          <option value="">{t('selectMember')}</option>
                          {(students || []).map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium">
                        {t('startDate')}
                      </span>
                      <Input
                        type="date"
                        value={mealOffStart}
                        onChange={e => {
                          const next = e.target.value
                          setMealOffStart(next)
                          if (mealOffEnd < next) setMealOffEnd(next)
                        }}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium">
                        {t('endDate')}
                      </span>
                      <Input
                        type="date"
                        value={mealOffEnd}
                        min={mealOffStart}
                        onChange={e => setMealOffEnd(e.target.value)}
                      />
                    </label>
                    <label className="block text-sm sm:col-span-2 lg:col-span-3">
                      <span className="mb-1 block font-medium">
                        {t('reason')}
                      </span>
                      <Input
                        value={mealOffReason}
                        onChange={e => setMealOffReason(e.target.value)}
                        placeholder={t('reasonPlaceholder')}
                      />
                    </label>
                    <div className="sm:col-span-2 lg:col-span-3">
                      <p className="mb-2 text-sm font-medium">
                        {t('mealsToSkip')}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border"
                            checked={mealOffBreakfast}
                            onChange={e =>
                              setMealOffBreakfast(e.target.checked)
                            }
                          />
                          {t('breakfast')}
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border"
                            checked={mealOffLunch}
                            onChange={e => setMealOffLunch(e.target.checked)}
                          />
                          {t('lunch')}
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border"
                            checked={mealOffDinner}
                            onChange={e => setMealOffDinner(e.target.checked)}
                          />
                          {t('dinner')}
                        </label>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
                      <Button
                        onClick={handleMealOffRequest}
                        disabled={mealOffSubmitting}
                      >
                        {mealOffSubmitting
                          ? t('submitting')
                          : t('submitMealOff')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={mealOffSubmitting}
                        onClick={() => setMealOffFormOpen(false)}
                      >
                        {t('cancelRequest')}
                      </Button>
                    </div>
                  </div>
                ) : null}

                <ul className="space-y-2">
                  {(offs || []).map(req => (
                    <li
                      key={req.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">
                          {req.studentName} · {req.startDate}
                          {req.endDate !== req.startDate
                            ? ` → ${req.endDate}`
                            : ''}
                        </p>
                        <p className="text-muted-foreground">
                          {formatMealOffMeals(req.meals)}
                          {req.reason ? ` — ${req.reason}` : ''}
                        </p>
                        <Badge className="mt-1" variant="outline">
                          {req.status}
                        </Badge>
                      </div>
                      {isOwner && req.status === 'pending' ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={async () => {
                              const r = await reviewMealOffRequest(
                                messId,
                                req.id,
                                true
                              )
                              if (!r.ok) toast.error(r.error)
                              else {
                                toast.success(t('mealOffApproved'))
                                refetchOff()
                                refetchGrid()
                              }
                            }}
                          >
                            {t('approve')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const r = await reviewMealOffRequest(
                                messId,
                                req.id,
                                false
                              )
                              if (!r.ok) toast.error(r.error)
                              else {
                                toast.success(t('mealOffRejected'))
                                refetchOff()
                              }
                            }}
                          >
                            {t('reject')}
                          </Button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                  {!offs?.length ? (
                    <p className="py-6 text-center text-muted-foreground">
                      {t('noMealOff')}
                    </p>
                  ) : null}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {isOwner ? (
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('pricingTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <label className="text-sm">
                    {t('mealsPerDay')}
                    <Input
                      className="mt-1 w-24"
                      value={mealsPerDay}
                      onChange={e => setMealsPerDay(e.target.value)}
                    />
                  </label>
                  <label className="text-sm">
                    {t('guestPrice')}
                    <Input
                      className="mt-1 w-32"
                      value={guestPrice}
                      onChange={e => setGuestPrice(e.target.value)}
                      placeholder="50"
                    />
                  </label>
                  <Button className="self-end" onClick={handleSavePricing}>
                    {t('savePricing')}
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t('utilitiesTitle')}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {t('utilitiesHint')}
                  </p>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-3 rounded-lg border p-3">
                    <p className="text-sm font-medium">{t('waterSection')}</p>
                    <div className="flex flex-wrap gap-3">
                      <label className="text-sm">
                        {t('waterAvail')}
                        <select
                          className="mt-1 block h-10 rounded-md border px-2"
                          value={waterAvail}
                          onChange={e => setWaterAvail(e.target.value)}
                        >
                          <option value="24_7">24/7</option>
                          <option value="limited">{t('availLimited')}</option>
                          <option value="frequent_problem">
                            {t('availFrequent')}
                          </option>
                        </select>
                      </label>
                      <label className="text-sm">
                        {t('waterSource')}
                        <select
                          className="mt-1 block h-10 rounded-md border px-2"
                          value={waterSource}
                          onChange={e => setWaterSource(e.target.value)}
                        >
                          <option value="wasa">WASA</option>
                          <option value="deep_tube_well">
                            {t('sourceDeepTube')}
                          </option>
                          <option value="both">{t('sourceBoth')}</option>
                          <option value="other">{t('sourceOther')}</option>
                        </select>
                      </label>
                    </div>
                    {waterSource === 'other' ? (
                      <label className="block text-sm">
                        {t('waterSourceManual')}
                        <Input
                          className="mt-1"
                          value={waterSourceManual}
                          onChange={e => setWaterSourceManual(e.target.value)}
                          placeholder={t('waterSourceManualPlaceholder')}
                        />
                      </label>
                    ) : null}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={hasFilter}
                          onChange={e => setHasFilter(e.target.checked)}
                        />
                        {t('hasFilter')}
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={separateDrinkingWater}
                          onChange={e =>
                            setSeparateDrinkingWater(e.target.checked)
                          }
                        />
                        {t('separateDrinkingWater')}
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={hasWaterBackup}
                          onChange={e => setHasWaterBackup(e.target.checked)}
                        />
                        {t('hasWaterBackup')}
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-lg border p-3">
                    <p className="text-sm font-medium">{t('powerSection')}</p>
                    <div className="flex flex-wrap gap-3">
                      <label className="text-sm">
                        {t('powerAvail')}
                        <select
                          className="mt-1 block h-10 rounded-md border px-2"
                          value={powerAvail}
                          onChange={e => setPowerAvail(e.target.value)}
                        >
                          <option value="24/7">24/7</option>
                          <option value="limited">{t('availLimited')}</option>
                          <option value="frequent_problem">
                            {t('availFrequent')}
                          </option>
                        </select>
                      </label>
                      <label className="text-sm">
                        {t('loadShedding')}
                        <select
                          className="mt-1 block h-10 rounded-md border px-2"
                          value={loadShedding}
                          onChange={e => setLoadShedding(e.target.value)}
                        >
                          <option value="rare">{t('sheddingRare')}</option>
                          <option value="moderate">
                            {t('sheddingModerate')}
                          </option>
                          <option value="frequent">
                            {t('sheddingFrequent')}
                          </option>
                        </select>
                      </label>
                      <label className="text-sm">
                        {t('meterType')}
                        <select
                          className="mt-1 block h-10 rounded-md border px-2"
                          value={meterType}
                          onChange={e => setMeterType(e.target.value)}
                        >
                          <option value="shared">{t('meterShared')}</option>
                          <option value="prepaid">{t('meterPrepaid')}</option>
                          <option value="separate">{t('meterSeparate')}</option>
                        </select>
                      </label>
                      <label className="text-sm">
                        {t('billSplitMethod')}
                        <select
                          className="mt-1 block h-10 rounded-md border px-2"
                          value={billSplitMethod}
                          onChange={e => setBillSplitMethod(e.target.value)}
                        >
                          <option value="equal">{t('splitEqual')}</option>
                          <option value="by_room">{t('splitByRoom')}</option>
                          <option value="by_seat">{t('splitBySeat')}</option>
                          <option value="owner_pays">
                            {t('splitOwnerPays')}
                          </option>
                        </select>
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={hasIps}
                          onChange={e => setHasIps(e.target.checked)}
                        />
                        IPS
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={hasGenerator}
                          onChange={e => setHasGenerator(e.target.checked)}
                        />
                        {t('hasGenerator')}
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={commonAreaBackup}
                          onChange={e => setCommonAreaBackup(e.target.checked)}
                        />
                        {t('commonAreaBackup')}
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={liftBackup}
                          onChange={e => setLiftBackup(e.target.checked)}
                        />
                        {t('liftBackup')}
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={emergencyLight}
                          onChange={e => setEmergencyLight(e.target.checked)}
                        />
                        {t('emergencyLight')}
                      </label>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={showManualUtilities}
                      onChange={e => {
                        const on = e.target.checked
                        setShowManualUtilities(on)
                        if (on && manualPairs.length === 0) {
                          setManualPairs([{ key: '', value: '' }])
                        }
                      }}
                    />
                    {t('manualEntry')}
                  </label>
                  {showManualUtilities ? (
                    <div className="space-y-3 rounded-lg border border-dashed p-3">
                      <p className="text-xs text-muted-foreground">
                        {t('manualEntryHint')}
                      </p>
                      <div className="space-y-2">
                        {manualPairs.map((pair, index) => (
                          <div
                            key={`manual-${index}`}
                            className="flex flex-wrap items-center gap-2"
                          >
                            <Input
                              className="min-w-[8rem] flex-1"
                              value={pair.key}
                              onChange={e => {
                                const next = [...manualPairs]
                                next[index] = {
                                  ...next[index],
                                  key: e.target.value,
                                }
                                setManualPairs(next)
                              }}
                              placeholder={t('manualKeyPlaceholder')}
                            />
                            <Input
                              className="min-w-[8rem] flex-1"
                              value={pair.value}
                              onChange={e => {
                                const next = [...manualPairs]
                                next[index] = {
                                  ...next[index],
                                  value: e.target.value,
                                }
                                setManualPairs(next)
                              }}
                              placeholder={t('manualValuePlaceholder')}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const next = manualPairs.filter(
                                  (_, i) => i !== index
                                )
                                setManualPairs(
                                  next.length ? next : [{ key: '', value: '' }]
                                )
                              }}
                            >
                              {t('manualRemove')}
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setManualPairs(prev => [
                            ...prev,
                            { key: '', value: '' },
                          ])
                        }
                      >
                        {t('manualAddRow')}
                      </Button>
                    </div>
                  ) : null}

                  <Button onClick={handleSaveUtilities}>
                    {t('saveUtilities')}
                  </Button>
                  {mess.utilities ? (
                    <p className="text-sm text-muted-foreground">
                      {t('scoresPreview', {
                        water: mess.utilities.water.score,
                        power: mess.utilities.electricity.score,
                      })}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>
          ) : null}
        </Tabs>
      </div>
    </Layout>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}
