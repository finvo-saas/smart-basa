import { apiRequest } from './client'
import type { ApiResult } from './http'
import { hasAuthTokens } from '@/utils/auth-tokens'
import type { Notice } from '@/types/mess'

export type BuildingNotice = Notice & {
  buildingId: string
  buildingName?: string
  flatIds?: string[]
  source: 'building'
}

function toDateOnly(value?: string | Date): string | undefined {
  if (!value) return undefined
  if (typeof value === 'string') return value.slice(0, 10)
  return value.toISOString().slice(0, 10)
}

export async function fetchBuildingNotices(): Promise<
  ApiResult<BuildingNotice[]>
> {
  if (!hasAuthTokens()) return { ok: true, data: [] }
  return apiRequest<BuildingNotice[]>('/building-notices/')
}

export async function createBuildingNotice(
  buildingId: string,
  notice: {
    title: string
    content: string
    date: string
    priority: Notice['priority']
    category?: Notice['category']
    expiryDate?: string
    pdfUrl?: string
    imageUrls?: string[]
    flatIds?: string[]
  },
): Promise<ApiResult<BuildingNotice>> {
  return apiRequest<BuildingNotice>(`/buildings/${buildingId}/notices/`, {
    method: 'POST',
    body: {
      title: notice.title,
      content: notice.content,
      date: toDateOnly(notice.date) || notice.date.slice(0, 10),
      priority: notice.priority,
      category: notice.category || 'general',
      expiryDate: toDateOnly(notice.expiryDate),
      pdfUrl: notice.pdfUrl || '',
      imageUrls: notice.imageUrls || [],
      flatIds: notice.flatIds || [],
    },
  })
}

export async function removeBuildingNotice(
  noticeId: string,
): Promise<ApiResult<void>> {
  const result = await apiRequest<unknown>(`/building-notices/${noticeId}/`, {
    method: 'DELETE',
  })
  if (!result.ok) return result
  return { ok: true, data: undefined }
}

export async function acknowledgeBuildingNotice(
  noticeId: string,
): Promise<ApiResult<BuildingNotice>> {
  return apiRequest<BuildingNotice>(
    `/building-notices/${noticeId}/acknowledge/`,
    {
      method: 'POST',
      body: {},
    },
  )
}
