export type BookingStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'completed'

export type BookingMode = 'instant' | 'request'

export interface Booking {
  id: string
  propertyId: string
  propertyName: string
  propertyType: 'mess' | 'apartment' | 'hostel' | 'hotel'
  propertyAddress: string
  propertyImage?: string
  flatId?: string | null
  flatNumber?: string | null
  renterId: string
  renterName: string
  renterPhone: string
  renterWhatsapp?: string
  renterEmail?: string
  ownerId: string
  ownerName: string
  ownerPhone: string
  ownerWhatsapp?: string
  status: BookingStatus
  /** Instant bookings are auto-approved; requests need owner action */
  bookingMode?: BookingMode
  moveInDate?: string
  moveOutDate?: string
  duration?: number // in months
  rent: number
  deposit?: number
  totalAmount: number
  message?: string
  specialRequests?: string
  createdAt: string
  updatedAt: string
  approvedAt?: string
  rejectedAt?: string
  cancelledAt?: string
  rejectionReason?: string
  cancellationReason?: string
  completedAt?: string
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  completed: 'Completed',
}

export interface BookingFormData {
  moveInDate: string
  moveOutDate?: string
  duration?: number
  message?: string
  specialRequests?: string
  agreeToTerms: boolean
}
