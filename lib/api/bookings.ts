import type { Booking, BookingFormData, BookingStatus } from '@/types/booking'
import type { Property } from '@/types/property'
import { apiRequest } from './client'
import type { ApiResult } from './http'
import { hasAuthTokens } from '@/utils/auth-tokens'

export async function fetchBookingsForRenter(
  _renterId?: string,
): Promise<ApiResult<Booking[]>> {
  if (!hasAuthTokens()) return { ok: true, data: [] }
  return apiRequest<Booking[]>('/bookings/mine/')
}

export async function fetchBookingsForOwner(
  _ownerId?: string,
): Promise<ApiResult<Booking[]>> {
  if (!hasAuthTokens()) return { ok: true, data: [] }
  return apiRequest<Booking[]>('/bookings/owner/')
}

export async function fetchBookingById(
  id: string,
): Promise<ApiResult<Booking | null>> {
  const result = await apiRequest<Booking>(`/bookings/${id}/`)
  if (!result.ok) {
    if (result.code === 'NOT_FOUND') return { ok: true, data: null }
    return result
  }
  return result
}

export async function createBooking(
  property: Property,
  data: BookingFormData & { moveInDate: string; moveOutDate?: string },
): Promise<ApiResult<Booking>> {
  if (!property.available) {
    return {
      ok: false,
      error: 'This property is not available',
      code: 'UNAVAILABLE',
    }
  }
  if (property.published === false || property.listingStatus === 'paused') {
    return {
      ok: false,
      error: 'This listing is not accepting bookings',
      code: 'UNPUBLISHED',
    }
  }

  return apiRequest<Booking>('/bookings/', {
    method: 'POST',
    body: {
      propertyId: property.id,
      moveInDate: data.moveInDate,
      moveOutDate: data.moveOutDate,
      duration: data.duration || 1,
      message: data.message || '',
      specialRequests: data.specialRequests || '',
    },
  })
}

export async function patchBookingStatus(
  bookingId: string,
  status: BookingStatus,
  reason?: string,
  flatId?: string,
): Promise<ApiResult<Booking>> {
  if ((status === 'rejected' || status === 'cancelled') && !reason?.trim()) {
    return {
      ok: false,
      error: 'Please provide a reason',
      code: 'REASON_REQUIRED',
    }
  }

  return apiRequest<Booking>(`/bookings/${bookingId}/status/`, {
    method: 'PATCH',
    body: {
      status,
      reason: reason?.trim() || '',
      ...(flatId ? { flatId } : {}),
    },
  })
}

export async function fetchAllBookings(): Promise<ApiResult<Booking[]>> {
  if (!hasAuthTokens()) return { ok: true, data: [] }
  return apiRequest<Booking[]>('/admin/bookings/')
}

/** @deprecated Prefer patchBookingStatus — kept for call-site compatibility */
export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  reason?: string,
): Promise<Booking | undefined> {
  const result = await patchBookingStatus(bookingId, status, reason)
  return result.ok ? result.data : undefined
}
