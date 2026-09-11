'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Layout } from '@/components/layout/Layout'
import { CreateNoticeDialog } from '@/components/notice/CreateNoticeDialog'
import { BulkNoticeDialog } from '@/components/bulk/BulkNoticeDialog'
import { BulkSMSDialog } from '@/components/bulk/BulkSMSDialog'
import { EnhancedNoticeBoard } from '@/components/notice/EnhancedNoticeBoard'
import { Plus, Search, Trash2, CheckCircle2, Pencil } from 'lucide-react'
import {
  fetchAllNotices,
  fetchMessList,
  createNotice,
  patchNotice,
  removeNotice,
  acknowledgeMessNotice,
} from '@/lib/api/mess'
import { createBuildingNotice, removeBuildingNotice } from '@/lib/api/buildingNotices'
import { fetchBuildings } from '@/lib/api/buildings'
import { getCurrentAccountUserId } from '@/lib/api/account'
import { uploadMediaFile, uploadMediaFiles } from '@/lib/api/media'
import { useMockQuery } from '@/hooks/useMockQuery'
import { getStoredRole } from '@/utils/auth'
import type { Notice } from '@/types/mess'
import { format } from 'date-fns'
import { useConfirm } from '@/components/feedback'
import { toast } from '@/lib/feedback/toast'

function isBuildingNotice(notice: Notice): boolean {
  return (
    notice.scopeType === 'building' ||
    notice.source === 'building' ||
    Boolean(notice.buildingId)
  )
}

