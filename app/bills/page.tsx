'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useStoredRole } from '@/hooks/useStoredRole'
import { Layout } from '@/components/layout/Layout'
import { EmptyState, LoadingState } from '@/components/page'
import { BillCard } from '@/components/bill/BillCard'
import { GenerateBillDialog } from '@/components/bill/GenerateBillDialog'
import { EditBillDialog } from '@/components/bill/EditBillDialog'
import { BillTemplateDialog } from '@/components/bill/BillTemplateDialog'
import type { BillTemplateFormData } from '@/components/bill/BillTemplateDialog'
import { MeterReadingDialog } from '@/components/bill/MeterReadingDialog'
import type { MeterReadingFormData } from '@/components/bill/MeterReadingDialog'
import { BillGenerationRuleDialog } from '@/components/bill/BillGenerationRuleDialog'
import type { BillRuleFormData } from '@/components/bill/BillGenerationRuleDialog'
import { BulkBillDialog } from '@/components/bulk/BulkBillDialog'
import { SchedulePaymentDialog } from '@/components/payment/SchedulePaymentDialog'
import { PayBillDialog } from '@/components/payment/PayBillDialog'
import { RecordCashPaymentDialog } from '@/components/payment/RecordCashPaymentDialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Plus,
  Filter,
  FileText,
  Settings,
  Calendar,
  Zap,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import {
  fetchBillsBoard,
  fetchBillsForTenant,
  scheduleBillPayment,
  generateBill,
  bulkGenerateBills,
  saveBillTemplates,
  saveBillRules,
  saveMeterReadings,
  getPreviousMeterReading,
} from '@/lib/api/bills'
import { fetchMessList } from '@/lib/api/mess'
import { fetchOwnerPortfolioSnapshot } from '@/lib/api/buildings'
import { getCurrentAccountUserId } from '@/lib/api/account'
import { toast } from '@/lib/feedback/toast'
import type { Building, Flat, Renter } from '@/types/building'
import type { Mess } from '@/types/mess'
import type {
  Bill,
  BillStatus,
  BillTemplate,
  BillGenerationRule,
  MeterReading,
} from '@/types/bill'
import type { BulkBillGenerationData } from '@/types/bulk'
import type { PaymentMethod } from '@/types/payment'
import { useConfirm } from '@/components/feedback'

