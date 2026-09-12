export type LiveStatusState = 'ok' | 'warn' | 'down'

export interface MessMealSystem {
  mealsPerDay: number
  vegetarianOption: boolean
  mealMonthlyCharge?: number | null
  guestMealPrice?: number | null
  mealOffPolicy?: string
  fishMeatDaysPerWeek?: number | null
}

export interface MessUtilityProfile {
  availability?: string
  source?: string
  tankCapacityLiters?: number | null
  hasFilter?: boolean
  separateDrinkingWater?: boolean
  hasBackup?: boolean
  loadSheddingLevel?: string
  hasIps?: boolean
  hasGenerator?: boolean
  generatorCovers?: string[]
  liftBackup?: boolean
  commonAreaBackup?: boolean
  emergencyLight?: boolean
  meterType?: string
  billSplitMethod?: string
  /** Freeform owner key → value pairs */
  manual?: Record<string, string>
}

export interface MessReliabilityScore {
  score: number
  label: string
  profile: MessUtilityProfile
  live: LiveStatusState
}

export interface MessUtilities {
  water: MessReliabilityScore
  electricity: MessReliabilityScore
  combined: number
}

export interface MessMealDay {
  date: string
  source: 'daily' | 'weekly' | 'empty'
  breakfast: string[]
  lunch: string[]
  dinner: string[]
  snack: string[]
  notes?: string
}

export interface MessMealCalendar {
  messId: string
  from: string
  to: string
  mealSystem: MessMealSystem
  today: MessMealDay | null
  calendar: MessMealDay[]
  guestMealPrice?: number | null
}

export interface HisabGridRow {
  studentId: string
  name: string
  seatNumber: string
  breakfast: number
  lunch: number
  dinner: number
  guestBreakfast: number
  guestLunch: number
  guestDinner: number
  memberTotal: number
  guestTotal: number
  notes?: string
  logId?: string | null
}

export interface HisabMonthMember {
  studentId: string
  name: string
  seatNumber: string
  mealCount: number
  mealCost: number
  guestMeals: number
  guestCost: number
  fixedShare: number
  deposits: number
  total: number
  due: number
  credit: number
}

export interface HisabMonth {
  messId: string
  year: number
  month: number
  status: 'open' | 'closed'
  closedAt?: string | null
  bazaarTotal: number
  fixedTotal: number
  totalMeals: number
  mealRate: number
  guestMealPrice?: number | null
  guestMeals: number
  activeStudents: number
  fixedShare: number
  members: HisabMonthMember[]
  note: string
  paymentTodo?: boolean
}

/** One calendar day on a member's monthly meal sheet. */
export interface MemberMealDay {
  date: string
  day: number
  weekday: string
  breakfast: number
  lunch: number
  dinner: number
  guestBreakfast: number
  guestLunch: number
  guestDinner: number
  memberTotal: number
  guestTotal: number
  notes: string
  /** False when the owner never marked this day. */
  logged: boolean
}

export interface MemberMealSheet {
  messId: string
  messName: string
  year: number
  month: number
  monthStart: string
  monthEnd: string
  status: 'open' | 'closed'
  member: {
    studentId: string
    name: string
    phone: string
    seatNumber: string
    occupantType: OccupantType
    isActive: boolean
  }
  days: MemberMealDay[]
  totals: {
    breakfast: number
    lunch: number
    dinner: number
    memberMeals: number
    guestMeals: number
    daysWithMeals: number
    daysInMonth: number
  }
  costs: {
    mealRate: number
    mealCost: number
    guestMealPrice?: number | null
    guestCost: number
    fixedShare: number
    deposits: number
    total: number
    due: number
    credit: number
  }
  generatedAt: string
}

export interface MealOffRequest {
  id: string
  messId: string
  studentId: string
  studentName: string
  startDate: string
  endDate: string
  meals: Record<string, boolean>
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  reviewNote?: string
  reviewedAt?: string | null
  createdAt?: string | null
}

