'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { BedDouble, Search, UserPlus, Users, Wallet } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MessSubpageBackButton } from '@/components/mess/MessSubpageBackButton'
import { MemberAvatar } from '@/components/mess/MemberAvatar'
import { MemberActionsMenu } from '@/components/mess/MemberActionsMenu'
import { MemberFormDialog } from '@/components/mess/MemberFormDialog'
import { OCCUPANT_TYPES } from '@/components/mess/occupantType'
import {
  assignMessStudent,
  fetchMessById,
  fetchMessStudents,
  removeMessMember,
  updateMessMember,
  type MessMemberInput,
} from '@/lib/api/mess'
import { useMockQuery } from '@/hooks/useMockQuery'
import { useAppFormat } from '@/hooks/useAppFormat'
import { getStoredRole } from '@/utils/auth'
import { useConfirm } from '@/components/feedback'
import { toast } from '@/lib/feedback/toast'
import type { MessMember, OccupantType } from '@/types/mess'

type StatusFilter = 'all' | 'active' | 'inactive'

const typeBadgeClass: Record<OccupantType, string> = {
  student:
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300',
  job_holder:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300',
  business:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300',
  family:
    'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300',
  other: 'bg-muted text-muted-foreground',
}

export default function MessMembersPage() {
  const t = useTranslations('mess')
  const tm = useTranslations('mess.members')
  const params = useParams()
  const router = useRouter()
  const role = getStoredRole()
  const messId = params.messId as string
  const { confirm } = useConfirm()
  const { formatCurrency, formatNumber } = useAppFormat()

  const loadMess = useCallback(() => fetchMessById(messId), [messId])
  const { data: mess } = useMockQuery(loadMess)

  const [members, setMembers] = useState<MessMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<OccupantType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MessMember | null>(null)

  const refresh = useCallback(async () => {
    const result = await fetchMessStudents(messId)
    setLoading(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setMembers(result.data)
  }, [messId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (role !== 'owner') {
      router.replace('/dashboard')
    }
  }, [role, router])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return members.filter(member => {
      if (statusFilter === 'active' && member.isActive === false) return false
      if (statusFilter === 'inactive' && member.isActive !== false) return false
      if (typeFilter !== 'all' && member.occupantType !== typeFilter) return false
      if (!needle) return true
      return [
        member.name,
        member.phone,
        member.seatNumber,
        member.university,
        member.organization,
      ]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(needle))
    })
  }, [members, search, statusFilter, typeFilter])

  const stats = useMemo(() => {
    const active = members.filter(m => m.isActive !== false)
    return {
      active: active.length,
      former: members.length - active.length,
      unseated: active.filter(m => !m.seatNumber).length,
      income: active.reduce((sum, m) => sum + (m.monthlyFee || 0), 0),
    }
  }, [members])

  const handleSave = async (input: MessMemberInput) => {
    const result = editing
      ? await updateMessMember(messId, editing.id, input)
      : await assignMessStudent(messId, input)
    if (!result.ok) {
      toast.error(result.error)
      return false
    }
    toast.success(
      editing
        ? tm('toast.updated', { name: result.data.name })
        : tm('toast.added', { name: result.data.name })
    )
    setEditing(null)
    await refresh()
    return true
  }

  const handleVacateSeat = async (member: MessMember) => {
    const confirmed = await confirm({
      title: tm('confirm.vacateTitle', { name: member.name }),
      description: tm('confirm.vacateDesc'),
    })
    if (!confirmed) return
    const result = await updateMessMember(messId, member.id, { vacateSeat: true })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(tm('toast.vacated', { name: member.name }))
    await refresh()
  }

  const handleToggleActive = async (member: MessMember) => {
    const reactivating = member.isActive === false
    if (!reactivating) {
      const confirmed = await confirm({
        title: tm('confirm.markLeftTitle', { name: member.name }),
        description: tm('confirm.markLeftDesc'),
      })
      if (!confirmed) return
    }
    const result = await updateMessMember(messId, member.id, {
      isActive: reactivating,
    })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(
      reactivating
        ? tm('toast.reactivated', { name: member.name })
        : tm('toast.left', { name: member.name })
    )
    await refresh()
  }

  const handleRemove = async (member: MessMember) => {
    const confirmed = await confirm({
      title: tm('confirm.removeTitle', { name: member.name }),
      description: tm('confirm.removeDesc'),
      variant: 'destructive',
    })
    if (!confirmed) return
    const result = await removeMessMember(messId, member.id)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(tm('toast.removed', { name: member.name }))
    await refresh()
  }

  const openAdd = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (member: MessMember) => {
    setEditing(member)
    setDialogOpen(true)
  }

  if (!mess) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <p className="text-center">{loading ? t('loading') : t('notFound')}</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout userRole="owner">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <MessSubpageBackButton />
            <h1 className="mb-2 text-2xl font-bold">{tm('title')}</h1>
            <p className="text-muted-foreground">{mess.name}</p>
          </div>
          {/* A renter can be added without a seat, so this is never disabled. */}
          <Button onClick={openAdd}>
            <UserPlus className="mr-2 h-4 w-4" />
            {tm('add')}
          </Button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {tm('stats.current')}
              </div>
              <p className="mt-1 text-2xl font-bold">
                {formatNumber(stats.active)}
              </p>
              <p className="text-xs text-muted-foreground">
                {tm('stats.former', { count: stats.former })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BedDouble className="h-3.5 w-3.5" />
                {tm('stats.vacantSeats')}
              </div>
              <p className="mt-1 text-2xl font-bold">
                {formatNumber(mess.availableSeats)}
              </p>
              <p className="text-xs text-muted-foreground">
                {tm('stats.ofSeats', { total: mess.totalSeats })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {tm('stats.withoutSeat')}
              </div>
              <p className="mt-1 text-2xl font-bold">
                {formatNumber(stats.unseated)}
              </p>
              <p className="text-xs text-muted-foreground">
                {tm('stats.withoutSeatHint')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Wallet className="h-3.5 w-3.5" />
                {tm('stats.monthlyRent')}
              </div>
              <p className="mt-1 text-2xl font-bold text-primary">
                {formatCurrency(stats.income)}
              </p>
              <p className="text-xs text-muted-foreground">
                {tm('stats.monthlyRentHint')}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder={tm('searchPlaceholder')}
              className="pl-9"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={value => setTypeFilter(value as OccupantType | 'all')}
          >
            <SelectTrigger className="sm:w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tm('filters.allTypes')}</SelectItem>
              {OCCUPANT_TYPES.map(type => (
                <SelectItem key={type} value={type}>
                  {tm(`type.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={value => setStatusFilter(value as StatusFilter)}
          >
            <SelectTrigger className="sm:w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{tm('filters.current')}</SelectItem>
              <SelectItem value="inactive">{tm('filters.former')}</SelectItem>
              <SelectItem value="all">{tm('filters.allStatuses')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
              <p className="mb-4 text-muted-foreground">
                {members.length === 0 ? tm('emptyDesc') : tm('noMatchDesc')}
              </p>
              {members.length === 0 && (
                <Button onClick={openAdd}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {tm('addFirst')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop table */}
            <Card className="hidden md:block">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{tm('columns.member')}</TableHead>
                      <TableHead>{tm('columns.type')}</TableHead>
                      <TableHead>{tm('columns.seat')}</TableHead>
                      <TableHead>{tm('columns.fee')}</TableHead>
                      <TableHead>{tm('columns.joined')}</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(member => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <Link
                            href={`/mess/${messId}/members/${member.id}`}
                            className="flex items-center gap-3"
                          >
                            <MemberAvatar
                              name={member.name}
                              photoUrl={member.photoUrl}
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium hover:underline">
                                {member.name}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {member.phone}
                              </p>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={typeBadgeClass[member.occupantType]}
                          >
                            {tm(`type.${member.occupantType}`)}
                          </Badge>
                          {(member.university || member.organization) && (
                            <p className="mt-1 max-w-[180px] truncate text-xs text-muted-foreground">
                              {member.university || member.organization}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {member.seatNumber ? (
                            <span className="font-medium">
                              {member.seatNumber}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {tm('noSeat')}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{formatCurrency(member.monthlyFee)}</TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {format(new Date(member.joinedDate), 'dd MMM yyyy')}
                          </p>
                          {member.isActive === false && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {member.leftDate
                                ? tm('leftOn', {
                                    date: format(
                                      new Date(member.leftDate),
                                      'dd MMM yyyy'
                                    ),
                                  })
                                : tm('filters.former')}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <MemberActionsMenu
                            member={member}
                            messId={messId}
                            onEdit={openEdit}
                            onVacateSeat={handleVacateSeat}
                            onToggleActive={handleToggleActive}
                            onRemove={handleRemove}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {filtered.map(member => (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <MemberAvatar
                        name={member.name}
                        photoUrl={member.photoUrl}
                        className="h-12 w-12"
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/mess/${messId}/members/${member.id}`}
                          className="font-medium hover:underline"
                        >
                          {member.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {member.phone}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={typeBadgeClass[member.occupantType]}
                          >
                            {tm(`type.${member.occupantType}`)}
                          </Badge>
                          <Badge variant="outline">
                            {member.seatNumber || tm('noSeat')}
                          </Badge>
                          <Badge variant="outline">
                            {formatCurrency(member.monthlyFee)}
                          </Badge>
                          {member.isActive === false && (
                            <Badge variant="outline">
                              {tm('filters.former')}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <MemberActionsMenu
                        member={member}
                        messId={messId}
                        onEdit={openEdit}
                        onVacateSeat={handleVacateSeat}
                        onToggleActive={handleToggleActive}
                        onRemove={handleRemove}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        <MemberFormDialog
          mess={mess}
          member={editing}
          open={dialogOpen}
          onOpenChange={open => {
            setDialogOpen(open)
            if (!open) setEditing(null)
          }}
          onSubmit={handleSave}
        />
      </div>
    </Layout>
  )
}
