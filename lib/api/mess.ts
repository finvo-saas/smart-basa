import type {
  HisabGridRow,
  HisabMonth,
  MealOffRequest,
  MemberDeposit,
  MemberMealSheet,
  Mess,
  MessMealCalendar,
  MessMember,
  MessMemberDetail,
  MessUtilities,
  Notice,
  OccupantType,
  Seat,
} from '@/types/mess'
import type { SMSTemplate, SMSGroup } from '@/types/sms'
import type { Bill } from '@/types/bill'
import { apiRequest } from './client'
import type { ApiResult } from './http'
import { hasAuthTokens } from '@/utils/auth-tokens'

export async function fetchMessList(
  options?: { mine?: boolean },
): Promise<ApiResult<Mess[]>> {
  return apiRequest<Mess[]>(options?.mine ? '/mess/?mine=1' : '/mess/', {
    auth: Boolean(options?.mine),
  })
}

export async function fetchMessById(
  id: string,
): Promise<ApiResult<Mess | undefined>> {
  const result = await apiRequest<Mess>(`/mess/${id}/`, { auth: false })
  if (!result.ok) {
    if (result.code === 'NOT_FOUND') return { ok: true, data: undefined }
    return result
  }
  return result
}

export type MessProfileInput = {
  name: string
  address: string
  city: string
  monthlyFee: number
  gender: 'male' | 'female' | 'mixed'
  facilities?: string[]
  images?: string[]
  description?: string
  totalSeats?: number
  publishListing?: boolean
  listingId?: string | null
}

export async function createMess(
  input: MessProfileInput,
): Promise<ApiResult<Mess>> {
  return apiRequest<Mess>('/mess/', {
    method: 'POST',
    body: input,
  })
}

export async function updateMess(
  id: string,
  patch: Partial<MessProfileInput>,
): Promise<ApiResult<Mess>> {
  return apiRequest<Mess>(`/mess/${id}/`, {
    method: 'PATCH',
    body: patch,
  })
}

export async function updateMessLiveStatus(
  messId: string,
  status: Record<string, 'ok' | 'warn' | 'down'>,
): Promise<ApiResult<{ status: Record<string, string>; updatedAt?: string | null }>> {
  return apiRequest(`/mess/${messId}/live-status/`, {
    method: 'PATCH',
    body: status,
  })
}

export type MessExpenseSplit = {
  messId: string
  month: string
  year: number
  activeStudents: number
  splitTotal: number
  perPerson: number
  shares: Array<{
    studentId: string | null
    name: string
    seatNumber: string
    share: number
  }>
  byCategory: Array<{ category: string; total: number; perPerson: number }>
  note: string
}

export async function fetchMessExpenseSplit(
  messId: string,
  month?: number,
  year?: number,
): Promise<ApiResult<MessExpenseSplit>> {
  const params = new URLSearchParams()
  if (month) params.set('month', String(month))
  if (year) params.set('year', String(year))
  const q = params.toString()
  return apiRequest<MessExpenseSplit>(
    `/mess/${messId}/expenses/split/${q ? `?${q}` : ''}`,
  )
}

export async function fetchMyMessMemberships(): Promise<ApiResult<MessMember[]>> {
  if (!hasAuthTokens()) return { ok: true, data: [] }
  return apiRequest<MessMember[]>('/mess/me/memberships/')
}

export async function fetchMessStudents(
  messId?: string,
  filters?: { q?: string; type?: OccupantType | 'all'; status?: MemberStatusFilter },
): Promise<ApiResult<MessMember[]>> {
  if (!messId) {
    // Student dashboard: only the signed-in member's own enrollments.
    return fetchMyMessMemberships()
  }
  if (!hasAuthTokens()) return { ok: true, data: [] }
  const params = new URLSearchParams()
  if (filters?.q) params.set('q', filters.q)
  if (filters?.type && filters.type !== 'all') params.set('type', filters.type)
  if (filters?.status && filters.status !== 'all') {
    params.set('status', filters.status)
  }
  const query = params.toString()
  return apiRequest<MessMember[]>(
    `/mess/${messId}/students/${query ? `?${query}` : ''}`,
  )
}

