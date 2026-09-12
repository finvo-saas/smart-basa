'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Building2, Hotel, Search, UtensilsCrossed } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const CATEGORIES = [
  { href: '/search?category=all', key: 'all', icon: Search },
  { href: '/search?category=apartment', key: 'apartment', icon: Building2 },
  { href: '/search?category=mess', key: 'mess', icon: UtensilsCrossed },
  { href: '/search?category=hotel', key: 'hotel', icon: Hotel },
] as const

export function QuickExploreBar() {
  const t = useTranslations('home.live')
  const router = useRouter()
  const [query, setQuery] = useState('')

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const city = query.trim()
    const params = new URLSearchParams({ category: 'all' })
    if (city) params.set('city', city)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="relative z-10 mx-auto -mt-5 max-w-4xl px-3 sm:-mt-8 sm:px-6 lg:px-8">
      <div className="rounded-2xl border bg-background/95 p-2.5 shadow-lg backdrop-blur sm:p-4">
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3"
        >
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="h-11 pl-9"
              aria-label={t('searchPlaceholder')}
            />
          </div>
          <Button type="submit" size="lg" className="h-11 w-full shrink-0 sm:w-auto">
            {t('searchCta')}
          </Button>
        </form>
        <div className="mt-2.5 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
          {CATEGORIES.map(item => {
            const Icon = item.icon
            return (
              <Button
                key={item.key}
                variant="secondary"
                size="sm"
                asChild
                className="h-8 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm"
              >
                <Link href={item.href}>
                  <Icon className="mr-1 h-3.5 w-3.5 shrink-0 sm:mr-1.5" />
                  {t(`categories.${item.key}`)}
                </Link>
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
