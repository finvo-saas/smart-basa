export type ComplaintStatus = 'open' | 'in_progress' | 'resolved'

export type ComplaintCategory = 'maintenance' | 'billing' | 'noise' | 'other'

export type ComplaintScopeType = 'mess' | 'building' | 'hotel'

export interface ComplaintMessage {
  id: string
  authorId: string
  authorName: string
  body: string
  isStaffReply: boolean
  createdAt: string
}

export interface Complaint {
  id: string
  userId: string
  userName: string
  title: string
  description: string
  status: ComplaintStatus
  category?: ComplaintCategory | string
  imageUrl?: string
  scopeType?: ComplaintScopeType | string
  scopeId?: string | null
  scopeName?: string | null
  targetId?: string | null
  targetLabel?: string | null
  buildingId?: string | null
  buildingName?: string | null
  flatId?: string | null
  flatNumber?: string | null
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  response?: string
  messages?: ComplaintMessage[]
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'complaint' | 'bill' | 'system' | 'other'
  read: boolean
  createdAt: string
  link?: string
}
