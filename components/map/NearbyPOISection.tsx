'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { fetchNearbyPOIs } from '@/lib/api/discover'
import type { NearbyPOIResponse, POICategory } from '@/types/living'
import { Button } from '@/components/ui/button'
import {
  Bus,
  GraduationCap,
  Hospital,
  Landmark,
  ShoppingBag,
  TrainFront,
} from 'lucide-react'

const CATEGORIES: POICategory[] = [
  'hospital',
  'school',
  'market',
  'mosque',
  'bus',
  'metro',
]

const ICONS = {
  hospital: Hospital,
  school: GraduationCap,
  market: ShoppingBag,
  mosque: Landmark,
  bus: Bus,
  metro: TrainFront,
}

function hasAnyPois(data: NearbyPOIResponse | null | undefined): boolean {
  if (!data?.pois) return false
  return CATEGORIES.some(key => (data.pois[key] || []).length > 0)
}

export function NearbyPOISection({
  lat,
  lng,
}: {
  lat?: number | null
  lng?: number | null
}) {
  const t = useTranslations('living.poi')
  const canQuery =
    lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)

  const [data, setData] = useState<NearbyPOIResponse | null>(null)
  const [loading, setLoading] = useState(canQuery)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const load = useCallback(
    async (opts?: { soft?: boolean }) => {
      if (!canQuery) {
        setData(null)
        setLoading(false)
        setError(null)
        return
      }

      const id = ++requestId.current
      if (!opts?.soft) {
        setLoading(true)
        setError(null)
      }

      const maxAttempts = 3
      let lastError: string | null = null
      let lastData: NearbyPOIResponse | null = null

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (id !== requestId.current) return
        const result = await fetchNearbyPOIs(Number(lat), Number(lng))
        if (id !== requestId.current) return

        if (!result.ok) {
          lastError = result.error
          // Brief pause then retry (Overpass rate limits / cold start)
          if (attempt < maxAttempts - 1) {
            await new Promise(r => setTimeout(r, 800 * (attempt + 1)))
            continue
          }
          break
        }

        lastData = result.data
        lastError = null
        if (hasAnyPois(result.data)) break
        // Empty payload often means Overpass flake — retry before showing "none"
        if (attempt < maxAttempts - 1) {
          await new Promise(r => setTimeout(r, 900 * (attempt + 1)))
        }
      }

      if (id !== requestId.current) return
      setData(lastData)
      setError(lastError)
      setLoading(false)
    },
    [canQuery, lat, lng],
  )

  useEffect(() => {
    void load()
    return () => {
      // Invalidate in-flight responses from Strict Mode remounts
      requestId.current += 1
    }
  }, [load])

  if (!canQuery) {
    return (
      <section>
        <h2 className="mb-2 text-lg font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      </section>
    )
  }

  const pois = data?.pois
  const found = hasAnyPois(data)

  return (
    <section>
      <h2 className="mb-1 text-lg font-semibold">{t('title')}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{t('subtitle')}</p>
      {loading ? (
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      ) : error ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load()}
          >
            {t('retry')}
          </Button>
        </div>
      ) : !found ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t('none')}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load()}
          >
            {t('retry')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map(key => {
            const items = pois?.[key] || []
            if (!items.length) return null
            const Icon = ICONS[key]
            return (
              <div key={key}>
                <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Icon className="h-4 w-4 text-primary" />
                  {t(key)}
                </p>
                <ul className="space-y-1.5 text-sm">
                  {items.slice(0, 4).map(item => (
                    <li key={`${item.name}-${item.lat}-${item.lng}`}>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-foreground hover:underline"
                      >
                        {item.name}
                      </a>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {t('meters', { m: item.distanceM })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
