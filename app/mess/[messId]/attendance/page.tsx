'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AttendanceCalendar } from '@/components/attendance/AttendanceCalendar'
import { AttendanceTable } from '@/components/attendance/AttendanceTable'
import { AttendanceSummaryCard } from '@/components/attendance/AttendanceSummaryCard'
import { MarkAttendanceDialog } from '@/components/attendance/MarkAttendanceDialog'
import { AttendanceReportDialog } from '@/components/attendance/AttendanceReportDialog'
import {
  getAttendanceByMess,
  getAttendanceByDate,
  getAttendanceSummary,
  bulkMarkAttendance,
  generateAttendanceReport,
} from '@/lib/api/messDomain'
import { fetchMessById, fetchMessStudents } from '@/lib/api/mess'
import { getCurrentAccountUserId } from '@/lib/api/account'
import { useMockQuery } from '@/hooks/useMockQuery'
import { getStoredRole } from '@/utils/auth'
import { Plus, Calendar, FileText, Users } from 'lucide-react'
import { MessSubpageBackButton } from '@/components/mess/MessSubpageBackButton'
import type {
  AttendanceRecord,
  AttendanceSummary,
  AttendanceReport,
} from '@/types/attendance'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { toast } from '@/lib/feedback/toast'

export default function AttendanceManagementPage() {
  const t = useTranslations('mess')
  const params = useParams()
  const router = useRouter()
  const role = getStoredRole()
  const messId = params.messId as string
  const ownerId = getCurrentAccountUserId()

  const loadMess = useCallback(() => fetchMessById(messId), [messId])
  const { data: mess } = useMockQuery(loadMess)

  const loadStudents = useCallback(() => fetchMessStudents(messId), [messId])
  const { data: allStudents } = useMockQuery(loadStudents)
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  )
  const [selectedStudent, setSelectedStudent] = useState<string>('all')
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(
    []
  )
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([])
  const [studentSummaries, setStudentSummaries] = useState<AttendanceSummary[]>(
    []
  )
  const [isMarkDialogOpen, setIsMarkDialogOpen] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(
    null
  )

  const messStudents = useMemo(
    () => (allStudents ?? []).filter(s => s.seatNumber),
    [allStudents]
  )

  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd')

  useEffect(() => {
    void getAttendanceByMess(messId).then(setAttendanceRecords)
  }, [messId])

  useEffect(() => {
    void getAttendanceByDate(messId, selectedDate).then(setTodayRecords)
  }, [messId, selectedDate])

  useEffect(() => {
    if (messStudents.length === 0) {
      setStudentSummaries([])
      return
    }
    void Promise.all(
      messStudents.map(student =>
        getAttendanceSummary(student.id, messId, monthStart, monthEnd)
      )
    ).then(setStudentSummaries)
  }, [messStudents, messId, monthStart, monthEnd])

  useEffect(() => {
    if (role !== 'owner') {
      router.replace('/dashboard')
    }
  }, [role, router])

  const filteredRecords = useMemo(() => {
    let records = attendanceRecords

    if (selectedStudent !== 'all') {
      records = records.filter(r => r.studentId === selectedStudent)
    }

    return records
  }, [attendanceRecords, selectedStudent])

  const handleMarkAttendance = async (data: {
    studentIds: string[]
    date: string
    status: AttendanceRecord['status']
    mealStatus: AttendanceRecord['status']
    type: AttendanceRecord['type']
    checkInTime?: string
    checkOutTime?: string
    mealCategory?: AttendanceRecord['mealCategory']
    notes?: string
  }) => {
    const toIso = (time?: string) =>
      time ? new Date(`${data.date}T${time}`).toISOString() : undefined

    const records = data.studentIds.flatMap(studentId => {
      const base = {
        studentId,
        studentName:
          messStudents.find(s => s.id === studentId)?.name || 'Unknown',
        date: data.date,
        notes: data.notes,
        markedBy: ownerId,
      }
      const rows: Omit<AttendanceRecord, 'id' | 'markedAt' | 'messId'>[] = []
      if (data.type !== 'meal') {
        rows.push({
          ...base,
          status: data.status,
          type: 'general',
          checkInTime: toIso(data.checkInTime),
          checkOutTime: toIso(data.checkOutTime),
        })
      }
      if (data.type !== 'general') {
        rows.push({
          ...base,
          status: data.mealStatus,
          type: 'meal',
          mealCategory: data.mealCategory,
        })
      }
      return rows
    })

    const result = await bulkMarkAttendance(messId, records)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(t('attendance.marked', { count: data.studentIds.length }))
    setAttendanceRecords(await getAttendanceByMess(messId))
    setTodayRecords(await getAttendanceByDate(messId, selectedDate))
  }

  const handleGenerateReport = async (data: {
    reportType: AttendanceReport['reportType']
    startDate: string
    endDate: string
  }) => {
    const report = await generateAttendanceReport(
      messId,
      data.startDate,
      data.endDate,
      data.reportType
    )
    if (report) {
      toast.success(
        t('attendance.reportGenerated', { fileName: report.fileName ?? '' })
      )
    }
  }

  const handleDateClick = (date: string) => {
    setSelectedDate(date)
    setIsMarkDialogOpen(true)
  }

  if (role !== 'owner') {
    return null
  }

  if (!mess) {
    return (
      <Layout>
        <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-6">
          <p className="text-center text-sm">{t('notFound')}</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout userRole="owner">
      <div className="mx-auto w-full min-w-0 max-w-7xl px-3 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <MessSubpageBackButton fallbackHref="/mess" />
            <h1 className="mb-1 text-balance text-xl font-bold sm:mb-2 sm:text-2xl">
              {t('attendance.managementTitle')}
            </h1>
            <p className="truncate text-sm text-muted-foreground sm:text-base">
              {mess.name}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 min-[360px]:flex-row sm:w-auto">
            <Button
              variant="outline"
              className="w-full min-w-0 sm:w-auto"
              onClick={() => setIsReportDialogOpen(true)}
            >
              <FileText className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">{t('attendance.generateReport')}</span>
            </Button>
            <Button
              className="w-full min-w-0 sm:w-auto"
              onClick={() => setIsMarkDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">{t('attendance.markAttendance')}</span>
            </Button>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 md:mb-6 md:grid-cols-4 md:gap-4">
          <Card className="overflow-hidden">
            <CardHeader className="space-y-0 p-3 pb-1 sm:p-6 sm:pb-2">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Users className="h-4 w-4 shrink-0 text-blue-600 sm:h-5 sm:w-5" />
                <span className="min-w-0 leading-snug">
                  {t('attendance.totalStudents')}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <p className="text-xl font-bold tabular-nums sm:text-2xl">
                {messStudents.length}
              </p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader className="space-y-0 p-3 pb-1 sm:p-6 sm:pb-2">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Calendar className="h-4 w-4 shrink-0 text-green-600 sm:h-5 sm:w-5" />
                <span className="min-w-0 leading-snug">
                  {t('attendance.todayPresent')}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <p className="text-xl font-bold tabular-nums sm:text-2xl">
                {todayRecords.filter(r => r.status === 'present').length}
              </p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader className="space-y-0 p-3 pb-1 sm:p-6 sm:pb-2">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Users className="h-4 w-4 shrink-0 text-red-600 sm:h-5 sm:w-5" />
                <span className="min-w-0 leading-snug">
                  {t('attendance.todayAbsent')}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <p className="text-xl font-bold tabular-nums sm:text-2xl">
                {todayRecords.filter(r => r.status === 'absent').length}
              </p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader className="space-y-0 p-3 pb-1 sm:p-6 sm:pb-2">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <FileText className="h-4 w-4 shrink-0 text-purple-600 sm:h-5 sm:w-5" />
                <span className="min-w-0 leading-snug">
                  {t('attendance.totalRecords')}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <p className="text-xl font-bold tabular-nums sm:text-2xl">
                {attendanceRecords.length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="calendar" className="space-y-4 sm:space-y-6">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <TabsList className="h-auto w-full justify-start sm:w-auto">
              <TabsTrigger value="calendar" className="flex-1 px-2 text-xs sm:flex-none sm:px-3 sm:text-sm">
                {t('attendance.tabs.calendar')}
              </TabsTrigger>
              <TabsTrigger value="records" className="flex-1 px-2 text-xs sm:flex-none sm:px-3 sm:text-sm">
                {t('attendance.tabs.records')}
              </TabsTrigger>
              <TabsTrigger value="summaries" className="flex-1 px-2 text-xs sm:flex-none sm:px-3 sm:text-sm">
                {t('attendance.tabs.summaries')}
              </TabsTrigger>
            </TabsList>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-full min-w-0 sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('attendance.allStudents')}
                </SelectItem>
                {messStudents.map(student => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="calendar" className="min-w-0 space-y-4">
            <AttendanceCalendar
              records={filteredRecords}
              onDateClick={handleDateClick}
              studentId={
                selectedStudent !== 'all' ? selectedStudent : undefined
              }
            />
          </TabsContent>

          <TabsContent value="records" className="min-w-0 space-y-4">
            <AttendanceTable
              records={filteredRecords}
              onEdit={record => {
                setEditingRecord(record)
                setSelectedDate(record.date)
                setIsMarkDialogOpen(true)
              }}
              showStudentName={selectedStudent === 'all'}
            />
          </TabsContent>

          <TabsContent value="summaries" className="min-w-0 space-y-4">
            {studentSummaries.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
                {studentSummaries.map(summary => (
                  <AttendanceSummaryCard
                    key={summary.studentId}
                    summary={summary}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="px-3 py-10 text-center sm:py-12">
                  <p className="text-sm text-muted-foreground">
                    {t('attendance.emptySummaries')}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <MarkAttendanceDialog
          messId={messId}
          date={selectedDate}
          open={isMarkDialogOpen}
          onOpenChange={open => {
            setIsMarkDialogOpen(open)
            if (!open) {
              setEditingRecord(null)
              setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
            }
          }}
          onSubmit={handleMarkAttendance}
        />
        <AttendanceReportDialog
          open={isReportDialogOpen}
          onOpenChange={setIsReportDialogOpen}
          onSubmit={handleGenerateReport}
        />
      </div>
    </Layout>
  )
}
