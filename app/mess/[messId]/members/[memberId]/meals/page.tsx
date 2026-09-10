'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Printer,
  UtensilsCrossed,
} from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MessSubpageBackButton } from '@/components/mess/MessSubpageBackButton'
import { fetchMemberMonthMeals } from '@/lib/api/mess'
import {
  downloadMealSheetHtml,
  downloadMealSheetPdf,
  printMealSheet,
} from '@/lib/download/mealSheet'
import { useAppFormat } from '@/hooks/useAppFormat'
import { getStoredRole } from '@/utils/auth'
import { toast } from '@/lib/feedback/toast'
import type { MemberMealSheet } from '@/types/mess'

/** Meal counts read better as dashes than zeros on a month-long grid. */
function MealCell({ value }: { value: number }) {
  if (!value) return <span className="text-muted-foreground">—</span>
  return <span>{Number(value.toFixed(2))}</span>
}

function SummaryTile({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function CostRow({
  label,
  value,
  emphasis,
}: {
  label: string
  value: string
  emphasis?: 'due' | 'credit'
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-sm font-semibold ${
          emphasis === 'due'
            ? 'text-destructive'
            : emphasis === 'credit'
              ? 'text-emerald-600'
              : ''
        }`}
      >
        {value}
      </span>
    </div>
  )
}

export default function MemberMealSheetPage() {
  const t = useTranslations('mess')
  const tm = useTranslations('mess.mealSheet')
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = getStoredRole()
  const messId = params.messId as string
  const memberId = params.memberId as string
  const { formatCurrency, formatNumber } = useAppFormat()

  const today = new Date()
  // Links from the হিসাব month table carry the month the owner was looking at.
  const [year, setYear] = useState(
    Number(searchParams.get('year')) || today.getFullYear()
  )
  const [month, setMonth] = useState(() => {
    const requested = Number(searchParams.get('month'))
    return requested >= 1 && requested <= 12 ? requested : today.getMonth() + 1
  })
  const [sheet, setSheet] = useState<MemberMealSheet | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (role !== 'owner') {
      router.replace('/dashboard')
    }
  }, [role, router])

  const load = useCallback(async () => {
    setLoading(true)
    const result = await fetchMemberMonthMeals(messId, memberId, year, month)
    setLoading(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setSheet(result.data)
  }, [messId, memberId, year, month])

  useEffect(() => {
    void load()
  }, [load])

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month - 1 + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth() + 1)
  }

  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth() + 1

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })

  if (!sheet) {
    return (
      <Layout userRole="owner">
        <div className="container mx-auto max-w-5xl px-4 py-6">
          <MessSubpageBackButton
            fallbackHref={`/mess/${messId}/members/${memberId}`}
          />
          <p className="text-center">{loading ? t('loading') : tm('notFound')}</p>
        </div>
      </Layout>
    )
  }

  const { member, totals, costs, days } = sheet
  const hasMeals = totals.memberMeals > 0 || totals.guestMeals > 0

  return (
    <Layout userRole="owner">
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <MessSubpageBackButton
          fallbackHref={`/mess/${messId}/members/${memberId}`}
        />

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">{tm('title')}</h1>
            <p className="text-sm text-muted-foreground">
              {member.name}
              {member.seatNumber ? ` · ${member.seatNumber}` : ''} ·{' '}
              {sheet.messName}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => printMealSheet(sheet)}
            >
              <Printer className="mr-2 h-4 w-4" />
              {tm('print')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  {tm('download')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => downloadMealSheetPdf(sheet)}>
                  <Download className="mr-2 h-4 w-4" />
                  {tm('downloadPdf')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadMealSheetHtml(sheet)}>
                  <FileText className="mr-2 h-4 w-4" />
                  {tm('downloadHtml')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Card className="mb-4">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => shiftMonth(-1)}
                aria-label={tm('prevMonth')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-base">{monthLabel}</CardTitle>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => shiftMonth(1)}
                disabled={isCurrentMonth}
                aria-label={tm('nextMonth')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Badge variant="outline">
              {sheet.status === 'closed' ? tm('monthClosed') : tm('monthOpen')}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-4">
              <SummaryTile
                label={tm('totalMeals')}
                value={formatNumber(totals.memberMeals)}
                hint={`${formatNumber(totals.breakfast)} / ${formatNumber(
                  totals.lunch
                )} / ${formatNumber(totals.dinner)}`}
              />
              <SummaryTile
                label={tm('daysWithMeals')}
                value={`${formatNumber(totals.daysWithMeals)} / ${formatNumber(
                  totals.daysInMonth
                )}`}
              />
              <SummaryTile
                label={tm('guestMeals')}
                value={formatNumber(totals.guestMeals)}
              />
              <SummaryTile
                label={tm('mealRate')}
                value={formatCurrency(costs.mealRate)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">{tm('dayByDay')}</CardTitle>
          </CardHeader>
          <CardContent>
            {hasMeals ? null : (
              <div className="mb-4 flex flex-col gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-start gap-2">
                  <UtensilsCrossed className="mt-0.5 h-4 w-4 shrink-0" />
                  {tm('noMeals')}
                </span>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/mess/${messId}/hisab`}>{tm('markMeals')}</Link>
                </Button>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">{tm('columns.date')}</TableHead>
                  <TableHead className="text-center">
                    {tm('columns.breakfast')}
                  </TableHead>
                  <TableHead className="text-center">
                    {tm('columns.lunch')}
                  </TableHead>
                  <TableHead className="text-center">
                    {tm('columns.dinner')}
                  </TableHead>
                  <TableHead className="text-center">
                    {tm('columns.guest')}
                  </TableHead>
                  <TableHead className="text-center">
                    {tm('columns.total')}
                  </TableHead>
                  <TableHead>{tm('columns.notes')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {days.map(day => (
                  <TableRow
                    key={day.date}
                    className={day.memberTotal || day.guestTotal ? '' : 'opacity-60'}
                  >
                    <TableCell className="whitespace-nowrap font-medium">
                      {day.day}{' '}
                      <span className="text-xs font-normal text-muted-foreground">
                        {day.weekday}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <MealCell value={day.breakfast} />
                    </TableCell>
                    <TableCell className="text-center">
                      <MealCell value={day.lunch} />
                    </TableCell>
                    <TableCell className="text-center">
                      <MealCell value={day.dinner} />
                    </TableCell>
                    <TableCell className="text-center">
                      <MealCell value={day.guestTotal} />
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      <MealCell value={day.memberTotal} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {day.notes}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 font-semibold hover:bg-transparent">
                  <TableCell>{tm('columns.total')}</TableCell>
                  <TableCell className="text-center">
                    <MealCell value={totals.breakfast} />
                  </TableCell>
                  <TableCell className="text-center">
                    <MealCell value={totals.lunch} />
                  </TableCell>
                  <TableCell className="text-center">
                    <MealCell value={totals.dinner} />
                  </TableCell>
                  <TableCell className="text-center">
                    <MealCell value={totals.guestMeals} />
                  </TableCell>
                  <TableCell className="text-center">
                    <MealCell value={totals.memberMeals} />
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tm('costs')}</CardTitle>
          </CardHeader>
          <CardContent>
            <CostRow
              label={tm('mealCost', {
                meals: formatNumber(totals.memberMeals),
                rate: formatCurrency(costs.mealRate),
              })}
              value={formatCurrency(costs.mealCost)}
            />
            <CostRow
              label={tm('guestCost', { count: formatNumber(totals.guestMeals) })}
              value={formatCurrency(costs.guestCost)}
            />
            <CostRow
              label={tm('fixedShare')}
              value={formatCurrency(costs.fixedShare)}
            />
            <CostRow
              label={tm('deposits')}
              value={`− ${formatCurrency(costs.deposits)}`}
            />
            <CostRow
              label={costs.due > 0 ? tm('due') : tm('credit')}
              value={formatCurrency(costs.due > 0 ? costs.due : costs.credit)}
              emphasis={costs.due > 0 ? 'due' : 'credit'}
            />
            <p className="mt-3 text-xs text-muted-foreground">{tm('rateNote')}</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
