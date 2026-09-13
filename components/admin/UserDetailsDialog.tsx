'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { UserManagement, UserStatus } from '@/types/admin'
import { CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'

const statusColors: Record<UserStatus, string> = {
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-yellow-100 text-yellow-800',
  banned: 'bg-red-100 text-red-800',
}

interface UserDetailsDialogProps {
  user: UserManagement | null
  open: boolean
  onOpenChange: (open: boolean) => void
  canManage?: boolean
  canBan?: boolean
  onStatusChange?: (userId: string, status: UserStatus) => void
  onVerify?: (userId: string) => void
}

export function UserDetailsDialog({
  user,
  open,
  onOpenChange,
  canManage = false,
  canBan = false,
  onStatusChange,
  onVerify,
}: UserDetailsDialogProps) {
  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{user.name}</DialogTitle>
          <DialogDescription>Platform user account details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium">{user.phone}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{user.email || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Role</p>
              <Badge variant="outline" className="capitalize">
                {user.role}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <Badge className={statusColors[user.status]}>{user.status}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Verified</p>
              <div className="mt-0.5 flex items-center gap-1">
                {user.verified ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Yes</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    <span>No</span>
                  </>
                )}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Joined</p>
              <p className="font-medium">
                {format(new Date(user.createdAt), 'MMM dd, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Last login</p>
              <p className="font-medium">
                {user.lastLogin
                  ? format(new Date(user.lastLogin), 'MMM dd, yyyy HH:mm')
                  : '—'}
              </p>
            </div>
          </div>

          <div className="border-t" />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-md border p-3 text-center">
              <p className="text-lg font-semibold">{user.totalProperties ?? 0}</p>
              <p className="text-xs text-muted-foreground">Properties</p>
            </div>
            <div className="rounded-md border p-3 text-center">
              <p className="text-lg font-semibold">{user.totalBookings ?? 0}</p>
              <p className="text-xs text-muted-foreground">Bookings</p>
            </div>
            <div className="rounded-md border p-3 text-center">
              <p className="text-lg font-semibold">{user.totalComplaints ?? 0}</p>
              <p className="text-xs text-muted-foreground">Complaints</p>
            </div>
          </div>

          {(canManage || canBan) && (
            <>
              <div className="border-t" />
              <div className="flex flex-wrap gap-2">
                {canManage && !user.verified && (
                  <Button size="sm" onClick={() => onVerify?.(user.id)}>
                    Verify
                  </Button>
                )}
                {canManage && user.status === 'active' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange?.(user.id, 'suspended')}
                  >
                    Suspend
                  </Button>
                )}
                {canManage && user.status === 'suspended' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange?.(user.id, 'active')}
                  >
                    Activate
                  </Button>
                )}
                {canBan && user.status === 'banned' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange?.(user.id, 'active')}
                  >
                    Unban
                  </Button>
                )}
                {canBan && user.status !== 'banned' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onStatusChange?.(user.id, 'banned')}
                  >
                    Ban
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
