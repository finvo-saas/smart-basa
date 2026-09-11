/**
 * Mess sub-domain API accessors — async replacements for former mock modules.
 * All functions return ApiResult<T> (or Promise<T> for thin helpers noted below).
 */
import type {
  DailyMenu,
  WeeklySchedule,
  MealTiming,
  MealPreference,
} from '@/types/meal'
import type {
  AttendanceRecord,
  AttendanceSummary,
  AttendanceReport,
} from '@/types/attendance'
import type {
  SMSTemplate,
  SMSGroup,
  SMSMessage,
  SMSHistory,
} from '@/types/sms'
import type {
  MessRule,
  RuleAcceptance,
  RuleViolation,
} from '@/types/messRules'
import type {
  MessExpense,
  MonthlyExpenseSummary,
  ExpenseReport,
} from '@/types/messExpense'
import { apiRequest } from './client'
import type { ApiResult } from './http'
import { hasAuthTokens } from '@/utils/auth-tokens'

function emptyOk<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

// ── Meals ──────────────────────────────────────────────────────────

export async function getDailyMenusByMess(
  messId: string,
): Promise<DailyMenu[]> {
  const result = await apiRequest<DailyMenu[]>(`/mess/${messId}/meals/daily/`, {
    auth: hasAuthTokens(),
  })
  return result.ok ? result.data : []
}

export async function getDailyMenuByDate(
  messId: string,
  date: string,
): Promise<DailyMenu | undefined> {
  const menus = await getDailyMenusByMess(messId)
  return menus.find(m => m.date === date)
}

export async function addDailyMenu(
  menu: Omit<DailyMenu, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string
  },
): Promise<DailyMenu | undefined> {
  const result = await apiRequest<DailyMenu>(
    `/mess/${menu.messId}/meals/daily/`,
    { method: 'POST', body: menu },
  )
  return result.ok ? result.data : undefined
}

export async function updateDailyMenu(
  menuId: string,
  updates: Partial<DailyMenu> & { messId: string },
): Promise<DailyMenu | undefined> {
  const result = await apiRequest<DailyMenu>(
    `/mess/${updates.messId}/meals/daily/${menuId}/`,
    { method: 'PATCH', body: updates },
  )
  return result.ok ? result.data : undefined
}

const EMPTY_WEEK_DAYS = [
  'saturday',
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
] as const

function normalizeWeeklySchedule(schedule: WeeklySchedule): WeeklySchedule {
  let raw: unknown = schedule.schedule
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw)
    } catch {
      raw = {}
    }
  }
  const source =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {}

  const normalized = {} as WeeklySchedule['schedule']
  for (const day of EMPTY_WEEK_DAYS) {
    const dayValue = source[day]
    normalized[day] =
      dayValue && typeof dayValue === 'object' && !Array.isArray(dayValue)
        ? (dayValue as WeeklySchedule['schedule'][typeof day])
        : {}
  }

  return {
    ...schedule,
    schedule: normalized,
  }
}

export async function getWeeklyScheduleByMess(
  messId: string,
): Promise<WeeklySchedule | undefined> {
  const result = await apiRequest<WeeklySchedule[]>(
    `/mess/${messId}/meals/weekly/`,
    { auth: hasAuthTokens() },
  )
  if (!result.ok || !result.data.length) return undefined
  const selected = result.data.find(s => s.isActive) ?? result.data[0]
  return normalizeWeeklySchedule(selected)
}

export async function addWeeklySchedule(
  schedule: Omit<WeeklySchedule, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string
  },
): Promise<WeeklySchedule | undefined> {
  const result = await apiRequest<WeeklySchedule>(
    `/mess/${schedule.messId}/meals/weekly/`,
    { method: 'POST', body: schedule },
  )
  return result.ok ? normalizeWeeklySchedule(result.data) : undefined
}

export async function updateWeeklySchedule(
  scheduleId: string,
  updates: Partial<WeeklySchedule> & { messId: string },
): Promise<WeeklySchedule | undefined> {
  const { messId, ...body } = updates
  const result = await apiRequest<WeeklySchedule>(
    `/mess/${messId}/meals/weekly/${scheduleId}/`,
    { method: 'PATCH', body },
  )
  return result.ok ? normalizeWeeklySchedule(result.data) : undefined
}

export async function getMealTimingByMess(
  messId: string,
): Promise<MealTiming | undefined> {
  const result = await apiRequest<MealTiming>(
    `/mess/${messId}/meals/timing/`,
    { auth: hasAuthTokens() },
  )
  return result.ok ? result.data : undefined
}

