'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Layout } from '@/components/layout/Layout'
import {
  PageContainer,
  PageHeader,
  EmptyState,
  LoadingState,
} from '@/components/page'
import { EnhancedNoticeBoard } from '@/components/notice/EnhancedNoticeBoard'
import { PayBillDialog } from '@/components/payment/PayBillDialog'
import { DownloadBillButton } from '@/components/bill/DownloadBillButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  User,
  Phone,
  Mail,
  GraduationCap,
  Home,
  DollarSign,
  Calendar,
  CreditCard,
  UtensilsCrossed,
  Wallet,
  ScrollText,
} from 'lucide-react'
import {
  acknowledgeMessNotice,
  fetchMessById,
  fetchNoticesByMess,
  fetchOrCreateMessBill,
} from '@/lib/api/mess'
import { getCurrentAccountUserId } from '@/lib/api/account'
import { ok } from '@/lib/api/http'
import { useMessStudentSelf } from '@/hooks/useMessStudentSelf'
import { useMockQuery } from '@/hooks/useMockQuery'
import { useAppFormat } from '@/hooks/useAppFormat'
import { toast } from '@/lib/feedback/toast'
import type { Bill } from '@/types/bill'

export default function StudentDashboardPage() {
  const t = useTranslations('mess')
  const tc = useTranslations('common')
  const { formatDate } = useAppFormat()
  const router = useRouter()
  const tenantId = getCurrentAccountUserId()

  const { student, loading: studentsLoading } = useMessStudentSelf()

  const loadMess = useCallback(
    () =>
      student?.messId
        ? fetchMessById(student.messId)
        : Promise.resolve(ok(undefined)),
    [student?.messId]
  )
  const { data: mess, loading: messLoading } = useMockQuery(loadMess)

  const loadNotices = useCallback(
    () => (mess ? fetchNoticesByMess(mess.id) : Promise.resolve(ok([]))),
    [mess]
  )
  const { data: notices, refetch: refetchNotices } = useMockQuery(loadNotices)

  const [messBill, setMessBill] = useState<Bill | null>(null)
  const [isPayOpen, setIsPayOpen] = useState(false)

  const handleAcknowledge = useCallback(
    (noticeId: string) => {
      void acknowledgeMessNotice(noticeId, tenantId).then(result => {
        if (result.ok) {
          void refetchNotices()
          return
        }
        toast.error(result.error || tc('error'))
      })
    },
    [tenantId, refetchNotices, tc]
  )

  useEffect(() => {
    if (!student || !mess) return
    fetchOrCreateMessBill({
      tenantId,
      tenantName: student.name,
      messId: mess.id,
      messName: mess.name,
      seatNumber: student.seatNumber,
      monthlyFee: student.monthlyFee,
    }).then(result => {
      if (result.ok) setMessBill(result.data)
    })
  }, [student, mess, tenantId])

  const isPaid = messBill?.status === 'paid'

  const dueLabel = useMemo(() => {
    if (!messBill) return '—'
    return formatDate(messBill.dueDate, { style: 'medium' })
  }, [messBill, formatDate])

  if (studentsLoading || messLoading) {
    return (
      <Layout>
        <PageContainer>
          <LoadingState label={t('loading')} />
        </PageContainer>
      </Layout>
    )
  }

  if (!student || !mess) {
    return (
      <Layout>
        <PageContainer>
          <EmptyState
            title={t('studentDashboard.emptyTitle')}
            description={t('studentDashboard.emptyDesc')}
            icon={GraduationCap}
          >
            <Button variant="outline" onClick={() => router.push('/mess')}>
              {t('studentDashboard.backToMess')}
            </Button>
          </EmptyState>
        </PageContainer>
      </Layout>
    )
  }

  const statusLabel =
    isPaid
      ? tc('status.paid')
      : messBill?.status === 'overdue'
        ? messBill.status
        : tc('status.unpaid')

  return (
    <Layout>
      <PageContainer>
        <PageHeader
          title={t('studentDashboard.title')}
          description={t('studentDashboard.headerSubtitle', {
            mess: mess.name,
            seat: student.seatNumber || '—',
          })}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/mess/student-dashboard/menu">
                  <UtensilsCrossed className="mr-2 h-4 w-4" />
                  {t('studentDashboard.tabs.menu')}
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/mess/student-dashboard/attendance">
                  <Calendar className="mr-2 h-4 w-4" />
                  {t('studentDashboard.tabs.attendance')}
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/payments">
                  <Wallet className="mr-2 h-4 w-4" />
                  {t('studentDashboard.payments')}
                </Link>
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t('studentDashboard.studentInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{student.name}</h3>
                    {student.studentId && (
                      <p className="text-sm text-muted-foreground">
                        {t('studentDashboard.studentId', {
                          id: student.studentId,
                        })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t('studentDashboard.phone')}
                      </p>
                      <p className="font-medium">{student.phone}</p>
                    </div>
                  </div>
                  {student.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {t('studentDashboard.email')}
                        </p>
                        <p className="font-medium">{student.email}</p>
                      </div>
                    </div>
                  )}
                  {student.university && (
                    <div className="flex items-center gap-3">
                      <GraduationCap className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {t('studentDashboard.university')}
                        </p>
                        <p className="font-medium">{student.university}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Home className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t('studentDashboard.seatLabel')}
                      </p>
                      <p className="font-medium">
                        {student.seatNumber || t('studentDashboard.notAssigned')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  {t('studentDashboard.messDetails')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative h-40 w-full overflow-hidden rounded-lg bg-muted">
                  {mess.images[0] && (
                    <Image
                      src={mess.images[0]}
                      alt={mess.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 66vw"
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{mess.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {mess.address}, {mess.city}
                  </p>
                </div>
                {mess.facilities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {mess.facilities.map(facility => (
                      <Badge key={facility} variant="outline">
                        {facility}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/mess/${mess.id}/rules`}>
                      <ScrollText className="mr-2 h-4 w-4" />
                      {t('studentDashboard.messRules')}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <EnhancedNoticeBoard
              notices={notices ?? []}
              userId={tenantId}
              onAcknowledge={handleAcknowledge}
              showAcknowledgment
            />
          </div>

          <div className="space-y-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {t('studentDashboard.monthlyFee')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {messBill?.month} {messBill?.year}
                  </p>
                  <p className="mt-1 text-3xl font-bold text-primary">
                    ৳{(messBill?.amount ?? student.monthlyFee).toLocaleString()}
                  </p>
                  <Badge
                    variant="outline"
                    className={
                      isPaid
                        ? 'mt-2 border-emerald-200 bg-emerald-50 text-emerald-800'
                        : messBill?.status === 'overdue'
                          ? 'mt-2 border-red-200 bg-red-50 text-red-800'
                          : 'mt-2 border-amber-200 bg-amber-50 text-amber-900'
                    }
                  >
                    {statusLabel}
                  </Badge>
                </div>

                <div className="space-y-2 rounded-lg border p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t('studentDashboard.dueDate')}
                    </span>
                    <span className="font-medium">{dueLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t('studentDashboard.seatLabel')}
                    </span>
                    <span className="font-medium">
                      {student.seatNumber || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t('studentDashboard.lateFee')}
                    </span>
                    <span className="font-medium">৳200</span>
                  </div>
                </div>

                {!isPaid && messBill ? (
                  <Button
                    className="w-full"
                    onClick={() => setIsPayOpen(true)}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {tc('payNow')}
                  </Button>
                ) : (
                  messBill && (
                    <DownloadBillButton
                      bill={messBill}
                      className="w-full"
                      label={t('studentDashboard.downloadReceipt')}
                    />
                  )
                )}

                <Button variant="outline" className="w-full" asChild>
                  <Link href="/payments">
                    <Wallet className="mr-2 h-4 w-4" />
                    {t('studentDashboard.paymentHistory')}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UtensilsCrossed className="h-5 w-5" />
                  {t('studentDashboard.mealMenu')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  {t('studentDashboard.mealMenuDesc')}
                </p>
                <Button className="w-full" asChild>
                  <Link href="/mess/student-dashboard/menu">
                    {t('studentDashboard.viewMenu')}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-5 w-5" />
                  {t('studentDashboard.tabs.attendance')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  {t('studentDashboard.viewAttendance')}
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/mess/student-dashboard/attendance">
                    {t('studentDashboard.viewAttendance')}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <PayBillDialog
          bill={messBill}
          open={isPayOpen}
          onOpenChange={setIsPayOpen}
          onSuccess={paid => setMessBill(paid)}
        />
      </PageContainer>
    </Layout>
  )
}
