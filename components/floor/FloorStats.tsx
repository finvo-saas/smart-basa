'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/StatCard'
import { Home, Users, DollarSign, TrendingUp } from 'lucide-react'
import type { FloorStats as FloorStatsType } from '@/types/floor'

interface FloorStatsProps {
  stats: FloorStatsType
  floorName?: string
}

function Icon({
  path,
  className = 'h-6 w-6',
}: {
  path: string
  className?: string
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  )
}

export function FloorStats({ stats, floorName }: FloorStatsProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      {floorName && (
        <div>
        <h2 className="mb-2 break-words text-lg font-bold sm:text-xl">{floorName} Statistics</h2>
          <p className="text-muted-foreground">
            Comprehensive statistics for this floor
          </p>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Flats"
          value={stats.totalFlats.toString()}
          icon={<Home className="h-5 w-5 md:h-6 md:w-6" />}
        />
        <StatCard
          label="Occupied"
          value={stats.occupiedFlats.toString()}
          icon={<Users className="h-5 w-5 md:h-6 md:w-6" />}
        />
        <StatCard
          label="Available"
          value={stats.availableFlats.toString()}
          icon={<Home className="h-5 w-5 md:h-6 md:w-6" />}
        />
        <StatCard
          label="Occupancy Rate"
          value={`${stats.occupancyRate.toFixed(1)}%`}
          icon={<TrendingUp className="h-5 w-5 md:h-6 md:w-6" />}
        />
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Rent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="break-all text-xl font-bold text-primary sm:text-2xl">
              ৳{stats.totalRent.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Sum of all flat rents
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Collected Rent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="break-all text-xl font-bold text-green-600 dark:text-green-400 sm:text-2xl">
              ৳{stats.collectedRent.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              From occupied flats
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Rent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="break-all text-xl font-bold text-orange-600 dark:text-orange-400 sm:text-2xl">
              ৳{stats.pendingRent.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              From available flats
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.totalFlats}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Flats</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.occupiedFlats}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Occupied</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.availableFlats}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Available</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.maintenanceFlats}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Maintenance</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