export type MemberStatusFilter = 'all' | 'active' | 'inactive'

/** Everything an owner can set on a member; all optional except name/phone. */
export type MessMemberInput = {
  name: string
  phone: string
  whatsappNumber?: string
  email?: string
  occupantType?: OccupantType
  photoUrl?: string
  studentId?: string
  university?: string
  organization?: string
  designation?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  nidNumber?: string
  permanentAddress?: string
  notes?: string
  seatNumber?: string
  joinedDate?: string
  monthlyFee?: number
}

export async function assignMessStudent(
  messId: string,
  data: MessMemberInput,
): Promise<ApiResult<MessMember>> {
  return apiRequest<MessMember>(`/mess/${messId}/students/`, {
    method: 'POST',
    body: {
      name: data.name,
      phone: data.phone,
      whatsappNumber: data.whatsappNumber || '',
      email: data.email || '',
      occupantType: data.occupantType || 'student',
      photoUrl: data.photoUrl || '',
      studentId: data.studentId || '',
      university: data.university || '',
      organization: data.organization || '',
      designation: data.designation || '',
      emergencyContactName: data.emergencyContactName || '',
      emergencyContactPhone: data.emergencyContactPhone || '',
      nidNumber: data.nidNumber || '',
      permanentAddress: data.permanentAddress || '',
      notes: data.notes || '',
      seatNumber: data.seatNumber || '',
      ...(data.joinedDate ? { joinedDate: data.joinedDate } : {}),
      ...(data.monthlyFee != null ? { monthlyFee: data.monthlyFee } : {}),
    },
  })
}

export async function fetchMessMember(
  messId: string,
  memberId: string,
): Promise<ApiResult<MessMemberDetail>> {
  return apiRequest<MessMemberDetail>(`/mess/${messId}/students/${memberId}/`)
}

export async function updateMessMember(
  messId: string,
  memberId: string,
  patch: Partial<MessMemberInput> & {
    isActive?: boolean
    leftDate?: string | null
    vacateSeat?: boolean
  },
): Promise<ApiResult<MessMember>> {
  return apiRequest<MessMember>(`/mess/${messId}/students/${memberId}/`, {
    method: 'PATCH',
    body: patch,
  })
}

export async function removeMessMember(
  messId: string,
  memberId: string,
): Promise<ApiResult<{ id: string; removed: boolean }>> {
  return apiRequest(`/mess/${messId}/students/${memberId}/`, {
    method: 'DELETE',
  })
}

export async function fetchMessSeats(
  messId?: string,
): Promise<ApiResult<Seat[]>> {
  if (!messId) {
    const messes = await fetchMessList()
    if (!messes.ok) return messes
    const lists = await Promise.all(
      messes.data.map(m =>
        apiRequest<Seat[]>(`/mess/${m.id}/seats/`, { auth: false }),
      ),
    )
    return { ok: true, data: lists.flatMap(r => (r.ok ? r.data : [])) }
  }
  return apiRequest<Seat[]>(`/mess/${messId}/seats/`, { auth: false })
}

export async function fetchNoticesByMess(
  messId: string,
): Promise<ApiResult<Notice[]>> {
  return apiRequest<Notice[]>(`/mess/${messId}/notices/`, {
    auth: hasAuthTokens(),
  })
}

export async function fetchAllNotices(): Promise<ApiResult<Notice[]>> {
  if (!hasAuthTokens()) return { ok: true, data: [] }
  return apiRequest<Notice[]>('/notices/')
}

export async function createNotice(
  notice: Omit<Notice, 'id' | 'createdAt' | 'acknowledgments'> & {
    id?: string
    createdAt?: string
    messId: string
  },
): Promise<ApiResult<Notice>> {
  return apiRequest<Notice>(`/mess/${notice.messId}/notices/`, {
    method: 'POST',
    body: {
      title: notice.title,
      content: notice.content,
      date: notice.date,
      priority: notice.priority,
      category: notice.category || 'general',
      expiryDate: notice.expiryDate,
      pdfUrl: notice.pdfUrl || '',
      imageUrls: notice.imageUrls || [],
    },
  })
}

