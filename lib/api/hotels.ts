import type {
  Hotel,
  Booking,
  Room,
  Review,
  RoomPricing,
  HotelRegistrationInput,
  HotelPricingRules,
  CancellationPolicy,
} from '@/types/hotel'
import { apiRequest } from './client'
import type { ApiResult } from './http'
import { hasAuthTokens } from '@/utils/auth-tokens'

export async function fetchHotels(): Promise<ApiResult<Hotel[]>> {
  return apiRequest<Hotel[]>('/hotels/', { auth: false })
}

export async function fetchHotelById(
  id: string,
): Promise<ApiResult<Hotel | undefined>> {
  const result = await apiRequest<Hotel>(`/hotels/${id}/`, { auth: false })
  if (!result.ok) {
    if (result.code === 'NOT_FOUND') return { ok: true, data: undefined }
    return result
  }
  return result
}

export async function fetchOwnerHotels(
  _ownerId?: string,
): Promise<ApiResult<Hotel[]>> {
  if (!hasAuthTokens()) return { ok: true, data: [] }
  return apiRequest<Hotel[]>('/hotels/mine/')
}

export async function registerHotel(
  input: HotelRegistrationInput,
  _ownerId?: string,
): Promise<ApiResult<Hotel>> {
  return apiRequest<Hotel>('/hotels/', {
    method: 'POST',
    body: input,
  })
}

export async function patchHotelPricing(
  hotelId: string,
  rules:
    | HotelPricingRules
    | {
        pricingRules?: HotelPricingRules
        cancellationPolicy?: CancellationPolicy
        advancePaymentPercent?: number
      },
): Promise<ApiResult<Hotel>> {
  const body =
    'weekendMultiplier' in rules
      ? { pricingRules: rules as HotelPricingRules }
      : rules
  return apiRequest<Hotel>(`/hotels/${hotelId}/pricing/`, {
    method: 'PATCH',
    body,
  })
}

export async function fetchHotelRooms(
  hotelId: string,
): Promise<ApiResult<Room[]>> {
  return apiRequest<Room[]>(`/hotels/${hotelId}/rooms/`, { auth: false })
}

export type RoomWriteInput = {
  roomNumber: string
  type: Room['type']
  floor: number
  capacity: number
  basePrice: number
  description?: string
  amenities?: string[]
  images?: string[]
  available?: boolean
}

export async function createHotelRoom(
  hotelId: string,
  input: RoomWriteInput,
): Promise<ApiResult<Room>> {
  return apiRequest<Room>(`/hotels/${hotelId}/rooms/`, {
    method: 'POST',
    body: input,
  })
}

export async function updateHotelRoom(
  hotelId: string,
  roomId: string,
  input: Partial<RoomWriteInput>,
): Promise<ApiResult<Room>> {
  return apiRequest<Room>(`/hotels/${hotelId}/rooms/${roomId}/`, {
    method: 'PATCH',
    body: input,
  })
}

export async function deleteHotelRoom(
  hotelId: string,
  roomId: string,
): Promise<ApiResult<{ deleted: boolean }>> {
  return apiRequest<{ deleted: boolean }>(
    `/hotels/${hotelId}/rooms/${roomId}/`,
    { method: 'DELETE' },
  )
}

export async function fetchHotelBookings(
  hotelId: string,
): Promise<ApiResult<Booking[]>> {
  return apiRequest<Booking[]>(`/hotels/${hotelId}/bookings/`, {
    auth: hasAuthTokens(),
  })
}

export async function fetchUserHotelBookings(
  _userId?: string,
): Promise<ApiResult<Booking[]>> {
  if (!hasAuthTokens()) return { ok: true, data: [] }
  return apiRequest<Booking[]>('/hotels/bookings/mine/')
}

export async function patchHotelBookingStatus(
  bookingId: string,
  status: Booking['status'],
): Promise<ApiResult<Booking>> {
  return apiRequest<Booking>(`/hotels/bookings/${bookingId}/status/`, {
    method: 'PATCH',
    body: { status },
  })
}

export async function createHotelBooking(
  booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string
    createdAt?: string
    updatedAt?: string
  },
): Promise<ApiResult<Booking>> {
  return apiRequest<Booking>(`/hotels/${booking.hotelId}/bookings/`, {
    method: 'POST',
    body: {
      roomId: booking.roomId,
      guestName: booking.guestName,
      guestPhone: booking.guestPhone,
      guestEmail: booking.guestEmail || '',
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      paymentMethod: booking.paymentMethod || '',
      transactionId: booking.transactionId || '',
      specialRequests: booking.specialRequests || '',
      paymentStatus: booking.paymentStatus || 'pending',
      advanceAmount: booking.advanceAmount,
    },
  })
}

export async function cancelHotelBooking(
  bookingId: string,
  reason?: string,
): Promise<ApiResult<Booking & { cancellation?: Record<string, unknown> }>> {
  return apiRequest(`/hotels/bookings/${bookingId}/cancel/`, {
    method: 'POST',
    body: { reason: reason || '' },
  })
}

export async function fetchHotelReviews(
  hotelId: string,
): Promise<ApiResult<Review[]>> {
  return apiRequest<Review[]>(`/hotels/${hotelId}/reviews/`, { auth: false })
}

export async function fetchRoomPricing(
  hotelId: string,
  roomId: string,
): Promise<ApiResult<RoomPricing | undefined>> {
  const result = await apiRequest<RoomPricing[] | RoomPricing>(
    `/hotels/${hotelId}/rooms/pricing/?roomId=${encodeURIComponent(roomId)}`,
    { auth: false },
  )
  if (!result.ok) return result
  const data = result.data
  if (Array.isArray(data)) {
    return { ok: true, data: data[0] }
  }
  return { ok: true, data }
}

/** Async helper for owner dashboard stats (replaces sync mock). */
export async function getBookingsByHotelId(
  hotelId: string,
): Promise<Booking[]> {
  const result = await fetchHotelBookings(hotelId)
  return result.ok ? result.data : []
}
