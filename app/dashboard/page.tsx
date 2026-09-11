'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/Layout'
import { getLoginPhone, getStoredRole, isAdminSession, isLoggedIn } from '@/utils/auth'
import { fetchRenters } from '@/lib/api/buildings'
import { getCurrentAccountUserId } from '@/lib/api/account'
import { useMockQuery } from '@/hooks/useMockQuery'
import { RenterDashboard } from '@/components/dashboard/RenterDashboard'
import { OwnerDashboard } from '@/components/dashboard/OwnerDashboard'
import { AdminDashboard } from '@/components/dashboard/AdminDashboard'
import { CIMSBanner } from '@/components/compliance/CIMSBanner'
import type { UserRole } from '@/types'

export default function DashboardPage() {
  const router = useRouter()
  const [role, setRole] = useState<UserRole>('renter')
  const [name, setName] = useState('Rahim')
  const [phone, setPhone] = useState('+8801712345678')
  const [email, setEmail] = useState('rahim@example.com')

  const [city, setCity] = useState('Dhaka')
  const [area, setArea] = useState('Mirpur')
  const [search, setSearch] = useState('')

  const currentUserId = getCurrentAccountUserId()
  const loadRenters = useCallback(() => fetchRenters(), [])
  const { data: renters } = useMockQuery(loadRenters)
  const currentRenter = renters?.find(r => r.id === currentUserId)

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login')
      return
    }

    const storedRole = getStoredRole()
    if (storedRole === 'admin') {
      if (isAdminSession()) {
        router.replace('/admin')
        return
      }
      router.replace('/admin/login')
      return
    }
    if (storedRole) setRole(storedRole)

    const storedPhone = getLoginPhone()
    if (storedPhone) {
      setPhone(storedPhone)
      setName('User ' + storedPhone.slice(-4))
    }

    if (currentRenter) {
      setName(currentRenter.name)
      setPhone(currentRenter.phone)
      if (currentRenter.email) setEmail(currentRenter.email)
    }
  }, [router, currentRenter])

  const areasByCity: Record<string, string[]> = useMemo(
    () => ({
      Dhaka: ['Mirpur', 'Uttara', 'Dhanmondi', 'Mohammadpur', 'Bashundhara'],
      Chattogram: ['Pahartali', 'Panchlaish', 'Halishahar', 'Agrabad'],
      Sylhet: ['Zindabazar', 'Amberkhana', 'Shibgonj'],
      Khulna: ['Sonadanga', 'Khalishpur', 'Daulatpur'],
    }),
    [],
  )

  useEffect(() => {
    const list = areasByCity[city] || []
    if (!list.includes(area)) setArea(list[0] || '')
  }, [city, area, areasByCity])

  return (
    <Layout userRole={role}>
      <div className="relative min-h-screen pb-20 md:pb-6">
        <div className="mx-auto w-full max-w-7xl px-3 pt-3 sm:px-6 md:pt-6 lg:px-8">
          <div className="mb-4 md:mb-6">
            <CIMSBanner />
          </div>

          {role === 'renter' && (
            <RenterDashboard
              renterId={currentUserId}
              name={name}
              phone={phone}
              email={email}
              city={city}
              area={area}
              search={search}
              onCityChange={setCity}
              onAreaChange={setArea}
              onSearchChange={setSearch}
              areasByCity={areasByCity}
            />
          )}

          {role === 'owner' && <OwnerDashboard ownerId={currentUserId} />}

          {role === 'admin' && <AdminDashboard adminId={currentUserId} />}
        </div>
      </div>
    </Layout>
  )
}
