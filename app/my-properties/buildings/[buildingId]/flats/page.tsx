'use client'

import { Suspense, useState, useMemo, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Layout } from '@/components/layout/Layout'
import {
  PageContainer,
  PageHeader,
  EmptyState,
  LoadingState,
} from '@/components/page'
import { FlatCard } from '@/components/flat/FlatCard'
import { FlatDetailDialog } from '@/components/flat/FlatDetailDialog'
import { FlatFormDialog, type FlatFormValues } from '@/components/flat/FlatFormDialog'
import { AssignRenterDialog, type AssignRenterPayload } from '@/components/flat/AssignRenterDialog'
import {
  VacateFlatDialog,
  type VacateFlatValues,
} from '@/components/flat/VacateFlatDialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { ArrowLeft, Filter, Layers, Plus } from 'lucide-react'
import {
  fetchBuildingById,
  fetchFlatsByBuilding,
  assignRenter,
  patchFlatTenancy,
  createFlat,
  patchFlat,
  deleteFlat,
  vacateFlat,
  ensureFlatListing,
} from '@/lib/api/buildings'
import { useMockQuery } from '@/hooks/useMockQuery'
import type { Flat, FlatStatus } from '@/types/building'
import { useAppFormat } from '@/hooks/useAppFormat'

function FlatsPageContent() {
  const t = useTranslations('portfolio.flats')
  const tb = useTranslations('portfolio.buildings')
  const tc = useTranslations('common')
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const buildingId = params.buildingId as string
  const floorFromQuery = searchParams.get('floor')
  const { formatCurrency } = useAppFormat()

  const loadBuilding = useCallback(
    () => fetchBuildingById(buildingId),
    [buildingId],
  )
  const { data: building } = useMockQuery(loadBuilding)

  const loadFlats = useCallback(
    () => fetchFlatsByBuilding(buildingId),
    [buildingId],
  )
  const { data: fetchedFlats, refetch } = useMockQuery(loadFlats)

  const [localFlats, setLocalFlats] = useState<Flat[] | null>(null)
  const flats = localFlats ?? fetchedFlats ?? []
  const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [assignFlat, setAssignFlat] = useState<Flat | null>(null)
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [assignMode, setAssignMode] = useState<'assign' | 'edit'>('assign')
  const [formFlat, setFormFlat] = useState<Flat | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [vacateTarget, setVacateTarget] = useState<Flat | null>(null)
  const [isVacateOpen, setIsVacateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Flat | null>(null)
  const [statusFilter, setStatusFilter] = useState<FlatStatus | 'all'>('all')
  const [floorFilter, setFloorFilter] = useState<string>(floorFromQuery || 'all')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [publishingId, setPublishingId] = useState<string | null>(null)

  useEffect(() => {
    if (fetchedFlats) setLocalFlats(fetchedFlats)
  }, [fetchedFlats])

  useEffect(() => {
    if (floorFromQuery) setFloorFilter(floorFromQuery)
  }, [floorFromQuery])

  const floors = useMemo(
    () => Array.from(new Set(flats.map(f => f.floor))).sort((a, b) => a - b),
    [flats],
  )

  const filteredFlats = useMemo(() => {
    let list = [...flats]
    if (statusFilter !== 'all') {
      list = list.filter(f => f.status === statusFilter)
    }
    if (floorFilter !== 'all') {
      list = list.filter(f => f.floor === Number(floorFilter))
    }
    return list
  }, [flats, statusFilter, floorFilter])

  const statusCounts = {
    all: flats.length,
    available: flats.filter(f => f.status === 'available').length,
    occupied: flats.filter(f => f.status === 'occupied').length,
    maintenance: flats.filter(f => f.status === 'maintenance').length,
  }

  const occupancyPct =
    statusCounts.all > 0
      ? Math.round((statusCounts.occupied / statusCounts.all) * 100)
      : 0

  const totalRent = flats.reduce((sum, f) => sum + (f.rent || 0), 0)
  const occupiedRent = flats
    .filter(f => f.status === 'occupied')
    .reduce((sum, f) => sum + (f.rent || 0), 0)

  const upsertLocal = (updated: Flat) => {
    setLocalFlats(prev => {
      const base = prev ?? fetchedFlats ?? []
      const idx = base.findIndex(f => f.id === updated.id)
      if (idx === -1) return [...base, updated]
      return base.map(f => (f.id === updated.id ? updated : f))
    })
    setSelectedFlat(prev => (prev?.id === updated.id ? updated : prev))
  }

  const removeLocal = (flatId: string) => {
    setLocalFlats(prev => (prev ?? fetchedFlats ?? []).filter(f => f.id !== flatId))
    setSelectedFlat(prev => (prev?.id === flatId ? null : prev))
  }

  const handleViewDetails = (flat: Flat) => {
    setSelectedFlat(flat)
    setIsDialogOpen(true)
  }

  const handleAssignRenter = (flat: Flat) => {
    setAssignMode('assign')
    setAssignFlat(flat)
    setIsDialogOpen(false)
    setIsAssignOpen(true)
  }

  const handleEditRenter = (flat: Flat) => {
    setAssignMode('edit')
    setAssignFlat(flat)
    setIsDialogOpen(false)
    setIsAssignOpen(true)
  }

  const handleAssignSubmit = async (flat: Flat, renter: AssignRenterPayload) => {
    setErrorMessage(null)
    if (assignMode === 'edit') {
      const result = await patchFlatTenancy(flat.id, {
        name: renter.name,
        phone: renter.phone,
        whatsapp: renter.whatsapp,
        email: renter.email,
        nid: renter.nid,
        address: renter.address,
        joinedDate: renter.joinedDate,
        deposit: renter.deposit,
      })
      if (!result.ok) {
        setErrorMessage(result.error || t('assignError'))
        return
      }
      upsertLocal(result.data)
      setSelectedFlat(result.data)
      setSuccessMessage(
        t('updateSuccess', { flat: flat.flatNumber }),
      )
      return
    }
    const result = await assignRenter(flat.id, {
      name: renter.name,
      phone: renter.phone,
      whatsapp: renter.whatsapp,
      email: renter.email,
      nid: renter.nid,
      address: renter.address,
      joinedDate: renter.joinedDate,
      deposit: renter.deposit,
    })
    if (!result.ok) {
      setErrorMessage(result.error || t('assignError'))
      return
    }
    upsertLocal(result.data)
    setSuccessMessage(
      t('assignSuccess', { renter: renter.name, flat: flat.flatNumber }),
    )
  }

  const handleFormSubmit = async (data: FlatFormValues) => {
    setErrorMessage(null)
    if (formFlat) {
      const result = await patchFlat(formFlat.id, {
        flatNumber: data.flatNumber,
        floor: data.floor,
        rent: data.rent,
        status: data.status,
        area: data.area,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
      })
      if (!result.ok) {
        setErrorMessage(result.error || t('saveError'))
        return
      }
      upsertLocal(result.data)
      setSuccessMessage(t('updateSuccess', { flat: result.data.flatNumber }))
    } else {
      const result = await createFlat({
        buildingId,
        flatNumber: data.flatNumber,
        floor: data.floor,
        rent: data.rent,
        status: data.status === 'occupied' ? 'available' : data.status,
        area: data.area,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
      })
      if (!result.ok) {
        setErrorMessage(result.error || t('saveError'))
        return
      }
      upsertLocal(result.data)
      setSuccessMessage(t('createSuccess', { flat: result.data.flatNumber }))
      void refetch?.()
    }
  }

  const handleVacate = async (flat: Flat, data: VacateFlatValues) => {
    setErrorMessage(null)
    const result = await vacateFlat(flat.id, {
      advanceNote: data.advanceNote,
      depositReturned: data.depositReturned,
    })
    if (!result.ok) {
      setErrorMessage(result.error || t('vacateError'))
      return
    }
    upsertLocal(result.data)
    setIsDialogOpen(false)
    setSuccessMessage(t('vacateSuccess', { flat: flat.flatNumber }))
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setErrorMessage(null)
    const result = await deleteFlat(deleteTarget.id)
    if (!result.ok) {
      setErrorMessage(result.error || t('deleteError'))
      setDeleteTarget(null)
      return
    }
    removeLocal(deleteTarget.id)
    setIsDialogOpen(false)
    setSuccessMessage(t('deleteSuccess', { flat: deleteTarget.flatNumber }))
    setDeleteTarget(null)
  }

  const handlePublishListing = async (flat: Flat) => {
    setErrorMessage(null)
    setPublishingId(flat.id)
    const result = await ensureFlatListing(flat.id, true)
    setPublishingId(null)
    if (!result.ok) {
      setErrorMessage(result.error || t('publishError'))
      return
    }
    upsertLocal(result.data.flat)
    setSuccessMessage(
      t('publishSuccess', {
        flat: flat.flatNumber,
        url: result.data.bookUrl,
      }),
    )
  }

  const handleGenerateBill = (flat: Flat) => {
    setIsDialogOpen(false)
    router.push(
      `/bills?action=generate&propertyId=${buildingId}&flatId=${flat.id}`,
    )
  }

  const defaultFloor =
    floorFilter !== 'all' ? Number(floorFilter) : floors[floors.length - 1] || 1

  if (!building) {
    return (
      <EmptyState title={tb('notFoundTitle')} description={tb('notFoundDesc')}>
        <Button
          variant="outline"
          onClick={() => router.push('/my-properties')}
        >
          {tb('backToBuildings')}
        </Button>
      </EmptyState>
    )
  }

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => router.push('/my-properties')}
        className="-ml-2 mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {tb('backToBuildings')}
      </Button>

      <PageHeader
        title={building.name}
        description={building.address}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/my-properties/buildings/${buildingId}/floors`)
              }
            >
              <Layers className="mr-2 h-4 w-4" />
              {t('manageFloors')}
            </Button>
            <Button
              onClick={() => {
                setFormFlat(null)
                setIsFormOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('addFlat')}
            </Button>
          </div>
        }
      />

      {/* Occupancy board summary */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-3">
          <p className="text-xs text-muted-foreground">{t('board.total')}</p>
          <p className="text-2xl font-semibold tabular-nums">{statusCounts.all}</p>
        </div>
        <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <p className="text-xs text-muted-foreground">{t('occupied')}</p>
          <p className="text-2xl font-semibold tabular-nums text-emerald-800 dark:text-emerald-200">
            {statusCounts.occupied}
          </p>
        </div>
        <div className="rounded-xl border border-sky-200/70 bg-sky-50/50 p-3 dark:border-sky-900/50 dark:bg-sky-950/30">
          <p className="text-xs text-muted-foreground">{t('available')}</p>
          <p className="text-2xl font-semibold tabular-nums text-sky-800 dark:text-sky-200">
            {statusCounts.available}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-xs text-muted-foreground">{t('board.occupancy')}</p>
          <p className="text-2xl font-semibold tabular-nums">{occupancyPct}%</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {t('board.rentCollected', {
              collected: formatCurrency(occupiedRent),
              total: formatCurrency(totalRent),
            })}
          </p>
        </div>
      </div>

      {successMessage ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
          {successMessage}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100">
          {errorMessage}
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t('filters')}</span>
        </div>
        <Select
          value={statusFilter}
          onValueChange={value => setStatusFilter(value as FlatStatus | 'all')}
        >
          <SelectTrigger className="w-auto min-w-[7.5rem] flex-1 sm:w-[180px] sm:flex-none">
            <SelectValue placeholder={t('statusPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {tc('status.all')} ({statusCounts.all})
            </SelectItem>
            <SelectItem value="available">
              {t('available')} ({statusCounts.available})
            </SelectItem>
            <SelectItem value="occupied">
              {t('occupied')} ({statusCounts.occupied})
            </SelectItem>
            <SelectItem value="maintenance">
              {t('maintenance')} ({statusCounts.maintenance})
            </SelectItem>
          </SelectContent>
        </Select>
        <Select value={floorFilter} onValueChange={setFloorFilter}>
          <SelectTrigger className="w-auto min-w-[7.5rem] flex-1 sm:w-[160px] sm:flex-none">
            <SelectValue placeholder={t('floorPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allFloors')}</SelectItem>
            {floors.map(floor => (
              <SelectItem key={floor} value={String(floor)}>
                {t('floorNumber', { number: floor })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredFlats.length === 0 ? (
        <EmptyState
          title={t('emptyTitle')}
          description={
            statusFilter !== 'all' || floorFilter !== 'all'
              ? t('emptyFiltered')
              : t('emptyBuilding')
          }
        >
          {statusFilter === 'all' && floorFilter === 'all' ? (
            <Button
              onClick={() => {
                setFormFlat(null)
                setIsFormOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('addFlat')}
            </Button>
          ) : null}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFlats.map(flat => (
            <FlatCard
              key={flat.id}
              flat={flat}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      <FlatDetailDialog
        flat={selectedFlat}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAssignRenter={handleAssignRenter}
        onEditRenter={handleEditRenter}
        onGenerateBill={handleGenerateBill}
        onEditFlat={flat => {
          setFormFlat(flat)
          setIsDialogOpen(false)
          setIsFormOpen(true)
        }}
        onVacateFlat={flat => {
          setVacateTarget(flat)
          setIsDialogOpen(false)
          setIsVacateOpen(true)
        }}
        onDeleteFlat={flat => setDeleteTarget(flat)}
        onPublishListing={handlePublishListing}
        publishingListing={
          selectedFlat ? publishingId === selectedFlat.id : false
        }
        propertyName={building?.name}
      />

      <AssignRenterDialog
        flat={assignFlat}
        open={isAssignOpen}
        onOpenChange={open => {
          setIsAssignOpen(open)
          if (!open) setAssignMode('assign')
        }}
        mode={assignMode}
        onAssign={handleAssignSubmit}
      />

      <FlatFormDialog
        flat={formFlat}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        lockOccupiedStatus
        defaultFloor={defaultFloor}
      />

      <VacateFlatDialog
        flat={vacateTarget}
        open={isVacateOpen}
        onOpenChange={setIsVacateOpen}
        onVacate={handleVacate}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('deleteTitle', { flat: deleteTarget?.flatNumber ?? '' })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('deleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDeleteConfirm()}>
              {t('confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function FlatsPage() {
  const t = useTranslations('portfolio.flats')

  return (
    <Layout>
      <PageContainer>
        <Suspense fallback={<LoadingState label={t('loading')} />}>
          <FlatsPageContent />
        </Suspense>
      </PageContainer>
    </Layout>
  )
}
