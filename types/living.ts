export type VerificationBreakdownItem = {
  key: string
  label: string
  earned: number
  max: number
  passed?: boolean
}

export type VerificationScore = {
  score: number
  label: string
  breakdown: VerificationBreakdownItem[]
  signals?: {
    addressVerified?: boolean
    photosVerified?: boolean
    rentVerified?: boolean
    listingVerified?: boolean
    ownerNidVerified?: boolean
  }
}

export type LivingCost = {
  rent: number
  serviceCharge?: number
  electricity: number
  gas: number
  internet: number
  water: number
  transport: number
  meals: number
  total: number
  currency: string
  shared?: boolean
  note?: string
}

export type POICategory =
  | 'hospital'
  | 'school'
  | 'market'
  | 'mosque'
  | 'bus'
  | 'metro'

export type NearbyPOI = {
  name: string
  lat: number
  lng: number
  distanceM: number
  category: POICategory
}

export type NearbyPOIResponse = {
  lat: number
  lng: number
  radius: number
  source: string
  pois: Record<POICategory, NearbyPOI[]>
}

export type AreaSummary = {
  area: string
  city: string
  listingCount: number
  averageRent: number
  verifiedPercent: number
  securityPercent: number
  parkingPercent: number
  averageRating: number
  transportScore: number
  marketAccess: number
  safetyScore: number
  livingCost: LivingCost | null
}

export type AreaListItem = {
  area: string
  city: string
  listingCount: number
  averageRent: number
}

export type AreaCompareResult = {
  areas: AreaSummary[]
  recommendation: { area: string; reason: string }
}

export type RoommateProfile = {
  id: string
  userId: string
  userName: string
  looking: boolean
  occupation: 'student' | 'job' | 'other'
  sleepSchedule: 'early' | 'normal' | 'late'
  smoking: boolean
  cooking: boolean
  cleanliness: number
  social: 'quiet' | 'balanced' | 'chatty'
  petsOk: boolean
  gender: 'male' | 'female' | 'other' | ''
  genderPref: 'male' | 'female' | 'any'
  city: string
  area: string
  budgetMin: number
  budgetMax: number
  bio: string
  createdAt?: string
  updatedAt?: string
  compatibilityScore?: number
  compatibilityBreakdown?: VerificationBreakdownItem[]
}

export type RoommateMatchResult = {
  profile: RoommateProfile
  matches: RoommateProfile[]
}

export type RoommateProfileInput = Omit<
  RoommateProfile,
  'id' | 'userId' | 'userName' | 'createdAt' | 'updatedAt' | 'compatibilityScore' | 'compatibilityBreakdown'
>
