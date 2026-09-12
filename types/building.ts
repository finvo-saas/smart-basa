export type FlatStatus = 'available' | 'occupied' | 'maintenance'

export interface Renter {
  id: string
  name: string
  phone: string
  /** WhatsApp number so owners can message instead of calling. */
  whatsapp?: string
  email?: string
  nid?: string
  address?: string
  joinedDate: string
  photoUrl?: string | null
  profilePhotoUrl?: string | null
}

export interface Flat {
  id: string
  flatNumber: string
  floor: number
  rent: number
  status: FlatStatus
  buildingId: string
  renter?: Renter
  area?: number
  bedrooms?: number
  bathrooms?: number
  /** Advance / security deposit on active tenancy */
  deposit?: number | null
  tenancyId?: string | null
  /** Linked public listing (apartment marketplace) */
  listingId?: string | null
  electricityBill?: number | null
  gasBill?: number | null
  internetBill?: number | null
  waterBill?: number | null
}

export interface Building {
  id: string
  name: string
  address: string
  city: string
  totalFloors: number
  totalFlats: number
  occupiedFlats: number
  createdAt: string
}

export interface Payment {
  id: string
  flatId: string
  amount: number
  month: string
  year: number
  status: 'paid' | 'pending' | 'overdue'
  paidDate?: string
  dueDate: string
}

export interface MyTenancy {
  id: string
  status: 'active' | 'ended' | 'pending' | string
  startDate: string
  endDate?: string | null
  deposit?: number | null
  notes?: string
  flat: Flat
  building: Pick<Building, 'id' | 'name' | 'address' | 'city'>
  owner: {
    id: string
    name: string
    phone: string
    whatsapp?: string
  }
}

