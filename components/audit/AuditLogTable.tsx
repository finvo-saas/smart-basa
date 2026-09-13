'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'
import type { AuditLog } from '@/types/audit'

interface AuditLogTableProps {
  logs: AuditLog[]
  onViewDetails?: (log: AuditLog) => void
  onRollback?: (log: AuditLog) => void
  showRollback?: boolean
}

const actionColors: Record<string, string> = {
  create:
    'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400',
  update:
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
  delete:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400',
  approve:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400',
  reject:
    'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400',
  verify:
    'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400',
  unverify:
    'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400',
  payment:
    'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400',
  rollback:
    'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
}

const roleColors: Record<string, string> = {
  admin:
    'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400',
  owner:
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
  renter:
    'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400',
}

export function AuditLogTable({
  logs,
  onViewDetails,
  onRollback,
  showRollback = true,
}: AuditLogTableProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No audit logs found</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>User</TableHead>
            <TableHead className="hidden md:table-cell">Changes</TableHead>
            <TableHead className="hidden lg:table-cell">Timestamp</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map(log => (
            <TableRow key={log.id}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge
                    variant="outline"
                    className={`text-xs ${actionColors[log.action] || 'bg-gray-50 text-gray-700 border-gray-200'}`}
                  >
                    {log.action}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {log.entityType}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-[200px]">
                  <p className="font-medium text-sm truncate">
                    {log.entityName}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{log.userName}</p>
                  <Badge
                    variant="outline"
                    className={`text-xs w-fit ${roleColors[log.userRole] || ''}`}
                  >
                    {log.userRole}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {log.changes && log.changes.length > 0 ? (
                  <div className="space-y-1 max-w-[300px]">
                    {log.changes.slice(0, 2).map((change, idx) => (
                      <div key={idx} className="text-xs">
                        <span className="font-medium">{change.field}:</span>{' '}
                        <span className="line-through text-red-600 dark:text-red-400">
                          {String(change.oldValue || 'N/A').substring(0, 20)}
                        </span>{' '}
                        →{' '}
                        <span className="text-green-600 dark:text-green-400">
                          {String(change.newValue || 'N/A').substring(0, 20)}
                        </span>
                      </div>
                    ))}
                    {log.changes.length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        +{log.changes.length - 2} more
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No changes
                  </span>
                )}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="text-xs text-muted-foreground">
                  <p>{format(new Date(log.timestamp), 'MMM dd, yyyy')}</p>
                  <p>{format(new Date(log.timestamp), 'HH:mm:ss')}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  {onViewDetails && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(log)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {showRollback && log.canRollback && onRollback && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRollback(log)}
                      className="h-8 w-8 p-0"
                      title="Rollback"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
