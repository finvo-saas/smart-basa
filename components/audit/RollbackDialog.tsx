'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import type { AuditLog } from '@/types/audit'

interface RollbackDialogProps {
  log: AuditLog | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function RollbackDialog({
  log,
  open,
  onOpenChange,
  onConfirm,
}: RollbackDialogProps) {
  if (!log) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            Rollback Audit Log?
            <Badge
              variant="outline"
              className="bg-yellow-50 text-yellow-700 border-yellow-200"
            >
              {log.action.toUpperCase()}
            </Badge>
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to rollback this action? This will reverse
              the changes made to:
            </p>
            <div className="rounded-lg border p-3 bg-muted/30">
              <p className="font-medium text-sm mb-1">{log.entityName}</p>
              <p className="text-xs capitalize text-muted-foreground">
                {log.entityType}
              </p>
            </div>
            {log.changes && log.changes.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-2">
                  Changes that will be reversed:
                </p>
                <div className="space-y-1">
                  {log.changes.slice(0, 3).map((change, idx) => (
                    <div key={idx} className="text-xs">
                      <span className="font-medium">{change.field}:</span>{' '}
                      <span className="line-through text-red-600 dark:text-red-400">
                        {String(change.newValue || 'N/A')}
                      </span>{' '}
                      →{' '}
                      <span className="text-green-600 dark:text-green-400">
                        {String(change.oldValue || 'N/A')}
                      </span>
                    </div>
                  ))}
                  {log.changes.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{log.changes.length - 3} more changes
                    </p>
                  )}
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              This action cannot be undone. A new audit log entry will be
              created for this rollback.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            Confirm Rollback
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
