export type BillStatus = 'paid' | 'unpaid' | 'overdue'

export interface Bill {
  id: string
  tenantName: string
  tenantId: string
  propertyType: 'apartment' | 'mess'
  propertyName: string
  propertyId: string
  flatNumber?: string
  seatNumber?: string
  month: string
  year: number
  amount: number
  amountPaid?: number
  dueDate: string
  paidDate?: string
  status: BillStatus
  items: BillItem[]
  createdAt: string
  templateId?: string // Reference to bill template if auto-generated
  meterReadings?: MeterReading // Meter readings used for calculation
  /** ISO timestamp when owner last opened WhatsApp share for this bill */
  whatsappSharedAt?: string | null
}

export interface BillItem {
  id: string
  description: string
  amount: number
  type: 'rent' | 'utility' | 'maintenance' | 'other'
  calculationType?: 'fixed' | 'meter-based' | 'percentage' // How this item is calculated
  unitRate?: number // For meter-based calculations
  previousReading?: number // Previous meter reading
  currentReading?: number // Current meter reading
  consumption?: number // Calculated consumption
}

export interface GenerateBillData {
  propertyId: string
  propertyType: 'apartment' | 'mess'
  month: string
  year: number
  tenantId: string
  items: Omit<BillItem, 'id'>[]
}

// Bill Template for recurring bills
export interface BillTemplate {
  id: string
  name: string
  description?: string
  propertyId: string
  propertyType: 'apartment' | 'mess'
  flatId?: string // For apartment-specific templates
  seatId?: string // For mess-specific templates
  items: BillTemplateItem[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface BillTemplateItem {
  id: string
  description: string
  type: 'rent' | 'utility' | 'maintenance' | 'other'
  calculationType: 'fixed' | 'meter-based' | 'percentage'
  fixedAmount?: number // For fixed amount
  unitRate?: number // For meter-based (per unit rate)
  percentage?: number // For percentage-based (e.g., 5% of rent)
  baseItemId?: string // For percentage-based calculations
  meterType?: 'electricity' | 'gas' | 'water' // For meter-based
  serviceCharge?: number // Fixed service charge
}

// Meter Reading
export interface MeterReading {
  id: string
  propertyId: string
  propertyType: 'apartment' | 'mess'
  flatId?: string
  seatId?: string
  month: string
  year: number
  electricity?: number
  gas?: number
  water?: number
  previousElectricity?: number
  previousGas?: number
  previousWater?: number
  electricityConsumption?: number
  gasConsumption?: number
  waterConsumption?: number
  submittedAt: string
  submittedBy: string
}

// Bill Generation Rule
export interface BillGenerationRule {
  id: string
  name: string
  description?: string
  propertyId?: string // If null, applies to all properties
  propertyType?: 'apartment' | 'mess' // If null, applies to both
  templateId: string // Template to use
  schedule: BillSchedule
  isActive: boolean
  lastRun?: string
  nextRun?: string
  createdAt: string
  updatedAt: string
}

export interface BillSchedule {
  type: 'monthly' | 'weekly' | 'custom'
  dayOfMonth?: number // 1-31, for monthly schedule
  dayOfWeek?: number // 0-6 (Sunday-Saturday), for weekly schedule
  customDays?: number[] // Array of days for custom schedule
  generateBeforeDays?: number // Generate bills X days before due date
  dueDateDay?: number // Day of month when bill is due (default: 5)
}
