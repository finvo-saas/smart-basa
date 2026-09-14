'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Bell, Search, ExternalLink } from 'lucide-react'
import { fetchSearchMatchNotifications } from '@/lib/api/search'
import { useMockQuery } from '@/hooks/useMockQuery'
import type { SavedSearch } from '@/types/savedSearch'
import type { SearchMatchNotification } from '@/lib/api/search'
import { useRouter } from 'next/navigation'

interface SearchNotificationProps {
  userId: string
}

interface MatchNotification {
  savedSearch: SavedSearch
  newMatches: SearchMatchNotification['newMatches']
  matchCount: number
}

export function SearchNotification({ userId }: SearchNotificationProps) {
  const router = useRouter()
  const [showNotificationDialog, setShowNotificationDialog] = useState(false)
  const [dismissedIds, setDismissedIds] = useState<string[]>([])

  const loadNotifications = useCallback(
    () => fetchSearchMatchNotifications(userId),
    [userId]
  )
  const { data, refetch } = useMockQuery(loadNotifications)
  const notifications: MatchNotification[] = (data ?? []).filter(
    notification => !dismissedIds.includes(notification.savedSearch.id)
  )

  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refetch])

  useEffect(() => {
    setDismissedIds([])
  }, [userId])

  const handleViewMatches = (savedSearch: SavedSearch) => {
    // Navigate to search page with filters
    const params = new URLSearchParams()
    if (
      savedSearch.filters.propertyType &&
      savedSearch.filters.propertyType !== 'all'
    ) {
      params.set('type', savedSearch.filters.propertyType)
    }
    if (savedSearch.filters.city) {
      params.set('city', savedSearch.filters.city)
    }
    if (savedSearch.filters.area) {
      params.set('area', savedSearch.filters.area)
    }
    params.set('minRent', savedSearch.filters.rentRange[0].toString())
    params.set('maxRent', savedSearch.filters.rentRange[1].toString())
    if (savedSearch.filters.availableOnly) {
      params.set('availableOnly', 'true')
    }
    if (savedSearch.filters.verifiedOnly) {
      params.set('verifiedOnly', 'true')
    }
    router.push(`/search?${params.toString()}`)
    setShowNotificationDialog(false)
    setDismissedIds(ids => (ids.includes(savedSearch.id) ? ids : [...ids, savedSearch.id]))
  }

  const handleDismiss = () => {
    setShowNotificationDialog(false)
    setDismissedIds(notifications.map(notification => notification.savedSearch.id))
  }

  if (notifications.length === 0) {
    return null
  }

  const totalNewMatches = notifications.reduce(
    (sum, notif) => sum + notif.newMatches.length,
    0
  )

  return (
    <>
      {/* Notification Badge */}
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 shrink-0 md:h-10 md:w-10"
        title="New listing matches"
        onClick={() => setShowNotificationDialog(true)}
      >
        <Search className="h-5 w-5" />
        {totalNewMatches > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {totalNewMatches > 9 ? '9+' : totalNewMatches}
          </Badge>
        )}
      </Button>

      {/* Notification Dialog */}
      <Dialog
        open={showNotificationDialog}
        onOpenChange={setShowNotificationDialog}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              New Property Matches!
            </DialogTitle>
            <DialogDescription>
              {totalNewMatches} new{' '}
              {totalNewMatches === 1 ? 'property matches' : 'properties match'}{' '}
              your saved searches
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {notifications.map(notification => (
              <Card
                key={notification.savedSearch.id}
                className="border-l-4 border-l-primary"
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">
                        {notification.savedSearch.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {notification.newMatches.length} new{' '}
                        {notification.newMatches.length === 1
                          ? 'match'
                          : 'matches'}{' '}
                        found
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {notification.matchCount} total matches
                    </Badge>
                  </div>

                  {/* New Matches Preview */}
                  <div className="space-y-2 mb-4">
                    {notification.newMatches.slice(0, 3).map(property => (
                      <div
                        key={property.id}
                        className="flex items-center justify-between p-2 rounded border bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {property.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {property.area}, {property.city} • ৳
                            {property.rent.toLocaleString()}/month
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            router.push(`/search?propertyId=${property.id}`)
                            handleDismiss()
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {notification.newMatches.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{notification.newMatches.length - 3} more matches
                      </p>
                    )}
                  </div>

                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => handleViewMatches(notification.savedSearch)}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    View All Matches
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/saved-searches')}
            >
              Manage Saved Searches
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDismiss}
            >
              Dismiss
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
