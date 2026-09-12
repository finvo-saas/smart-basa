'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Search, Sparkles, Loader2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AISearchBarProps {
  onSearch: (query: string) => void
  /** Sentence currently in the URL, so a refresh keeps the typed search. */
  queryFromUrl?: string
  loading?: boolean
  parsedQuery?: {
    area: string | null
    city: string | null
    type: string | null
    gender: string | null
    budgetMin: number | null
    budgetMax: number | null
    facilities: string[]
  } | null
}

export function AISearchBar({
  onSearch,
  queryFromUrl = '',
  loading,
  parsedQuery,
}: AISearchBarProps) {
  const t = useTranslations('search')
  const [query, setQuery] = useState(queryFromUrl)
  const previousUrlQuery = useRef(queryFromUrl)
  const examples = t.raw('page.ai.examples') as string[]

  useEffect(() => {
    if (queryFromUrl) {
      setQuery(queryFromUrl)
    } else if (previousUrlQuery.current) {
      setQuery('')
    }
    previousUrlQuery.current = queryFromUrl
  }, [queryFromUrl])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (query.trim()) onSearch(query.trim())
    },
    [query, onSearch],
  )

  return (
    <div className="min-w-0 space-y-3">
      <form
        onSubmit={handleSubmit}
        className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center"
      >
        <div className="relative min-w-0 flex-1">
          <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('page.ai.placeholder')}
            className={cn(
              'h-12 w-full min-w-0 pl-10 text-sm sm:text-base',
              query ? 'pr-10' : 'pr-3',
            )}
            aria-label={t('page.ai.placeholder')}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={t('page.ai.clear')}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <Button
          type="submit"
          disabled={!query.trim() || loading}
          className="h-12 w-full shrink-0 sm:w-auto sm:px-5"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {loading ? t('page.ai.matching') : t('page.ai.match')}
        </Button>
      </form>

      {parsedQuery && (
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {parsedQuery.area && (
            <Badge variant="secondary">📍 {parsedQuery.area}</Badge>
          )}
          {parsedQuery.city && (
            <Badge variant="secondary">🏙️ {parsedQuery.city}</Badge>
          )}
          {parsedQuery.type && (
            <Badge variant="secondary">🏠 {parsedQuery.type}</Badge>
          )}
          {parsedQuery.gender && (
            <Badge variant="secondary">👤 {parsedQuery.gender}</Badge>
          )}
          {parsedQuery.budgetMin != null && (
            <Badge variant="secondary">
              💰 ৳{Math.round(parsedQuery.budgetMin).toLocaleString()}
              {parsedQuery.budgetMax
                ? ` – ৳${Math.round(parsedQuery.budgetMax).toLocaleString()}`
                : ''}
            </Badge>
          )}
          {parsedQuery.facilities.map(f => (
            <Badge key={f} variant="outline">
              ✓ {f}
            </Badge>
          ))}
        </div>
      )}

      {!parsedQuery && (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{t('page.ai.try')}</span>
          {examples.map(example => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setQuery(example)
                onSearch(example)
              }}
              className="max-w-full truncate rounded-full border border-dashed px-2.5 py-1 text-left text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {example}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
