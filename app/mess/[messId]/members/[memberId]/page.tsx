'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import {
  AlertTriangle,
  BedDouble,
  CalendarCheck,
  ClipboardList,
  MessageSquare,
  Pencil,
  Phone,
  Trash2,
  UserCheck,
  UserMinus,
  UserRound,
  UtensilsCrossed,
} from 'lucide-react'
import { WhatsAppButton } from '@/components/contact/WhatsAppButton'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessSubpageBackButton } from '@/components/mess/MessSubpageBackButton'
import { MemberAvatar } from '@/components/mess/MemberAvatar'
import { MemberFormDialog } from '@/components/mess/MemberFormDialog'
import {
  fetchMessById,
  fetchMessMember,
  removeMessMember,
  updateMessMember,
  type MessMemberInput,
} from '@/lib/api/mess'
import { useMockQuery } from '@/hooks/useMockQuery'
import { useAppFormat } from '@/hooks/useAppFormat'
import { getStoredRole } from '@/utils/auth'
import { useConfirm } from '@/components/feedback'
import { toast } from '@/lib/feedback/toast'
import type { MessMemberDetail } from '@/types/mess'

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5 border-b py-2 last:border-b-0 sm:flex-row sm:justify-between sm:gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium sm:text-right">{value}</span>
    </div>
  )
}

