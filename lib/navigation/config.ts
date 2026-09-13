import {
  LayoutDashboard,
  Search,
  Building2,
  Hotel,
  UtensilsCrossed,
  Wallet,
  CalendarCheck,
  MoreHorizontal,
  Home,
  FileText,
  User,
  MessageSquare,
  Bell,
  Plus,
  Heart,
  Clock,
  Bookmark,
  MessageCircle,
  Menu,
} from 'lucide-react'
import type { UserRole } from '@/types'
import type {
  BottomNavItem,
  MobileUtilityLink,
  NavItem,
  QuickActionItem,
} from './types'

export const primaryNavItems: NavItem[] = [
  {
    labelKey: 'primary.dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['renter', 'owner', 'admin'],
  },
  {
    labelKey: 'primary.discover',
    icon: Search,
    roles: ['renter'],
    matchPrefixes: ['/search', '/properties', '/hotels', '/listings', '/favorites', '/messes', '/roommates', '/areas', '/university'],
    children: [
      {
        labelKey: 'children.search',
        href: '/search',
        descriptionKey: 'children.searchDesc',
      },
      {
        labelKey: 'children.browseListings',
        href: '/properties',
        descriptionKey: 'children.browseListingsDesc',
      },
      {
        labelKey: 'children.browseMess',
        href: '/messes',
        descriptionKey: 'children.browseMessDesc',
      },
      {
        labelKey: 'children.hotelsStays',
        href: '/hotels',
        descriptionKey: 'children.hotelsStaysDesc',
      },
      {
        labelKey: 'children.findRoommates',
        href: '/roommates',
      },
      {
        labelKey: 'children.compareAreas',
        href: '/areas/compare',
      },
      {
        labelKey: 'children.universities',
        href: '/university',
      },
      {
        labelKey: 'children.areasSeo',
        href: '/areas',
      },
    ],
  },
  {
    labelKey: 'primary.myLiving',
    icon: Home,
    roles: ['renter'],
    matchPrefixes: ['/rentals', '/mess/student-dashboard', '/mess'],
    children: [
      {
        labelKey: 'children.myRentals',
        href: '/rentals',
        descriptionKey: 'children.myRentalsDesc',
      },
      {
        labelKey: 'children.myMess',
        href: '/mess/student-dashboard',
        descriptionKey: 'children.myMessDesc',
      },
    ],
  },
  {
    labelKey: 'primary.finance',
    icon: Wallet,
    roles: ['renter'],
    matchPrefixes: ['/bills', '/payments'],
    children: [
      {
        labelKey: 'children.bills',
        href: '/bills',
        descriptionKey: 'children.billsDesc',
      },
      {
        labelKey: 'children.payments',
        href: '/payments',
        descriptionKey: 'children.paymentsDesc',
      },
    ],
  },
  {
    labelKey: 'primary.bookings',
    href: '/my-bookings',
    icon: CalendarCheck,
    roles: ['renter'],
    matchPrefixes: ['/my-bookings'],
  },
  {
    labelKey: 'primary.more',
    icon: MoreHorizontal,
    roles: ['renter'],
    matchPrefixes: ['/compare', '/complaints', '/documents', '/reminders', '/roommates', '/areas', '/notices'],
    children: [
      { labelKey: 'children.compareListings', href: '/compare' },
      { labelKey: 'children.compareAreas', href: '/areas/compare' },
      { labelKey: 'children.findRoommates', href: '/roommates' },
      { labelKey: 'children.notices', href: '/notices' },
      { labelKey: 'children.complaints', href: '/complaints' },
      { labelKey: 'children.documents', href: '/documents' },
      { labelKey: 'children.reminders', href: '/reminders' },
    ],
  },
  {
    labelKey: 'primary.properties',
    icon: Building2,
    roles: ['owner'],
    ownerVertical: 'apartment',
    matchPrefixes: ['/my-properties', '/my-listings', '/listings'],
    children: [
      {
        labelKey: 'children.myBuildings',
        href: '/my-properties',
        descriptionKey: 'children.myBuildingsDesc',
        ownerVertical: 'apartment',
      },
      {
        labelKey: 'children.bookingRequests',
        href: '/my-properties/bookings',
        descriptionKey: 'children.bookingRequestsDesc',
        ownerVertical: 'apartment',
      },
      {
        labelKey: 'children.myListings',
        href: '/my-listings',
        descriptionKey: 'children.myListingsDesc',
        ownerVertical: 'apartment',
      },
    ],
  },
  {
    labelKey: 'primary.myHotels',
    icon: Hotel,
    roles: ['owner'],
    ownerVertical: 'hotel',
    matchPrefixes: ['/my-hotels'],
    children: [
      {
        labelKey: 'children.allHotels',
        href: '/my-hotels',
        descriptionKey: 'children.allHotelsDesc',
        ownerVertical: 'hotel',
      },
      {
        labelKey: 'children.registerHotel',
        href: '/my-hotels/new',
        descriptionKey: 'children.registerHotelDesc',
        ownerVertical: 'hotel',
      },
      {
        labelKey: 'children.browseMarketplace',
        href: '/hotels',
        descriptionKey: 'children.browseMarketplaceDesc',
        ownerVertical: 'hotel',
      },
    ],
  },
  {
    labelKey: 'primary.messHostel',
    href: '/mess',
    icon: UtensilsCrossed,
    roles: ['owner'],
    ownerVertical: 'mess',
    matchPrefixes: ['/mess', '/my-properties/bookings'],
    children: [
      {
        labelKey: 'children.myMessOps',
        href: '/mess',
        descriptionKey: 'children.myMessOpsDesc',
        ownerVertical: 'mess',
      },
      {
        labelKey: 'children.seatRequests',
        href: '/my-properties/bookings?scope=mess',
        descriptionKey: 'children.seatRequestsDesc',
        ownerVertical: 'mess',
      },
      {
        labelKey: 'children.addMess',
        href: '/mess?new=1',
        descriptionKey: 'children.addMessDesc',
        ownerVertical: 'mess',
      },
    ],
  },
  {
    labelKey: 'primary.finance',
    icon: Wallet,
    roles: ['owner'],
    matchPrefixes: ['/bills', '/payments', '/reports', '/expenses', '/subscription'],
    children: [
      {
        labelKey: 'children.generateRent',
        href: '/bills?mode=generate',
        descriptionKey: 'children.generateRentDesc',
        ownerVertical: 'apartment',
      },
      {
        labelKey: 'children.bills',
        href: '/bills',
        descriptionKey: 'children.billsDesc',
        ownerVertical: 'apartment',
      },
      {
        labelKey: 'children.payments',
        href: '/payments',
        descriptionKey: 'children.paymentsDesc',
      },
      {
        labelKey: 'children.subscription',
        href: '/subscription',
        descriptionKey: 'children.subscriptionDesc',
      },
      { labelKey: 'children.reports', href: '/reports' },
      {
        labelKey: 'children.expenses',
        href: '/expenses',
        ownerVertical: 'apartment',
      },
    ],
  },
  {
    labelKey: 'primary.communicate',
    icon: MessageSquare,
    roles: ['owner'],
    matchPrefixes: ['/notices', '/messages'],
    children: [
      {
        labelKey: 'children.notices',
        href: '/notices',
        descriptionKey: 'children.noticesDesc',
      },
      {
        labelKey: 'children.messages',
        href: '/messages',
        descriptionKey: 'children.messagesDesc',
      },
    ],
  },
  {
    labelKey: 'primary.more',
    icon: MoreHorizontal,
    roles: ['owner'],
    matchPrefixes: ['/documents', '/complaints'],
    children: [
      { labelKey: 'children.documents', href: '/documents' },
      { labelKey: 'children.complaints', href: '/complaints' },
    ],
  },
  {
    labelKey: 'primary.admin',
    href: '/admin',
    icon: Building2,
    roles: ['admin'],
    matchPrefixes: ['/admin'],
  },
]

