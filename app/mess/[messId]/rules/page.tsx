'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RuleCard } from '@/components/rules/RuleCard'
import { RuleDialog } from '@/components/rules/RuleDialog'
import { ViolationCard } from '@/components/rules/ViolationCard'
import {
  getRulesByMess,
  getViolationsByMess,
  getAcceptancesByStudent,
  addRule,
  updateRule,
  deleteRule,
  acceptRule,
  updateViolation,
} from '@/lib/api/messDomain'
import { fetchMessById } from '@/lib/api/mess'
import { getCurrentAccountUserId } from '@/lib/api/account'
import { useMockQuery } from '@/hooks/useMockQuery'
import { getStoredRole } from '@/utils/auth'
import { Plus, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { MessSubpageBackButton } from '@/components/mess/MessSubpageBackButton'
import type { MessRule, RuleAcceptance, RuleViolation } from '@/types/messRules'
import { useConfirm } from '@/components/feedback'
import { toast } from '@/lib/feedback/toast'

export default function RulesManagementPage() {
  const t = useTranslations('mess')
  const tc = useTranslations('common')
  const { confirm } = useConfirm()
  const params = useParams()
  const role = getStoredRole()
  const messId = params.messId as string

  const loadMess = useCallback(() => fetchMessById(messId), [messId])
  const { data: mess } = useMockQuery(loadMess)
  const [rules, setRules] = useState<MessRule[]>([])
  const [violations, setViolations] = useState<RuleViolation[]>([])
  const [studentAcceptances, setStudentAcceptances] = useState<RuleAcceptance[]>(
    []
  )
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<MessRule | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [ruleStatusFilter, setRuleStatusFilter] = useState<string>('all')

  const currentStudentId = getCurrentAccountUserId()
  const ownerId = getCurrentAccountUserId()

  useEffect(() => {
    void getRulesByMess(messId).then(setRules)
    void getViolationsByMess(messId).then(setViolations)
  }, [messId])

  useEffect(() => {
    void getAcceptancesByStudent(currentStudentId).then(setStudentAcceptances)
  }, [currentStudentId])

  const acceptedRuleIds = useMemo(
    () => new Set(studentAcceptances.map(acc => acc.ruleId)),
    [studentAcceptances]
  )

  const visibleRules = useMemo(() => {
    let list = rules
    if (role === 'renter') {
      list = list.filter(r => r.status === 'active')
    } else if (ruleStatusFilter !== 'all') {
      list = list.filter(r => r.status === ruleStatusFilter)
    }
    return list
  }, [rules, ruleStatusFilter, role])

  const filteredViolations = useMemo(() => {
    let filtered = violations

    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter)
    }
    if (severityFilter !== 'all') {
      filtered = filtered.filter(v => v.severity === severityFilter)
    }

    return filtered
  }, [violations, statusFilter, severityFilter])

  const handleRuleSubmit = async (data: Parameters<typeof addRule>[0]) => {
    if (editingRule) {
      const updated = await updateRule(editingRule.id, { ...data, messId })
      if (!updated) {
        toast.error(t('rules.updateFailed'))
        return
      }
      toast.success(t('rules.updateSuccess'))
    } else {
      const created = await addRule(data)
      if (!created) {
        toast.error(t('rules.createFailed'))
        return
      }
      toast.success(t('rules.createSuccess'))
    }
    setRules(await getRulesByMess(messId))
    setEditingRule(null)
  }

  const handleRuleDelete = async (ruleId: string) => {
    const ok = await confirm({
      title: t('rules.deleteTitle'),
      description: t('rules.deleteDesc'),
      variant: 'destructive',
    })
    if (!ok) return
    await deleteRule(messId, ruleId)
    setRules(await getRulesByMess(messId))
  }

  const handleToggleRuleStatus = async (rule: MessRule) => {
    const nextStatus = rule.status === 'active' ? 'inactive' : 'active'
    const updated = await updateRule(rule.id, {
      messId,
      status: nextStatus,
    })
    if (!updated) {
      toast.error(t('rules.updateFailed'))
      return
    }
    toast.success(
      nextStatus === 'active'
        ? t('rules.activatedSuccess')
        : t('rules.deactivatedSuccess'),
    )
    setRules(await getRulesByMess(messId))
  }

  const handleAcceptRule = async (rule: MessRule) => {
    const result = await acceptRule(messId, rule.id)
    if (result) {
      setStudentAcceptances(prev => {
        if (prev.some(a => a.ruleId === rule.id)) return prev
        return [...prev, result]
      })
      setRules(await getRulesByMess(messId))
      toast.success(t('rules.acceptSuccess'))
      return
    }
    toast.error(tc('error'))
  }

  const handleResolveViolation = async (violation: RuleViolation) => {
    const notes = prompt(t('rules.resolutionPrompt'))
    if (notes) {
      await updateViolation(violation.id, {
        status: 'resolved',
        resolutionNotes: notes,
        resolvedBy: role === 'owner' ? ownerId : currentStudentId,
        messId,
      })
      setViolations(await getViolationsByMess(messId))
    }
  }

  if (!mess) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <p className="text-center">{t('notFound')}</p>
        </div>
      </Layout>
    )
  }

  const isOwner = role === 'owner'
  const isRenter = role === 'renter'

  return (
    <Layout userRole={role as 'owner' | 'renter'}>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <MessSubpageBackButton
              fallbackHref={isRenter ? '/mess/student-dashboard' : '/mess'}
            />
            <h1 className="text-2xl font-bold mb-2">
              {t('rules.managementTitle')}
            </h1>
            <p className="text-muted-foreground">{mess?.name ?? '…'}</p>
          </div>
          {isOwner && (
            <Button
              onClick={() => {
                setEditingRule(null)
                setIsRuleDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('rules.createRule')}
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="rules" className="space-y-6">
          <TabsList className="max-w-full justify-start overflow-x-auto">
            <TabsTrigger value="rules">
              <FileText className="h-4 w-4 mr-2" />
              {t('rules.tabs.rules')}
            </TabsTrigger>
            {isOwner && (
              <TabsTrigger value="violations">
                <AlertTriangle className="h-4 w-4 mr-2" />
                {t('rules.tabs.violations')}
              </TabsTrigger>
            )}
            {isRenter && (
              <TabsTrigger value="my-violations">
                <AlertTriangle className="h-4 w-4 mr-2" />
                {t('rules.tabs.myViolations')}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Rules Tab */}
          <TabsContent value="rules" className="space-y-4">
            {isOwner && rules.length > 0 && (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Select
                  value={ruleStatusFilter}
                  onValueChange={setRuleStatusFilter}
                >
                  <SelectTrigger className="w-auto min-w-[9rem]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t('rules.allRuleStatus')}
                    </SelectItem>
                    <SelectItem value="active">
                      {t('rules.ruleStatus.active')}
                    </SelectItem>
                    <SelectItem value="inactive">
                      {t('rules.ruleStatus.inactive')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {visibleRules.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {visibleRules.map(rule => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    isAccepted={acceptedRuleIds.has(rule.id)}
                    onAccept={isRenter ? handleAcceptRule : undefined}
                    onEdit={
                      isOwner
                        ? r => {
                            setEditingRule(r)
                            setIsRuleDialogOpen(true)
                          }
                        : undefined
                    }
                    onDelete={
                      isOwner ? r => void handleRuleDelete(r.id) : undefined
                    }
                    onToggleStatus={
                      isOwner
                        ? r => void handleToggleRuleStatus(r)
                        : undefined
                    }
                    showActions={isOwner || isRenter}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">
                    {rules.length > 0
                      ? t('rules.emptyFilteredRules')
                      : t('rules.emptyRules')}
                  </p>
                  {isOwner && rules.length === 0 && (
                    <Button
                      onClick={() => {
                        setEditingRule(null)
                        setIsRuleDialogOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('rules.createFirstRule')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Violations Tab (Owner) */}
          {isOwner && (
            <TabsContent value="violations" className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold sm:text-xl">
                  {t('rules.violationsTitle')}
                </h2>
                <div className="flex flex-wrap gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-auto min-w-[7.5rem] flex-1 sm:w-[150px] sm:flex-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t('rules.allStatus')}
                      </SelectItem>
                      <SelectItem value="pending">
                        {tc('status.pending')}
                      </SelectItem>
                      <SelectItem value="resolved">
                        {tc('status.resolved')}
                      </SelectItem>
                      <SelectItem value="appealed">
                        {t('rules.status.appealed')}
                      </SelectItem>
                      <SelectItem value="dismissed">
                        {t('rules.status.dismissed')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={severityFilter}
                    onValueChange={setSeverityFilter}
                  >
                    <SelectTrigger className="w-auto min-w-[7.5rem] flex-1 sm:w-[150px] sm:flex-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t('rules.allSeverity')}
                      </SelectItem>
                      <SelectItem value="minor">
                        {t('rules.severity.minor')}
                      </SelectItem>
                      <SelectItem value="moderate">
                        {t('rules.severity.moderate')}
                      </SelectItem>
                      <SelectItem value="major">
                        {t('rules.severity.major')}
                      </SelectItem>
                      <SelectItem value="critical">
                        {t('rules.severity.critical')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredViolations.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredViolations.map(violation => (
                    <ViolationCard
                      key={violation.id}
                      violation={violation}
                      onResolve={handleResolveViolation}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      {t('rules.emptyViolations')}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {/* My Violations Tab (Renter) */}
          {isRenter && (
            <TabsContent value="my-violations" className="space-y-4">
              {violations.filter(v => v.studentId === currentStudentId).length >
              0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {violations
                    .filter(v => v.studentId === currentStudentId)
                    .map(violation => (
                      <ViolationCard
                        key={violation.id}
                        violation={violation}
                        showActions={false}
                      />
                    ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      {t('rules.emptyMyViolations')}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* Dialogs */}
        {isOwner && (
          <RuleDialog
            rule={editingRule}
            messId={messId}
            open={isRuleDialogOpen}
            onOpenChange={open => {
              setIsRuleDialogOpen(open)
              if (!open) setEditingRule(null)
            }}
            onSubmit={handleRuleSubmit}
          />
        )}
      </div>
    </Layout>
  )
}