export async function updateMealTiming(
  messId: string,
  timing: Partial<MealTiming>,
): Promise<MealTiming | undefined> {
  const result = await apiRequest<MealTiming>(
    `/mess/${messId}/meals/timing/`,
    { method: 'PATCH', body: timing },
  )
  return result.ok ? result.data : undefined
}

export async function getMealPreferenceByUser(
  _userId: string,
  messId: string,
): Promise<MealPreference | undefined> {
  const result = await apiRequest<MealPreference>(
    `/mess/${messId}/meals/preferences/`,
  )
  if (!result.ok) return undefined
  return result.data
}

export async function updateMealPreference(
  userId: string,
  messId: string,
  preferences: MealPreference['preferences'],
): Promise<MealPreference | undefined> {
  const result = await apiRequest<MealPreference>(
    `/mess/${messId}/meals/preferences/`,
    {
      method: 'PUT',
      body: { userId, messId, preferences },
    },
  )
  return result.ok ? result.data : undefined
}

// ── Attendance ─────────────────────────────────────────────────────

export async function getAttendanceByMess(
  messId: string,
  startDate?: string,
  endDate?: string,
): Promise<AttendanceRecord[]> {
  const params = new URLSearchParams()
  if (startDate) params.set('startDate', startDate)
  if (endDate) params.set('endDate', endDate)
  const qs = params.toString()
  const result = await apiRequest<AttendanceRecord[]>(
    `/mess/${messId}/attendance/${qs ? `?${qs}` : ''}`,
    { auth: hasAuthTokens() },
  )
  return result.ok ? result.data : []
}

export async function getAttendanceByStudent(
  studentId: string,
  messId: string,
  startDate?: string,
  endDate?: string,
): Promise<AttendanceRecord[]> {
  const params = new URLSearchParams({ studentId })
  if (startDate) params.set('startDate', startDate)
  if (endDate) params.set('endDate', endDate)
  const result = await apiRequest<AttendanceRecord[]>(
    `/mess/${messId}/attendance/?${params}`,
  )
  return result.ok ? result.data : []
}

export async function getAttendanceByDate(
  messId: string,
  date: string,
): Promise<AttendanceRecord[]> {
  const result = await apiRequest<AttendanceRecord[]>(
    `/mess/${messId}/attendance/?date=${encodeURIComponent(date)}`,
    { auth: hasAuthTokens() },
  )
  return result.ok ? result.data : []
}

export async function getAttendanceSummary(
  studentId: string,
  messId: string,
  startDate: string,
  endDate: string,
): Promise<AttendanceSummary> {
  const params = new URLSearchParams({
    studentId,
    startDate,
    endDate,
  })
  const result = await apiRequest<AttendanceSummary | AttendanceSummary[]>(
    `/mess/${messId}/attendance/summary/?${params}`,
  )
  if (!result.ok) {
    return {
      studentId,
      studentName: '',
      messId,
      period: { startDate, endDate },
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      excusedDays: 0,
      mealAttended: 0,
      mealAbsent: 0,
      attendanceRate: 0,
      mealAttendanceRate: 0,
    }
  }
  const data = result.data
  if (Array.isArray(data)) {
    return (
      data.find(s => s.studentId === studentId) ?? {
        studentId,
        studentName: '',
        messId,
        period: { startDate, endDate },
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        excusedDays: 0,
        mealAttended: 0,
        mealAbsent: 0,
        attendanceRate: 0,
        mealAttendanceRate: 0,
      }
    )
  }
  return data
}

export async function markAttendance(
  record: Omit<AttendanceRecord, 'id' | 'markedAt'> & { id?: string },
): Promise<AttendanceRecord | undefined> {
  const result = await apiRequest<AttendanceRecord>(
    `/mess/${record.messId}/attendance/`,
    { method: 'POST', body: record },
  )
  return result.ok ? result.data : undefined
}

export async function bulkMarkAttendance(
  messId: string,
  records: Omit<AttendanceRecord, 'id' | 'markedAt' | 'messId'>[],
): Promise<ApiResult<AttendanceRecord[]>> {
  return apiRequest<AttendanceRecord[]>(`/mess/${messId}/attendance/bulk/`, {
    method: 'POST',
    body: { date: records[0]?.date, records },
  })
}

export async function generateAttendanceReport(
  messId: string,
  startDate: string,
  endDate: string,
  reportType: AttendanceReport['reportType'] = 'custom',
): Promise<AttendanceReport | undefined> {
  const result = await apiRequest<AttendanceReport>(
    `/mess/${messId}/attendance/report/`,
    {
      method: 'POST',
      body: { startDate, endDate, reportType },
    },
  )
  return result.ok ? result.data : undefined
}

