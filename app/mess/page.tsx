'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Layout } from '@/components/layout/Layout'
import {
  PageContainer,
  PageHeader,
  EmptyState,
  LoadingState,
} from '@/components/page'
import { MessOverviewCard } from '@/components/mess/MessOverviewCard'
import { MemberFormDialog } from '@/components/mess/MemberFormDialog'
import { AddMessDialog } from '@/components/mess/AddMessDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStoredRole } from '@/hooks/useStoredRole'
import { useMockQuery } from '@/hooks/useMockQuery'
import {
  assignMessStudent,
  ensureMessListing,
  fetchMessList,
  type MessMemberInput,
} from '@/lib/api/mess'
import { toast } from '@/lib/feedback/toast'
import type { Mess } from '@/types/mess'
import { LayoutDashboard, GraduationCap, Building2, Plus } from 'lucide-react'
import { MessOnboardingDialog } from '@/components/onboarding'
import { ok } from '@/lib/api/http'

export default function MessOverviewPage() {
  const t = useTranslations('mess')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { ready, isOwner, isRenter } = useStoredRole()
  const loadMesses = useCallback(() => {
    if (!ready) {
      return Promise.resolve(ok([] as Mess[]))
    }
    if (isOwner) {
      return fetchMessList({ mine: true })
    }
    return Promise.resolve(ok([] as Mess[]))
  }, [ready, isOwner])
  const { data: messList, loading, refetch } = useMockQuery(loadMesses)
  const messes = messList ?? []
  const [selectedMess, setSelectedMess] = useState<Mess | null>(null)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [assignMessage, setAssignMessage] = useState<string | null>(null)
  const [localMesses, setLocalMesses] = useState<Mess[] | null>(null)
  const [messDialogOpen, setMessDialogOpen] = useState(false)
  const [editingMess, setEditingMess] = useState<Mess | null>(null)
  const displayMesses = localMesses ?? messes

  useEffect(() => {
    if (!ready || !isOwner) return
    if (searchParams.get('new') === '1') {
      setEditingMess(null)
      setMessDialogOpen(true)
      router.replace('/mess', { scroll: false })
    }
  }, [ready, isOwner, searchParams, router])

  const upsertLocal = (mess: Mess) => {
    setLocalMesses(prev => {
      const base = prev ?? messes
      const idx = base.findIndex(m => m.id === mess.id)
      if (idx < 0) return [mess, ...base]
      const next = [...base]
      next[idx] = mess
      return next
    })
    void refetch()
  }

  const handleAssignRenter = (mess: Mess) => {
    setSelectedMess(mess)
    setIsAssignDialogOpen(true)
  }

  const handleEditMess = (mess: Mess) => {
    setEditingMess(mess)
    setMessDialogOpen(true)
  }

  const handlePublishListing = async (mess: Mess) => {
    const result = await ensureMessListing(mess.id)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    upsertLocal(result.data.mess)
    toast.success(t('overview.publishSuccess'))
  }

  const handleAssign = async (data: MessMemberInput) => {
    if (!selectedMess) return false

    const result = await assignMessStudent(selectedMess.id, data)
    if (!result.ok) {
      toast.error(result.error)
      return false
    }

    const listResult = await fetchMessList({ mine: true })
    if (listResult.ok) {
      setLocalMesses(listResult.data)
    } else {
      setLocalMesses(prev => {
        const base = prev ?? messes
        return base.map(m =>
          m.id === selectedMess.id && data.seatNumber
            ? {
                ...m,
                availableSeats: Math.max(0, m.availableSeats - 1),
              }
            : m,
        )
      })
    }
    void refetch()

    setAssignMessage(
      data.seatNumber
        ? t('overview.assignSuccess', {
            name: data.name,
            seat: data.seatNumber,
            mess: selectedMess.name,
          })
        : t('overview.assignSuccessNoSeat', {
            name: data.name,
            mess: selectedMess.name,
          }),
    )
    return true
  }

  if (!ready || loading) {
    return (
      <Layout>
        <PageContainer>
          <LoadingState label={t('loading')} />
        </PageContainer>
      </Layout>
    )
  }

  if (isRenter) {
    return (
      <Layout>
        <PageContainer>
          <PageHeader
            title={t('overview.renterTitle')}
            description={t('overview.renterDescription')}
          />
          <Card className="max-w-lg border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="h-5 w-5" />
                {t('studentDashboard.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('overview.renterCardDesc')}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/mess/student-dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {t('overview.openStudentDashboard')}
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/messes">{t('overview.browsePublic')}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </PageContainer>
      </Layout>
    )
  }

  return (
    <Layout>
      <PageContainer>
        <MessOnboardingDialog
          onAddMess={() => {
            setEditingMess(null)
            setMessDialogOpen(true)
          }}
        />
        <PageHeader
          title={t('overview.ownerTitle')}
          description={t('overview.ownerDescription')}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href="/mess/student-dashboard">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  {t('overview.previewStudentView')}
                </Link>
              </Button>
              <Button
                onClick={() => {
                  setEditingMess(null)
                  setMessDialogOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('overview.addMess')}
              </Button>
            </div>
          }
        />

        {assignMessage && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
            {assignMessage}
          </div>
        )}

        {displayMesses.length === 0 ? (
          <EmptyState
            title={t('overview.emptyTitle')}
            description={t('overview.emptyDesc')}
            icon={Building2}
          >
            <Button
              onClick={() => {
                setEditingMess(null)
                setMessDialogOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('overview.addMess')}
            </Button>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayMesses.map(mess => (
              <MessOverviewCard
                key={mess.id}
                mess={mess}
                onAssignRenter={handleAssignRenter}
                onEdit={handleEditMess}
                onPublishListing={handlePublishListing}
                showManageLinks={isOwner}
              />
            ))}
          </div>
        )}

        <MemberFormDialog
          mess={selectedMess}
          open={isAssignDialogOpen}
          onOpenChange={open => {
            setIsAssignDialogOpen(open)
            if (!open) setSelectedMess(null)
          }}
          onSubmit={handleAssign}
        />

        <AddMessDialog
          open={messDialogOpen}
          onOpenChange={open => {
            setMessDialogOpen(open)
            if (!open) setEditingMess(null)
          }}
          mess={editingMess}
          onSaved={mess => {
            upsertLocal(mess)
            toast.success(
              editingMess
                ? t('overview.updateSuccess')
                : t('overview.createSuccess'),
            )
          }}
        />
      </PageContainer>
    </Layout>
  )
}
