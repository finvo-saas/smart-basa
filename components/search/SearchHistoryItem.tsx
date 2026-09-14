'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Clock, X, MapPin, DollarSign } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import type { SearchHistory } from '@/types/favorites'

interface SearchHistoryItemProps {
  history: SearchHistory
  onSearch: (history: SearchHistory) => void
  onRemove: (id: string) => void
}

export function SearchHistoryItem({
  history,
  onSearch,
  onRemove,
}: SearchHistoryItemProps) {
  const t = useTranslations('search.history')
  const tc = useTranslations('common')

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

      if (diffInHours < 24 * 7) {
        return formatDistanceToNow(date, { addSuffix: true })
      }
      return format(date, 'MMM d, yyyy')
    } catch {
      return ''
    }
  }

  const getFilterSummary = () => {
    const parts: string[] = []
    if (
      history.filters.propertyType &&
      history.filters.propertyType !== 'all'
    ) {
      parts.push(history.filters.propertyType)
    }
    if (history.filters.city) {
      parts.push(history.filters.city)
    }
    if (history.filters.area) {
      parts.push(history.filters.area)
    }
    return parts.length > 0 ? parts.join(' • ') : 'All properties'
  }

  return (
    <Card className="flex h-full min-w-0 flex-col overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="flex h-full flex-col gap-3 p-3 pt-3 sm:p-4 sm:pt-4">
        <div className="min-w-0 flex-1">
          {history.searchQuery ? (
            <div className="mb-2">
              <p className="mb-1 line-clamp-2 break-words text-sm font-semibold">
                &ldquo;{history.searchQuery}&rdquo;
              </p>
              <p className="line-clamp-2 break-words text-xs text-muted-foreground">
                {getFilterSummary()}
              </p>
            </div>
          ) : (
            <p className="mb-2 line-clamp-2 break-words text-sm font-semibold">
              {getFilterSummary()}
            </p>
          )}

          <div className="space-y-1 text-xs text-muted-foreground">
            {history.filters.rentRange && (
              <div className="flex min-w-0 items-center gap-2">
                <DollarSign className="h-3 w-3 shrink-0" />
                <span className="min-w-0 truncate">
                  ৳{history.filters.rentRange[0].toLocaleString()} – ৳
                  {history.filters.rentRange[1].toLocaleString()}
                </span>
              </div>
            )}
            {history.filters.city && (
              <div className="flex min-w-0 items-center gap-2">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="min-w-0 truncate">
                  {history.filters.area ? `${history.filters.area}, ` : ''}
                  {history.filters.city}
                </span>
              </div>
            )}
          </div>

          <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <Badge variant="secondary" className="text-xs">
              {history.resultCount}{' '}
              {history.resultCount === 1 ? 'result' : 'results'}
            </Badge>
            <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0" />
              <span className="truncate">{formatTime(history.searchedAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="h-9 min-w-0 flex-1"
            onClick={() => onSearch(history)}
          >
            <Search className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">{t('runAgain')}</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            aria-label={tc('delete')}
            onClick={() => onRemove(history.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
