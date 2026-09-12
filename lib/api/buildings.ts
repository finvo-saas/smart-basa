import type { Building, Flat, MyTenancy, Renter } from '@/types/building'
import type { Mess } from '@/types/mess'
import type { Floor, FloorFormData, FloorStats } from '@/types/floor'
import { apiRequest } from './client'
import type { ApiResult } from './http'
import { hasAuthTokens } from '@/utils/auth-tokens'

export async function fetchBuildings(
  _ownerId?: string,
): Promise<ApiResult<Building[]>> {
  if (!hasAuthTokens()) return { ok: true, data: [] }
  return apiRequest<Building[]>('/buildings/')
}

export async function fetchAllBuildings(): Promise<ApiResult<Building[]>> {
  return apiRequest<Building[]>('/buildings/all/')
}

export async function fetchBuildingById(
  id: string,
): Promise<ApiResult<Building | undefined>> {
  const result = await apiRequest<Building>(`/buildings/${id}/`)
  if (!result.ok) {
    if (result.code === 'NOT_FOUND') return { ok: true, data: undefined }
    return result
  }
  return result
}

export async function createBuilding(data: {
  name: string
  address: string
  city: string
  totalFloors: number
  totalFlats: number
}): Promise<ApiResult<Building>> {
  return apiRequest<Building>('/buildings/', {
    method: 'POST',
    body: data,
  })
}

export async function patchBuilding(
  buildingId: string,
  data: Partial<{
    name: string
    address: string
    city: string
    totalFloors: number
    totalFlats: number
  }>,
): Promise<ApiResult<Building>> {
  return apiRequest<Building>(`/buildings/${buildingId}/`, {
    method: 'PATCH',
    body: data,
  })
}

export async function fetchFlatsByBuilding(
  buildingId: string,
): Promise<ApiResult<Flat[]>> {
  return apiRequest<Flat[]>(`/buildings/${buildingId}/flats/`)
}

export async function fetchAllFlats(): Promise<ApiResult<Flat[]>> {
  return apiRequest<Flat[]>('/flats/')
}

export async function createFlat(data: {
  buildingId: string
  flatNumber: string
  floor: number
  rent: number
  status?: Flat['status']
  area?: number
  bedrooms?: number
  bathrooms?: number
  electricityBill?: number | null
  gasBill?: number | null
  internetBill?: number | null
  waterBill?: number | null
}): Promise<ApiResult<Flat>> {
  return apiRequest<Flat>('/flats/', {
    method: 'POST',
    body: data,
  })
}

export async function patchFlat(
  flatId: string,
  data: Partial<{
    flatNumber: string
    floor: number
    rent: number
    status: Flat['status']
    area?: number
    bedrooms?: number
    bathrooms?: number
    electricityBill?: number | null
    gasBill?: number | null
    internetBill?: number | null
    waterBill?: number | null
  }>,
): Promise<ApiResult<Flat>> {
  return apiRequest<Flat>(`/flats/${flatId}/`, {
    method: 'PATCH',
    body: data,
  })
}

export async function deleteFlat(flatId: string): Promise<ApiResult<boolean>> {
  const result = await apiRequest<null>(`/flats/${flatId}/`, {
    method: 'DELETE',
  })
  if (!result.ok) return result
  return { ok: true, data: true }
}

export async function ensureFlatListing(
  flatId: string,
  publish = true,
): Promise<
  ApiResult<{
    listingId: string
    bookUrl: string
    flat: Flat
    listing: import('@/types/property').Property
  }>
> {
  return apiRequest(`/flats/${flatId}/ensure-listing/`, {
    method: 'POST',
    body: { publish },
  })
}

export async function assignRenter(
  flatId: string,
  data: {
    name: string
    phone: string
    whatsapp?: string
    email?: string
    nid?: string
    address?: string
    joinedDate?: string
    deposit?: number
    notes?: string
  },
): Promise<ApiResult<Flat>> {
  const result = await apiRequest<{ flat: Flat; renter: Renter }>(
    `/flats/${flatId}/assign-renter/`,
    {
      method: 'POST',
      body: data,
    },
  )
  if (!result.ok) return result
  return { ok: true, data: result.data.flat }
}

export async function patchFlatTenancy(
  flatId: string,
  data: Partial<{
    name: string
    phone: string
    whatsapp: string
    email: string
    nid: string
    address: string
    joinedDate: string
    deposit: number
    notes: string
  }>,
): Promise<ApiResult<Flat>> {
  return apiRequest<Flat>(`/flats/${flatId}/tenancy/`, {
    method: 'PATCH',
    body: data,
  })
}

export async function vacateFlat(
  flatId: string,
  data?: {
    advanceNote?: string
    depositReturned?: number
  },
): Promise<ApiResult<Flat>> {
  return apiRequest<Flat>(`/flats/${flatId}/vacate/`, {
    method: 'POST',
    body: data ?? {},
  })
}

