'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/page'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OwnerPaymentAnalyticsPanel } from '@/components/payment/OwnerPaymentAnalytics'
import { PayoutLedgerTable } from '@/components/payment/PayoutLedgerTable'
import { CommissionBreakdownCard } from '@/components/payment/CommissionBreakdownCard'
import {
  fetchCollectionReport,
  fetchCollectionSettings,
  fetchGatewayCredentials,
  fetchOwnerLedger,
  fetchOwnerPaymentAnalytics,
  fetchOwnerPayouts,
  fetchPaymentClaims,
  reviewPaymentClaim,
  updateCollectionSettings,
  upsertGatewayCredential,
} from '@/lib/api/payments'
import { getDemoOwnerId } from '@/lib/api/demoUser'
import { useMockQuery } from '@/hooks/useMockQuery'
import { useAppFormat } from '@/hooks/useAppFormat'
import {
  BarChart3,
  Check,
  ClipboardList,
  FileText,
  Settings2,
  Wallet,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import type { CollectionMode } from '@/types/payment'

export function OwnerPaymentsPanel() {
  const t = useTranslations('payments.owner')
  const ownerId = getDemoOwnerId()
  const initialTab =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('tab') || 'ledger'
      : 'ledger'
  const { formatCurrency, formatNumber } = useAppFormat()

  const loadAnalytics = useCallback(
    () => fetchOwnerPaymentAnalytics(ownerId),
    [ownerId]
  )
  const loadPayouts = useCallback(() => fetchOwnerPayouts(ownerId), [ownerId])
  const loadLedger = useCallback(() => fetchOwnerLedger(), [])
  const loadClaims = useCallback(
    () => fetchPaymentClaims({ ownerView: true, status: 'pending' }),
    []
  )
  const loadSettings = useCallback(() => fetchCollectionSettings(), [])
  const loadGateways = useCallback(() => fetchGatewayCredentials(), [])
  const loadReport = useCallback(() => fetchCollectionReport(), [])

  const { data: analytics, refetch: refetchAnalytics } =
    useMockQuery(loadAnalytics)
  const { data: payoutData, refetch: refetchPayouts } = useMockQuery(loadPayouts)
  const { data: ledgerData, refetch: refetchLedger } = useMockQuery(loadLedger)
  const { data: claimsData, refetch: refetchClaims } = useMockQuery(loadClaims)
  const { data: settings, refetch: refetchSettings } = useMockQuery(loadSettings)
  const { data: gateways, refetch: refetchGateways } = useMockQuery(loadGateways)
  const { data: report, refetch: refetchReport } = useMockQuery(loadReport)

  const payouts = payoutData ?? []
  const ledger = ledgerData ?? []
  const claims = claimsData ?? []
  const showPlatformPayouts = Boolean(analytics?.showsPlatformPayouts)

  const [mode, setMode] = useState<CollectionMode>('manual')
  const [bkash, setBkash] = useState('')
  const [nagad, setNagad] = useState('')
  const [rocket, setRocket] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [platformCollect, setPlatformCollect] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [gwGateway, setGwGateway] = useState<'bkash' | 'nagad' | 'rocket'>(
    'bkash'
  )
  const [gwMerchant, setGwMerchant] = useState('')
  const [gwAppKey, setGwAppKey] = useState('')
  const [gwAppSecret, setGwAppSecret] = useState('')

  useEffect(() => {
    if (!settings) return
    setMode(settings.collectionMode)
    setPlatformCollect(settings.platformCollectEnabled)
    setBkash(settings.instructions?.bkashNumber || '')
    setNagad(settings.instructions?.nagadNumber || '')
    setRocket(settings.instructions?.rocketNumber || '')
    setBankName(settings.instructions?.bankName || '')
    setBankAccount(settings.instructions?.bankAccountNumber || '')
    setBankAccountName(settings.instructions?.bankAccountName || '')
    setPaymentNote(settings.instructions?.paymentNote || '')
  }, [settings])

  const refreshAll = useCallback(() => {
    refetchAnalytics()
    refetchPayouts()
    refetchLedger()
    refetchClaims()
    refetchSettings()
    refetchGateways()
    refetchReport()
  }, [
    refetchAnalytics,
    refetchPayouts,
    refetchLedger,
    refetchClaims,
    refetchSettings,
    refetchGateways,
    refetchReport,
  ])

  const saveSettings = async () => {
    setSavingSettings(true)
    const result = await updateCollectionSettings({
      collectionMode: mode,
      platformCollectEnabled: platformCollect,
      instructions: {
        bkashNumber: bkash,
        nagadNumber: nagad,
        rocketNumber: rocket,
        bankName,
        bankAccountNumber: bankAccount,
        bankAccountName,
        paymentNote,
      },
    })
    setSavingSettings(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('Collection settings saved')
    refreshAll()
  }

  const saveGateway = async () => {
    const result = await upsertGatewayCredential({
      gateway: gwGateway,
      merchantNumber: gwMerchant,
      credentials: {
        ...(gwAppKey ? { app_key: gwAppKey } : {}),
        ...(gwAppSecret ? { app_secret: gwAppSecret } : {}),
      },
      isActive: true,
      isSandbox: true,
    })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('Owner gateway connected')
    setGwAppKey('')
    setGwAppSecret('')
    refreshAll()
  }

  const onReviewClaim = async (id: string, approve: boolean) => {
    const result = await reviewPaymentClaim(id, {
      approve,
      reason: approve ? '' : 'Rejected by owner',
    })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(approve ? 'Payment confirmed' : 'Claim rejected')
    refreshAll()
  }

  const defaultTab = useMemo(() => {
    const allowed = new Set([
      'ledger',
      'claims',
      'report',
      'settings',
      'payouts',
      'analytics',
    ])
    return allowed.has(initialTab) ? initialTab : 'ledger'
  }, [initialTab])

  const latest = payouts[0]

  return (
    <>
      <PageHeader
        title={
          showPlatformPayouts ? t('panelTitle') : 'Collection ledger'
        }
        description={
          showPlatformPayouts
            ? t('panelDescription')
            : 'Record money you already received. Smart Living does not hold rent or mess dues.'
        }
        actions={
          <Button variant="outline" asChild>
            <Link href="/bills">
              <FileText className="mr-2 h-4 w-4" />
              {t('manageBills')}
            </Link>
          </Button>
        }
      />

      {showPlatformPayouts && latest && (
        <div className="mb-6">
          <CommissionBreakdownCard
            grossAmount={latest.grossAmount}
            commissionRate={latest.commissionRate}
            commissionAmount={latest.commissionAmount}
            netAmount={latest.netAmount}
          />
        </div>
      )}

      {!showPlatformPayouts && analytics && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Marked received</CardDescription>
              <CardTitle className="text-xl">
                {formatCurrency(analytics.markedReceived ?? analytics.totalCollected)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Mess deposits</CardDescription>
              <CardTitle className="text-xl">
                {formatCurrency(analytics.messDepositsConfirmed ?? 0)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Outstanding bills</CardDescription>
              <CardTitle className="text-xl">
                {formatCurrency(analytics.outstandingBills ?? 0)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending claims</CardDescription>
              <CardTitle className="text-xl">
                {formatNumber(analytics.pendingClaims ?? 0)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="ledger">
            <Wallet className="mr-2 h-4 w-4" />
            Ledger
          </TabsTrigger>
          <TabsTrigger value="claims">
            <ClipboardList className="mr-2 h-4 w-4" />
            Claims
          </TabsTrigger>
          <TabsTrigger value="report">
            <FileText className="mr-2 h-4 w-4" />
            Report
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings2 className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
          {showPlatformPayouts && (
            <>
              <TabsTrigger value="payouts">
                <Wallet className="mr-2 h-4 w-4" />
                {t('payoutLedger')}
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="mr-2 h-4 w-4" />
                {t('analytics')}
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="ledger" className="space-y-3">
          {ledger.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No receipts yet. Record payments from Bills, or confirm member
              claims.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-3">Bill</th>
                    <th className="p-3">Tenant</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">TrxID</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map(row => (
                    <tr key={row.id} className="border-t">
                      <td className="p-3">{row.billName}</td>
                      <td className="p-3">{row.tenantName || '—'}</td>
                      <td className="p-3">{row.paymentMethod}</td>
                      <td className="p-3 font-mono text-xs">
                        {row.transactionId}
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(row.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="claims" className="space-y-3">
          {claims.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No pending claims. When a renter pays cash or submits “I paid”,
              confirm or reject here.
            </p>
          ) : (
            claims.map(claim => (
              <Card key={claim.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {claim.tenantName || 'Tenant'} ·{' '}
                    {formatCurrency(claim.amount)}
                  </CardTitle>
                  <CardDescription>
                    {claim.propertyName} · {claim.paymentMethod}
                    {claim.transactionId
                      ? ` · Trx ${claim.transactionId}`
                      : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button size="sm" onClick={() => onReviewClaim(claim.id, true)}>
                    <Check className="mr-1 h-4 w-4" />
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReviewClaim(claim.id, false)}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Reject
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="report" className="space-y-3">
          {report ? (
            <>
              <p className="text-sm text-muted-foreground">
                {report.year}-{String(report.month).padStart(2, '0')} ·{' '}
                {formatNumber(report.count)} receipts ·{' '}
                {formatCurrency(report.total)}
              </p>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-3">Source</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Method</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map(row => (
                      <tr key={`${row.source}-${row.id}`} className="border-t">
                        <td className="p-3">{row.source}</td>
                        <td className="p-3">
                          {row.tenantName || row.label}
                        </td>
                        <td className="p-3">{row.paymentMethod}</td>
                        <td className="p-3 text-right">
                          {formatCurrency(row.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No report data.</p>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How you collect money</CardTitle>
              <CardDescription>
                Default for Bangladesh: you collect on your bKash/Nagad/cash.
                Platform collect is opt-in only (hotels / managed service).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Collection mode</Label>
                <Select
                  value={mode}
                  onValueChange={v => setMode(v as CollectionMode)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">
                      Manual ledger (recommended)
                    </SelectItem>
                    <SelectItem value="owner_gateway">
                      Owner merchant gateway
                    </SelectItem>
                    <SelectItem value="platform_collect">
                      Platform collect (opt-in)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {mode === 'platform_collect' && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={platformCollect}
                    onChange={e => setPlatformCollect(e.target.checked)}
                  />
                  I understand Smart Living may settle money with commission
                </label>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>bKash number</Label>
                  <Input value={bkash} onChange={e => setBkash(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Nagad number</Label>
                  <Input value={nagad} onChange={e => setNagad(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Rocket number</Label>
                  <Input
                    value={rocket}
                    onChange={e => setRocket(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bank name</Label>
                  <Input
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bank account</Label>
                  <Input
                    value={bankAccount}
                    onChange={e => setBankAccount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account name</Label>
                  <Input
                    value={bankAccountName}
                    onChange={e => setBankAccountName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Note on bills</Label>
                <Textarea
                  rows={2}
                  value={paymentNote}
                  onChange={e => setPaymentNote(e.target.value)}
                  placeholder="e.g. Send money to personal bKash and share TrxID"
                />
              </div>
              <Button onClick={saveSettings} disabled={savingSettings}>
                {savingSettings ? 'Saving…' : 'Save settings'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Owner gateway (optional)</CardTitle>
              <CardDescription>
                Connect your merchant credentials so checkout settles to you —
                not the platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(gateways ?? []).length > 0 && (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {(gateways ?? []).map(g => (
                    <li key={g.id}>
                      {g.gateway} · {g.merchantNumber || 'no merchant #'} ·{' '}
                      {g.isActive ? 'active' : 'inactive'}
                      {g.isSandbox ? ' (sandbox)' : ''}
                    </li>
                  ))}
                </ul>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Gateway</Label>
                  <Select
                    value={gwGateway}
                    onValueChange={v =>
                      setGwGateway(v as 'bkash' | 'nagad' | 'rocket')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bkash">bKash</SelectItem>
                      <SelectItem value="nagad">Nagad</SelectItem>
                      <SelectItem value="rocket">Rocket</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Merchant number</Label>
                  <Input
                    value={gwMerchant}
                    onChange={e => setGwMerchant(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>App key</Label>
                  <Input
                    value={gwAppKey}
                    onChange={e => setGwAppKey(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>App secret</Label>
                  <Input
                    type="password"
                    value={gwAppSecret}
                    onChange={e => setGwAppSecret(e.target.value)}
                  />
                </div>
              </div>
              <Button variant="outline" onClick={saveGateway}>
                Save gateway credentials
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {showPlatformPayouts && (
          <>
            <TabsContent value="payouts">
              <PayoutLedgerTable payouts={payouts} onUpdated={refreshAll} />
            </TabsContent>
            <TabsContent value="analytics">
              {analytics && (
                <OwnerPaymentAnalyticsPanel analytics={analytics} />
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </>
  )
}