export default function MessMemberDetailPage() {
  const t = useTranslations('mess')
  const tm = useTranslations('mess.members')
  const tContact = useTranslations('contact')
  const params = useParams()
  const router = useRouter()
  const role = getStoredRole()
  const messId = params.messId as string
  const memberId = params.memberId as string
  const { confirm } = useConfirm()
  const { formatCurrency, formatNumber } = useAppFormat()

  const loadMess = useCallback(() => fetchMessById(messId), [messId])
  const { data: mess } = useMockQuery(loadMess)

  const [detail, setDetail] = useState<MessMemberDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)

  const refresh = useCallback(async () => {
    const result = await fetchMessMember(messId, memberId)
    setLoading(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setDetail(result.data)
  }, [messId, memberId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (role !== 'owner') {
      router.replace('/dashboard')
    }
  }, [role, router])

  const member = detail?.member

  const handleSave = async (input: MessMemberInput) => {
    const result = await updateMessMember(messId, memberId, input)
    if (!result.ok) {
      toast.error(result.error)
      return false
    }
    toast.success(tm('toast.updated', { name: result.data.name }))
    await refresh()
    return true
  }

  const handleVacateSeat = async () => {
    if (!member) return
    const confirmed = await confirm({
      title: tm('confirm.vacateTitle', { name: member.name }),
      description: tm('confirm.vacateDesc'),
    })
    if (!confirmed) return
    const result = await updateMessMember(messId, memberId, { vacateSeat: true })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(tm('toast.vacated', { name: member.name }))
    await refresh()
  }

  const handleToggleActive = async () => {
    if (!member) return
    const reactivating = member.isActive === false
    if (!reactivating) {
      const confirmed = await confirm({
        title: tm('confirm.markLeftTitle', { name: member.name }),
        description: tm('confirm.markLeftDesc'),
      })
      if (!confirmed) return
    }
    const result = await updateMessMember(messId, memberId, {
      isActive: reactivating,
    })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(
      reactivating
        ? tm('toast.reactivated', { name: member.name })
        : tm('toast.left', { name: member.name })
    )
    await refresh()
  }

  const handleRemove = async () => {
    if (!member) return
    const confirmed = await confirm({
      title: tm('confirm.removeTitle', { name: member.name }),
      description: tm('confirm.removeDesc'),
      variant: 'destructive',
    })
    if (!confirmed) return
    const result = await removeMessMember(messId, memberId)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(tm('toast.removed', { name: member.name }))
    router.push(`/mess/${messId}/members`)
  }

  if (!member) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <p className="text-center">
            {loading ? t('loading') : tm('detail.notFound')}
          </p>
        </div>
      </Layout>
    )
  }

  const attendance = detail?.attendance
  const hisabRow = detail?.hisab.row ?? null

  return (
    <Layout userRole="owner">
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <MessSubpageBackButton fallbackHref={`/mess/${messId}/members`} />

        <Card className="mb-6">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <MemberAvatar
                name={member.name}
                photoUrl={member.photoUrl}
                className="h-16 w-16"
              />
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold">{member.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {mess?.name}
                  {member.seatNumber
                    ? ` · ${tm('columns.seat')} ${member.seatNumber}`
                    : ''}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="outline">
                    {tm(`type.${member.occupantType}`)}
                  </Badge>
                  <Badge variant="outline">
                    {formatCurrency(member.monthlyFee)} / {tm('detail.month')}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      member.isActive === false
                        ? 'border-muted text-muted-foreground'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                    }
                  >
                    {member.isActive === false
                      ? tm('filters.former')
                      : tm('filters.current')}
                  </Badge>
                  {!member.userId && (
                    <Badge variant="outline" className="text-muted-foreground">
                      {tm('detail.noAccount')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                {tm('actions.edit')}
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={`tel:${member.phone}`}>
                  <Phone className="mr-1.5 h-3.5 w-3.5" />
                  {tm('actions.call')}
                </a>
              </Button>
              <WhatsAppButton
                size="sm"
                number={member.whatsappNumber}
                message={tContact('messageRenter')}
              />
              <Button size="sm" variant="outline" asChild>
                <Link href={`/mess/${messId}/members/${memberId}/meals`}>
                  <UtensilsCrossed className="mr-1.5 h-3.5 w-3.5" />
                  {tm('actions.mealSheet')}
                </Link>
              </Button>
              {member.seatNumber && (
                <Button size="sm" variant="outline" onClick={handleVacateSeat}>
                  <BedDouble className="mr-1.5 h-3.5 w-3.5" />
                  {tm('actions.vacate')}
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleToggleActive}>
                {member.isActive === false ? (
                  <>
                    <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                    {tm('actions.reactivate')}
                  </>
                ) : (
                  <>
                    <UserMinus className="mr-1.5 h-3.5 w-3.5" />
                    {tm('actions.markLeft')}
                  </>
                )}
              </Button>
              <Button size="sm" variant="outline" onClick={handleRemove}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5 text-destructive" />
                {tm('actions.remove')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 [&>button]:whitespace-normal [&>button]:px-2 sm:grid-cols-4 sm:[&>button]:px-3">
            <TabsTrigger value="profile">
              <UserRound className="mr-2 h-4 w-4 shrink-0" />
              {tm('detail.tabs.profile')}
            </TabsTrigger>
            <TabsTrigger value="attendance">
              <CalendarCheck className="mr-2 h-4 w-4 shrink-0" />
              {tm('detail.tabs.attendance')}
            </TabsTrigger>
            <TabsTrigger value="dues">
              <ClipboardList className="mr-2 h-4 w-4 shrink-0" />
              {tm('detail.tabs.dues')}
            </TabsTrigger>
            <TabsTrigger value="violations">
              <AlertTriangle className="mr-2 h-4 w-4 shrink-0" />
              {tm('detail.tabs.violations')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {tm('detail.contact')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <InfoRow label={tm('form.phone')} value={member.phone} />
                  <InfoRow
                    label={tContact('whatsappNumber')}
                    value={member.whatsappNumber}
                  />
                  <InfoRow label={tm('form.email')} value={member.email} />
                  <InfoRow
                    label={tm('form.emergencyName')}
                    value={member.emergencyContactName}
                  />
                  <InfoRow
                    label={tm('form.emergencyPhone')}
                    value={member.emergencyContactPhone}
                  />
                  <InfoRow
                    label={tm('form.permanentAddress')}
                    value={member.permanentAddress}
                  />
                  <InfoRow label={tm('form.nid')} value={member.nidNumber} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {tm('detail.stay')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <InfoRow
                    label={tm('form.type')}
                    value={tm(`type.${member.occupantType}`)}
                  />
                  <InfoRow
                    label={tm('form.studentId')}
                    value={member.studentId}
                  />
                  <InfoRow
                    label={tm('form.university')}
                    value={member.university}
                  />
                  <InfoRow
                    label={tm('form.organization')}
                    value={member.organization}
                  />
                  <InfoRow
                    label={tm('form.designation')}
                    value={member.designation}
                  />
                  <InfoRow
                    label={tm('columns.seat')}
                    value={
                      member.seatNumber
                        ? `${member.seatNumber}${member.roomNumber ? ` · ${member.roomNumber}` : ''}`
                        : tm('noSeat')
                    }
                  />
                  <InfoRow
                    label={tm('form.joinedDate')}
                    value={format(new Date(member.joinedDate), 'dd MMM yyyy')}
                  />
                  <InfoRow
                    label={tm('detail.leftDate')}
                    value={
                      member.leftDate
                        ? format(new Date(member.leftDate), 'dd MMM yyyy')
                        : ''
                    }
                  />
                  <InfoRow
                    label={tm('form.monthlyFee')}
                    value={formatCurrency(member.monthlyFee)}
                  />
                </CardContent>
              </Card>

              {member.notes && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {tm('form.notes')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="whitespace-pre-line text-sm text-muted-foreground">
                      {member.notes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-base">
                  {tm('detail.thisMonth')}
                </CardTitle>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/mess/${messId}/attendance`}>
                    {tm('actions.attendance')}
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-4">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">
                      {tm('detail.present')}
                    </p>
                    <p className="text-xl font-bold">
                      {formatNumber(attendance?.presentDays ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">
                      {tm('detail.absent')}
                    </p>
                    <p className="text-xl font-bold">
                      {formatNumber(attendance?.absentDays ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">
                      {tm('detail.mealAttended')}
                    </p>
                    <p className="text-xl font-bold">
                      {formatNumber(attendance?.mealAttended ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">
                      {tm('detail.mealRate')}
                    </p>
                    <p className="text-xl font-bold">
                      {attendance?.mealAttendanceRate ?? 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dues" className="space-y-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-base">
                  {tm('detail.hisabThisMonth')}
                </CardTitle>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/mess/${messId}/hisab`}>
                    {tm('actions.hisab')}
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {hisabRow ? (
                  <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-4">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">
                        {tm('detail.meals')}
                      </p>
                      <p className="text-xl font-bold">
                        {formatNumber(hisabRow.mealCount)}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">
                        {tm('detail.total')}
                      </p>
                      <p className="text-xl font-bold">
                        {formatCurrency(hisabRow.total)}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">
                        {tm('detail.deposits')}
                      </p>
                      <p className="text-xl font-bold">
                        {formatCurrency(hisabRow.deposits)}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">
                        {hisabRow.due > 0 ? tm('detail.due') : tm('detail.credit')}
                      </p>
                      <p
                        className={`text-xl font-bold ${
                          hisabRow.due > 0 ? 'text-destructive' : 'text-emerald-600'
                        }`}
                      >
                        {formatCurrency(
                          hisabRow.due > 0 ? hisabRow.due : hisabRow.credit
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {tm('detail.noHisab')}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {tm('detail.recentDeposits')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {detail?.deposits.length ? (
                  <div className="space-y-2">
                    {detail.deposits.map(deposit => (
                      <div
                        key={deposit.id}
                        className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {formatCurrency(deposit.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(deposit.date), 'dd MMM yyyy')}
                            {deposit.note ? ` · ${deposit.note}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {tm('detail.noDeposits')}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="violations">
            <Card>
              <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-base">
                  {tm('detail.tabs.violations')}
                </CardTitle>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/mess/${messId}/rules`}>
                    {tm('detail.openRules')}
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {detail?.violations.length ? (
                  <div className="space-y-3">
                    {detail.violations.map(violation => (
                      <div
                        key={violation.id}
                        className="rounded-lg border p-3 text-sm"
                      >
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="font-medium">
                            {violation.ruleTitle}
                          </span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {violation.severity}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {violation.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(
                              new Date(violation.violationDate),
                              'dd MMM yyyy'
                            )}
                          </span>
                        </div>
                        <p className="text-muted-foreground">
                          {violation.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {tm('detail.noViolations')}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/mess/${messId}/sms`}>
              <MessageSquare className="mr-2 h-4 w-4" />
              {tm('actions.sms')}
            </Link>
          </Button>
        </div>

        <MemberFormDialog
          mess={mess ?? null}
          member={member}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSubmit={handleSave}
        />
      </div>
    </Layout>
  )
}