export const bottomNavItems: BottomNavItem[] = [
  {
    labelKey: 'bottom.home',
    href: '/dashboard',
    icon: LayoutDashboard,
    matchPrefixes: ['/dashboard'],
    roles: ['renter'],
  },
  {
    labelKey: 'bottom.discover',
    href: '/search',
    icon: Search,
    matchPrefixes: ['/search', '/properties', '/hotels', '/listings'],
    roles: ['renter'],
  },
  {
    labelKey: 'bottom.bills',
    href: '/bills',
    icon: FileText,
    matchPrefixes: ['/bills', '/payments'],
    roles: ['renter'],
  },
  {
    labelKey: 'bottom.bookings',
    href: '/my-bookings',
    icon: CalendarCheck,
    matchPrefixes: ['/my-bookings'],
    roles: ['renter'],
  },
  {
    labelKey: 'bottom.menu',
    icon: Menu,
    action: 'menu',
    roles: ['renter'],
  },
  {
    labelKey: 'bottom.dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    matchPrefixes: ['/dashboard'],
    roles: ['owner'],
  },
  {
    labelKey: 'bottom.properties',
    href: '/my-properties',
    icon: Building2,
    matchPrefixes: ['/my-properties', '/my-listings', '/my-properties/bookings'],
    roles: ['owner'],
    ownerVertical: 'apartment',
  },
  {
    labelKey: 'bottom.hotels',
    href: '/my-hotels',
    icon: Hotel,
    matchPrefixes: ['/my-hotels'],
    roles: ['owner'],
    ownerVertical: 'hotel',
  },
  {
    labelKey: 'bottom.mess',
    href: '/mess',
    icon: UtensilsCrossed,
    matchPrefixes: ['/mess'],
    roles: ['owner'],
    ownerVertical: 'mess',
  },
  {
    labelKey: 'bottom.menu',
    icon: Menu,
    action: 'menu',
    roles: ['owner'],
  },
  {
    labelKey: 'bottom.dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    matchPrefixes: ['/dashboard'],
    roles: ['admin'],
  },
  {
    labelKey: 'bottom.admin',
    href: '/admin',
    icon: Building2,
    matchPrefixes: ['/admin'],
    roles: ['admin'],
  },
  {
    labelKey: 'bottom.notices',
    href: '/notices',
    icon: Bell,
    matchPrefixes: ['/notices'],
    roles: ['admin'],
  },
  {
    labelKey: 'bottom.menu',
    icon: Menu,
    action: 'menu',
    roles: ['admin'],
  },
]