// ── SMS ────────────────────────────────────────────────────────────

export async function getSMSTemplatesByMess(
  messId: string,
): Promise<SMSTemplate[]> {
  const result = await apiRequest<SMSTemplate[]>(
    `/mess/${messId}/sms/templates/`,
  )
  return result.ok ? result.data : []
}

export async function getSMSGroupsByMess(messId: string): Promise<SMSGroup[]> {
  const result = await apiRequest<SMSGroup[]>(`/mess/${messId}/sms/groups/`)
  if (!result.ok || !Array.isArray(result.data)) return []
  return result.data.map(group => ({
    ...group,
    memberIds: Array.isArray(group.memberIds)
      ? group.memberIds.map(String)
      : Array.isArray((group as { member_ids?: unknown }).member_ids)
        ? ((group as { member_ids: unknown[] }).member_ids).map(String)
        : [],
  }))
}

export async function getSMSMessagesByMess(
  messId: string,
): Promise<SMSMessage[]> {
  const result = await apiRequest<SMSMessage[]>(
    `/mess/${messId}/sms/messages/`,
  )
  return result.ok ? result.data : []
}

export async function getSMSHistory(
  messId: string,
  startDate?: string,
  endDate?: string,
): Promise<SMSHistory> {
  const params = new URLSearchParams()
  if (startDate) params.set('startDate', startDate)
  if (endDate) params.set('endDate', endDate)
  const qs = params.toString()
  const result = await apiRequest<SMSHistory>(
    `/mess/${messId}/sms/history/${qs ? `?${qs}` : ''}`,
  )
  if (!result.ok) {
    return {
      messages: [],
      totalSent: 0,
      totalFailed: 0,
      totalCost: 0,
      period: {
        startDate: startDate || '',
        endDate: endDate || '',
      },
    }
  }
  return result.data
}

export async function sendBulkSMS(
  messId: string,
  payload: Record<string, unknown>,
): Promise<SMSMessage | undefined> {
  const result = await apiRequest<SMSMessage>(`/mess/${messId}/sms/send/`, {
    method: 'POST',
    body: payload,
  })
  if (!result.ok) {
    throw new Error(result.error || 'SMS send failed')
  }
  return result.data
}

export async function getOwnerSMSWallet(): Promise<
  import('@/types/sms').OwnerSMSWallet | undefined
> {
  const result = await apiRequest<import('@/types/sms').OwnerSMSWallet>(
    '/mess/sms/wallet/',
  )
  return result.ok ? result.data : undefined
}

export async function purchaseSMSCredits(
  packageId: string,
): Promise<
  | {
      balance: number
      credits: number
      amountBdt: number
      wallet: import('@/types/sms').OwnerSMSWallet
    }
  | undefined
> {
  const result = await apiRequest<{
    balance: number
    credits: number
    amountBdt: number
    wallet: import('@/types/sms').OwnerSMSWallet
  }>('/mess/sms/credits/purchase/', {
    method: 'POST',
    body: { packageId },
  })
  return result.ok ? result.data : undefined
}

export async function getOwnerSMSLedger(): Promise<{
  wallet: import('@/types/sms').OwnerSMSWallet
  ledger: import('@/types/sms').SMSCreditLedgerEntry[]
} | undefined> {
  const result = await apiRequest<{
    wallet: import('@/types/sms').OwnerSMSWallet
    ledger: import('@/types/sms').SMSCreditLedgerEntry[]
  }>('/mess/sms/credits/ledger/')
  return result.ok ? result.data : undefined
}

export async function getOwnerSMSHistory(params?: {
  messId?: string
  startDate?: string
  endDate?: string
}): Promise<{
  wallet: import('@/types/sms').OwnerSMSWallet
  messages: SMSMessage[]
  totalSent: number
  totalFailed: number
  totalCost: number
} | undefined> {
  const search = new URLSearchParams()
  if (params?.messId) search.set('messId', params.messId)
  if (params?.startDate) search.set('startDate', params.startDate)
  if (params?.endDate) search.set('endDate', params.endDate)
  const qs = search.toString()
  const result = await apiRequest<{
    wallet: import('@/types/sms').OwnerSMSWallet
    messages: SMSMessage[]
    totalSent: number
    totalFailed: number
    totalCost: number
  }>(`/mess/sms/history/${qs ? `?${qs}` : ''}`)
  return result.ok ? result.data : undefined
}

export async function addSMSTemplate(
  template: Omit<SMSTemplate, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string
    messId: string
  },
): Promise<SMSTemplate | undefined> {
  const result = await apiRequest<SMSTemplate>(
    `/mess/${template.messId}/sms/templates/`,
    { method: 'POST', body: template },
  )
  return result.ok ? result.data : undefined
}

