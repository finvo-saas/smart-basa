'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Clock, Edit } from 'lucide-react'
import type { AttendanceRecord } from '@/types/attendance'
import { format } from 'date-fns'

interface AttendanceTableProps {
  records: AttendanceRecord[]
  onEdit?: (record: AttendanceRecord) => void
  showStudentName?: boolean
}

const statusConfig = {
  present: {
    label: 'Present',
    className:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400',
  },
  absent: {
    label: 'Absent',
    className:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400',
  },
  late: {
    label: 'Late',
    className:
      'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
  },
  excused: {
    label: 'Excused',
    className:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
  },
  meal_attended: {
    label: 'Meal Attended',
    className:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400',
  },
  meal_absent: {
    label: 'Meal Absent',
    className:
      'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400',
  },
}

export function AttendanceTable({
  records,
  onEdit,
  showStudentName = false,
}: AttendanceTableProps) {
  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="px-3 py-10 text-center sm:py-12">
          <p className="text-sm text-muted-foreground">
            No attendance records found
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="text-base sm:text-lg">
          Attendance Records
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3 pt-0 sm:p-6 sm:pt-0">
        {/* Mobile cards */}
        <div className="space-y-2 md:hidden">
          {records.map(record => {
            const status = statusConfig[record.status]
            return (
              <div
                key={record.id}
                className="rounded-lg border p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    {showStudentName && (
                      <p className="truncate font-medium">{record.studentName}</p>
                    )}
                    <p className="text-muted-foreground">
                      {format(new Date(record.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  {showStudentName && onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => onEdit(record)}
                      aria-label="Edit record"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className={status.className}>
                    {status.label}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {record.type === 'general'
                      ? 'General'
                      : record.type === 'meal'
                        ? 'Meal'
                        : 'Both'}
                  </Badge>
                  {record.mealCategory && (
                    <span className="text-xs capitalize text-muted-foreground">
                      ({record.mealCategory})
                    </span>
                  )}
                </div>
                {(record.checkInTime || record.checkOutTime) && (
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {record.checkInTime && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        In {format(new Date(record.checkInTime), 'HH:mm')}
                      </span>
                    )}
                    {record.checkOutTime && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Out {format(new Date(record.checkOutTime), 'HH:mm')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-md border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                {showStudentName && <TableHead>Student</TableHead>}
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                {showStudentName && onEdit && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map(record => {
                const status = statusConfig[record.status]

                return (
                  <TableRow key={record.id}>
                    {showStudentName && (
                      <TableCell className="font-medium">
                        {record.studentName}
                      </TableCell>
                    )}
                    <TableCell>
                      {format(new Date(record.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {record.type === 'general'
                          ? 'General'
                          : record.type === 'meal'
                            ? 'Meal'
                            : 'Both'}
                      </Badge>
                      {record.mealCategory && (
                        <span className="ml-2 text-xs capitalize text-muted-foreground">
                          ({record.mealCategory})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.checkInTime ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {format(new Date(record.checkInTime), 'HH:mm')}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.checkOutTime ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {format(new Date(record.checkOutTime), 'HH:mm')}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    {showStudentName && onEdit && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(record)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
