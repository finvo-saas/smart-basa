/** Match a typed city or area to the catalog, ignoring case and common Bangla names. */

const PLACE_ALIASES: Record<string, string> = {
  sylhet: 'sylhet',
  সিলেট: 'sylhet',
  dhaka: 'dhaka',
  ঢাকা: 'dhaka',
  chattogram: 'chattogram',
  chittagong: 'chattogram',
  চট্টগ্রাম: 'chattogram',
  rajshahi: 'rajshahi',
  রাজশাহী: 'rajshahi',
  khulna: 'khulna',
  খুলনা: 'khulna',
  rangpur: 'rangpur',
  রংপুর: 'rangpur',
  dhanmondi: 'dhanmondi',
  ধানমন্ডি: 'dhanmondi',
  mohammadpur: 'mohammadpur',
  মোহাম্মদপুর: 'mohammadpur',
  mirpur: 'mirpur',
  মিরপুর: 'mirpur',
  uttara: 'uttara',
  উত্তরা: 'uttara',
  gulshan: 'gulshan',
  গুলশান: 'gulshan',
  banani: 'banani',
  বনানী: 'banani',
  motijheel: 'motijheel',
  মতিঝিল: 'motijheel',
}

export function placeKey(value?: string | null): string {
  const raw = (value || '').trim().toLowerCase()
  return PLACE_ALIASES[raw] ?? raw
}

export function samePlace(left?: string | null, right?: string | null): boolean {
  if (!left?.trim() || !right?.trim()) return false
  return placeKey(left) === placeKey(right)
}

export function resolvePlaceQuery(
  raw: string,
  meta?: {
    cities: string[]
    areasByCity: Record<string, string[]>
  } | null,
): { city?: string; area?: string } {
  const query = raw.trim()
  if (!query || !meta) return {}
  const city = meta.cities.find(item => samePlace(item, query))
  if (city) return { city }
  for (const [cityName, areas] of Object.entries(meta.areasByCity)) {
    const area = areas.find(item => samePlace(item, query))
    if (area) return { city: cityName, area }
  }
  return {}
}