export async function patchNotice(
  id: string,
  updates: Partial<Notice>,
): Promise<ApiResult<Notice>> {
  return apiRequest<Notice>(`/notices/${id}/`, {
    method: 'PATCH',
    body: updates,
  })
}

export async function removeNotice(id: string): Promise<ApiResult<void>> {
  const result = await apiRequest<unknown>(`/notices/${id}/`, {
    method: 'DELETE',
  })
  if (!result.ok) return result
  return { ok: true, data: undefined }
}

export async function acknowledgeMessNotice(
  noticeId: string,
  _userId?: string,
): Promise<ApiResult<Notice>> {
  return apiRequest<Notice>(`/notices/${noticeId}/acknowledge/`, {
    method: 'POST',
    body: {},
  })
}

export async function fetchOrCreateMessBill(input: {
  tenantId?: string
  tenantName: string
  messId: string
  messName?: string
  seatNumber?: string
  monthlyFee: number
  studentId?: string
}): Promise<ApiResult<Bill>> {
  return apiRequest<Bill>(`/mess/${input.messId}/bills/get-or-create/`, {
    method: 'POST',
    body: {
      tenantName: input.tenantName,
      seatNumber: input.seatNumber || '',
      monthlyFee: input.monthlyFee,
      studentId: input.studentId || '',
    },
  })
}

export async function fetchMessSmsTemplates(
  messId: string,
): Promise<ApiResult<SMSTemplate[]>> {
  if (!hasAuthTokens()) return { ok: true, data: [] }
  return apiRequest<SMSTemplate[]>(`/mess/${messId}/sms/templates/`)
}

export async function fetchMessSmsGroups(
  messId: string,
): Promise<ApiResult<SMSGroup[]>> {
  if (!hasAuthTokens()) return { ok: true, data: [] }
  return apiRequest<SMSGroup[]>(`/mess/${messId}/sms/groups/`)
}

/** Compatibility helpers previously re-exported from mocks */
export async function getNoticesByMess(messId: string): Promise<Notice[]> {
  const result = await fetchNoticesByMess(messId)
  return result.ok ? result.data : []
}

export async function getNoticeById(
  id: string,
): Promise<Notice | undefined> {
  const all = await fetchAllNotices()
  if (!all.ok) return undefined
  return all.data.find(n => n.id === id)
}

export async function acknowledgeNotice(
  noticeId: string,
  userId?: string,
): Promise<Notice | undefined> {
  const result = await acknowledgeMessNotice(noticeId, userId)
  return result.ok ? result.data : undefined
}

/* —— Public meal calendar, utilities, book bridge, মিল হিসাব —— */

export async function fetchMessMealCalendar(
  messId: string,
  days = 7,
): Promise<ApiResult<MessMealCalendar>> {
  return apiRequest<MessMealCalendar>(
    `/mess/${messId}/meals/calendar/?days=${days}`,
    { auth: false },
  )
}

export async function updateMessMealPricing(
  messId: string,
  body: Record<string, unknown>,
): Promise<ApiResult<Mess>> {
  return apiRequest<Mess>(`/mess/${messId}/meals/pricing/`, {
    method: 'PATCH',
    body,
  })
}

export async function fetchMessUtilities(
  messId: string,
): Promise<ApiResult<MessUtilities>> {
  return apiRequest<MessUtilities>(`/mess/${messId}/utilities/`, {
    auth: false,
  })
}

export async function updateMessUtilities(
  messId: string,
  body: {
    waterProfile?: Record<string, unknown>
    electricityProfile?: Record<string, unknown>
  },
): Promise<ApiResult<MessUtilities>> {
  return apiRequest<MessUtilities>(`/mess/${messId}/utilities/`, {
    method: 'PATCH',
    body,
  })
}

