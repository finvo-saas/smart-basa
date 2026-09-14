'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Layout } from '@/components/layout/Layout'
import { LoadingState } from '@/components/page'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SearchHistoryItem } from '@/components/search/SearchHistoryItem'
import {
  fetchSearchHistory,
  clearUserSearchHistory,
  deleteSearchHistoryEntry,
} from '@/lib/api/search'
import { getCurrentAccountUserId } from '@/lib/api/account'
import { useMockQuery } from '@/hooks/useMockQuery'
import type { SearchHistory } from '@/types/favorites'
import { Search, Clock, Trash2 } from 'lucide-react'
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

export default function SearchHistoryPage() {
  const router = useRouter()
  const t = useTranslations('search.history')
  const tc = useTranslations('common')
  const [showClearDialog, setShowClearDialog] = useState(false)

  const userId = getCurrentAccountUserId()
  const load = useCallback(() => fetchSearchHistory(userId), [userId])
  const { data: history, loading, refetch } = useMockQuery(load)

  const historyList = history ?? []

  const handleSearch = (historyItem: SearchHistory) => {
    const params = new URLSearchParams()
    if (
      historyItem.filters.propertyType &&
      historyItem.filters.propertyType !== 'all'
    ) {
      params.set('type', historyItem.filters.propertyType)
    }
    if (historyItem.filters.city) {
      params.set('city', historyItem.filters.city)
    }
    if (historyItem.filters.area) {
      params.set('area', historyItem.filters.area)
    }
    if (historyItem.filters.rentRange) {
      params.set('minRent', historyItem.filters.rentRange[0].toString())
      params.set('maxRent', historyItem.filters.rentRange[1].toString())
    }
    if (historyItem.searchQuery) {
      params.set('q', historyItem.searchQuery)
    }
    router.push(`/search?${params.toString()}`)
  }

  const handleRemove = async (id: string) => {
    await deleteSearchHistoryEntry(id)
    refetch()
  }

  const handleClearAll = async () => {
    await clearUserSearchHistory(userId)
    setShowClearDialog(false)
    refetch()
  }

  if (loading) {
    return (
      <Layout>
        <LoadingState label={t('title')} />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-bold sm:text-3xl">{t('title')}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('countInHistory', { count: historyList.length })}
              </p>
            </div>
            <div className="flex w-full min-w-0 gap-2 sm:w-auto">
              {historyList.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 min-w-0 flex-1 sm:flex-none"
                  onClick={() => setShowClearDialog(true)}
                >
                  <Trash2 className="h-4 w-4 shrink-0 sm:mr-2" />
                  <span className="truncate">{tc('clearAll')}</span>
                </Button>
              )}
              <Button
                size="sm"
                className="h-9 min-w-0 flex-1 sm:flex-none"
                onClick={() => router.push('/search')}
              >
                <Search className="h-4 w-4 shrink-0 sm:mr-2" />
                <span className="truncate">{tc('newSearch')}</span>
              </Button>
            </div>
          </div>
        </div>

        {historyList.length === 0 ? (
          <Card className="min-w-0">
            <CardContent className="flex flex-col items-center justify-center px-4 py-10 text-center sm:py-12">
              <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-base font-semibold text-muted-foreground sm:text-lg">
                {t('emptyTitle')}
              </p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                {t('emptyDesc')}
              </p>
              <Button
                className="mt-4 h-9 w-full max-w-xs sm:w-auto"
                onClick={() => router.push('/search')}
              >
                <Search className="mr-2 h-4 w-4 shrink-0" />
                {t('startSearching')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {historyList.map(historyItem => (
              <SearchHistoryItem
                key={historyItem.id}
                history={historyItem}
                onSearch={handleSearch}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}

        <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('clearConfirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('clearConfirmDesc')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearAll}
                className="bg-destructive text-destructive-foreground"
              >
                {tc('clearAll')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  )
}
