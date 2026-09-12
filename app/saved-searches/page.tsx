'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Layout } from '@/components/layout/Layout'
import { EmptyState, LoadingState } from '@/components/page'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SavedSearchCard } from '@/components/search/SavedSearchCard'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  fetchSavedSearches,
  patchSavedSearch,
  deleteSavedSearch,
} from '@/lib/api/search'
import { getCurrentAccountUserId } from '@/lib/api/account'
import { useMockQuery } from '@/hooks/useMockQuery'
import type { SavedSearch } from '@/types/savedSearch'
import { Search, Bell, BellOff, Plus } from 'lucide-react'
import { useConfirm } from '@/components/feedback'
import { finishPendingSavedSearch } from '@/lib/search/pendingSavedSearch'
import { hasAuthTokens } from '@/utils/auth-tokens'

export default function SavedSearchesPage() {
  const { confirm } = useConfirm()
  const router = useRouter()
  const t = useTranslations('search.savedSearches')
  const tc = useTranslations('common')
  const [selectedTab, setSelectedTab] = useState<'all' | 'active' | 'inactive'>(
    'all'
  )
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editName, setEditName] = useState('')

  const userId = getCurrentAccountUserId()
  const load = useCallback(() => fetchSavedSearches(userId), [userId])
  const { data: allSearches, loading, refetch } = useMockQuery(load)
  const [savingPending, setSavingPending] = useState(false)
  const [pendingError, setPendingError] = useState('')

  useEffect(() => {
    if (!hasAuthTokens()) return
    let cancelled = false
    setSavingPending(true)
    void finishPendingSavedSearch().then(async result => {
      if (cancelled) return
      if (result && !result.ok) setPendingError(result.error)
      if (result?.ok) await refetch()
      setSavingPending(false)
    })
    return () => {
      cancelled = true
    }
  }, [refetch])

  const searchesList = allSearches ?? []

  const activeSearches = useMemo(() => {
    return searchesList.filter(search => search.isActive)
  }, [searchesList])

  const inactiveSearches = useMemo(() => {
    return searchesList.filter(search => !search.isActive)
  }, [searchesList])

  const handleToggle = async (id: string, isActive: boolean) => {
    await patchSavedSearch(id, {
      isActive,
      updatedAt: new Date().toISOString(),
    })
    refetch()
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: t('deleteConfirmTitle'),
      description: t('deleteConfirmDesc'),
      variant: 'destructive',
    })
    if (!ok) return
    await deleteSavedSearch(id)
    refetch()
  }

  const handleEdit = (savedSearch: SavedSearch) => {
    setEditingSearch(savedSearch)
    setEditName(savedSearch.name)
    setShowEditDialog(true)
  }

  const handleSaveEdit = async () => {
    if (editingSearch && editName.trim()) {
      await patchSavedSearch(editingSearch.id, {
        name: editName.trim(),
        updatedAt: new Date().toISOString(),
      })
      setShowEditDialog(false)
      setEditingSearch(null)
      setEditName('')
      refetch()
    }
  }

  const handleSearch = (savedSearch: SavedSearch) => {
    const params = new URLSearchParams()
    if (
      savedSearch.filters.propertyType &&
      savedSearch.filters.propertyType !== 'all'
    ) {
      params.set('type', savedSearch.filters.propertyType)
    }
    if (savedSearch.filters.city) {
      params.set('city', savedSearch.filters.city)
    }
    if (savedSearch.filters.area) {
      params.set('area', savedSearch.filters.area)
    }
    params.set('minRent', savedSearch.filters.rentRange[0].toString())
    params.set('maxRent', savedSearch.filters.rentRange[1].toString())
    if (savedSearch.filters.availableOnly) {
      params.set('availableOnly', 'true')
    }
    if (savedSearch.filters.verifiedOnly) {
      params.set('verifiedOnly', 'true')
    }
    router.push(`/search?${params.toString()}`)
  }

  if (loading || savingPending) {
    return (
      <Layout>
        <LoadingState label={t('title')} />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">{t('title')}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('description')}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{t('pushNote')}</p>
              {pendingError ? (
                <p className="mt-2 text-sm text-destructive">{pendingError}</p>
              ) : null}
            </div>
            <Button onClick={() => router.push('/search')}>
              <Plus className="mr-2 h-4 w-4" />
              {tc('newSearch')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('stats.total')}
                  </p>
                  <p className="text-2xl font-bold">{searchesList.length}</p>
                </div>
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('stats.active')}
                  </p>
                  <p className="text-2xl font-bold">{activeSearches.length}</p>
                </div>
                <Bell className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('stats.inactive')}
                  </p>
                  <p className="text-2xl font-bold">
                    {inactiveSearches.length}
                  </p>
                </div>
                <BellOff className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs
          value={selectedTab}
          onValueChange={value =>
            setSelectedTab(value as 'all' | 'active' | 'inactive')
          }
        >
          <TabsList className="w-full justify-start sm:grid sm:grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              {t('tabs.all')} ({searchesList.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {t('tabs.active')} ({activeSearches.length})
            </TabsTrigger>
            <TabsTrigger value="inactive" className="flex items-center gap-2">
              <BellOff className="h-4 w-4" />
              {t('tabs.inactive')} ({inactiveSearches.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {searchesList.length === 0 ? (
              <EmptyState
                icon={Search}
                title={t('emptyAllTitle')}
                description={t('emptyAllDesc')}
              >
                <Button onClick={() => router.push('/search')}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('createSavedSearch')}
                </Button>
              </EmptyState>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {searchesList.map(search => (
                  <SavedSearchCard
                    key={search.id}
                    savedSearch={search}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onSearch={handleSearch}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            {activeSearches.length === 0 ? (
              <EmptyState
                icon={Bell}
                title={t('emptyActiveTitle')}
                description={t('emptyActiveDesc')}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeSearches.map(search => (
                  <SavedSearchCard
                    key={search.id}
                    savedSearch={search}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onSearch={handleSearch}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inactive" className="mt-6">
            {inactiveSearches.length === 0 ? (
              <EmptyState
                icon={BellOff}
                title={t('emptyInactiveTitle')}
                description={t('emptyInactiveDesc')}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inactiveSearches.map(search => (
                  <SavedSearchCard
                    key={search.id}
                    savedSearch={search}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onSearch={handleSearch}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('editTitle')}</DialogTitle>
              <DialogDescription>{t('editDesc')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">{t('searchName')}</Label>
                <Input
                  id="name"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder={t('searchNamePlaceholder')}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowEditDialog(false)
                    setEditingSearch(null)
                    setEditName('')
                  }}
                >
                  {tc('cancel')}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSaveEdit}
                  disabled={!editName.trim()}
                >
                  {tc('save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}
