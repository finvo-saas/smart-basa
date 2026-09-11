export interface Document {
  id: string
  type: 'nid' | 'passport' | 'driving_license' | 'police_verification' | 'other'
  documentNumber: string
  fileUrl: string
  /** Private storage key — used to mint fresh signed URLs on read. */
  fileKey?: string
  fileName: string
  fileSize: number
  uploadedAt: string
  expiryDate?: string
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'expired'
  verifiedAt?: string
  rejectionReason?: string
}

export interface JobInfo {
  id: string
  type: 'employed' | 'student' | 'unemployed' | 'self_employed'
  jobTitle?: string
  company?: string
  instituteName?: string
  studentId?: string
  department?: string
  employmentStartDate?: string
  verificationStatus: 'pending' | 'verified' | 'rejected'
  verifiedAt?: string
  rejectionReason?: string
  documents?: Document[]
}

export interface FamilyMember {
  id: string
  name: string
  relation: 'spouse' | 'child' | 'parent' | 'sibling' | 'other'
  age: number
  gender: 'male' | 'female' | 'other'
  photoUrl?: string
  nid?: string
  phone?: string
  isEmergencyContact: boolean
  createdAt: string
}

export interface EmergencyContact {
  id: string
  name: string
  relation: string
  phone: string
  email?: string
  address?: string
  isPrimary: boolean
}

export interface RenterProfile {
  userId: string
  documents: Document[]
  jobInfo?: JobInfo
  familyMembers: FamilyMember[]
  emergencyContacts: EmergencyContact[]
  updatedAt: string
}