export async function fetchMyTenancies(
  status: 'active' | 'ended' | 'all' = 'active',
): Promise<ApiResult<MyTenancy[]>> {
  if (!hasAuthTokens()) return { ok: true, data: [] }
  const path =
    status === 'active'
      ? '/tenancies/mine/'
      : `/tenancies/mine/?status=${encodeURIComponent(status)}`
  return apiRequest<MyTenancy[]>(path)
}

export async function fetchRenters(): Promise<ApiResult<Renter[]>> {
  return apiRequest<Renter[]>('/renters/')
}

export async function fetchFloorsByBuilding(
  buildingId: string,
): Promise<ApiResult<Floor[]>> {
  return apiRequest<Floor[]>(`/buildings/${buildingId}/floors/`)
}

export async function fetchFloorById(
  floorId: string,
): Promise<ApiResult<Floor | undefined>> {
  const result = await apiRequest<Floor>(`/floors/${floorId}/`)
  if (!result.ok) {
    if (result.code === 'NOT_FOUND') return { ok: true, data: undefined }
    return result
  }
  return result
}

export async function fetchFloorStats(
  floorId: string,
): Promise<ApiResult<FloorStats | undefined>> {
  const result = await apiRequest<FloorStats>(`/floors/${floorId}/stats/`)
  if (!result.ok) {
    if (result.code === 'NOT_FOUND') return { ok: true, data: undefined }
    return result
  }
  return result
}

export async function createFloor(
  buildingId: string,
  data: FloorFormData,
): Promise<ApiResult<Floor>> {
  return apiRequest<Floor>(`/buildings/${buildingId}/floors/`, {
    method: 'POST',
    body: data,
  })
}

export async function patchFloor(
  floorId: string,
  data: Partial<FloorFormData>,
): Promise<ApiResult<Floor>> {
  return apiRequest<Floor>(`/floors/${floorId}/`, {
    method: 'PATCH',
    body: data,
  })
}

export async function removeFloor(
  floorId: string,
): Promise<ApiResult<boolean>> {
  const result = await apiRequest<null>(`/floors/${floorId}/`, {
    method: 'DELETE',
  })
  if (!result.ok) return result
  return { ok: true, data: true }
}

export async function saveFlatsSnapshot(
  flats: Flat[],
): Promise<ApiResult<Flat[]>> {
  // Prefer granular flat CRUD; bulk upsert via sequential PATCH/POST
  const results: Flat[] = []
  for (const flat of flats) {
    const existing = await apiRequest<Flat>(`/flats/${flat.id}/`, {
      method: 'PATCH',
      body: flat,
    })
    if (existing.ok) {
      results.push(existing.data)
    } else {
      const created = await createFlat({
        buildingId: flat.buildingId,
        flatNumber: flat.flatNumber,
        floor: flat.floor,
        rent: flat.rent,
        status: flat.status,
        area: flat.area,
        bedrooms: flat.bedrooms,
        bathrooms: flat.bathrooms,
      })
      if (created.ok) results.push(created.data)
    }
  }
  return { ok: true, data: results }
}

export type OwnerPortfolioSnapshot = {
  buildings: Building[]
  flats: Flat[]
  messList: Mess[]
}

export async function fetchOwnerPortfolioSnapshot(
  _ownerId?: string,
): Promise<ApiResult<OwnerPortfolioSnapshot>> {
  return apiRequest<OwnerPortfolioSnapshot>('/portfolio/snapshot/')
}

/** Sync helpers kept for legacy floor pages — prefer async API fns. */
export async function getFloorsByBuilding(buildingId: string): Promise<Floor[]> {
  const r = await fetchFloorsByBuilding(buildingId)
  return r.ok ? r.data : []
}

export async function getFloorById(floorId: string): Promise<Floor | undefined> {
  const r = await fetchFloorById(floorId)
  return r.ok ? r.data : undefined
}

export async function getFloorStats(
  floorId: string,
): Promise<FloorStats | undefined> {
  const r = await fetchFloorStats(floorId)
  return r.ok ? r.data : undefined
}

export async function addFloor(
  buildingId: string,
  data: FloorFormData,
): Promise<Floor> {
  const r = await createFloor(buildingId, data)
  if (!r.ok) throw new Error(r.error)
  return r.data
}

export async function updateFloor(
  floorId: string,
  data: Partial<FloorFormData>,
): Promise<Floor | undefined> {
  const r = await patchFloor(floorId, data)
  return r.ok ? r.data : undefined
}

export async function deleteFloor(floorId: string): Promise<boolean> {
  const r = await removeFloor(floorId)
  return r.ok ? r.data : false
}
