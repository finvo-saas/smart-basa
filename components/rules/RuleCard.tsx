'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  PauseCircle,
  Pencil,
  PlayCircle,
  Trash2,
} from 'lucide-react'
import type { MessRule } from '@/types/messRules'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface RuleCardProps {
  rule: MessRule
  isAccepted?: boolean
  onAccept?: (rule: MessRule) => void
  onView?: (rule: MessRule) => void
  onEdit?: (rule: MessRule) => void
  onDelete?: (rule: MessRule) => void
  onToggleStatus?: (rule: MessRule) => void
  showActions?: boolean
}

const severityColors = {
  minor:
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
  moderate:
    'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
  major:
    'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400',
  critical:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400',
}

const categoryLabels = {
  general: 'General',
  payment: 'Payment',
  attendance: 'Attendance',
  meal: 'Meal',
  behavior: 'Behavior',
  facility: 'Facility',
  other: 'Other',
}

export function RuleCard({
  rule,
  isAccepted,
  onAccept,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  showActions = true,
}: RuleCardProps) {
  const t = useTranslations('mess.rules')
  const isActive = rule.status === 'active'
  const hasOwnerActions = Boolean(onEdit || onDelete || onToggleStatus)
  const hasRenterActions = Boolean(
    onView || (onAccept && !isAccepted && rule.requiresAcceptance && isActive),
  )
  const showFooter = showActions && (hasOwnerActions || hasRenterActions)

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        !isAccepted && rule.requiresAcceptance && isActive
          ? 'border-yellow-500'
          : '',
        !isActive && 'opacity-80',
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-start gap-2 break-words text-base md:text-lg">
              <FileText className="h-5 w-5 shrink-0 text-primary" />
              {rule.title}
            </CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  isActive
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600',
                )}
              >
                {isActive ? t('ruleStatus.active') : t('ruleStatus.inactive')}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {categoryLabels[rule.category]}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${severityColors[rule.severity]}`}
              >
                {rule.severity.charAt(0).toUpperCase() + rule.severity.slice(1)}
              </Badge>
              {isAccepted && (
                <Badge
                  variant="outline"
                  className="border-green-200 bg-green-50 text-xs text-green-700"
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Accepted
                </Badge>
              )}
              {!isAccepted && rule.requiresAcceptance && isActive && (
                <Badge
                  variant="outline"
                  className="border-yellow-200 bg-yellow-50 text-xs text-yellow-700"
                >
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Pending Acceptance
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{rule.description}</p>

        {rule.penalty && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              <p className="min-w-0 break-words text-sm font-medium text-red-800 dark:text-red-200">
                Penalty: {rule.penalty}
              </p>
            </div>
          </div>
        )}

        {rule.effectiveDate && (
          <div className="text-xs text-muted-foreground">
            Effective from:{' '}
            {format(new Date(rule.effectiveDate), 'MMM dd, yyyy')}
          </div>
        )}

        {showFooter && (
          <div className="flex flex-wrap gap-2 border-t pt-2">
            {!isAccepted && rule.requiresAcceptance && onAccept && isActive && (
              <Button
                variant="default"
                size="sm"
                className="min-w-[8rem] flex-1"
                onClick={() => onAccept(rule)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Accept Rule
              </Button>
            )}
            {onView && (
              <Button
                variant="outline"
                size="sm"
                className="min-w-[8rem] flex-1"
                onClick={() => onView(rule)}
              >
                View Details
              </Button>
            )}
            {onToggleStatus && (
              <Button
                variant="outline"
                size="sm"
                className="min-w-[8rem] flex-1"
                onClick={() => onToggleStatus(rule)}
              >
                {isActive ? (
                  <>
                    <PauseCircle className="mr-2 h-4 w-4" />
                    {t('deactivate')}
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    {t('activate')}
                  </>
                )}
              </Button>
            )}
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="min-w-[8rem] flex-1"
                onClick={() => onEdit(rule)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="min-w-[8rem] flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onDelete(rule)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
