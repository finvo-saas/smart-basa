export type PropertyType = 'mess' | 'apartment' | 'hostel' | 'hotel'
export type Gender = 'male' | 'female' | 'mixed' | null
export type SeatType = 'single' | 'shared' | null
export type MealPlan = 'breakfast' | 'lunch' | 'dinner' | 'all' | null
export type FurnishingStatus =
  | 'furnished'
  | 'unfurnished'
  | 'semi-furnished'
  | null
export type PropertyFace =
  | 'north'
  | 'south'
  | 'east'
  | 'west'
  | 'north-east'
  | 'north-west'
  | 'south-east'
  | 'south-west'
  | null
export type TenantType = 'family' | 'bachelor' | 'office' | 'any' | null
export type VerificationStatus = 'verified' | 'pending' | 'unverified'
export type ListingStatus = 'draft' | 'published' | 'paused' | 'rejected'

export interface Property {
  id: string
  name: string
  type: PropertyType
  rent: number
  area: string
  address: string
  city: string
  latitude?: number
  longitude?: number
  available: boolean
  gender?: Gender
  seatType?: SeatType // For mess/hostel
  mealIncluded?: boolean // For mess
  mealPlan?: MealPlan // For mess
  mealCost?: number // For mess
  images: string[]
  videos?: string[] // Video walkthrough URLs
  videoThumbnail?: string // Video thumbnail image
  facilities: string[]
  nearbyFacilities?: string[] // bus stop, metro, hospital, university
  buildingAge?: number // in years
  floorLevel?: number
  /** Apartment BHK */
  bedrooms?: number | null
  bathrooms?: number | null
  kitchens?: number | null
  livingRooms?: number | null
  balconies?: number | null
  /** Built-up size in sqft (not neighbourhood `area`) */
  sizeSqft?: number | null
  unitNumber?: string
  propertyFace?: PropertyFace
  /** Monthly service charge (BDT), in addition to rent */
  serviceCharge?: number | null
  electricityBill?: number | null
  gasBill?: number | null
  internetBill?: number | null
  waterBill?: number | null
  parkingCount?: number | null
  /** ISO date YYYY-MM-DD */
  availableFrom?: string | null
  rentNegotiable?: boolean
  tenantType?: TenantType
  furnishing?: FurnishingStatus
  parking?: boolean
  security?: boolean
  verified?: boolean
  verificationStatus?: VerificationStatus
  verifiedAt?: string // Date when verified
  /** Plain text or light HTML from owner rich editor */
  description: string
  ownerId: string
  ownerName: string
  ownerPhone: string
  /** Owner's WhatsApp number; empty when the owner has not added one. */
  ownerWhatsapp?: string
  createdAt: string
  /** Instant book auto-approves; otherwise owner must accept */
  instantBook?: boolean
  /** Flat in My properties that this apartment listing is for. */
  linkedFlatId?: string | null
  /** Linked flat occupancy. Unlinked listings are not tied to a portfolio flat. */
  occupancy?: 'occupied' | 'vacant' | 'unlinked'
  unitLabel?: string | null
  flatStatus?: string | null
  /** Security deposit in months of rent */
  depositMonths?: number
  /** Public discovery visibility */
  published?: boolean
  listingStatus?: ListingStatus
  /** Cached rating (1–5), synced from reviews */
  rating?: number
  reviewCount?: number
  updatedAt?: string
  /** Paid featured boost — higher visibility in search */
  featured?: boolean
  featuredUntil?: string
  lastConfirmedAt?: string | null
  confirmedHoursAgo?: number | null
  stale?: boolean
  /** AI-computed match score (0–100), only present in AI match results */
  aiMatchScore?: number
  /** Live seats from mess ops when the listing is linked */
  openSeats?: number | null
  verificationScore?: import('./living').VerificationScore
  livingCost?: import('./living').LivingCost
  livingConditionScore?: import('./living').VerificationScore
  safetyScore?: import('./living').VerificationScore
  /** Linked mess ops id when this listing mirrors a mess */
  messId?: string | null
  /** From linked mess utility profiles (mess/hostel listings) */
  utilities?: import('./mess').MessUtilities | null
  tourImages?: string[]
  cctv?: boolean | null
  streetLighting?: boolean | null
  addressVerified?: boolean
  photosVerified?: boolean
  rentVerified?: boolean
}

export interface PropertyListingInput {
  name: string
  type: PropertyType
  rent: number
  area: string
  address: string
  city: string
  latitude?: number
  longitude?: number
  available: boolean
  gender?: Gender
  seatType?: SeatType
  mealIncluded?: boolean
  mealPlan?: MealPlan
  mealCost?: number
  images: string[]
  videos?: string[]
  videoThumbnail?: string
  facilities: string[]
  nearbyFacilities?: string[]
  buildingAge?: number
  floorLevel?: number
  bedrooms?: number | null
  bathrooms?: number | null
  kitchens?: number | null
  livingRooms?: number | null
  balconies?: number | null
  sizeSqft?: number | null
  unitNumber?: string
  propertyFace?: PropertyFace
  serviceCharge?: number | null
  electricityBill?: number | null
  gasBill?: number | null
  internetBill?: number | null
  waterBill?: number | null
  parkingCount?: number | null
  availableFrom?: string | null
  rentNegotiable?: boolean
  tenantType?: TenantType
  furnishing?: FurnishingStatus
  parking?: boolean
  security?: boolean
  description: string
  instantBook?: boolean
  /** Vacant flat this apartment listing is attached to. Required to publish. */
  flatId?: string | null
  depositMonths?: number
  published?: boolean
  listingStatus?: ListingStatus
}

export interface SearchFilters {
  propertyType: PropertyType | 'all'
  city?: string
  area?: string
  rentRange: [number, number]
  availableOnly: boolean
  gender: Gender
  seatType?: SeatType
  mealIncluded?: boolean
  mealPlan?: MealPlan
  nearbyFacilities?: string[]
  buildingAge?: number
  floorLevel?: number
  bedrooms?: number
  bathrooms?: number
  sizeSqftMin?: number
  tenantType?: TenantType
  furnishing?: FurnishingStatus
  parking?: boolean
  security?: boolean
  verifiedOnly?: boolean
}