export default function BillsPage() {
  const t = useTranslations('bills')
  const tc = useTranslations('common')
  const { confirm } = useConfirm()
  const [bills, setBills] = useState<Bill[]>([])
  const [templates, setTemplates] = useState<BillTemplate[]>([])
  const [rules, setRules] = useState<BillGenerationRule[]>([])
  const [meterReadings, setMeterReadings] = useState<MeterReading[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [flats, setFlats] = useState<Flat[]>([])
  const [renters, setRenters] = useState<Renter[]>([])
  const [messList, setMessList] = useState<Mess[]>([])
  const [boardReady, setBoardReady] = useState(false)
  const [statusFilter, setStatusFilter] = useState<BillStatus | 'all'>('all')
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [editingBill, setEditingBill] = useState<Bill | null>(null)
  const [isEditBillOpen, setIsEditBillOpen] = useState(false)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [isMeterReadingDialogOpen, setIsMeterReadingDialogOpen] =
    useState(false)
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false)
  const [isBulkBillDialogOpen, setIsBulkBillDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<
    BillTemplate | undefined
  >()
  const [selectedRule, setSelectedRule] = useState<
    BillGenerationRule | undefined
  >()
  const [selectedReading, setSelectedReading] = useState<
    MeterReading | undefined
  >()
  const [selectedBillForPayment, setSelectedBillForPayment] =
    useState<Bill | null>(null)
  const [isSchedulePaymentDialogOpen, setIsSchedulePaymentDialogOpen] =
    useState(false)
  const [payBillTarget, setPayBillTarget] = useState<Bill | null>(null)
  const [isPayBillOpen, setIsPayBillOpen] = useState(false)
  const [cashBillTarget, setCashBillTarget] = useState<Bill | null>(null)
  const [isCashDialogOpen, setIsCashDialogOpen] = useState(false)

  const { ready, isOwner } = useStoredRole()
  const tenantId = getCurrentAccountUserId()

  const loadBoard = useCallback(async () => {
    if (!isOwner) {
      const result = await fetchBillsForTenant()
      if (result.ok) setBills(result.data)
      setBoardReady(true)
      return
    }
    const [result, messResult, portfolioResult] = await Promise.all([
      fetchBillsBoard(),
      fetchMessList({ mine: true }),
      fetchOwnerPortfolioSnapshot(),
    ])
    if (result.ok) {
      setBills(result.data.bills)
      setTemplates(result.data.templates)
      setRules(result.data.rules)
      setMeterReadings(result.data.meterReadings)
      setFlats(result.data.flats)
      setRenters(result.data.renters)
    }
    // Prefer portfolio/mess APIs for property names — bills board historically
    // omitted messes, which made template cards show Property N/A.
    const buildings =
      (portfolioResult.ok ? portfolioResult.data.buildings : null) ??
      (result.ok ? result.data.buildings : []) ??
      []
    const messesFromApi = messResult.ok ? messResult.data : []
    const messesFromPortfolio = portfolioResult.ok
      ? portfolioResult.data.messList
      : []
    const messesFromBoard = result.ok ? result.data.messList : []
    const messById = new Map<string, Mess>()
    for (const m of [...messesFromBoard, ...messesFromPortfolio, ...messesFromApi]) {
      messById.set(String(m.id), m)
    }
    setBuildings(buildings)
    setMessList([...messById.values()])
    setBoardReady(true)
  }, [isOwner])

  const resolvePropertyName = useCallback(
    (propertyId: string, propertyType?: string) => {
      const id = String(propertyId)
      const hit = [...buildings, ...messList].find(p => String(p.id) === id)
      if (hit?.name) return hit.name
      return propertyType === 'mess'
        ? t('misc.unknownMess')
        : t('misc.unknownProperty')
    },
    [buildings, messList, t],
  )

  useEffect(() => {
    loadBoard()
  }, [loadBoard])

  // Deep-links: /bills?action=generate | /bills?status=overdue
  useEffect(() => {
    if (!ready) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('action') === 'generate' && isOwner) {
      setIsGenerateDialogOpen(true)
    }
    const status = params.get('status')
    if (
      status === 'paid' ||
      status === 'unpaid' ||
      status === 'overdue' ||
      status === 'all'
    ) {
      setStatusFilter(status)
    }
  }, [ready, isOwner])

  // Filter bills based on role and status
  const filteredBills = useMemo(() => {
    let filtered = [...bills]

    if (!isOwner) {
      filtered = filtered.filter(b => b.tenantId === tenantId)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter)
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(`${a.month} 1, ${a.year}`)
      const dateB = new Date(`${b.month} 1, ${b.year}`)
      return dateB.getTime() - dateA.getTime()
    })
  }, [bills, statusFilter, isOwner, tenantId])

  const refreshBills = () => {
    loadBoard()
  }

  const handleRecordCash = (bill: Bill) => {
    setCashBillTarget(bill)
    setIsCashDialogOpen(true)
  }

  const handleSchedulePayment = (bill: Bill) => {
    setSelectedBillForPayment(bill)
    setIsSchedulePaymentDialogOpen(true)
  }

  const handlePayNow = (bill: Bill) => {
    setPayBillTarget(bill)
    setIsPayBillOpen(true)
  }

  const handlePaySuccess = (paidBill: Bill) => {
    setBills(prev => prev.map(b => (b.id === paidBill.id ? paidBill : b)))
  }

  const handleSchedulePaymentSubmit = (data: {
    billId: string
    billName: string
    amount: number
    scheduledDate: string
    scheduledTime?: string
    paymentMethod: string
    accountNumber?: string
    reminderEnabled: boolean
    reminderDays: number[]
    autoRetry: boolean
    maxRetries?: number
  }) => {
    scheduleBillPayment({
      userId: tenantId,
      billId: data.billId,
      billName: data.billName,
      amount: data.amount,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime || '10:00',
      paymentMethod: data.paymentMethod as PaymentMethod,
      accountNumber: data.accountNumber,
      status: 'scheduled',
      reminderEnabled: data.reminderEnabled,
      reminderDays: data.reminderDays,
      autoRetry: data.autoRetry,
      maxRetries: data.maxRetries ?? 0,
      retryCount: 0,
    })
    setSelectedBillForPayment(null)
    setIsSchedulePaymentDialogOpen(false)
  }

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const handleBulkBillSubmit = async (data: BulkBillGenerationData) => {
    if (!data.buildingId) {
      setIsBulkBillDialogOpen(false)
      return
    }
    const result = await bulkGenerateBills({
      buildingId: data.buildingId,
      flatIds: data.flatIds,
      month: data.month,
      year: data.year,
      templateId: data.templateId,
      includeUnpaid: data.includeUnpaid,
    })
    if (result.ok && result.data.length) {
      setBills(prev => [...result.data, ...prev])
    }
    setIsBulkBillDialogOpen(false)
  }

  const handleGenerate = async (data: any) => {
    const result = await generateBill({
      propertyId: data.propertyId,
      propertyType: data.propertyType,
      month: data.month,
      year: data.year,
      tenantId: data.tenantId,
      flatId: data.flatId,
      templateId: data.templateId,
      items: data.items.map((item: any) => ({
        description: item.description,
        amount: item.amount || 0,
        type: item.type,
        calculationType: item.calculationType,
        unitRate: item.unitRate,
        previousReading: item.previousReading,
        currentReading: item.currentReading,
        consumption: item.consumption,
      })),
    })
    if (result.ok) {
      setBills(prev => [result.data, ...prev])
    }
    setIsGenerateDialogOpen(false)
  }

  const handleTemplateSubmit = async (data: BillTemplateFormData) => {
    const today = new Date().toISOString().split('T')[0]
    const items = data.items.map((item, index) => ({
      id: `item-${index}`,
      description: item.description,
      type: item.type,
      calculationType: item.calculationType,
      fixedAmount: item.fixedAmount,
      unitRate: item.unitRate,
      percentage: item.percentage,
      baseItemId: item.baseItemId,
      meterType: item.meterType,
      serviceCharge: item.serviceCharge,
    }))
    let next: BillTemplate[]
    if (selectedTemplate) {
      next = templates.map(t =>
        t.id === selectedTemplate.id
          ? {
              ...t,
              name: data.name,
              description: data.description,
              propertyId: data.propertyId,
              propertyType: data.propertyType,
              flatId: data.flatId || undefined,
              seatId: data.seatId || undefined,
              isActive: data.isActive,
              items,
              updatedAt: today,
            }
          : t,
      )
    } else {
      next = [
        ...templates,
        {
          id: '',
          name: data.name,
          description: data.description,
          propertyId: data.propertyId,
          propertyType: data.propertyType,
          flatId: data.flatId || undefined,
          seatId: data.seatId || undefined,
          isActive: data.isActive,
          items,
          createdAt: today,
          updatedAt: today,
        },
      ]
    }
    const saved = await saveBillTemplates(next)
    if (!saved.ok) {
      toast.error(saved.error || t('templates.saveFailed'))
      return
    }
    setTemplates(saved.data)
    // Refresh property catalogs so card labels resolve immediately.
    const [messResult, portfolioResult] = await Promise.all([
      fetchMessList({ mine: true }),
      fetchOwnerPortfolioSnapshot(),
    ])
    if (portfolioResult.ok) setBuildings(portfolioResult.data.buildings)
    const messById = new Map<string, Mess>()
    for (const m of [
      ...(portfolioResult.ok ? portfolioResult.data.messList : []),
      ...(messResult.ok ? messResult.data : []),
      ...messList,
    ]) {
      messById.set(String(m.id), m)
    }
    setMessList([...messById.values()])
    setIsTemplateDialogOpen(false)
    setSelectedTemplate(undefined)
    toast.success(
      selectedTemplate ? t('templates.updated') : t('templates.created'),
    )
  }

  const persistTemplates = async (next: BillTemplate[]) => {
    const saved = await saveBillTemplates(next)
    if (!saved.ok) {
      toast.error(saved.error || t('templates.saveFailed'))
      return false
    }
    setTemplates(saved.data)
    return true
  }

  const handleMeterReadingSubmit = async (
    data: MeterReadingFormData & { id?: string },
  ) => {
    const editingId = data.id || selectedReading?.id
    const prevReading = await getPreviousMeterReading(
      data.propertyId,
      data.flatId || undefined,
      data.seatId || undefined,
      data.month,
      data.year,
    )

    const consumptionFields = {
      previousElectricity: prevReading?.electricity,
      previousGas: prevReading?.gas,
      previousWater: prevReading?.water,
      electricityConsumption:
        data.electricity !== undefined && prevReading?.electricity !== undefined
          ? data.electricity - prevReading.electricity
          : undefined,
      gasConsumption:
        data.gas !== undefined && prevReading?.gas !== undefined
          ? data.gas - prevReading.gas
          : undefined,
      waterConsumption:
        data.water !== undefined && prevReading?.water !== undefined
          ? data.water - prevReading.water
          : undefined,
    }

    const { id: _ignoreId, ...payload } = data
    let next: MeterReading[]
    if (editingId) {
      next = meterReadings.map(r =>
        r.id === editingId
          ? {
              ...r,
              ...payload,
              flatId: data.flatId || undefined,
              seatId: data.seatId || undefined,
              ...consumptionFields,
              submittedAt: new Date().toISOString(),
            }
          : r,
      )
    } else {
      next = [
        ...meterReadings,
        {
          id: '',
          ...payload,
          flatId: data.flatId || undefined,
          seatId: data.seatId || undefined,
          submittedAt: new Date().toISOString(),
          submittedBy: 'owner',
          ...consumptionFields,
        },
      ]
    }
    const saved = await saveMeterReadings(next)
    if (!saved.ok) {
      toast.error(saved.error || t('meterReadings.saveFailed'))
      return
    }
    const wasEdit = Boolean(editingId)
    setMeterReadings(saved.data)
    toast.success(
      wasEdit ? t('meterReadings.updated') : t('meterReadings.created'),
    )
    setIsMeterReadingDialogOpen(false)
    setSelectedReading(undefined)
    try {
      const [messResult, portfolioResult] = await Promise.all([
        fetchMessList({ mine: true }),
        fetchOwnerPortfolioSnapshot(),
      ])
      if (portfolioResult.ok) {
        setBuildings(portfolioResult.data.buildings)
        setFlats(portfolioResult.data.flats)
      }
      const messById = new Map<string, Mess>()
      for (const m of [
        ...(portfolioResult.ok ? portfolioResult.data.messList : []),
        ...(messResult.ok ? messResult.data : []),
        ...messList,
      ]) {
        messById.set(String(m.id), m)
      }
      setMessList([...messById.values()])
    } catch {
      // Property label refresh is best-effort; reading already saved.
    }
  }

  const calculateNextRun = (schedule: {
    type: string
    dayOfMonth?: number
    dayOfWeek?: number
    customDays?: number[]
    generateBeforeDays?: number
  }): string => {
    const pad = (n: number) => String(n).padStart(2, '0')
    const toIso = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const before = Math.max(0, schedule.generateBeforeDays || 0)
    const start = new Date(today)
    start.setDate(start.getDate() + 1)

    const jsWeekday = (d: Date) => d.getDay() // Sun=0

    if (schedule.type === 'weekly') {
      const target = schedule.dayOfWeek ?? 0
      const cursor = new Date(start)
      for (let i = 0; i < 21 + before; i++) {
        const scheduled = new Date(cursor)
        scheduled.setDate(scheduled.getDate() + before)
        if (jsWeekday(scheduled) === target) return toIso(cursor)
        cursor.setDate(cursor.getDate() + 1)
      }
    }

    if (schedule.type === 'custom') {
      const days = (schedule.customDays || [1]).filter(
        d => d >= 1 && d <= 31,
      )
      const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
      for (let m = 0; m < 24; m++) {
        const y = cursor.getFullYear()
        const month = cursor.getMonth()
        const last = new Date(y, month + 1, 0).getDate()
        for (const day of days) {
          const scheduled = new Date(y, month, Math.min(day, last))
          const run = new Date(scheduled)
          run.setDate(run.getDate() - before)
          if (run >= start) return toIso(run)
        }
        cursor.setMonth(cursor.getMonth() + 1)
      }
    }

    // monthly (default)
    const dayOfMonth = Math.min(Math.max(schedule.dayOfMonth || 1, 1), 31)
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
    for (let m = 0; m < 24; m++) {
      const y = cursor.getFullYear()
      const month = cursor.getMonth()
      const last = new Date(y, month + 1, 0).getDate()
      const scheduled = new Date(y, month, Math.min(dayOfMonth, last))
      const run = new Date(scheduled)
      run.setDate(run.getDate() - before)
      if (run >= start) return toIso(run)
      cursor.setMonth(cursor.getMonth() + 1)
    }

    const fallback = new Date(today)
    fallback.setDate(fallback.getDate() + 7)
    return toIso(fallback)
  }

  const persistRules = async (next: BillGenerationRule[]) => {
    const saved = await saveBillRules(next)
    if (!saved.ok) {
      toast.error(saved.error || t('automation.saveFailed'))
      return false
    }
    setRules(saved.data)
    return true
  }

  const handleRuleSubmit = async (
    data: BillRuleFormData & { id?: string },
  ) => {
    const editingId = data.id || selectedRule?.id
    const today = new Date().toISOString().split('T')[0]
    const { id: _ignoreId, ...payload } = data
    let next: BillGenerationRule[]
    if (editingId) {
      next = rules.map(r =>
        r.id === editingId
          ? {
              ...r,
              ...payload,
              propertyId: data.propertyId || undefined,
              propertyType: data.propertyType || undefined,
              description: data.description || undefined,
              updatedAt: today,
              nextRun: calculateNextRun(data.schedule),
            }
          : r,
      )
    } else {
      next = [
        ...rules,
        {
          id: '',
          ...payload,
          propertyId: data.propertyId || undefined,
          propertyType: data.propertyType || undefined,
          description: data.description || undefined,
          createdAt: today,
          updatedAt: today,
          lastRun: undefined,
          nextRun: calculateNextRun(data.schedule),
        },
      ]
    }
    const okSave = await persistRules(next)
    if (!okSave) return
    toast.success(
      editingId ? t('automation.updated') : t('automation.created'),
    )
    setIsRuleDialogOpen(false)
    setSelectedRule(undefined)
  }

  const handleToggleTemplate = async (template: BillTemplate) => {
    const next = templates.map(t =>
      t.id === template.id
        ? {
            ...t,
            isActive: !t.isActive,
            updatedAt: new Date().toISOString().split('T')[0],
          }
        : t,
    )
    await persistTemplates(next)
  }

  const handleToggleRule = async (rule: BillGenerationRule) => {
    const next = rules.map(r =>
      r.id === rule.id
        ? {
            ...r,
            isActive: !r.isActive,
            updatedAt: new Date().toISOString().split('T')[0],
          }
        : r,
    )
    const okSave = await persistRules(next)
    if (okSave) {
      toast.success(
        rule.isActive ? t('automation.deactivated') : t('automation.activated'),
      )
    }
  }

  const handleDeleteTemplate = async (template: BillTemplate) => {
    const confirmed = await confirm({
      title: t('confirm.deleteTemplateTitle'),
      description: t('confirm.deleteTemplateDesc', { name: template.name }),
      variant: 'destructive',
    })
    if (!confirmed) return
    const next = templates.filter(t => t.id !== template.id)
    const okSave = await persistTemplates(next)
    if (okSave) toast.success(t('templates.deleted'))
  }

  const handleDeleteRule = async (rule: BillGenerationRule) => {
    const confirmed = await confirm({
      title: t('confirm.deleteRuleTitle'),
      description: t('confirm.deleteRuleDesc', { name: rule.name }),
      variant: 'destructive',
    })
    if (!confirmed) return
    const next = rules.filter(r => r.id !== rule.id)
    const okSave = await persistRules(next)
    if (okSave) toast.success(t('automation.deleted'))
  }

  const statusCounts = {
    all: filteredBills.length,
    paid: bills.filter(b => b.status === 'paid').length,
    unpaid: bills.filter(b => b.status === 'unpaid').length,
    overdue: bills.filter(b => b.status === 'overdue').length,
  }

  const activeTemplates = templates.filter(t => t.isActive)
  const activeRules = rules.filter(r => r.isActive)

  // Wait for client role so owner/renter trees match after hydration
  if (!ready || !boardReady) {
    return (
      <Layout>
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <LoadingState label={tc('loading')} variant="skeleton" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              {isOwner ? t('owner.title') : t('renter.title')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isOwner ? t('owner.description') : t('renter.description')}
            </p>
          </div>
          {isOwner && (
            <div className="flex gap-2">
              <Button onClick={() => setIsGenerateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('actions.generateBill')}
              </Button>
              <Button
                onClick={() => setIsBulkBillDialogOpen(true)}
                variant="outline"
              >
                <FileText className="mr-2 h-4 w-4" />
                {t('actions.bulkGenerate')}
              </Button>
            </div>
          )}
        </div>

        {isOwner ? (
          <Tabs defaultValue="bills" className="space-y-6">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 p-1 sm:grid sm:grid-cols-4">
              <TabsTrigger
                value="bills"
                className="min-w-[calc(50%-0.25rem)] flex-1 gap-1.5 px-2 text-xs sm:min-w-0 sm:text-sm"
              >
                <FileText className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                {t('tabs.bills')}
              </TabsTrigger>
              <TabsTrigger
                value="templates"
                className="min-w-[calc(50%-0.25rem)] flex-1 gap-1.5 px-2 text-xs sm:min-w-0 sm:text-sm"
              >
                <Settings className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                {t('tabs.templates')}
              </TabsTrigger>
              <TabsTrigger
                value="readings"
                className="min-w-[calc(50%-0.25rem)] flex-1 gap-1.5 px-2 text-xs sm:min-w-0 sm:text-sm"
              >
                <Calendar className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span className="truncate">{t('tabs.meterReadings')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="automation"
                className="min-w-[calc(50%-0.25rem)] flex-1 gap-1.5 px-2 text-xs sm:min-w-0 sm:text-sm"
              >
                <Zap className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                {t('tabs.automation')}
              </TabsTrigger>
            </TabsList>

            {/* Bills Tab */}
            <TabsContent value="bills" className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t('filters.status')}</span>
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={value =>
                    setStatusFilter(value as BillStatus | 'all')
                  }
                >
                  <SelectTrigger className="w-auto min-w-[7.5rem] flex-1 sm:w-[180px] sm:flex-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t('filters.all', { count: statusCounts.all })}
                    </SelectItem>
                    <SelectItem value="paid">
                      {t('filters.paid', { count: statusCounts.paid })}
                    </SelectItem>
                    <SelectItem value="unpaid">
                      {t('filters.unpaid', { count: statusCounts.unpaid })}
                    </SelectItem>
                    <SelectItem value="overdue">
                      {t('filters.overdue', { count: statusCounts.overdue })}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredBills.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title={t('empty.billsTitle')}
                  description={
                    statusFilter !== 'all'
                      ? t('empty.billsDescFiltered', {
                          status: t(`status.${statusFilter}`),
                        })
                      : t('empty.billsDescDefault')
                  }
                >
                  <Button onClick={() => setIsGenerateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('actions.generateBill')}
                  </Button>
                </EmptyState>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredBills.map(bill => (
                    <BillCard
                      key={bill.id}
                      bill={bill}
                      onMarkPaid={isOwner ? handleRecordCash : undefined}
                      onSchedulePayment={handleSchedulePayment}
                      onEdit={
                        isOwner
                          ? b => {
                              setEditingBill(b)
                              setIsEditBillOpen(true)
                            }
                          : undefined
                      }
                      showTenantName={true}
                      enableWhatsAppShare={isOwner}
                      enableDueRemind={isOwner}
                      onWhatsAppShared={(billId, sharedAt) => {
                        setBills(prev =>
                          prev.map(b =>
                            b.id === billId
                              ? { ...b, whatsappSharedAt: sharedAt }
                              : b,
                          ),
                        )
                      }}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4 sm:space-y-6">
              <div className="flex flex-col gap-3 min-[400px]:flex-row min-[400px]:items-start min-[400px]:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold sm:text-xl">
                    {t('templates.title')}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground text-pretty">
                    {t('templates.description')}
                  </p>
                </div>
                <Button
                  className="w-full shrink-0 min-[400px]:w-auto"
                  onClick={() => {
                    setSelectedTemplate(undefined)
                    setIsTemplateDialogOpen(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('actions.createTemplate')}
                </Button>
              </div>

              {templates.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center px-4 py-10 text-center sm:py-12">
                    <p className="text-base font-semibold text-muted-foreground sm:text-lg">
                      {t('empty.templatesTitle')}
                    </p>
                    <Button
                      onClick={() => {
                        setSelectedTemplate(undefined)
                        setIsTemplateDialogOpen(true)
                      }}
                      className="mt-4 w-full max-w-xs sm:w-auto"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t('actions.createTemplate')}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                  {templates.map(template => {
                    const propertyName = resolvePropertyName(
                      template.propertyId,
                      template.propertyType,
                    )
                    return (
                      <Card key={template.id} className="min-w-0 overflow-hidden">
                        <CardHeader className="space-y-3 p-3 sm:p-6">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-base leading-snug sm:text-lg">
                                {template.name}
                              </CardTitle>
                              <CardDescription className="mt-1 text-pretty">
                                {template.description ||
                                  t('templates.noDescription')}
                              </CardDescription>
                            </div>
                            <Badge
                              variant={
                                template.isActive ? 'default' : 'secondary'
                              }
                              className="shrink-0"
                            >
                              {template.isActive
                                ? t('templates.active')
                                : t('templates.inactive')}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4 p-3 pt-0 sm:p-6 sm:pt-0">
                          <div className="space-y-2 text-sm">
                            <div className="flex flex-col gap-0.5 min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between min-[380px]:gap-3">
                              <span className="shrink-0 text-muted-foreground">
                                {t('templates.propertyLabel')}
                              </span>
                              <span className="min-w-0 break-words font-medium min-[380px]:text-right">
                                {propertyName}
                              </span>
                            </div>
                            <div className="flex flex-col gap-0.5 min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between min-[380px]:gap-3">
                              <span className="shrink-0 text-muted-foreground">
                                {t('templates.typeLabel')}
                              </span>
                              <span className="font-medium capitalize min-[380px]:text-right">
                                {template.propertyType}
                              </span>
                            </div>
                            <div className="flex flex-col gap-0.5 min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between min-[380px]:gap-3">
                              <span className="shrink-0 text-muted-foreground">
                                {t('templates.itemsLabel')}
                              </span>
                              <span className="font-medium min-[380px]:text-right">
                                {template.items.length}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-3 border-t pt-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={template.isActive}
                                onCheckedChange={() =>
                                  handleToggleTemplate(template)
                                }
                              />
                              <span className="text-sm text-muted-foreground">
                                {t('templates.active')}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 min-[380px]:flex-none"
                                onClick={() => {
                                  setSelectedTemplate(template)
                                  setIsTemplateDialogOpen(true)
                                }}
                              >
                                <Edit className="mr-1.5 h-4 w-4" />
                                {tc('edit')}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 min-[380px]:flex-none"
                                onClick={() => handleDeleteTemplate(template)}
                              >
                                <Trash2 className="mr-1.5 h-4 w-4" />
                                {tc('delete')}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            {/* Meter Readings Tab */}
            <TabsContent value="readings" className="space-y-4 sm:space-y-6">
              <div className="flex flex-col gap-3 min-[400px]:flex-row min-[400px]:items-start min-[400px]:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold sm:text-xl">
                    {t('meterReadings.title')}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground text-pretty">
                    {t('meterReadings.recordDesc')}
                  </p>
                </div>
                <Button
                  className="w-full shrink-0 min-[400px]:w-auto"
                  onClick={() => {
                    setSelectedReading(undefined)
                    setIsMeterReadingDialogOpen(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('actions.addReading')}
                </Button>
              </div>

              {meterReadings.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center px-4 py-10 text-center sm:py-12">
                    <p className="text-base font-semibold text-muted-foreground sm:text-lg">
                      {t('empty.readingsTitle')}
                    </p>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground text-pretty">
                      {t('empty.readingsDesc')}
                    </p>
                    <Button
                      onClick={() => {
                        setSelectedReading(undefined)
                        setIsMeterReadingDialogOpen(true)
                      }}
                      className="mt-4 w-full max-w-xs sm:w-auto"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t('actions.addReading')}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                  {meterReadings.map(reading => {
                    const propertyName = resolvePropertyName(
                      reading.propertyId,
                      reading.propertyType,
                    )
                    return (
                      <Card
                        key={reading.id}
                        className="min-w-0 overflow-hidden"
                      >
                        <CardHeader className="space-y-1 p-3 sm:p-6">
                          <CardTitle className="text-base leading-snug sm:text-lg">
                            {propertyName}
                          </CardTitle>
                          <CardDescription className="text-pretty">
                            {reading.month} {reading.year}
                            {(() => {
                              const flatNumber = reading.flatId
                                ? flats.find(f => f.id === reading.flatId)
                                    ?.flatNumber
                                : undefined
                              return flatNumber
                                ? ` • ${t('misc.flatPrefix', { number: flatNumber })}`
                                : null
                            })()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 p-3 pt-0 sm:p-6 sm:pt-0">
                          {reading.electricity !== undefined && (
                            <div className="flex flex-col gap-0.5 text-sm min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between min-[380px]:gap-3">
                              <span className="shrink-0 text-muted-foreground">
                                {t('meterReadings.electricity')}
                              </span>
                              <div className="min-w-0 min-[380px]:text-right">
                                <span className="font-medium">
                                  {t('meterReadings.units', {
                                    count: reading.electricity,
                                  })}
                                </span>
                                {reading.electricityConsumption !==
                                  undefined && (
                                  <Badge
                                    variant="outline"
                                    className="ml-2"
                                  >
                                    +{reading.electricityConsumption}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          {reading.gas !== undefined && (
                            <div className="flex flex-col gap-0.5 text-sm min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between min-[380px]:gap-3">
                              <span className="shrink-0 text-muted-foreground">
                                {t('meterReadings.gas')}
                              </span>
                              <div className="min-w-0 min-[380px]:text-right">
                                <span className="font-medium">
                                  {t('meterReadings.units', {
                                    count: reading.gas,
                                  })}
                                </span>
                                {reading.gasConsumption !== undefined && (
                                  <Badge
                                    variant="outline"
                                    className="ml-2"
                                  >
                                    +{reading.gasConsumption}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          {reading.water !== undefined && (
                            <div className="flex flex-col gap-0.5 text-sm min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between min-[380px]:gap-3">
                              <span className="shrink-0 text-muted-foreground">
                                {t('meterReadings.water')}
                              </span>
                              <div className="min-w-0 min-[380px]:text-right">
                                <span className="font-medium">
                                  {t('meterReadings.units', {
                                    count: reading.water,
                                  })}
                                </span>
                                {reading.waterConsumption !== undefined && (
                                  <Badge
                                    variant="outline"
                                    className="ml-2"
                                  >
                                    +{reading.waterConsumption}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="border-t pt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setSelectedReading(reading)
                                setIsMeterReadingDialogOpen(true)
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              {tc('edit')}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            {/* Automation Tab */}
            <TabsContent value="automation" className="space-y-4 sm:space-y-6">
              <div className="flex flex-col gap-3 min-[400px]:flex-row min-[400px]:items-start min-[400px]:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold sm:text-xl">
                    {t('automation.rulesTitle')}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground text-pretty">
                    {t('automation.rulesDescription')}
                  </p>
                </div>
                <Button
                  className="w-full shrink-0 min-[400px]:w-auto"
                  onClick={() => {
                    setSelectedRule(undefined)
                    setIsRuleDialogOpen(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('actions.createRule')}
                </Button>
              </div>

              {rules.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center px-4 py-10 text-center sm:py-12">
                    <p className="text-base font-semibold text-muted-foreground sm:text-lg">
                      {t('empty.rulesTitle')}
                    </p>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground text-pretty">
                      {t('empty.rulesDesc')}
                    </p>
                    <Button
                      onClick={() => {
                        setSelectedRule(undefined)
                        setIsRuleDialogOpen(true)
                      }}
                      className="mt-4 w-full max-w-xs sm:w-auto"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t('actions.createRule')}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-4">
                  {rules.map(rule => {
                    const template = templates.find(
                      t => t.id === rule.templateId,
                    )
                    return (
                      <Card
                        key={rule.id}
                        className="min-w-0 overflow-hidden"
                      >
                        <CardHeader className="space-y-3 p-3 sm:p-6">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-base leading-snug sm:text-lg">
                                {rule.name}
                              </CardTitle>
                              <CardDescription className="mt-1 text-pretty">
                                {rule.description ||
                                  t('templates.noDescription')}
                              </CardDescription>
                            </div>
                            <Badge
                              variant={
                                rule.isActive ? 'default' : 'secondary'
                              }
                              className="shrink-0"
                            >
                              {rule.isActive
                                ? t('templates.active')
                                : t('templates.inactive')}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4 p-3 pt-0 sm:p-6 sm:pt-0">
                          <div className="space-y-2 text-sm">
                            <div className="flex flex-col gap-0.5 min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between min-[380px]:gap-3">
                              <span className="shrink-0 text-muted-foreground">
                                {t('automation.templateLabel')}
                              </span>
                              <span className="min-w-0 break-words font-medium min-[380px]:text-right">
                                {template?.name || t('misc.notAvailable')}
                              </span>
                            </div>
                            <div className="flex flex-col gap-0.5 min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between min-[380px]:gap-3">
                              <span className="shrink-0 text-muted-foreground">
                                {t('automation.scheduleLabel')}
                              </span>
                              <span className="font-medium capitalize min-[380px]:text-right">
                                {rule.schedule.type}
                                {rule.schedule.type === 'monthly' &&
                                  rule.schedule.dayOfMonth && (
                                    <span>
                                      {' '}
                                      •{' '}
                                      {t('automation.dayOfMonth', {
                                        day: rule.schedule.dayOfMonth,
                                      })}
                                    </span>
                                  )}
                              </span>
                            </div>
                            {rule.nextRun && (
                              <div className="flex flex-col gap-0.5 min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between min-[380px]:gap-3">
                                <span className="shrink-0 text-muted-foreground">
                                  {t('automation.nextRun')}
                                </span>
                                <span className="font-medium min-[380px]:text-right">
                                  {rule.nextRun}
                                </span>
                              </div>
                            )}
                            {rule.lastRun && (
                              <div className="flex flex-col gap-0.5 min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between min-[380px]:gap-3">
                                <span className="shrink-0 text-muted-foreground">
                                  {t('automation.lastRun')}
                                </span>
                                <span className="font-medium min-[380px]:text-right">
                                  {rule.lastRun}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-3 border-t pt-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={rule.isActive}
                                onCheckedChange={() => handleToggleRule(rule)}
                              />
                              <span className="text-sm text-muted-foreground">
                                {t('templates.active')}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 min-[380px]:flex-none"
                                onClick={() => {
                                  setSelectedRule(rule)
                                  setIsRuleDialogOpen(true)
                                }}
                              >
                                <Edit className="mr-1.5 h-4 w-4" />
                                {tc('edit')}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 min-[380px]:flex-none"
                                onClick={() => handleDeleteRule(rule)}
                              >
                                <Trash2 className="mr-1.5 h-4 w-4" />
                                {tc('delete')}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          // Renter view - simple bills list
          <>
            <div className="mb-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t('filters.status')}</span>
              </div>
              <Select
                value={statusFilter}
                onValueChange={value =>
                  setStatusFilter(value as BillStatus | 'all')
                }
              >
                <SelectTrigger className="w-auto min-w-[7.5rem] flex-1 sm:w-[180px] sm:flex-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('filters.all', { count: statusCounts.all })}
                  </SelectItem>
                  <SelectItem value="paid">
                    {t('filters.paid', { count: statusCounts.paid })}
                  </SelectItem>
                  <SelectItem value="unpaid">
                    {t('filters.unpaid', { count: statusCounts.unpaid })}
                  </SelectItem>
                  <SelectItem value="overdue">
                    {t('filters.overdue', { count: statusCounts.overdue })}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredBills.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={t('empty.renterTitle')}
                description={t('empty.renterDesc')}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredBills.map(bill => (
                  <BillCard
                    key={bill.id}
                    bill={bill}
                    onPayNow={handlePayNow}
                    onSchedulePayment={handleSchedulePayment}
                    showTenantName={false}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Dialogs */}
        {isOwner && (
          <>
            <GenerateBillDialog
              open={isGenerateDialogOpen}
              onOpenChange={setIsGenerateDialogOpen}
              onGenerate={handleGenerate}
            />
            <EditBillDialog
              bill={editingBill}
              open={isEditBillOpen}
              onOpenChange={open => {
                setIsEditBillOpen(open)
                if (!open) setEditingBill(null)
              }}
              onSaved={saved => {
                setBills(prev => prev.map(b => (b.id === saved.id ? saved : b)))
              }}
            />
            <BillTemplateDialog
              open={isTemplateDialogOpen}
              onOpenChange={open => {
                setIsTemplateDialogOpen(open)
                if (!open) setSelectedTemplate(undefined)
              }}
              onSubmit={handleTemplateSubmit}
              template={selectedTemplate}
            />
            <MeterReadingDialog
              open={isMeterReadingDialogOpen}
              onOpenChange={open => {
                setIsMeterReadingDialogOpen(open)
                if (!open) setSelectedReading(undefined)
              }}
              onSubmit={handleMeterReadingSubmit}
              reading={selectedReading}
            />
            <BillGenerationRuleDialog
              open={isRuleDialogOpen}
              onOpenChange={open => {
                setIsRuleDialogOpen(open)
                if (!open) setSelectedRule(undefined)
              }}
              onSubmit={handleRuleSubmit}
              rule={selectedRule}
            />
            <BulkBillDialog
              open={isBulkBillDialogOpen}
              onOpenChange={setIsBulkBillDialogOpen}
              onSubmit={handleBulkBillSubmit}
            />
          </>
        )}

        <SchedulePaymentDialog
          payment={null}
          billId={selectedBillForPayment?.id}
          open={isSchedulePaymentDialogOpen}
          onOpenChange={open => {
            setIsSchedulePaymentDialogOpen(open)
            if (!open) setSelectedBillForPayment(null)
          }}
          onSubmit={handleSchedulePaymentSubmit}
        />

        <PayBillDialog
          bill={payBillTarget}
          open={isPayBillOpen}
          onOpenChange={open => {
            setIsPayBillOpen(open)
            if (!open) setPayBillTarget(null)
          }}
          onSuccess={handlePaySuccess}
        />

        <RecordCashPaymentDialog
          bill={cashBillTarget}
          open={isCashDialogOpen}
          onOpenChange={open => {
            setIsCashDialogOpen(open)
            if (!open) setCashBillTarget(null)
          }}
          onSuccess={refreshBills}
        />
      </div>
    </Layout>
  )
}