export async function updateSMSTemplate(
  templateId: string,
  updates: Partial<SMSTemplate> & { messId: string },
): Promise<SMSTemplate | undefined> {
  const result = await apiRequest<SMSTemplate>(
    `/mess/${updates.messId}/sms/templates/${templateId}/`,
    { method: 'PATCH', body: updates },
  )
  return result.ok ? result.data : undefined
}

export async function deleteSMSTemplate(
  messId: string,
  templateId: string,
): Promise<boolean> {
  const result = await apiRequest(`/mess/${messId}/sms/templates/${templateId}/`, {
    method: 'DELETE',
  })
  return result.ok
}

export async function addSMSGroup(
  group: Omit<SMSGroup, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): Promise<SMSGroup | undefined> {
  const result = await apiRequest<SMSGroup>(
    `/mess/${group.messId}/sms/groups/`,
    { method: 'POST', body: group },
  )
  return result.ok ? result.data : undefined
}

export async function updateSMSGroup(
  groupId: string,
  updates: Partial<SMSGroup> & { messId: string },
): Promise<SMSGroup | undefined> {
  const { messId, ...body } = updates
  const result = await apiRequest<SMSGroup>(
    `/mess/${messId}/sms/groups/${groupId}/`,
    { method: 'PATCH', body },
  )
  return result.ok ? result.data : undefined
}

export async function deleteSMSGroup(
  messId: string,
  groupId: string,
): Promise<boolean> {
  const result = await apiRequest(`/mess/${messId}/sms/groups/${groupId}/`, {
    method: 'DELETE',
  })
  return result.ok
}

// ── Rules ──────────────────────────────────────────────────────────

export async function getRulesByMess(messId: string): Promise<MessRule[]> {
  const result = await apiRequest<MessRule[]>(`/mess/${messId}/rules/`, {
    auth: hasAuthTokens(),
  })
  return result.ok ? result.data : []
}

export async function getRuleById(
  messId: string,
  ruleId: string,
): Promise<MessRule | undefined> {
  const rules = await getRulesByMess(messId)
  return rules.find(r => r.id === ruleId)
}

export async function getAcceptancesByStudent(
  _studentId: string,
): Promise<RuleAcceptance[]> {
  // Acceptances are embedded per-rule accept flow; return empty list for UI filter
  return []
}

export async function getViolationsByMess(
  messId: string,
): Promise<RuleViolation[]> {
  const result = await apiRequest<RuleViolation[]>(
    `/mess/${messId}/rules/violations/`,
  )
  return result.ok ? result.data : []
}

export async function addRule(
  rule: Omit<MessRule, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): Promise<MessRule | undefined> {
  const result = await apiRequest<MessRule>(`/mess/${rule.messId}/rules/`, {
    method: 'POST',
    body: {
      title: rule.title,
      description: rule.description,
      category: rule.category,
      severity: rule.severity,
      penalty: rule.penalty || '',
      status: rule.status || 'active',
      requiresAcceptance: Boolean(rule.requiresAcceptance),
      effectiveDate: rule.effectiveDate || null,
      expiryDate: rule.expiryDate || null,
    },
  })
  return result.ok ? result.data : undefined
}

export async function updateRule(
  ruleId: string,
  updates: Partial<MessRule> & { messId: string },
): Promise<MessRule | undefined> {
  const result = await apiRequest<MessRule>(
    `/mess/${updates.messId}/rules/${ruleId}/`,
    {
      method: 'PATCH',
      body: {
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.description !== undefined
          ? { description: updates.description }
          : {}),
        ...(updates.category !== undefined ? { category: updates.category } : {}),
        ...(updates.severity !== undefined ? { severity: updates.severity } : {}),
        ...(updates.penalty !== undefined
          ? { penalty: updates.penalty || '' }
          : {}),
        ...(updates.status !== undefined ? { status: updates.status } : {}),
        ...(updates.requiresAcceptance !== undefined
          ? { requiresAcceptance: Boolean(updates.requiresAcceptance) }
          : {}),
        ...(updates.effectiveDate !== undefined
          ? { effectiveDate: updates.effectiveDate || null }
          : {}),
        ...(updates.expiryDate !== undefined
          ? { expiryDate: updates.expiryDate || null }
          : {}),
      },
    },
  )
  return result.ok ? result.data : undefined
}

export async function deleteRule(
  messId: string,
  ruleId: string,
): Promise<boolean> {
  const result = await apiRequest(`/mess/${messId}/rules/${ruleId}/`, {
    method: 'DELETE',
  })
  return result.ok
}