export async function ensureMessListing(
  messId: string,
): Promise<
  ApiResult<{ listingId: string; bookUrl: string; mess: Mess }>
> {
  return apiRequest(`/mess/${messId}/ensure-listing/`, { method: 'POST' })
}

export async function fetchHisabGrid(
  messId: string,
  date: string,
): Promise<
  ApiResult<{
    messId: string
    date: string
    rows: HisabGridRow[]
    totals: { memberMeals: number; guestMeals: number; students: number }
  }>
> {
  return apiRequest(`/mess/${messId}/hisab/grid/?date=${date}`)
}

export async function saveHisabGrid(
  messId: string,
  date: string,
  rows: Array<Partial<HisabGridRow> & { studentId: string }>,
): Promise<ApiResult<{ rows: HisabGridRow[] }>> {
  return apiRequest(`/mess/${messId}/hisab/grid/`, {
    method: 'PUT',
    body: { date, rows },
  })
}

export async function markAllHisabMeals(
  messId: string,
  date: string,
  on: boolean,
): Promise<ApiResult<{ rows: HisabGridRow[] }>> {
  return apiRequest(`/mess/${messId}/hisab/grid/mark-all/`, {
    method: 'POST',
    body: { date, on },
  })
}

export async function fetchHisabMonth(
  messId: string,
  month?: number,
  year?: number,
): Promise<ApiResult<HisabMonth>> {
  const params = new URLSearchParams()
  if (month) params.set('month', String(month))
  if (year) params.set('year', String(year))
  const q = params.toString()
  return apiRequest<HisabMonth>(
    `/mess/${messId}/hisab/month/${q ? `?${q}` : ''}`,
  )
}

/** One member's day-by-day meals for a month (owner sheet, or the member's own). */
export async function fetchMemberMonthMeals(
  messId: string,
  studentId: string,
  year: number,
  month: number,
): Promise<ApiResult<MemberMealSheet>> {
  return apiRequest<MemberMealSheet>(
    `/mess/${messId}/students/${studentId}/meals/?year=${year}&month=${month}`,
  )
}

export async function closeHisabMonth(
  messId: string,
  month: number,
  year: number,
): Promise<ApiResult<HisabMonth>> {
  return apiRequest(`/mess/${messId}/hisab/month/close/`, {
    method: 'POST',
    body: { month, year },
  })
}

export async function reopenHisabMonth(
  messId: string,
  month: number,
  year: number,
): Promise<ApiResult<HisabMonth>> {
  return apiRequest(`/mess/${messId}/hisab/month/reopen/`, {
    method: 'POST',
    body: { month, year },
  })
}

export async function fetchMealOffRequests(
  messId: string,
): Promise<ApiResult<MealOffRequest[]>> {
  return apiRequest(`/mess/${messId}/hisab/meal-off/`)
}

export async function createMealOffRequest(
  messId: string,
  body: {
    studentId?: string
    startDate: string
    endDate: string
    reason?: string
    meals?: Record<string, boolean>
  },
): Promise<ApiResult<MealOffRequest>> {
  return apiRequest(`/mess/${messId}/hisab/meal-off/`, {
    method: 'POST',
    body,
  })
}

export async function reviewMealOffRequest(
  messId: string,
  requestId: string,
  approve: boolean,
  note?: string,
): Promise<ApiResult<MealOffRequest>> {
  return apiRequest(`/mess/${messId}/hisab/meal-off/${requestId}/review/`, {
    method: 'POST',
    body: { approve, note: note || '' },
  })
}

export async function fetchMemberDeposits(
  messId: string,
): Promise<ApiResult<MemberDeposit[]>> {
  return apiRequest(`/mess/${messId}/hisab/deposits/`)
}

export async function addMemberDeposit(
  messId: string,
  body: {
    studentId: string
    amount: number
    date: string
    note?: string
    paymentMethod?: string
    transactionId?: string
  },
): Promise<ApiResult<MemberDeposit>> {
  return apiRequest(`/mess/${messId}/hisab/deposits/`, {
    method: 'POST',
    body,
  })
}
