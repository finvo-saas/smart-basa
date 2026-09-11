'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Layout } from '@/components/layout/Layout'
import { EmptyState, LoadingState } from '@/components/page'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AgreementCard } from '@/components/agreement/AgreementCard'
import { AgreementViewDialog } from '@/components/agreement/AgreementViewDialog'
import { AgreementUploadDialog } from '@/components/agreement/AgreementUploadDialog'
import { ChecklistDialog } from '@/components/checklist/ChecklistDialog'
import { ChecklistViewDialog } from '@/components/checklist/ChecklistViewDialog'
import {
  fetchAgreements,
  fetchActiveAgreement,
  createAgreement,
  patchAgreement,
  signAgreement,
  fetchChecklists,
  createChecklist,
  patchChecklist,
  fetchDocumentBuildings,
} from '@/lib/api/documents'
import { getCurrentAccountUserId } from '@/lib/api/account'
import { uploadMediaFile } from '@/lib/api/media'
import { getStoredRole } from '@/utils/auth'
import { useRouter } from 'next/navigation'
import { FileText, Upload, Plus, ListChecks, AlertCircle } from 'lucide-react'
import type { RentalAgreement } from '@/types/agreement'
import type { Building } from '@/types/building'
import type { Checklist as ChecklistType } from '@/types/checklist'
import { differenceInDays } from 'date-fns'
import { toast } from '@/lib/feedback/toast'

