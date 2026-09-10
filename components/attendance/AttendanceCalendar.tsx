'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react'
import type { AttendanceRecord } from '@/types/attendance'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns'

interface AttendanceCalendarProps {
  records: AttendanceRecord[]
  onDateClick?: (date: string) => void
  studentId?: string
}

const statusColors = {
  present: 'bg-green-500',
  absent: 'bg-red-500',
  late: 'bg-yellow-500',
  excused: 'bg-blue-500',
  meal_attended: 'bg-green-600',
  meal_absent: 'bg-orange-500',
}

export function AttendanceCalendar({
  records,
  onDateClick,
  studentId,
}: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const monthRecords = useMemo(() => {
    const monthStr = format(currentMonth, 'yyyy-MM')
    return records.filter(r => r.date.startsWith(monthStr))
  }, [records, currentMonth])

  const recordsByDate = useMemo(() => {
    const grouped: Record<string, AttendanceRecord[]> = {}
    monthRecords.forEach(record => {
      if (!studentId || record.studentId === studentId) {
        if (!grouped[record.date]) {
          grouped[record.date] = []
        }
        grouped[record.date].push(record)
      }
    })
    return grouped
  }, [monthRecords, studentId])

  const getStatusForDate = (
    date: string
  ): AttendanceRecord['status'] | null => {
    const dayRecords = recordsByDate[date]
    if (!dayRecords || dayRecords.length === 0) return null

    if (dayRecords.some(r => r.status === 'present')) return 'present'
    if (dayRecords.some(r => r.status === 'late')) return 'late'
    if (dayRecords.some(r => r.status === 'excused')) return 'excused'
    if (dayRecords.some(r => r.status === 'absent')) return 'absent'
    return dayRecords[0].status
  }

  const handleDateClick = (date: Date) => {
    if (onDateClick) {
      onDateClick(format(date, 'yyyy-MM-dd'))
    }
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  // Bangladesh week: Sat → Fri
  const firstDayPad = (monthStart.getDay() + 1) % 7
  const weekDays = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  const weekDaysShort = ['S', 'S', 'M', 'T', 'W', 'T', 'F']

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="space-y-3 p-3 sm:p-6">
        <div className="flex min-w-0 flex-col gap-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
          <CardTitle className="flex min-w-0 items-center gap-2 text-base sm:text-lg">
            <CalendarIcon className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            <span className="truncate">Attendance Calendar</span>
          </CardTitle>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9"
              onClick={goToPreviousMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm"
              onClick={goToToday}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9"
              onClick={goToNextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {format(currentMonth, 'MMMM yyyy')}
        </p>
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {weekDays.map((day, i) => (
              <div
                key={day}
                className="p-1 text-center text-[10px] font-semibold text-muted-foreground sm:p-2 sm:text-xs"
              >
                <span className="min-[380px]:hidden">{weekDaysShort[i]}</span>
                <span className="hidden min-[380px]:inline">{day}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {Array.from({ length: firstDayPad }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {daysInMonth.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const status = getStatusForDate(dateStr)
              const isToday = isSameDay(day, new Date())

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  className={`
                    aspect-square min-w-0 rounded-md border p-0.5 text-[10px] transition-all sm:p-1 sm:text-xs
                    ${isToday ? 'border-primary bg-primary/10 font-bold' : 'border-border'}
                    ${status ? 'cursor-pointer hover:bg-muted' : 'opacity-50'}
                    ${onDateClick ? '' : 'cursor-default'}
                  `}
                >
                  <div className="flex h-full flex-col items-center justify-center">
                    <span className={isToday ? 'text-primary' : ''}>
                      {format(day, 'd')}
                    </span>
                    {status && (
                      <div
                        className={`mt-0.5 h-1.5 w-1.5 rounded-full sm:mt-1 sm:h-2 sm:w-2 ${statusColors[status]}`}
                        title={status}
                      />
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-2 border-t pt-3 text-[11px] sm:gap-4 sm:pt-4 sm:text-xs">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500 sm:h-3 sm:w-3" />
              <span>Present</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500 sm:h-3 sm:w-3" />
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500 sm:h-3 sm:w-3" />
              <span>Late</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500 sm:h-3 sm:w-3" />
              <span>Excused</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
