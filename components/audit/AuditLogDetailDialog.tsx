'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'
import type { AuditLog } from '@/types/audit'

interface AuditLogDetailDialogProps {
  log: AuditLog | null
  open: boolean
  onOpenChange: (open: boolean) => void
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

export function AuditLogDetailDialog({
  log,
  open,
  onOpenChange,
}: AuditLogDetailDialogProps) {
  if (!log) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Audit Log Details
            <Badge
              variant="outline"
              className={
                actionColors[log.action] ||
                'bg-gray-50 text-gray-700 border-gray-200'
              }
            >
              {log.action.toUpperCase()}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Detailed information about this audit log entry
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="font-semibold mb-3 text-sm">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Entity Type
                  </p>
                  <Badge variant="outline">{log.entityType}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Entity Name
                  </p>
                  <p className="text-sm font-medium">{log.entityName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Timestamp
                  </p>
                  <p className="text-sm">
                    {format(new Date(log.timestamp), 'PPpp')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Can Rollback
                  </p>
                  <Badge
                    variant="outline"
                    className={
                      log.canRollback
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }
                  >
                    {log.canRollback ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* User Information */}
            <div>
              <h3 className="font-semibold mb-3 text-sm">User Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    User Name
                  </p>
                  <p className="text-sm font-medium">{log.userName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    User Role
                  </p>
                  <Badge
                    variant="outline"
                    className={roleColors[log.userRole] || ''}
                  >
                    {log.userRole}
                  </Badge>
                </div>
                {log.ipAddress && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      IP Address
                    </p>
                    <p className="text-sm font-mono">{log.ipAddress}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Changes */}
            {log.changes && log.changes.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-sm">
                  Changes ({log.changes.length})
                </h3>
                <div className="space-y-3">
                  {log.changes.map((change, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border p-3 bg-muted/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">{change.field}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Old Value
                          </p>
                          <div className="rounded bg-red-50 dark:bg-red-900/20 p-2 text-xs">
                            <p className="break-words">
                              {change.oldValue === null ||
                              change.oldValue === undefined
                                ? 'N/A'
                                : typeof change.oldValue === 'object'
                                  ? JSON.stringify(change.oldValue, null, 2)
                                  : String(change.oldValue)}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            New Value
                          </p>
                          <div className="rounded bg-green-50 dark:bg-green-900/20 p-2 text-xs">
                            <p className="break-words">
                              {change.newValue === null ||
                              change.newValue === undefined
                                ? 'N/A'
                                : typeof change.newValue === 'object'
                                  ? JSON.stringify(change.newValue, null, 2)
                                  : String(change.newValue)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-sm">Metadata</h3>
                <div className="rounded-lg border p-3 bg-muted/30">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Rollback Data */}
            {log.rollbackData && (
              <div>
                <h3 className="font-semibold mb-3 text-sm">Rollback Data</h3>
                <div className="rounded-lg border p-3 bg-yellow-50 dark:bg-yellow-900/20">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(log.rollbackData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
