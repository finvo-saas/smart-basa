'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, XCircle, Clock, UtensilsCrossed } from 'lucide-react'
import type { AttendanceSummary } from '@/types/attendance'
import { format } from 'date-fns'

interface AttendanceSummaryCardProps {
  summary: AttendanceSummary
}

export function AttendanceSummaryCard({ summary }: AttendanceSummaryCardProps) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="space-y-1 p-3 sm:p-6">
        <CardTitle className="truncate text-base sm:text-lg">
          {summary.studentName}
        </CardTitle>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {format(new Date(summary.period.startDate), 'MMM dd')} -{' '}
          {format(new Date(summary.period.endDate), 'MMM dd, yyyy')}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 p-3 pt-0 sm:space-y-4 sm:p-6 sm:pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">Attendance Rate</span>
            <span className="shrink-0 font-semibold tabular-nums">
              {summary.attendanceRate.toFixed(1)}%
            </span>
          </div>
          <Progress value={summary.attendanceRate} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="rounded-lg border p-2.5 sm:p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600 sm:h-4 sm:w-4" />
              <span>Present</span>
            </div>
            <p className="text-lg font-bold tabular-nums sm:text-xl">
              {summary.presentDays}
            </p>
          </div>
          <div className="rounded-lg border p-2.5 sm:p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
              <XCircle className="h-3.5 w-3.5 shrink-0 text-red-600 sm:h-4 sm:w-4" />
              <span>Absent</span>
            </div>
            <p className="text-lg font-bold tabular-nums sm:text-xl">
              {summary.absentDays}
            </p>
          </div>
          <div className="rounded-lg border p-2.5 sm:p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
              <Clock className="h-3.5 w-3.5 shrink-0 text-yellow-600 sm:h-4 sm:w-4" />
              <span>Late</span>
            </div>
            <p className="text-lg font-bold tabular-nums sm:text-xl">
              {summary.lateDays}
            </p>
          </div>
          <div className="rounded-lg border p-2.5 sm:p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-blue-600 sm:h-4 sm:w-4" />
              <span>Excused</span>
            </div>
            <p className="text-lg font-bold tabular-nums sm:text-xl">
              {summary.excusedDays}
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-2.5 sm:p-3">
          <div className="mb-2 flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-sm font-medium">Meal Attendance</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">Meal rate</span>
              <span className="shrink-0 font-semibold tabular-nums">
                {summary.mealAttendanceRate.toFixed(1)}%
              </span>
            </div>
            <Progress value={summary.mealAttendanceRate} className="h-2" />
            <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Attended: {summary.mealAttended}</span>
              <span>Absent: {summary.mealAbsent}</span>
            </div>
          </div>
        </div>

        <div className="border-t pt-2 text-center">
          <p className="text-sm text-muted-foreground">Total Days</p>
          <p className="text-xl font-bold tabular-nums sm:text-2xl">
            {summary.totalDays}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
