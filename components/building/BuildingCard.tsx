'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Building2, MapPin, Layers, Home, Pencil } from 'lucide-react'
import type { Building } from '@/types/building'
import { useRouter } from 'next/navigation'

interface BuildingCardProps {
  building: Building
  onEdit?: (building: Building) => void
}

export function BuildingCard({ building, onEdit }: BuildingCardProps) {
  const router = useRouter()
  const occupancyRate =
    building.totalFlats > 0
      ? (building.occupiedFlats / building.totalFlats) * 100
      : 0
  const availableFlats = building.totalFlats - building.occupiedFlats

  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg sm:text-xl">{building.name}</CardTitle>
            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1">{building.address}</span>
            </div>
          </div>
          {onEdit ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => onEdit(building)}
              aria-label="Edit building"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total flats</p>
            <p className="text-lg font-semibold">{building.totalFlats}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Occupied</p>
            <p className="text-lg font-semibold">{building.occupiedFlats}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Available</p>
            <p className="text-lg font-semibold text-primary">{availableFlats}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Occupancy</span>
            <span className="font-medium">{occupancyRate.toFixed(0)}%</span>
          </div>
          <Progress value={occupancyRate} className="h-2" />
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Layers className="h-4 w-4" />
          <span>{building.totalFloors} floors</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/my-properties/buildings/${building.id}/floors`)
            }
          >
            <Layers className="mr-2 h-4 w-4" />
            Floors
          </Button>
          <Button
            onClick={() =>
              router.push(`/my-properties/buildings/${building.id}/flats`)
            }
          >
            <Home className="mr-2 h-4 w-4" />
            Flats
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
