'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Building2, Users, Home, Wrench, Edit, Trash2 } from 'lucide-react'
import type { Floor } from '@/types/floor'
import { format } from 'date-fns'

interface FloorCardProps {
  floor: Floor
  buildingName?: string
  onEdit?: (floor: Floor) => void
  onDelete?: (floor: Floor) => void
  showActions?: boolean
}

export function FloorCard({
  floor,
  buildingName,
  onEdit,
  onDelete,
  showActions = true,
}: FloorCardProps) {
  const occupancyRate =
    floor.totalFlats > 0 ? (floor.occupiedFlats / floor.totalFlats) * 100 : 0

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex min-w-0 items-center gap-2 text-base md:text-lg">
              <Building2 className="h-5 w-5 shrink-0 text-primary" />
              <span className="min-w-0 break-words">
                {floor.name || `Floor ${floor.floorNumber}`}
              </span>
            </CardTitle>
            {buildingName && (
              <p className="text-xs text-muted-foreground mt-1">
                {buildingName}
              </p>
            )}
          </div>
          {showActions && (
            <div className="flex items-center gap-2 shrink-0">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(floor)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(floor)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1 mb-1">
              <Home className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <p className="text-lg font-bold">{floor.totalFlats}</p>
          </div>
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1 mb-1">
              <Users className="h-3 w-3 text-green-600 dark:text-green-400" />
              <p className="text-xs text-muted-foreground">Occupied</p>
            </div>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {floor.occupiedFlats}
            </p>
          </div>
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1 mb-1">
              <Home className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              <p className="text-xs text-muted-foreground">Available</p>
            </div>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {floor.availableFlats}
            </p>
          </div>
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1 mb-1">
              <Wrench className="h-3 w-3 text-orange-600 dark:text-orange-400" />
              <p className="text-xs text-muted-foreground">Maintenance</p>
            </div>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {floor.maintenanceFlats}
            </p>
          </div>
        </div>

        {/* Occupancy Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Occupancy Rate</span>
            <span className="font-medium">{occupancyRate.toFixed(1)}%</span>
          </div>
          <Progress value={occupancyRate} className="h-2" />
        </div>

        {/* Notes */}
        {floor.notes && (
          <div className="rounded-lg border p-2 bg-muted/30">
            <p className="text-xs text-muted-foreground line-clamp-2">
              {floor.notes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 border-t pt-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link
              href={`/my-properties/buildings/${floor.buildingId}/flats?floor=${floor.floorNumber}`}
            >
              View flats
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link
              href={`/my-properties/buildings/${floor.buildingId}/floors/${floor.id}/stats`}
            >
              View stats
            </Link>
          </Button>
        </div>

        {/* Last Updated */}
        <p className="text-xs text-muted-foreground text-center">
          Updated {format(new Date(floor.updatedAt), 'MMM dd, yyyy')}
        </p>
      </CardContent>
    </Card>
  )
}
