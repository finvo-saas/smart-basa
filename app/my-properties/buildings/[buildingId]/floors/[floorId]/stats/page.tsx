'use client'

import { useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Layout } from '@/components/layout/Layout'
import { FloorStats } from '@/components/floor/FloorStats'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/page'
import {
  fetchBuildingById,
  fetchFloorById,
  fetchFloorStats,
} from '@/lib/api/buildings'
import { useMockQuery } from '@/hooks/useMockQuery'
import { ArrowLeft } from 'lucide-react'

export default function FloorStatsPage() {
  const t = useTranslations('portfolio.floors')
  const tf = useTranslations('portfolio.flats')
  const params = useParams()
  const router = useRouter()
  const buildingId = params.buildingId as string
  const floorId = params.floorId as string

  const loadBuilding = useCallback(
    () => fetchBuildingById(buildingId),
    [buildingId]
  )
  const { data: building, loading: buildingLoading } = useMockQuery(loadBuilding)

  const loadFloor = useCallback(() => fetchFloorById(floorId), [floorId])
  const { data: floor, loading: floorLoading } = useMockQuery(loadFloor)

  const loadStats = useCallback(() => fetchFloorStats(floorId), [floorId])
  const { data: stats, loading: statsLoading } = useMockQuery(loadStats)

  const floorName =
    floor?.name ||
    (floor ? tf('floorNumber', { number: floor.floorNumber }) : '')

  if (buildingLoading || floorLoading || statsLoading) {
    return (
      <Layout userRole="owner">
        <div className="container mx-auto px-4 py-8">
          <LoadingState label={t('statistics', { name: '' })} />
        </div>
      </Layout>
    )
  }

  if (!floor || !building || !stats) {
    return (
      <Layout userRole="owner">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">{t('notFound')}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() =>
                  router.push(`/my-properties/buildings/${buildingId}/floors`)
                }
              >
                {t('backToFloors')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout userRole="owner">
      <div className="container mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-6">
        <div className="mb-6 min-w-0">
          <Button
            variant="ghost"
            onClick={() =>
              router.push(`/my-properties/buildings/${buildingId}/floors`)
            }
            className="mb-4 -ml-2 h-auto whitespace-normal"
          >
            <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
            {t('backToFloors')}
          </Button>
          <h1 className="break-words text-xl font-bold sm:text-2xl">
            {t('statistics', { name: floorName })}
          </h1>
          <p className="mt-1 break-words text-muted-foreground">{building.name}</p>
        </div>

        <FloorStats stats={stats} floorName={floorName} />
      </div>
    </Layout>
  )
}
