/** Owner business verticals — mess / apartment / hotel focus. */

export type OwnerVertical = 'mess' | 'apartment' | 'hotel'

export const OWNER_VERTICALS: OwnerVertical[] = ['mess', 'apartment', 'hotel']

export const OWNER_VERTICAL_META: Record<
  OwnerVertical,
  {
    label: string
    description: string
    href: string
  }
> = {
  mess: {
    label: 'Mess / Hostel',
    description: 'Seats, meals, হিসাব, attendance, SMS, and rules.',
    href: '/mess',
  },
  apartment: {
    label: 'Apartment / Building',
    description: 'Buildings, flats, rent bills, and booking requests.',
    href: '/my-properties',
  },
  hotel: {
    label: 'Hotel',
    description: 'Rooms, stay bookings, pricing, and hotel invoices.',
    href: '/my-hotels',
  },
}

/** Short role labels shown in the header/account menu. */
export const OWNER_VERTICAL_ROLE_LABEL: Record<OwnerVertical, string> = {
  mess: 'Mess owner',
  apartment: 'Apartment owner',
  hotel: 'Hotel owner',
}

/** "Mess owner" / "Apartment owner" / "Hotel owner", or "Property owner" before focus is picked. */
export function ownerRoleLabel(
  primary: OwnerVertical | '' | null | undefined,
  enabled: OwnerVertical[] | null | undefined,
  focusSelected?: boolean | null,
): string {
  const list = normalizeOwnerVerticals(enabled, primary)
  if (!focusSelected || list.length === 0) return 'Property owner'
  const focus =
    primary && list.includes(primary as OwnerVertical)
      ? (primary as OwnerVertical)
      : list[0]
  return OWNER_VERTICAL_ROLE_LABEL[focus]
}

/**
 * Normalize enabled verticals. Product rule: exactly one business type.
 * If legacy data has multiple, keep primary (when valid) else the first.
 */
export function normalizeOwnerVerticals(
  value: unknown,
  primary?: string | null,
): OwnerVertical[] {
  if (!Array.isArray(value)) return []
  const allowed = new Set<string>(OWNER_VERTICALS)
  const list = value
    .map(v => String(v))
    .filter((v): v is OwnerVertical => allowed.has(v))
  if (list.length <= 1) return list
  if (primary && list.includes(primary as OwnerVertical)) {
    return [primary as OwnerVertical]
  }
  return [list[0]]
}

export function hasOwnerVertical(
  enabled: OwnerVertical[] | null | undefined,
  focusSelected: boolean | null | undefined,
  vertical: OwnerVertical,
): boolean {
  if (!focusSelected) return false
  return (enabled || []).includes(vertical)
}

export function defaultPathForOwnerFocus(
  primary: OwnerVertical | '' | null | undefined,
  enabled: OwnerVertical[] | null | undefined,
): string {
  const focus =
    primary && (enabled || []).includes(primary as OwnerVertical)
      ? (primary as OwnerVertical)
      : (enabled || [])[0]
  if (!focus) return '/dashboard'
  return OWNER_VERTICAL_META[focus].href
}