export async function acceptRule(
  messId: string,
  ruleId: string,
): Promise<RuleAcceptance | undefined> {
  const result = await apiRequest<RuleAcceptance>(
    `/mess/${messId}/rules/${ruleId}/accept/`,
    { method: 'POST', body: {} },
  )
  return result.ok ? result.data : undefined
}

export async function addViolation(
  violation: Omit<RuleViolation, 'id' | 'reportedAt'> & { id?: string },
): Promise<RuleViolation | undefined> {
  const result = await apiRequest<RuleViolation>(
    `/mess/${violation.messId}/rules/violations/`,
    { method: 'POST', body: violation },
  )
  return result.ok ? result.data : undefined
}

export async function updateViolation(
  violationId: string,
  updates: Partial<RuleViolation> & { messId: string },
): Promise<RuleViolation | undefined> {
  const result = await apiRequest<RuleViolation>(
    `/mess/${updates.messId}/rules/violations/${violationId}/`,
    { method: 'PATCH', body: updates },
  )
  return result.ok ? result.data : undefined
}

// ── Expenses ───────────────────────────────────────────────────────

export async function getExpensesByMess(
  messId: string,
  startDate?: string,
  endDate?: string,
): Promise<MessExpense[]> {
  const params = new URLSearchParams()
  if (startDate) params.set('startDate', startDate)
  if (endDate) params.set('endDate', endDate)
  const qs = params.toString()
  const result = await apiRequest<MessExpense[]>(
    `/mess/${messId}/expenses/${qs ? `?${qs}` : ''}`,
  )
  return result.ok ? result.data : []
}

export async function getExpenseById(
  messId: string,
  expenseId: string,
): Promise<MessExpense | undefined> {
  const expenses = await getExpensesByMess(messId)
  return expenses.find(e => e.id === expenseId)
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** `month` is 1–12; the API answers with the month name for display. */
export async function getMonthlyExpenseSummary(
  messId: string,
  month: number,
  year: number,
): Promise<MonthlyExpenseSummary> {
  const result = await apiRequest<MonthlyExpenseSummary>(
    `/mess/${messId}/expenses/summary/?month=${month}&year=${year}`,
  )
  if (!result.ok) {
    return {
      messId,
      month: MONTH_NAMES[month - 1] ?? String(month),
      year,
      totalAmount: 0,
      categoryBreakdown: [],
      expenseCount: 0,
      averageDailyExpense: 0,
    }
  }
  return result.data
}

export async function addExpense(
  expense: Omit<MessExpense, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string
  },
): Promise<MessExpense | undefined> {
  const result = await apiRequest<MessExpense>(
    `/mess/${expense.messId}/expenses/`,
    { method: 'POST', body: expense },
  )
  return result.ok ? result.data : undefined
}

export async function updateExpense(
  expenseId: string,
  updates: Partial<MessExpense> & { messId: string },
): Promise<MessExpense | undefined> {
  const result = await apiRequest<MessExpense>(
    `/mess/${updates.messId}/expenses/${expenseId}/`,
    { method: 'PATCH', body: updates },
  )
  return result.ok ? result.data : undefined
}

export async function deleteExpense(
  messId: string,
  expenseId: string,
): Promise<boolean> {
  const result = await apiRequest(`/mess/${messId}/expenses/${expenseId}/`, {
    method: 'DELETE',
  })
  return result.ok
}

export async function generateExpenseReport(
  messId: string,
  startDate: string,
  endDate: string,
  reportType: ExpenseReport['reportType'] = 'custom',
): Promise<ExpenseReport | undefined> {
  const result = await apiRequest<ExpenseReport>(
    `/mess/${messId}/expenses/report/`,
    {
      method: 'POST',
      body: { startDate, endDate, reportType },
    },
  )
  return result.ok ? result.data : undefined
}

// Legacy sync mock exports removed — pages must await these helpers.
export const mockDailyMenus: DailyMenu[] = []
export const mockWeeklySchedules: WeeklySchedule[] = []
export const mockMealTimings: MealTiming[] = []
export const mockMealPreferences: MealPreference[] = []
export const mockAttendanceRecords: AttendanceRecord[] = []
export const mockSMSTemplates: SMSTemplate[] = []
export const mockSMSGroups: SMSGroup[] = []
export const mockSMSMessages: SMSMessage[] = []
export const mockMessRules: MessRule[] = []
export const mockRuleAcceptances: RuleAcceptance[] = []
export const mockRuleViolations: RuleViolation[] = []
export const mockMessExpenses: MessExpense[] = []

export { emptyOk }
