export type HotelType = 'hotel' | 'guest-house' | 'resort'
export type RoomType = 'single' | 'double' | 'suite' | 'family'
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'checked-in'
  | 'checked-out'
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'partial'

export interface Room {
  id: string
  hotelId: string
  roomNumber: string
  type: RoomType
  floor: number
  capacity: number // max guests
  basePrice: number // per night
  amenities: string[]
  images: string[]
  description: string
  available: boolean
}

export interface RoomPricing {
  roomId: string
  date: string // YYYY-MM-DD
  price: number
  isWeekend: boolean
  isSpecialOffer: boolean
  offerPrice?: number
}

export interface Review {
  id: string
  hotelId: string
  bookingId: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number // 1-5
  comment: string
  images?: string[]
  createdAt: string
  ownerResponse?: string
  ownerResponseDate?: string
}

export interface Booking {
  id: string
  hotelId: string
  roomId: string
  roomNumber?: string
  userId: string
  guestName: string
  guestPhone: string
  guestWhatsapp?: string
  guestEmail?: string
  checkIn: string // YYYY-MM-DD
  checkOut: string // YYYY-MM-DD
  checkInTime?: string // HH:mm
  checkOutTime?: string // HH:mm
  guests: number
  status: BookingStatus
  paymentStatus: PaymentStatus
  totalAmount: number
  advanceAmount: number
  remainingAmount: number
  paymentMethod?: 'bkash' | 'nagad' | 'rocket' | 'card' | 'cash'
  transactionId?: string
  specialRequests?: string
  createdAt: string
  updatedAt: string
}

export interface CancellationPolicy {
  freeCancellationHours: number
  partialRefundHours: number
  partialRefundPercent: number
  noRefundWithinHours: number
  summary: string
}

export interface SeasonalPriceRule {
  id: string
  name: string
  startDate: string // YYYY-MM-DD
  endDate: string
  multiplier: number // e.g. 1.25 = +25%
}

export interface HotelPricingRules {
  weekendMultiplier: number // Fri–Sat nights, e.g. 1.15
  serviceChargePercent: number // e.g. 10
  vatPercent: number // e.g. 15 (BD VAT on hotels often applied)
  seasonalRules: SeasonalPriceRule[]
}

export interface BookingFeeBreakdown {
  nights: number
  baseRoomTotal: number
  weekendNights: number
  weekendSurcharge: number
  seasonalSurcharge: number
  subtotal: number
  serviceCharge: number
  vat: number
  total: number
  advanceAmount: number
  remainingAmount: number
  advancePercent: number
}

export interface Hotel {
  id: string
  name: string
  type: HotelType
  starRating?: number // 1-5
  ownerId: string
  ownerName: string
  ownerPhone: string
  /** Owner's WhatsApp number; empty when the owner has not added one. */
  ownerWhatsapp?: string
  ownerEmail?: string
  address: string
  area: string
  city: string
  latitude?: number
  longitude?: number
  images: string[]
  description: string
  amenities: string[] // WiFi, AC, Parking, Restaurant, etc.
  checkInTime: string // HH:mm
  checkOutTime: string // HH:mm
  minimumStay: number // nights
  licenseNumber?: string
  /** Document name, or an externally hosted link. */
  licenseDocument?: string
  /** Signed, short-lived link when the license was uploaded to storage. */
  licenseDocumentUrl?: string
  verified: boolean
  featured: boolean
  averageRating: number // 0-5
  totalReviews: number
  totalRooms: number
  availableRooms: number
  featuredUntil?: string | null
  lastConfirmedAt?: string | null
  confirmedHoursAgo?: number | null
  stale?: boolean
  cancellationPolicy?: CancellationPolicy
  pricingRules?: HotelPricingRules
  advancePaymentPercent?: number // default 30
  createdAt: string
  updatedAt: string
}

export interface HotelRegistrationInput {
  name: string
  type: HotelType
  starRating?: number
  address: string
  area: string
  city: string
  description: string
  amenities: string[]
  checkInTime: string
  checkOutTime: string
  minimumStay: number
  licenseNumber?: string
  licenseDocumentName?: string
  /** Storage key from the upload response; kept private, signed per read. */
  licenseDocumentKey?: string
  imageUrl?: string
  weekendMultiplier: number
  serviceChargePercent: number
  vatPercent: number
  freeCancellationHours: number
  partialRefundPercent: number
}

export interface HotelSearchFilters {
  city?: string
  area?: string
  hotelType?: HotelType | 'all'
  minPrice?: number
  maxPrice?: number
  minRating?: number
  amenities?: string[]
  roomType?: RoomType | 'all'
  checkIn?: string
  checkOut?: string
  guests?: number
}
