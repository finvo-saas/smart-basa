'use client'

import { useState, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FloorCard } from '@/components/floor/FloorCard'
import { FloorDialog } from '@/components/floor/FloorDialog'
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
import {
  fetchBuildingById,
  fetchFloorsByBuilding,
  createFloor,
  patchFloor,
  removeFloor,
} from '@/lib/api/buildings'
import { useMockQuery } from '@/hooks/useMockQuery'
import type { Floor, FloorFormData } from '@/types/floor'
import { Plus, Building2 } from 'lucide-react'

export default function FloorsPage() {
  const t = useTranslations('portfolio.floors')
  const tb = useTranslations('portfolio.buildings')
  const tc = useTranslations('common')
  const params = useParams()
  const router = useRouter()
  const buildingId = params.buildingId as string

  const loadBuilding = useCallback(
    () => fetchBuildingById(buildingId),
    [buildingId]
  )
  const { data: building } = useMockQuery(loadBuilding)

  const loadFloors = useCallback(
    () => fetchFloorsByBuilding(buildingId),
    [buildingId]
  )
  const { data: floorsData, refetch: refetchFloors } = useMockQuery(loadFloors)
  const floors = floorsData ?? []

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null)
  const [deleteFloorData, setDeleteFloorData] = useState<Floor | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleAddFloor = () => {
    setSelectedFloor(null)
    setIsDialogOpen(true)
  }

  const handleEditFloor = (floor: Floor) => {
    setSelectedFloor(floor)
    setIsDialogOpen(true)
  }

  const handleDeleteFloor = (floor: Floor) => {
    setDeleteFloorData(floor)
    setIsDeleteDialogOpen(true)
  }

  const handleSubmit = async (data: FloorFormData) => {
    if (selectedFloor) {
      await patchFloor(selectedFloor.id, data)
    } else {
      await createFloor(buildingId, data)
    }
    void refetchFloors()
  }

  const handleConfirmDelete = async () => {
    if (deleteFloorData) {
      await removeFloor(deleteFloorData.id)
      setIsDeleteDialogOpen(false)
      setDeleteFloorData(null)
      void refetchFloors()
    }
  }

  const tf = useTranslations('portfolio.flats')
  const deleteFloorName =
    deleteFloorData?.name ||
    (deleteFloorData
      ? tf('floorNumber', { number: deleteFloorData.floorNumber })
      : '')

  if (!building) {
    return (
      <Layout userRole="owner">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">{tb('notFoundTitle')}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/my-properties')}
              >
                {tb('backToBuildings')}
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
        {/* Header */}
        <div className="mb-6">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <Button
                variant="ghost"
                className="mb-2 -ml-2 h-auto whitespace-normal px-2"
                onClick={() => router.push('/my-properties')}
              >
                {t('backToBuildings')}
              </Button>
              <h1 className="flex min-w-0 items-start gap-2 break-words text-xl font-bold sm:text-2xl">
                <Building2 className="mt-0.5 h-6 w-6 shrink-0" />
                <span className="min-w-0">{t('titleSuffix', { name: building.name })}</span>
              </h1>
              <p className="mt-1 text-muted-foreground">{t('manageDesc')}</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() =>
                  router.push(`/my-properties/buildings/${buildingId}/flats`)
                }
              >
                {t('allFlats')}
              </Button>
              <Button className="w-full sm:w-auto" onClick={handleAddFloor}>
                <Plus className="mr-2 h-4 w-4" />
                {t('addFloor')}
              </Button>
            </div>
          </div>
        </div>

        {/* Floors Grid */}
        {floors.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {floors.map(floor => (
              <FloorCard
                key={floor.id}
                floor={floor}
                buildingName={building.name}
                onEdit={handleEditFloor}
                onDelete={handleDeleteFloor}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">{t('emptyFloors')}</p>
              <Button onClick={handleAddFloor}>
                <Plus className="h-4 w-4 mr-2" />
                {t('addFirstFloor')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dialogs */}
        <FloorDialog
          floor={selectedFloor}
          buildingId={buildingId}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={handleSubmit}
        />

        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('deleteDesc', { name: deleteFloorName })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tc('actions.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {tc('delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  )
}