export interface MemberDeposit {
  id: string
  messId: string
  studentId: string
  studentName: string
  amount: number
  date: string
  note: string
  paymentMethod?: string
  transactionId?: string
  status?: 'confirmed' | 'pending_claim' | 'rejected'
  createdAt?: string | null
}

/** A mess seat can be taken by anyone, not only university students. */
export type OccupantType =
  | 'student'
  | 'job_holder'
  | 'business'
  | 'family'
  | 'other'

export interface MessMember {
  id: string
  messId: string
  messName?: string
  userId?: string
  /** True when this member is linked to a login account. */
  isSystemUser?: boolean
  name: string
  phone: string
  /** Renter's WhatsApp number so owners can message instead of calling. */
  whatsappNumber?: string
  email?: string
  occupantType: OccupantType
  photoUrl?: string
  /** Institution id — only meaningful when occupantType is 'student'. */
  studentId?: string
  university?: string
  /** Employer or business name for non-student members. */
  organization?: string
  designation?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  nidNumber?: string
  permanentAddress?: string
  notes?: string
  seatNumber?: string
  roomNumber?: string
  joinedDate: string
  leftDate?: string | null
  monthlyFee: number
  isActive?: boolean
}

/** Legacy alias — members were student-only before occupant types existed. */
export type Student = MessMember

export interface MessMemberDetail {
  member: MessMember
  attendance: {
    totalDays: number
    presentDays: number
    absentDays: number
    lateDays: number
    excusedDays: number
    mealAttended: number
    mealAbsent: number
    attendanceRate: number
    mealAttendanceRate: number
    period: { startDate: string; endDate: string }
  }
  hisab: {
    year: number
    month: number
    mealRate: number
    row: {
      mealCount: number
      mealCost: number
      guestMeals: number
      guestCost: number
      fixedShare: number
      deposits: number
      total: number
      due: number
      credit: number
    } | null
  }
  deposits: MemberDeposit[]
  violations: Array<{
    id: string
    ruleTitle: string
    violationDate: string
    description: string
    severity: string
    status: string
  }>
}

export interface Notice {
  id: string
  title: string
  content: string
  date: string
  priority: 'high' | 'medium' | 'low'
  messId?: string
  buildingId?: string
  buildingName?: string
  flatIds?: string[]
  /** Unified ops scope */
  scopeType?: 'mess' | 'building' | 'hotel'
  scopeId?: string
  scopeName?: string
  targetIds?: string[]
  source?: 'mess' | 'building' | 'hotel'
  category?:
    | 'general'
    | 'payment'
    | 'maintenance'
    | 'event'
    | 'announcement'
    | 'rule'
    | 'other'
  expiryDate?: string
  pdfUrl?: string
  imageUrls?: string[]
  createdBy: string
  createdAt: string
  acknowledgments?: NoticeAcknowledgment[]
}

export interface NoticeAcknowledgment {
  userId: string
  userName: string
  acknowledgedAt: string
}

export interface Mess {
  id: string
  name: string
  address: string
  city: string
  totalSeats: number
  availableSeats: number
  monthlyFee: number
  electricityBill?: number | null
  gasBill?: number | null
  internetBill?: number | null
  waterBill?: number | null
  gender: 'male' | 'female' | 'mixed'
  facilities: string[]
  images: string[]
  description?: string
  ownerName: string
  ownerPhone: string
  /** Owner's WhatsApp number; empty when the owner has not added one. */
  ownerWhatsapp?: string
  createdAt: string
  featured?: boolean
  lastConfirmedAt?: string | null
  confirmedHoursAgo?: number | null
  stale?: boolean
  listingId?: string | null
  /** From linked marketplace listing when available */
  latitude?: number | null
  longitude?: number | null
  bookUrl?: string | null
  mealSystem?: MessMealSystem
  utilities?: MessUtilities
  livingCost?: import('./living').LivingCost | null
  liveStatus?: {
    status: Record<string, LiveStatusState>
    updatedAt?: string | null
  }
}

export interface Seat {
  id: string
  seatNumber: string
  roomNumber: string
  status: 'available' | 'occupied'
  studentId?: string
  messId: string
}