export default function NoticesPage() {
  const { confirm } = useConfirm()
  const t = useTranslations('tools.notices')
  const tc = useTranslations('common')
  const role = getStoredRole()
  const isOwner = role === 'owner'
  const currentUserId = getCurrentAccountUserId()

  // Unified feed now returns mess + building (+ hotel) from ops.Notice
  const loadNotices = useCallback(() => fetchAllNotices(), [])
  const { data: initialNotices, refetch: refetchNotices } =
    useMockQuery(loadNotices)
  const loadMesses = useCallback(() => fetchMessList(), [])
  const { data: messList } = useMockQuery(loadMesses)
  const messes = messList ?? []
  const loadBuildings = useCallback(() => fetchBuildings(), [])
  const { data: buildingList } = useMockQuery(loadBuildings)
  const buildings = buildingList ?? []

  const [notices, setNotices] = useState<Notice[]>([])
  useEffect(() => {
    if (initialNotices) {
      setNotices(
        initialNotices.map(n => ({
          ...n,
          source: n.scopeType || n.source || (n.buildingId ? 'building' : 'mess'),
        })),
      )
    }
  }, [initialNotices])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [isBulkNoticeDialogOpen, setIsBulkNoticeDialogOpen] = useState(false)
  const [isBulkSMSDialogOpen, setIsBulkSMSDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedScope, setSelectedScope] = useState<string>('all')

  const filteredNotices = useMemo(() => {
    return notices.filter(notice => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !notice.title.toLowerCase().includes(query) &&
          !notice.content.toLowerCase().includes(query)
        ) {
          return false
        }
      }
      if (categoryFilter !== 'all' && notice.category !== categoryFilter) {
        return false
      }
      if (priorityFilter !== 'all' && notice.priority !== priorityFilter) {
        return false
      }
      if (statusFilter === 'active') {
        if (notice.expiryDate && new Date(notice.expiryDate) < new Date()) {
          return false
        }
      } else if (statusFilter === 'expired') {
        if (!notice.expiryDate || new Date(notice.expiryDate) >= new Date()) {
          return false
        }
      }
      if (selectedScope !== 'all') {
        if (selectedScope.startsWith('mess:')) {
          const id = selectedScope.slice(5)
          if ((notice.messId || notice.scopeId) !== id) return false
          if ((notice.scopeType || notice.source) === 'building') return false
        } else if (selectedScope.startsWith('building:')) {
          const id = selectedScope.slice(9)
          if ((notice.buildingId || notice.scopeId) !== id) return false
        }
      }
      return true
    })
  }, [
    notices,
    searchQuery,
    categoryFilter,
    priorityFilter,
    statusFilter,
    selectedScope,
  ])

  const activeNotices = filteredNotices.filter(notice => {
    if (!notice.expiryDate) return true
    return new Date(notice.expiryDate) >= new Date()
  })

  const expiredNotices = filteredNotices.filter(notice => {
    if (!notice.expiryDate) return false
    return new Date(notice.expiryDate) < new Date()
  })

  const handleCreateNotice = async (data: {
    title: string
    content: string
    priority: Notice['priority']
    category: Notice['category']
    expiryDate?: Date
    pdfFile?: File
    imageFiles?: File[]
    targetType: 'mess' | 'building'
    targetId: string
    noticeId?: string
  }) => {
    if (!data.targetId && !data.noticeId) {
      toast.error(t('noPermission'))
      return
    }

    let pdfUrl: string | undefined
    if (data.pdfFile) {
      const uploaded = await uploadMediaFile(data.pdfFile, 'notice')
      if (!uploaded.ok) {
        toast.error(uploaded.error)
        return
      }
      pdfUrl = uploaded.data.url
    }

    let imageUrls: string[] | undefined
    if (data.imageFiles?.length) {
      const uploaded = await uploadMediaFiles(data.imageFiles, 'notice')
      if (!uploaded.ok) {
        toast.error(uploaded.error)
        return
      }
      imageUrls = uploaded.data
    }

    const today = new Date().toISOString().slice(0, 10)
    const expiryIso = data.expiryDate
      ? data.expiryDate.toISOString().slice(0, 10)
      : undefined

    if (data.noticeId) {
      const result = await patchNotice(data.noticeId, {
        title: data.title,
        content: data.content,
        priority: data.priority,
        category: data.category,
        expiryDate: expiryIso,
        ...(pdfUrl ? { pdfUrl } : {}),
        ...(imageUrls ? { imageUrls } : {}),
        date: today,
      })
      if (result.ok) {
        void refetchNotices()
        toast.success('Notice updated')
      } else {
        toast.error(result.error)
      }
      setEditingNotice(null)
      setIsCreateDialogOpen(false)
      return
    }

    if (data.targetType === 'building') {
      const result = await createBuildingNotice(data.targetId, {
        title: data.title,
        content: data.content,
        date: today,
        priority: data.priority,
        category: data.category,
        expiryDate: expiryIso,
        pdfUrl,
        imageUrls,
      })
      if (result.ok) {
        void refetchNotices()
        toast.success(t('published'))
      } else {
        toast.error(result.error)
      }
    } else {
      const result = await createNotice({
        title: data.title,
        content: data.content,
        date: new Date().toISOString(),
        priority: data.priority,
        messId: data.targetId,
        category: data.category,
        expiryDate: data.expiryDate ? data.expiryDate.toISOString() : undefined,
        pdfUrl,
        imageUrls,
        createdBy: currentUserId,
        source: 'mess',
      })
      if (result.ok) {
        void refetchNotices()
        toast.success(t('published'))
      } else {
        toast.error(result.error)
      }
    }
    setIsCreateDialogOpen(false)
  }

  const handleDeleteNotice = async (notice: Notice) => {
    const ok = await confirm({
      title: t('deleteConfirmTitle'),
      description: t('deleteConfirmDesc'),
      variant: 'destructive',
    })
    if (!ok) return
    // Unified detail endpoint works for all scopes
    const result = await removeNotice(notice.id)
    if (result.ok) {
      setNotices(prev => prev.filter(n => n.id !== notice.id))
      void refetchNotices()
    } else {
      // Fallback for any lingering building-only route issues
      const alt = await removeBuildingNotice(notice.id)
      if (alt.ok) {
        setNotices(prev => prev.filter(n => n.id !== notice.id))
        void refetchNotices()
      } else {
        toast.error(result.error)
      }
    }
  }

  const handleAcknowledge = (noticeId: string) => {
    void acknowledgeMessNotice(noticeId, currentUserId).then(result => {
      if (result.ok) {
        setNotices(prev =>
          prev.map(n =>
            n.id === noticeId
              ? {
                  ...result.data,
                  source:
                    result.data.scopeType ||
                    result.data.source ||
                    n.source ||
                    'mess',
                }
              : n,
          ),
        )
      }
    })
  }

  const canCreate =
    isOwner && (messes.length > 0 || buildings.length > 0)

  return (
    <Layout>
      <div className="container mx-auto space-y-6 px-4 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {isOwner ? t('titleManagement') : t('title')}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {isOwner ? t('descriptionManagement') : t('description')}
            </p>
          </div>
          {canCreate && (
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setEditingNotice(null)
                  setIsCreateDialogOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('createNotice')}
              </Button>
              {messes.length > 0 && (
                <>
                  <Button
                    onClick={() => setIsBulkNoticeDialogOpen(true)}
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('bulkNotice')}
                  </Button>
                  <Button
                    onClick={() => setIsBulkSMSDialogOpen(true)}
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('bulkSms')}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{tc('filters')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="sm:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Select value={selectedScope} onValueChange={setSelectedScope}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectMess')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allScopes')}</SelectItem>
                  {messes.map(mess => (
                    <SelectItem key={`mess:${mess.id}`} value={`mess:${mess.id}`}>
                      {mess.name}
                    </SelectItem>
                  ))}
                  {buildings.map(building => (
                    <SelectItem
                      key={`building:${building.id}`}
                      value={`building:${building.id}`}
                    >
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allCategories')}</SelectItem>
                  <SelectItem value="general">{t('categories.general')}</SelectItem>
                  <SelectItem value="payment">{t('categories.payment')}</SelectItem>
                  <SelectItem value="maintenance">
                    {t('categories.maintenance')}
                  </SelectItem>
                  <SelectItem value="event">{t('categories.event')}</SelectItem>
                  <SelectItem value="announcement">
                    {t('categories.announcement')}
                  </SelectItem>
                  <SelectItem value="rule">{t('categories.rule')}</SelectItem>
                  <SelectItem value="other">{t('categories.other')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('priority')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allPriorities')}</SelectItem>
                  <SelectItem value="high">{t('priorities.high')}</SelectItem>
                  <SelectItem value="medium">{t('priorities.medium')}</SelectItem>
                  <SelectItem value="low">{t('priorities.low')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">
              {t('tabs.all')} ({filteredNotices.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              {t('tabs.active')} ({activeNotices.length})
            </TabsTrigger>
            <TabsTrigger value="expired">
              {t('tabs.expired')} ({expiredNotices.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <EnhancedNoticeBoard
              notices={filteredNotices}
              userId={currentUserId}
              onAcknowledge={handleAcknowledge}
              showAcknowledgment={!isOwner}
            />
          </TabsContent>

          <TabsContent value="active" className="mt-4">
            <EnhancedNoticeBoard
              notices={activeNotices}
              userId={currentUserId}
              onAcknowledge={handleAcknowledge}
              showAcknowledgment={!isOwner}
            />
          </TabsContent>

          <TabsContent value="expired" className="mt-4">
            <EnhancedNoticeBoard
              notices={expiredNotices}
              userId={currentUserId}
              onAcknowledge={handleAcknowledge}
              showAcknowledgment={!isOwner}
            />
          </TabsContent>
        </Tabs>

        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle>{t('allNotices')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredNotices.map(notice => {
                  const isExpired =
                    notice.expiryDate &&
                    new Date(notice.expiryDate) < new Date()
                  const ackCount = notice.acknowledgments?.length || 0
                  const scopeLabel = isBuildingNotice(notice)
                    ? notice.buildingName ||
                      notice.scopeName ||
                      t('buildingNotice')
                    : messes.find(m => m.id === notice.messId)?.name ||
                      notice.scopeName ||
                      t('messNotice')

                  return (
                    <div
                      key={notice.id}
                      className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex-1">
                        <div className="mb-2 flex items-start gap-2">
                          <h3 className="font-semibold">{notice.title}</h3>
                          {isExpired && (
                            <Badge
                              variant="outline"
                              className="bg-red-50 text-red-600"
                            >
                              {t('expired')}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {scopeLabel}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span>
                            {format(new Date(notice.date), 'MMM dd, yyyy')}
                          </span>
                          {notice.category && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs">
                                {notice.category}
                              </Badge>
                            </>
                          )}
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {notice.priority}
                          </Badge>
                          {ackCount > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                {t('acknowledged', { count: ackCount })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingNotice(notice)
                            setIsCreateDialogOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handleDeleteNotice(notice)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}

                {filteredNotices.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    <p>{t('noNoticesFound')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {canCreate && (
          <CreateNoticeDialog
            open={isCreateDialogOpen}
            onOpenChange={open => {
              setIsCreateDialogOpen(open)
              if (!open) setEditingNotice(null)
            }}
            messes={messes.map(m => ({ id: m.id, name: m.name }))}
            buildings={buildings.map(b => ({ id: b.id, name: b.name }))}
            notice={editingNotice}
            defaultTargetId={
              selectedScope !== 'all'
                ? selectedScope.split(':')[1]
                : messes[0]?.id || buildings[0]?.id
            }
            onSubmit={handleCreateNotice}
          />
        )}
        <BulkNoticeDialog
          open={isBulkNoticeDialogOpen}
          onOpenChange={setIsBulkNoticeDialogOpen}
          onSubmit={data => {
            toast.success(
              t('bulkNoticeSuccess', {
                target: data.buildingId || data.messId ? 'multiple' : 'all',
              }),
            )
          }}
        />
        <BulkSMSDialog
          open={isBulkSMSDialogOpen}
          onOpenChange={setIsBulkSMSDialogOpen}
          onSubmit={data => {
            toast.success(t('bulkSmsSuccess', { target: data.recipientType }))
          }}
        />
      </div>
    </Layout>
  )
}