export const quickActionItems: QuickActionItem[] = [
  {
    labelKey: 'quickActions.addBuilding',
    href: '/my-properties',
    descriptionKey: 'quickActions.addBuildingDesc',
    roles: ['owner'],
    ownerVertical: 'apartment',
  },
  {
    labelKey: 'quickActions.registerHotel',
    href: '/my-hotels/new',
    descriptionKey: 'quickActions.registerHotelDesc',
    roles: ['owner'],
    ownerVertical: 'hotel',
  },
  {
    labelKey: 'quickActions.publishListing',
    href: '/my-listings/new',
    descriptionKey: 'quickActions.publishListingDesc',
    roles: ['owner'],
    ownerVertical: 'apartment',
  },
  {
    labelKey: 'quickActions.createNotice',
    href: '/notices',
    descriptionKey: 'quickActions.createNoticeDesc',
    roles: ['owner'],
  },
]

export const mobileUtilityLinks: MobileUtilityLink[] = [
  {
    labelKey: 'utility.messages',
    href: '/messages',
    icon: MessageCircle,
    roles: ['renter', 'owner', 'admin'],
  },
  {
    labelKey: 'utility.notifications',
    href: '/notifications',
    icon: Bell,
    roles: ['renter', 'owner', 'admin'],
  },
  {
    labelKey: 'utility.favorites',
    href: '/favorites',
    icon: Heart,
    roles: ['renter'],
  },
  {
    labelKey: 'utility.searchHistory',
    href: '/search-history',
    icon: Clock,
    roles: ['renter'],
  },
  {
    labelKey: 'utility.savedSearches',
    href: '/saved-searches',
    icon: Bookmark,
    roles: ['renter'],
  },
  {
    labelKey: 'utility.notices',
    href: '/notices',
    icon: Bell,
    roles: ['renter', 'owner', 'admin'],
  },
  {
    labelKey: 'utility.profile',
    href: '/profile',
    icon: User,
    roles: ['renter', 'owner', 'admin'],
  },
]

import type { OwnerVertical } from '@/lib/owner-focus'
import type { NavChildItem } from './types'

export type OwnerNavOptions = {
  /** Enabled verticals when focus has been chosen. Empty + not selected → hide vertical items. */
  enabledVerticals?: OwnerVertical[]
  focusSelected?: boolean
}

function allowsVertical(
  required: OwnerVertical | undefined,
  options?: OwnerNavOptions,
): boolean {
  if (!required) return true
  if (!options?.focusSelected) return false
  return (options.enabledVerticals || []).includes(required)
}

function filterChildren(
  children: NavChildItem[] | undefined,
  options?: OwnerNavOptions,
): NavChildItem[] | undefined {
  if (!children) return undefined
  const next = children.filter(child =>
    allowsVertical(child.ownerVertical, options),
  )
  return next.length ? next : undefined
}

export function getMobileUtilityLinksForRole(
  role: UserRole,
): MobileUtilityLink[] {
  return mobileUtilityLinks.filter(item => item.roles.includes(role))
}

export function getPrimaryNavForRole(
  role: UserRole,
  options?: OwnerNavOptions,
): NavItem[] {
  return primaryNavItems
    .filter(item => item.roles.includes(role))
    .map(item => {
      if (role !== 'owner') return item
      const children = filterChildren(item.children, options)
      return { ...item, children }
    })
    .filter(item => {
      if (role !== 'owner') return true
      if (!allowsVertical(item.ownerVertical, options)) return false
      const original = primaryNavItems.find(i => i.labelKey === item.labelKey)
      if (original?.children?.length && !item.children?.length) return false
      return true
    })
}

export function getBottomNavForRole(
  role: UserRole,
  options?: OwnerNavOptions,
): BottomNavItem[] {
  return bottomNavItems.filter(item => {
    if (!item.roles.includes(role)) return false
    if (role !== 'owner') return true
    return allowsVertical(item.ownerVertical, options)
  })
}

export function getQuickActionsForRole(
  role: UserRole,
  options?: OwnerNavOptions,
): QuickActionItem[] {
  return quickActionItems.filter(item => {
    if (!item.roles.includes(role)) return false
    if (role !== 'owner') return true
    return allowsVertical(item.ownerVertical, options)
  })
}

export const quickActionTriggerIcon = Plus