export default function DocumentsPage() {
  const router = useRouter()
  const role = getStoredRole()
  const t = useTranslations('tools.documents')
  const tc = useTranslations('common')

  const userId = getCurrentAccountUserId()
  const [agreements, setAgreements] = useState<RentalAgreement[]>([])
  const [checklists, setChecklists] = useState<ChecklistType[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [activeAgreement, setActiveAgreement] = useState<
    RentalAgreement | undefined
  >(undefined)
  const [selectedAgreement, setSelectedAgreement] =
    useState<RentalAgreement | null>(null)
  const [selectedChecklist, setSelectedChecklist] =
    useState<ChecklistType | null>(null)
  const [isAgreementViewOpen, setIsAgreementViewOpen] = useState(false)
  const [isAgreementUploadOpen, setIsAgreementUploadOpen] = useState(false)
  const [isChecklistDialogOpen, setIsChecklistDialogOpen] = useState(false)
  const [isChecklistViewOpen, setIsChecklistViewOpen] = useState(false)
  const [editingAgreement, setEditingAgreement] =
    useState<RentalAgreement | null>(null)
  const [editingChecklist, setEditingChecklist] =
    useState<ChecklistType | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadDocuments = useCallback(async () => {
    const [agreementsRes, checklistsRes, activeRes, buildingsRes] =
      await Promise.all([
        fetchAgreements(userId),
        fetchChecklists(userId),
        fetchActiveAgreement(userId),
        fetchDocumentBuildings(),
      ])
    if (agreementsRes.ok) setAgreements(agreementsRes.data)
    if (checklistsRes.ok) setChecklists(checklistsRes.data)
    if (activeRes.ok) setActiveAgreement(activeRes.data)
    if (buildingsRes.ok) setBuildings(buildingsRes.data)
  }, [userId])

  useEffect(() => {
    if (role !== 'renter' && role !== 'owner' && role !== 'admin') return
    let mounted = true
    setIsLoading(true)
    loadDocuments().finally(() => {
      if (mounted) setIsLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [role, loadDocuments])

  const moveInChecklist = useMemo(
    () =>
      checklists.find(
        c =>
          c.userId === userId &&
          c.propertyId === (activeAgreement?.propertyId || '') &&
          c.flatId === activeAgreement?.flatId &&
          c.type === 'move_in'
      ),
    [checklists, userId, activeAgreement]
  )

  const moveOutChecklist = useMemo(
    () =>
      checklists.find(
        c =>
          c.userId === userId &&
          c.propertyId === (activeAgreement?.propertyId || '') &&
          c.flatId === activeAgreement?.flatId &&
          c.type === 'move_out'
      ),
    [checklists, userId, activeAgreement]
  )

  const expiringAgreements = useMemo(() => {
    return agreements.filter(agreement => {
      const daysUntilExpiry = differenceInDays(
        new Date(agreement.expiryDate),
        new Date()
      )
      return (
        daysUntilExpiry <= 30 &&
        daysUntilExpiry > 0 &&
        agreement.status === 'active'
      )
    })
  }, [agreements])

  useEffect(() => {
    if (role !== 'renter' && role !== 'owner' && role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [role, router])

  if (role !== 'renter' && role !== 'owner' && role !== 'admin') {
    return null
  }

  if (isLoading) {
    return (
      <Layout userRole={role === 'owner' ? 'owner' : 'renter'}>
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <LoadingState label={tc('loading')} variant="skeleton" />
        </div>
      </Layout>
    )
  }

  const handleAgreementView = (agreement: RentalAgreement) => {
    setSelectedAgreement(agreement)
    setIsAgreementViewOpen(true)
  }

  const handleSignAgreement = async (
    agreementId: string,
    payload: { role: 'tenant' | 'owner'; signature: string; signedName: string },
  ) => {
    const result = await signAgreement(agreementId, payload)
    if (!result.ok) {
      toast.error(result.error)
      return null
    }
    toast.success('Signature saved')
    await loadDocuments()
    setSelectedAgreement(result.data)
    return result.data
  }

  const handleAgreementDownload = (agreement: RentalAgreement) => {
    toast.info(t('downloading', { name: agreement.documentName }))
  }

  const handleAgreementUpload = async (data: Record<string, unknown>) => {
    const file = data.file as File | null | undefined
    // The dialog previews a picked PDF as a base64 data URL — never persist it.
    const shownUrl = (data.documentUrl as string) || ''
    let documentKey = editingAgreement?.documentKey || ''
    let documentUrl = shownUrl.startsWith('data:') ? '' : shownUrl
    if (file) {
      const uploaded = await uploadMediaFile(file, 'document')
      if (!uploaded.ok) {
        toast.error(uploaded.error)
        return
      }
      documentKey = uploaded.data.key || ''
    }
    // Stored documents are private: the API signs a fresh URL from the key,
    // so the URL field only carries externally hosted links.
    if (documentKey) documentUrl = ''
    const prca = data.prcaTerms as
      | import('@/lib/api/documents').PRCATerms
      | undefined
    const terms: RentalAgreement['terms'] = {
      duration: (prca?.duration ?? data.duration) as number,
      noticePeriod: (prca?.noticePeriod ?? data.noticePeriod) as number,
      renewalTerms: (prca?.renewalTerms ?? data.renewalTerms) as string,
      specialConditions: (prca?.specialConditions ??
        data.specialConditions) as string[] | undefined,
      ...(prca
        ? {
            templateKey: prca.templateKey,
            templateName: prca.templateName,
            templateNameBn: prca.templateNameBn,
            maxDepositMonths: prca.maxDepositMonths,
            provisions: prca.provisions,
            warnings: prca.warnings,
            landlordName: prca.landlordName,
            tenantName: prca.tenantName,
            propertyAddress: prca.propertyAddress,
            prcaCompliant: prca.prcaCompliant,
            generatedAt: prca.generatedAt,
          }
        : {}),
    }
    if (editingAgreement) {
      await patchAgreement(editingAgreement.id, {
        ...editingAgreement,
        ...data,
        documentKey,
        documentUrl,
        terms,
      } as RentalAgreement)
    } else {
      await createAgreement({
        userId,
        propertyId: data.propertyId as string,
        flatId: data.flatId as string | undefined,
        propertyName:
          buildings.find(b => b.id === data.propertyId)?.name ||
          'Unknown Property',
        flatNumber: data.flatNumber as string | undefined,
        agreementType: data.agreementType as RentalAgreement['agreementType'],
        startDate: data.startDate as string,
        endDate: data.endDate as string,
        monthlyRent: data.monthlyRent as number,
        securityDeposit: data.securityDeposit as number,
        documentKey,
        documentUrl,
        documentName: data.documentName as string,
        documentSize: data.documentSize as number,
        uploadedAt: new Date().toISOString(),
        uploadedBy: userId,
        expiryDate: data.expiryDate as string,
        renewalReminderDays: data.renewalReminderDays as number[],
        status: 'active',
        terms,
      } as RentalAgreement)
    }
    setEditingAgreement(null)
    await loadDocuments()
  }

  const handleChecklistSubmit = async (data: {
    propertyId: string
    propertyName: string
    flatId?: string
    flatNumber?: string
    type: ChecklistType['type']
    items: ChecklistType['items']
    notes?: string
  }) => {
    const payload = {
      userId,
      propertyId: data.propertyId,
      propertyName: data.propertyName,
      flatId: data.flatId,
      flatNumber: data.flatNumber,
      type: data.type,
      completedAt: new Date().toISOString(),
      completedBy: userId,
      items: data.items,
      photos: [],
      notes: data.notes,
      totalEstimatedValue: data.items.reduce(
        (sum, item) => sum + (item.estimatedValue || 0),
        0
      ),
      totalRepairCost: data.items.reduce(
        (sum, item) => sum + (item.repairCost || 0),
        0
      ),
      securityDepositAmount:
        editingChecklist?.securityDepositAmount ||
        activeAgreement?.securityDeposit ||
        0,
      status: 'completed' as const,
    }
    if (editingChecklist) {
      const result = await patchChecklist(editingChecklist.id, {
        ...editingChecklist,
        ...payload,
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('Checklist updated')
    } else {
      await createChecklist(payload)
    }
    setEditingChecklist(null)
    await loadDocuments()
  }

  return (
    <Layout userRole={role === 'owner' ? 'owner' : 'renter'}>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>

        {expiringAgreements.length > 0 && (
          <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    {t('expiringSoon', { count: expiringAgreements.length })}
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    {t('expiringSoonDesc')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="agreements" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="agreements">
                <FileText className="h-4 w-4 mr-2" />
                {t('tabs.agreements')}
              </TabsTrigger>
              <TabsTrigger value="checklists">
                <ListChecks className="h-4 w-4 mr-2" />
                {t('tabs.checklists')}
              </TabsTrigger>
            </TabsList>
            <Button onClick={() => setIsAgreementUploadOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              {t('uploadAgreement')}
            </Button>
          </div>

          <TabsContent value="agreements" className="space-y-6">
            {agreements.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {agreements.map(agreement => (
                  <AgreementCard
                    key={agreement.id}
                    agreement={agreement}
                    onView={handleAgreementView}
                    onDownload={handleAgreementDownload}
                    onEdit={
                      role === 'owner' || role === 'admin'
                        ? a => {
                            setEditingAgreement(a)
                            setIsAgreementUploadOpen(true)
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title={t('emptyAgreementsTitle')}
                description={t('emptyAgreementsDesc')}
              >
                <Button onClick={() => setIsAgreementUploadOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  {t('uploadAgreement')}
                </Button>
              </EmptyState>
            )}
          </TabsContent>

          <TabsContent value="checklists" className="space-y-6">
            {activeAgreement && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('currentRental')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {activeAgreement.propertyName}
                      </p>
                      {activeAgreement.flatNumber && (
                        <p className="text-sm text-muted-foreground">
                          {t('flat', { number: activeAgreement.flatNumber })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!moveInChecklist && (
                        <Button
                          variant="outline"
                          onClick={() => setIsChecklistDialogOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {t('moveInChecklist')}
                        </Button>
                      )}
                      {moveInChecklist && !moveOutChecklist && (
                        <Button
                          variant="outline"
                          onClick={() => setIsChecklistDialogOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {t('moveOutChecklist')}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {checklists.length > 0 ? (
              <div className="space-y-4">
                {checklists.map(checklist => (
                  <Card key={checklist.id} className="hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <ListChecks className="h-5 w-5" />
                            {checklist.type === 'move_in'
                              ? t('moveInLabel')
                              : t('moveOutLabel')}{' '}
                            {t('tabs.checklists')}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {checklist.propertyName}{' '}
                            {checklist.flatNumber &&
                              `- ${t('flat', { number: checklist.flatNumber })}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedChecklist(checklist)
                              setIsChecklistViewOpen(true)
                            }}
                          >
                            {t('viewDetails')}
                          </Button>
                          {(role === 'owner' || role === 'admin') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingChecklist(checklist)
                                setIsChecklistDialogOpen(true)
                              }}
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t('items')}
                          </p>
                          <p className="text-lg font-bold">
                            {checklist.items.length}
                          </p>
                        </div>
                        {checklist.totalEstimatedValue != null && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {t('totalValue')}
                            </p>
                            <p className="text-lg font-bold">
                              ৳{checklist.totalEstimatedValue.toLocaleString()}
                            </p>
                          </div>
                        )}
                        {checklist.totalRepairCost != null && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {t('repairCost')}
                            </p>
                            <p className="text-lg font-bold text-red-600">
                              ৳{checklist.totalRepairCost.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                      {checklist.items.length > 6 && (
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          {t('moreItems', {
                            count: checklist.items.length - 6,
                          })}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ListChecks}
                title={t('emptyChecklistsTitle')}
                description={t('emptyChecklistsDesc')}
              >
                {activeAgreement && (
                  <Button onClick={() => setIsChecklistDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('createMoveInChecklist')}
                  </Button>
                )}
              </EmptyState>
            )}
          </TabsContent>
        </Tabs>

        <AgreementViewDialog
          agreement={selectedAgreement}
          open={isAgreementViewOpen}
          onOpenChange={setIsAgreementViewOpen}
          onDownload={handleAgreementDownload}
          onSign={handleSignAgreement}
          onSigned={setSelectedAgreement}
        />
        <AgreementUploadDialog
          agreement={editingAgreement}
          open={isAgreementUploadOpen}
          onOpenChange={open => {
            setIsAgreementUploadOpen(open)
            if (!open) setEditingAgreement(null)
          }}
          onSubmit={handleAgreementUpload}
        />
        {(activeAgreement || editingChecklist) && (
          <ChecklistDialog
            checklist={editingChecklist}
            propertyId={
              editingChecklist?.propertyId || activeAgreement!.propertyId
            }
            propertyName={
              editingChecklist?.propertyName || activeAgreement!.propertyName
            }
            flatId={editingChecklist?.flatId || activeAgreement?.flatId}
            flatNumber={
              editingChecklist?.flatNumber || activeAgreement?.flatNumber
            }
            open={isChecklistDialogOpen}
            onOpenChange={open => {
              setIsChecklistDialogOpen(open)
              if (!open) setEditingChecklist(null)
            }}
            onSubmit={handleChecklistSubmit}
          />
        )}
        <ChecklistViewDialog
          checklist={selectedChecklist}
          open={isChecklistViewOpen}
          onOpenChange={setIsChecklistViewOpen}
        />
      </div>
    </Layout>
  )
}
