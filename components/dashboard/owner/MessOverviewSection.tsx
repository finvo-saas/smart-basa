'use client'

import { useCallback, useMemo } from 'react'
import {
  BedDouble,
  CalendarCheck,
  ClipboardList,
  Megaphone,
  MessageSquare,
  Receipt,
  ScrollText,
  Send,
  Users,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'
import { StatCard } from '../StatCard'
import {
  OwnerSection,
  QuickLinkGrid,
  StatGrid,
  type QuickLink,
} from './OwnerSection'
import { useMockQuery } from '@/hooks/useMockQuery'
import { useAppFormat } from '@/hooks/useAppFormat'
import { fetchAllNotices, fetchMessList } from '@/lib/api/mess'
import { getOwnerSMSWallet } from '@/lib/api/messDomain'
import { ok } from '@/lib/api/http'
import type { OwnerSMSWallet } from '@/types/sms'

export function MessOverviewSection() {
  const { formatCurrency, formatNumber } = useAppFormat()

  const load = useCallback(async () => {
    const [messResult, noticeResult, wallet] = await Promise.all([
      fetchMessList({ mine: true }),
      fetchAllNotices(),
      getOwnerSMSWallet(),
    ])
    if (!messResult.ok) return messResult
    return ok({
      messes: messResult.data,
      notices: noticeResult.ok ? noticeResult.data : [],
      wallet: (wallet ?? null) as OwnerSMSWallet | null,
    })
  }, [])
  const { data } = useMockQuery(load)

  const messes = data?.messes ?? []
  const notices = data?.notices ?? []
  const wallet = data?.wallet ?? null
  const singleMessId = messes.length === 1 ? messes[0].id : null

  const stats = useMemo(() => {
    const totalSeats = messes.reduce((sum, m) => sum + (m.totalSeats || 0), 0)
    const vacantSeats = messes.reduce(
      (sum, m) => sum + (m.availableSeats || 0),
      0
    )
    const occupiedSeats = Math.max(totalSeats - vacantSeats, 0)
    const monthlyPotential = messes.reduce((sum, m) => {
      const occupied = Math.max((m.totalSeats || 0) - (m.availableSeats || 0), 0)
      return sum + occupied * (m.monthlyFee || 0)
    }, 0)
    const occupancy =
      totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0
    return {
      totalSeats,
      vacantSeats,
      occupiedSeats,
      monthlyPotential,
      occupancy,
    }
  }, [messes])

  const messPath = useCallback(
    (suffix: string) => (singleMessId ? `/mess/${singleMessId}/${suffix}` : '/mess'),
    [singleMessId]
  )

  const links: QuickLink[] = [
    {
      title: 'Messes & seats',
      subtitle: 'Seat map, renters, live status',
      href: '/mess',
      icon: <BedDouble className="h-4 w-4" />,
    },
    {
      title: 'Renters',
      subtitle: 'Roster, profiles, seat changes',
      href: messPath('members'),
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: 'Meals & menu',
      subtitle: 'Weekly menu and meal pricing',
      href: messPath('meals'),
      icon: <UtensilsCrossed className="h-4 w-4" />,
    },
    {
      title: 'হিসাব (monthly)',
      subtitle: 'Meal counts, deposits, closing',
      href: messPath('hisab'),
      icon: <ClipboardList className="h-4 w-4" />,
    },
    {
      title: 'Attendance',
      subtitle: 'Daily meal attendance',
      href: messPath('attendance'),
      icon: <CalendarCheck className="h-4 w-4" />,
    },
    {
      title: 'Bulk SMS',
      subtitle: 'Notify students, buy credits',
      href: messPath('sms'),
      icon: <Send className="h-4 w-4" />,
    },
    {
      title: 'Mess expenses',
      subtitle: 'Bazar cost and split',
      href: messPath('expenses'),
      icon: <Receipt className="h-4 w-4" />,
    },
    {
      title: 'Rules & violations',
      subtitle: 'House rules and warnings',
      href: messPath('rules'),
      icon: <ScrollText className="h-4 w-4" />,
    },
    {
      title: 'Notices',
      subtitle: 'Announce to your students',
      href: '/notices',
      icon: <Megaphone className="h-4 w-4" />,
    },
  ]

  return (
    <OwnerSection
      icon={<UtensilsCrossed className="h-5 w-5" />}
      title="Mess & hostel"
      description="Seats, meals, হিসাব, attendance, and SMS."
      href="/mess"
      openLabel="Open mess"
    >
      <StatGrid>
        <StatCard
          label="My messes"
          value={formatNumber(messes.length)}
          hint={
            singleMessId
              ? messes[0].name
              : messes.length === 0
                ? 'Add your first mess'
                : `${messes.length} properties`
          }
          href="/mess"
          icon={<UtensilsCrossed className="h-6 w-6" />}
        />
        <StatCard
          label="Occupied seats"
          value={formatNumber(stats.occupiedSeats)}
          hint={`${stats.occupancy}% of ${formatNumber(stats.totalSeats)} seats`}
          href={messPath('members')}
          icon={<Users className="h-6 w-6" />}
        />
        <StatCard
          label="Vacant seats"
          value={formatNumber(stats.vacantSeats)}
          hint="Available to assign"
          href="/mess"
          icon={<BedDouble className="h-6 w-6" />}
        />
        <StatCard
          label="Seat income"
          value={formatCurrency(stats.monthlyPotential)}
          hint="Monthly · occupied seats × fee"
          href="/bills"
          icon={<Wallet className="h-6 w-6" />}
        />
        <StatCard
          label="SMS credits"
          value={formatNumber(wallet?.balance ?? 0)}
          hint={
            wallet
              ? `${formatNumber(wallet.monthlyFreeQuota)} free / month · ${formatNumber(wallet.lifetimeUsed)} used`
              : 'System BulkSMSBD gateway'
          }
          href={messPath('sms')}
          icon={<MessageSquare className="h-6 w-6" />}
        />
        <StatCard
          label="Notices"
          value={formatNumber(notices.length)}
          hint="Published to your tenants"
          href="/notices"
          icon={<ClipboardList className="h-6 w-6" />}
        />
      </StatGrid>
      <QuickLinkGrid links={links} />
    </OwnerSection>
  )
}
