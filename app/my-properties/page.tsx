'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Layout } from '@/components/layout/Layout'
import {
  PageContainer,
  PageHeader,
  EmptyState,
  LoadingState,
} from '@/components/page'
import { BuildingCard } from '@/components/building/BuildingCard'
import { AddBuildingDialog } from '@/components/building/AddBuildingDialog'
import { FreeTierLimitBanner } from '@/components/monetization'
import { VerticalLockedEmptyState } from '@/components/onboarding'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CalendarClock,
  CreditCard,
  FileText,
  Megaphone,
  MessageSquare,
  Plus,
  Receipt,
} from 'lucide-react'
import { QuickLinkGrid, type QuickLink } from '@/components/dashboard/owner/OwnerSection'
import { fetchBuildings } from '@/lib/api/buildings'
import { useMockQuery } from '@/hooks/useMockQuery'
import { useOwnerFocus } from '@/hooks/useOwnerFocus'
import { fetchOwnerUsageStatus } from '@/lib/api/subscriptions'
import type { Building } from '@/types/building'

export default function MyPropertiesPage() {
  const t = useTranslations('portfolio.myProperties')
  const tc = useTranslations('common')
  const { hasVertical, hydrated, needsFocusSelection } = useOwnerFocus()

  const loadBuildings = useCallback(() => fetchBuildings(), [])
  const { data: fetchedBuildings, error: buildingsError, refetch: refetchBuildings } =
    useMockQuery(loadBuildings)

  const [localBuildings, setLocalBuildings] = useState<Building[] | null>(null)
  const buildings = localBuildings ?? fetchedBuildings ?? []
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null)
  const [limitDialogOpen, setLimitDialogOpen] = useState(false)

  const loadUsage = useCallback(() => fetchOwnerUsageStatus(), [])
  const { data: usage, refetch: refetchUsage } = useMockQuery(loadUsage)

  const handleAddBuilding = (newBuilding: Building) => {
    setLocalBuildings(prev => [...(prev ?? fetchedBuildings ?? []), newBuilding])
    setIsAddDialogOpen(false)
    setEditingBuilding(null)
    refetchBuildings()
    refetchUsage()
  }

  const handleUpdateBuilding = (updated: Building) => {
    setLocalBuildings(prev =>
      (prev ?? fetchedBuildings ?? []).map(b =>
        b.id === updated.id ? updated : b,
      ),
    )
    setEditingBuilding(null)
    setIsAddDialogOpen(false)
    refetchBuildings()
  }

  const tryAddBuilding = () => {
    if (usage?.apartment.atLimit) {
      setLimitDialogOpen(true)
      return
    }
    setEditingBuilding(null)
    setIsAddDialogOpen(true)
  }

  if (!hydrated || needsFocusSelection) {
    return (
      <Layout userRole="owner">
        <PageContainer>
          <LoadingState />
        </PageContainer>
      </Layout>
    )
  }

  if (!hasVertical('apartment')) {
    return (
      <Layout userRole="owner">
        <PageContainer>
          <VerticalLockedEmptyState vertical="apartment" />
        </PageContainer>
      </Layout>
    )
  }

  return (
    <Layout userRole="owner">
      <PageContainer>
        <PageHeader
          title={t('title')}
          description={t('description')}
          actions={
            <Button className="w-full sm:w-auto" onClick={tryAddBuilding}>
              <Plus className="mr-2 h-4 w-4" />
              {t('addBuilding')}
            </Button>
          }
        />

        {usage && (
          <div className="mb-6">
            <FreeTierLimitBanner usage={usage} verticals={['apartment']} />
          </div>
        )}

        <div className="mb-6">
          <QuickLinkGrid
            links={[
              {
                title: t('subscription'),
                subtitle: t('subscriptionHint'),
                href: '/subscription',
                icon: <CreditCard className="h-4 w-4" />,
              },
              {
                title: t('bills'),
                subtitle: t('billsHint'),
                href: '/bills',
                icon: <Receipt className="h-4 w-4" />,
              },
              {
                title: t('notices'),
                subtitle: t('noticesHint'),
                href: '/notices',
                icon: <FileText className="h-4 w-4" />,
              },
              {
                title: t('complaints'),
                subtitle: t('complaintsHint'),
                href: '/complaints',
                icon: <MessageSquare className="h-4 w-4" />,
              },
              {
                title: t('bookingRequests'),
                subtitle: t('bookingRequestsHint'),
                href: '/my-properties/bookings',
                icon: <CalendarClock className="h-4 w-4" />,
              },
              {
                title: t('publicListings'),
                subtitle: t('publicListingsHint'),
                href: '/my-listings',
                icon: <Megaphone className="h-4 w-4" />,
              },
            ] satisfies QuickLink[]}
          />
        </div>

        {buildingsError ? (
          <EmptyState title={t('emptyTitle')} description={buildingsError}>
            <Button onClick={() => refetchBuildings()}>{tc('tryAgain')}</Button>
          </EmptyState>
        ) : buildings.length === 0 ? (
          <EmptyState title={t('emptyTitle')} description={t('emptyDesc')}>
            <Button onClick={tryAddBuilding}>
              <Plus className="mr-2 h-4 w-4" />
              {t('addBuilding')}
            </Button>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {buildings.map(building => (
              <BuildingCard
                key={building.id}
                building={building}
                onEdit={b => {
                  setEditingBuilding(b)
                  setIsAddDialogOpen(true)
                }}
              />
            ))}
          </div>
        )}

        <AddBuildingDialog
          open={isAddDialogOpen}
          onOpenChange={open => {
            setIsAddDialogOpen(open)
            if (!open) setEditingBuilding(null)
          }}
          building={editingBuilding}
          onAdd={handleAddBuilding}
          onUpdate={handleUpdateBuilding}
        />

        <Dialog open={limitDialogOpen} onOpenChange={setLimitDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('limitTitle')}</DialogTitle>
              <DialogDescription>
                {t('limitDesc', {
                  plan: usage?.planName ?? '',
                  max: usage?.apartment.max ?? 0,
                  used: usage?.apartment.used ?? 0,
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild className="flex-1">
                <Link href="/subscription">{t('viewUpgrade')}</Link>
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setLimitDialogOpen(false)}
              >
                {tc('actions.cancel')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </Layout>
  )
}
