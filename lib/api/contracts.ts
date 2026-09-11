/**
 * Typed API contracts — swap mock implementations in `lib/api/*.ts` for HTTP later.
 * All functions return `Promise<ApiResult<T>>` unless noted as sync server helpers.
 */
import type { Property } from '@/types/property'
import type { Bill, BillTemplate, BillGenerationRule, MeterReading } from '@/types/bill'
import type { Building, Flat, Renter } from '@/types/building'
import type { Mess, Notice, Student } from '@/types/mess'
import type { Complaint, Notification } from '@/types/complaint'
import type { Chat, ChatMessage } from '@/types/chat'
import type { Hotel, Booking, Room } from '@/types/hotel'
import type { PaymentTransaction, ScheduledPayment, OwnerPayout } from '@/types/payment'

/** GET /properties */
export type FetchPropertiesResponse = Property[]

/** GET /properties/:id */
export type FetchPropertyResponse = Property | null

/** GET /bills/board — owner + renter bill management snapshot */
export type BillsBoardResponse = {
  bills: Bill[]
  templates: BillTemplate[]
  rules: BillGenerationRule[]
  meterReadings: MeterReading[]
  buildings: Building[]
  flats: Flat[]
  renters: Renter[]
  messList: Mess[]
}

/** GET /complaints?userId=&role= */
export type FetchComplaintsResponse = Complaint[]

/** POST /complaints */
export type CreateComplaintRequest = {
  userId: string
  userName: string
  title: string
  description: string
  imageUrl?: string
  category?: 'maintenance' | 'billing' | 'noise' | 'other'
  scopeType?: 'mess' | 'building' | 'hotel'
  scopeId?: string
  targetId?: string
  buildingId?: string
  flatId?: string
  messId?: string
  hotelId?: string
}

/** GET /messages/chats?userId= */
export type FetchChatsResponse = Chat[]

/** GET /messages/chats/:id */
export type FetchChatMessagesResponse = ChatMessage[]

/** GET /hotels */
export type FetchHotelsResponse = Hotel[]

/** GET /hotels/:id */
export type FetchHotelResponse = Hotel | undefined

/** GET /mess */
export type FetchMessListResponse = Mess[]

/** GET /mess/:id/students */
export type FetchMessStudentsResponse = Student[]

/** GET /notices?messId= */
export type FetchNoticesResponse = Notice[]

/** GET /notifications?userId= */
export type FetchNotificationsResponse = Notification[]

/** GET /admin/dashboard */
export type AdminDashboardResponse = {
  pendingVerifications: number
  openComplaints: number
  openDisputes: number
  fraudReports: number
}

/** GET /buildings?ownerId= */
export type FetchBuildingsResponse = Building[]

/** GET /payments/history?userId= */
export type FetchPaymentHistoryResponse = PaymentTransaction[]

/** GET /payments/scheduled?userId= */
export type FetchScheduledPaymentsResponse = ScheduledPayment[]

/** GET /payments/owner/payouts?ownerId= */
export type FetchOwnerPayoutsResponse = OwnerPayout[]

/** GET /hotels/:id/bookings */
export type FetchHotelBookingsResponse = Booking[]

/** GET /hotels/:id/rooms */
export type FetchHotelRoomsResponse = Room[]

/** GET /buildings/portfolio-snapshot?ownerId= */
export type OwnerPortfolioSnapshotResponse = {
  buildings: Building[]
  flats: Flat[]
  messList: Mess[]
}

/** GET /search/notifications?userId= */
export type SearchMatchNotificationsResponse = {
  savedSearch: import('@/types/savedSearch').SavedSearch
  newMatches: Property[]
  matchCount: number
}[]

/** PATCH /admin/fraud-reports/:id */
export type PatchFraudReportRequest = Partial<
  import('@/types/admin').FraudReport
>

/** POST /audit/logs */
export type CreateAuditLogRequest = import('@/types/audit').AuditLog
