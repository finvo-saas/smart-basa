'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { PropertyCard } from '@/components/property/PropertyCard'
import { HotelCard } from '@/components/hotel/HotelCard'
import {
  DiscoverCategoryTabs,
  type DiscoverCategory,
} from '@/components/search/DiscoverCategoryTabs'
import { AISearchBar } from '@/components/search/AISearchBar'
import { PropertyDetailDialog } from '@/components/property/PropertyDetailDialog'
import dynamic from 'next/dynamic'
import { BookingConfirmation } from '@/components/booking/BookingConfirmation'
import { CompareBar } from '@/components/property/CompareBar'
import { SaveSearchDialog } from '@/components/search/SaveSearchDialog'
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Map,
  List,
  Navigation,
  MapPin,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react'
import {
  fetchAIMatch,
  fetchProperties,
  fetchPropertyMeta,
  type AIParsedQuery,
} from '@/lib/api/properties'
import { fetchHotels } from '@/lib/api/hotels'
import {
  recordSearchHistory,
  createSavedSearch,
  fetchSavedSearches,
} from '@/lib/api/search'
import { getCurrentAccountUserId } from '@/lib/api/account'
import { useMockQuery } from '@/hooks/useMockQuery'
import {
  calculateDistance,
  getCurrentLocation,
  formatDistance,
} from '@/utils/location'
import { createBooking } from '@/lib/api/bookings'
import type {
  Property,
  Gender,
  SeatType,
  MealPlan,
  FurnishingStatus,
  SearchFilters,
} from '@/types/property'
import type { BookingFormData, Booking } from '@/types/booking'
import type { Hotel } from '@/types/hotel'
import { useTranslations } from 'next-intl'
import { resolvePlaceQuery, samePlace } from '@/lib/search/placeQuery'
import { stashPendingSavedSearch } from '@/lib/search/pendingSavedSearch'
import { rememberAuthReturn } from '@/utils/auth'
import { hasAuthTokens } from '@/utils/auth-tokens'

const PropertyMap = dynamic(
  () =>
    import('@/components/map/PropertyMap').then(mod => mod.PropertyMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[320px] items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  },
)

const searchSchema = z.object({
  propertyType: z.enum(['all', 'mess', 'apartment', 'hostel', 'hotel']),
  city: z.string().optional(),
  area: z.string().optional(),
  rentRange: z.tuple([z.number(), z.number()]),
  availableOnly: z.boolean(),
  gender: z.enum(['male', 'female', 'mixed']).nullable(),
  seatType: z.enum(['single', 'shared']).nullable(),
  mealIncluded: z.boolean().optional(),
  mealPlan: z.enum(['breakfast', 'lunch', 'dinner', 'all']).nullable(),
  nearbyFacilities: z.array(z.string()).optional(),
  buildingAge: z.number().optional(),
  floorLevel: z.number().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  sizeSqftMin: z.number().optional(),
  tenantType: z.enum(['family', 'bachelor', 'office', 'any']).nullable(),
  furnishing: z.enum(['furnished', 'unfurnished', 'semi-furnished']).nullable(),
  parking: z.boolean().optional(),
  security: z.boolean().optional(),
  verifiedOnly: z.boolean().optional(),
})

type SearchFormData = z.infer<typeof searchSchema>

export default function SearchPage() {
  const t = useTranslations('search')
  const tc = useTranslations('common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category')
  const cityParam = searchParams.get('city')
  const areaParam = searchParams.get('area')
  const aiQueryParam = searchParams.get('q')
  const [showFilters, setShowFilters] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  )
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showBookingConfirmation, setShowBookingConfirmation] = useState(false)
  const [lastBooking, setLastBooking] = useState<Booking | null>(null)
  const [showSaveSearchDialog, setShowSaveSearchDialog] = useState(false)
  const [selectedCity, setSelectedCity] = useState<string>('all')
  const [availableAreas, setAvailableAreas] = useState<string[]>([])
  const [userLocation, setUserLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [searchByLocation, setSearchByLocation] = useState(false)
  const [searchRadius, setSearchRadius] = useState(10) // in km
  const [locationLoading, setLocationLoading] = useState(false)
  const [compareList, setCompareList] = useState<Property[]>([])
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiParsed, setAiParsed] = useState<AIParsedQuery | null>(null)
  const [aiResults, setAiResults] = useState<Property[] | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const restoredAiQuery = useRef<string | null>(null)

  const chatUserId = getCurrentAccountUserId()
  const loadProperties = useCallback(() => fetchProperties(), [])
  const loadMeta = useCallback(() => fetchPropertyMeta(), [])
  const loadSavedSearches = useCallback(
    () => fetchSavedSearches(chatUserId),
    [chatUserId]
  )
  const { data: properties } = useMockQuery(loadProperties)
  const { data: propertyMeta } = useMockQuery(loadMeta)
  const { data: savedSearches, refetch: refetchSavedSearches } =
    useMockQuery(loadSavedSearches)
  const loadHotels = useCallback(() => fetchHotels(), [])
  const { data: hotels } = useMockQuery(loadHotels)

  const publishedProperties = properties ?? []
  const cities = propertyMeta?.cities ?? []
  const allNearbyFacilities = useMemo(
    () =>
      [
        ...new Set(
          publishedProperties.flatMap(p => p.nearbyFacilities ?? [])
        ),
      ].sort(),
    [publishedProperties]
  )

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      propertyType: 'all',
      city: undefined,
      area: undefined,
      rentRange: [2000, 100000],
      availableOnly: true,
      gender: null,
      seatType: null,
      mealIncluded: undefined,
      mealPlan: null,
      nearbyFacilities: [],
      buildingAge: undefined,
      floorLevel: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      sizeSqftMin: undefined,
      tenantType: null,
      furnishing: null,
      parking: undefined,
      security: undefined,
      verifiedOnly: false,
    },
  })

  const { watch, setValue, handleSubmit, reset } = form
  const formValues = watch()

  const selectedType: DiscoverCategory =
    categoryParam === 'mess' ||
    categoryParam === 'apartment' ||
    categoryParam === 'hostel' ||
    categoryParam === 'hotel'
      ? categoryParam
      : 'all'

  const leaveAiMatch = useCallback(() => {
    setAiResults(null)
    setAiParsed(null)
    setAiError(null)
    restoredAiQuery.current = null
  }, [])

  const writeFiltersToUrl = useCallback(
    (next: { city?: string; area?: string; category?: DiscoverCategory }) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('q')
      params.delete('save')
      if (next.category === undefined) {
        // keep the current category param
      } else if (next.category === 'all') {
        params.delete('category')
      } else {
        params.set('category', next.category)
      }
      if (next.city) params.set('city', next.city)
      else params.delete('city')
      if (next.area) params.set('area', next.area)
      else params.delete('area')
      const qs = params.toString()
      router.replace(qs ? `/search?${qs}` : '/search', { scroll: false })
    },
    [router, searchParams],
  )

  const applyCategory = useCallback(
    (next: DiscoverCategory) => {
      leaveAiMatch()
      setValue('propertyType', next)
      writeFiltersToUrl({
        city: formValues.city,
        area: formValues.area,
        category: next,
      })
    },
    [formValues.area, formValues.city, leaveAiMatch, setValue, writeFiltersToUrl],
  )

  useEffect(() => {
    setValue('propertyType', selectedType)
  }, [selectedType, setValue])

  useEffect(() => {
    const rawCity = cityParam?.trim()
    const rawArea = areaParam?.trim()
    if (!rawCity && !rawArea) return

    const resolved = rawCity
      ? resolvePlaceQuery(rawCity, propertyMeta)
      : {}
    const city =
      resolved.city ||
      propertyMeta?.cities.find(item => samePlace(item, rawCity)) ||
      (rawCity && !propertyMeta ? rawCity : undefined)
    const area =
      resolved.area ||
      (rawArea
        ? (propertyMeta?.areasByCity[city || ''] ?? []).find(item =>
            samePlace(item, rawArea),
          ) || rawArea
        : undefined)

    if (city && propertyMeta?.cities.includes(city)) {
      setSelectedCity(city)
      setValue('city', city)
    } else if (city) {
      setValue('city', city)
    }
    if (area) setValue('area', area)
  }, [cityParam, areaParam, propertyMeta, setValue])

  // Handle get current location
  const handleGetCurrentLocation = async () => {
    setLocationLoading(true)
    const location = await getCurrentLocation()
    if (location) {
      setUserLocation(location)
      setSearchByLocation(true)
    } else {
      alert(t('page.locationError'))
    }
    setLocationLoading(false)
  }

  // Update available areas when city changes
  useEffect(() => {
    if (selectedCity && selectedCity !== 'all') {
      const areas = propertyMeta?.areasByCity[selectedCity] ?? []
      setAvailableAreas(areas)
      // Reset area if current area is not in new city
      if (formValues.area && !areas.includes(formValues.area)) {
        setValue('area', undefined)
      }
    } else {
      setAvailableAreas([])
      setValue('area', undefined)
    }
  }, [selectedCity, formValues.area, setValue, propertyMeta])

  // Filter properties based on form values
  const filteredProperties = useMemo(() => {
    let filtered = [...publishedProperties]

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(p => p.type === selectedType)
    }

    // Filter by city
    if (formValues.city) {
      filtered = filtered.filter(p => samePlace(p.city, formValues.city))
    }

    // Filter by area
    if (formValues.area) {
      filtered = filtered.filter(p => samePlace(p.area, formValues.area))
    }

    // Filter by rent range
    filtered = filtered.filter(
      p =>
        p.rent >= formValues.rentRange[0] && p.rent <= formValues.rentRange[1]
    )

    // Filter by availability
    if (formValues.availableOnly) {
      filtered = filtered.filter(p => p.available)
    }

    // Filter by gender (for mess/hostel)
    if (
      formValues.gender &&
      (selectedType === 'mess' ||
        selectedType === 'hostel' ||
        selectedType === 'all')
    ) {
      filtered = filtered.filter(
        p =>
          (p.type === 'mess' || p.type === 'hostel') &&
          (p.gender === formValues.gender || p.gender === 'mixed')
      )
    }

    // Filter by seat type (for mess/hostel)
    if (
      formValues.seatType &&
      (selectedType === 'mess' ||
        selectedType === 'hostel' ||
        selectedType === 'all')
    ) {
      filtered = filtered.filter(
        p =>
          (p.type === 'mess' || p.type === 'hostel') &&
          p.seatType === formValues.seatType
      )
    }

    // Filter by meal included (for mess)
    if (
      formValues.mealIncluded !== undefined &&
      (selectedType === 'mess' || selectedType === 'all')
    ) {
      filtered = filtered.filter(
        p => p.type === 'mess' && p.mealIncluded === formValues.mealIncluded
      )
    }

    // Filter by meal plan (for mess)
    if (
      formValues.mealPlan &&
      (selectedType === 'mess' || selectedType === 'all')
    ) {
      filtered = filtered.filter(
        p => p.type === 'mess' && p.mealPlan === formValues.mealPlan
      )
    }

    // Filter by nearby facilities
    if (formValues.nearbyFacilities && formValues.nearbyFacilities.length > 0) {
      filtered = filtered.filter(p =>
        formValues.nearbyFacilities!.some(facility =>
          p.nearbyFacilities?.includes(facility)
        )
      )
    }

    // Filter by building age
    if (formValues.buildingAge !== undefined) {
      filtered = filtered.filter(
        p => p.buildingAge && p.buildingAge <= formValues.buildingAge!
      )
    }

    // Filter by floor level
    if (formValues.floorLevel !== undefined) {
      filtered = filtered.filter(
        p => p.floorLevel && p.floorLevel <= formValues.floorLevel!
      )
    }

    // Apartment BHK / baths / size / tenant preference
    if (formValues.bedrooms !== undefined) {
      filtered = filtered.filter(
        p =>
          p.type !== 'apartment' ||
          (p.bedrooms != null && p.bedrooms >= formValues.bedrooms!),
      )
    }
    if (formValues.bathrooms !== undefined) {
      filtered = filtered.filter(
        p =>
          p.type !== 'apartment' ||
          (p.bathrooms != null && p.bathrooms >= formValues.bathrooms!),
      )
    }
    if (formValues.sizeSqftMin !== undefined) {
      filtered = filtered.filter(
        p =>
          p.type !== 'apartment' ||
          (p.sizeSqft != null && p.sizeSqft >= formValues.sizeSqftMin!),
      )
    }
    if (formValues.tenantType && formValues.tenantType !== 'any') {
      filtered = filtered.filter(
        p =>
          p.type !== 'apartment' ||
          !p.tenantType ||
          p.tenantType === 'any' ||
          p.tenantType === formValues.tenantType,
      )
    }

    // Filter by furnishing
    if (formValues.furnishing) {
      filtered = filtered.filter(p => p.furnishing === formValues.furnishing)
    }

    // Filter by parking
    if (formValues.parking !== undefined) {
      filtered = filtered.filter(p => p.parking === formValues.parking)
    }

    // Filter by security
    if (formValues.security !== undefined) {
      filtered = filtered.filter(p => p.security === formValues.security)
    }

    // Filter by verified only
    if (formValues.verifiedOnly) {
      filtered = filtered.filter(
        p => p.verified === true || p.verificationStatus === 'verified'
      )
    }

    // Filter by location/radius if enabled
    if (searchByLocation && userLocation) {
      filtered = filtered.filter(p => {
        if (!p.latitude || !p.longitude) return false
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          p.latitude,
          p.longitude
        )
        return distance <= searchRadius
      })
    }

    return filtered
  }, [
    formValues,
    selectedType,
    searchByLocation,
    userLocation,
    searchRadius,
    publishedProperties,
  ])

  const displayProperties = useMemo(() => {
    if (aiResults) return aiResults
    if (selectedType === 'hotel') return []
    if (selectedType === 'all') {
      return filteredProperties.filter(p => p.type !== 'hotel')
    }
    return filteredProperties
  }, [aiResults, filteredProperties, selectedType])

  const filteredHotels = useMemo(() => {
    if (selectedType !== 'hotel') {
      return [] as Hotel[]
    }
    let list = [...(hotels ?? [])]
    if (formValues.city) list = list.filter(h => samePlace(h.city, formValues.city))
    if (formValues.area) list = list.filter(h => samePlace(h.area, formValues.area))
    if (formValues.verifiedOnly) list = list.filter(h => h.verified)
    return list
  }, [
    hotels,
    selectedType,
    formValues.city,
    formValues.area,
    formValues.verifiedOnly,
  ])

  const usingAiMatch = aiResults != null
  const totalResults = usingAiMatch
    ? displayProperties.length
    : displayProperties.length + filteredHotels.length

  const handleAISearch = useCallback(async (
    query: string,
    options?: { updateUrl?: boolean },
  ) => {
    const sentence = query.trim()
    if (!sentence) return
    restoredAiQuery.current = sentence
    setAiLoading(true)
    setAiError(null)
    const result = await fetchAIMatch(sentence)
    setAiLoading(false)
    if (!result.ok) {
      setAiError(result.error)
      setAiResults(null)
      setAiParsed(null)
      return
    }
    setAiParsed(result.data.parsedQuery)
    setAiResults(result.data.results)
    setSelectedCity('all')
    setValue('city', undefined)
    setValue('area', undefined)
    setValue('propertyType', 'all')
    if (options?.updateUrl === false) return
    const next = `/search?q=${encodeURIComponent(sentence)}`
    if (aiQueryParam === sentence && !cityParam && !areaParam && !categoryParam) {
      return
    }
    router.push(next)
  }, [aiQueryParam, areaParam, categoryParam, cityParam, router, setValue])

  useEffect(() => {
    const sentence = aiQueryParam?.trim()
    if (!sentence || restoredAiQuery.current === sentence) return
    restoredAiQuery.current = sentence
    void handleAISearch(sentence, { updateUrl: false })
  }, [aiQueryParam, handleAISearch])

  const handleClearAISearch = useCallback(() => {
    setAiParsed(null)
    setAiResults(null)
    setAiError(null)
    restoredAiQuery.current = null
    if (aiQueryParam) router.push('/search')
  }, [aiQueryParam, router])

  // Save search to history when filters change (after filtering is done)
  useEffect(() => {
    // Only save if there are meaningful filters and we have results
    const hasFilters =
      selectedType !== 'all' ||
      formValues.city ||
      formValues.area ||
      formValues.rentRange[0] !== 2000 ||
      formValues.rentRange[1] !== 100000 ||
      formValues.availableOnly ||
      formValues.verifiedOnly ||
      formValues.gender ||
      formValues.seatType ||
      formValues.mealIncluded ||
      formValues.nearbyFacilities?.length ||
      formValues.buildingAge ||
      formValues.floorLevel ||
      formValues.bedrooms ||
      formValues.bathrooms ||
      formValues.sizeSqftMin ||
      formValues.tenantType ||
      formValues.furnishing ||
      formValues.parking ||
      formValues.security

    if (hasFilters && filteredProperties.length > 0) {
      // Debounce: only save after user stops changing filters
      const timer = setTimeout(() => {
        recordSearchHistory({
          userId: chatUserId,
          filters: formValues,
          resultCount: filteredProperties.length,
        })
      }, 2000) // Wait 2 seconds after last change

      return () => clearTimeout(timer)
    }
  }, [formValues, filteredProperties.length, chatUserId])

  const handleViewDetails = (property: Property) => {
    setSelectedProperty(property)
    setIsDialogOpen(true)
  }

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`
  }

  const handleRequest = (property: Property) => {
    setSelectedProperty(property)
    setIsDialogOpen(true)
  }

  const handleCompareToggle = (property: Property) => {
    setCompareList(prev => {
      if (prev.some(p => p.id === property.id)) {
        return prev.filter(p => p.id !== property.id)
      }
      if (prev.length >= 3) return prev
      return [...prev, property]
    })
  }

  const handleBookingSubmit = async (
    property: Property,
    data: BookingFormData & { moveInDate: string; moveOutDate?: string }
  ) => {
    setBookingError(null)
    const result = await createBooking(property, data)
    if (!result.ok) {
      setBookingError(result.error)
      throw new Error(result.error)
    }
    setLastBooking(result.data)
    setShowBookingConfirmation(true)
    setIsDialogOpen(false)
  }

  const handleReset = () => {
    handleClearAISearch()
    const params = new URLSearchParams(searchParams.toString())
    params.delete('city')
    params.delete('area')
    params.delete('q')
    const qs = params.toString()
    router.replace(qs ? `/search?${qs}` : '/search', { scroll: false })
    setSelectedCity('all')
    setUserLocation(null)
    setSearchByLocation(false)
    setSearchRadius(10)
    reset({
      propertyType: 'all',
      city: undefined,
      area: undefined,
      rentRange: [2000, 100000],
      availableOnly: true,
      gender: null,
      seatType: null,
      mealIncluded: undefined,
      mealPlan: null,
      nearbyFacilities: [],
      buildingAge: undefined,
      floorLevel: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      sizeSqftMin: undefined,
      tenantType: null,
      furnishing: null,
      parking: undefined,
      security: undefined,
      verifiedOnly: false,
    })
  }

  const openSaveSearch = () => {
    if (!hasAuthTokens()) {
      const filters: SearchFilters = {
        ...formValues,
        city: formValues.city || cityParam || undefined,
        area: formValues.area || areaParam || undefined,
        propertyType:
          selectedType !== 'all' ? selectedType : formValues.propertyType,
      }
      stashPendingSavedSearch(filters, aiQueryParam || undefined)
      rememberAuthReturn('/saved-searches')
      setShowFilters(false)
      router.push('/login?next=%2Fsaved-searches')
      return
    }
    setShowFilters(false)
    setShowSaveSearchDialog(true)
  }

  const handleSaveSearch = async (
    name: string,
    filters: SearchFilters,
    enableNotifications: boolean
  ) => {
    const result = await createSavedSearch({
      id: `search-${Date.now()}`,
      userId: chatUserId,
      name,
      filters,
      isActive: enableNotifications,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    if (result.ok) {
      refetchSavedSearches()
      alert(t('page.actions.saveSuccess', { name }))
      return
    }
    alert(result.error)
  }

  const isSearchSaved = useMemo(() => {
    return (savedSearches ?? []).some(saved => {
      const current = formValues
      return (
        saved.filters.propertyType === current.propertyType &&
        saved.filters.city === current.city &&
        saved.filters.area === current.area &&
        saved.filters.rentRange[0] === current.rentRange[0] &&
        saved.filters.rentRange[1] === current.rentRange[1] &&
        saved.filters.availableOnly === current.availableOnly &&
        saved.filters.verifiedOnly === current.verifiedOnly
      )
    })
  }, [formValues, savedSearches])

  const handleCityChange = (city: string) => {
    const nextCity = city === 'all' ? undefined : city
    leaveAiMatch()
    setSelectedCity(city)
    setValue('city', nextCity)
    setValue('area', undefined)
    writeFiltersToUrl({
      city: nextCity,
      area: undefined,
      category: selectedType,
    })
  }

  const handleAreaChange = (area: string) => {
    const nextArea = area === 'all' ? undefined : area
    leaveAiMatch()
    setValue('area', nextArea)
    writeFiltersToUrl({
      city: selectedCity === 'all' ? undefined : selectedCity,
      area: nextArea,
      category: selectedType,
    })
  }

  const handleNearbyFacilityToggle = (facility: string) => {
    const current = formValues.nearbyFacilities || []
    const updated = current.includes(facility)
      ? current.filter(f => f !== facility)
      : [...current, facility]
    setValue('nearbyFacilities', updated)
  }

  const minRent = 2000
  const maxRent = 100000

  return (
    <Layout>
      <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold sm:text-3xl">
                {t('page.title')}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {t('page.results', { count: totalResults })}
                {formValues.city ? ` · ${formValues.city}` : ''}
                {searchByLocation && userLocation && (
                  <span className="ml-2 inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {t('page.withinRadius', {
                      distance: formatDistance(searchRadius),
                    })}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                <Link href="/areas/compare">{t('page.compareAreas')}</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="hidden md:flex">
                <Link href="/roommates">{t('page.roommates')}</Link>
              </Button>
              {/* View Mode Toggle — visible on all breakpoints so map can be tested on mobile */}
              <div className="flex rounded-lg border bg-background p-1 shadow-sm">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 px-2 sm:px-3"
                >
                  <List className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">{t('page.viewMode.list')}</span>
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className="h-8 px-2 sm:px-3"
                >
                  <Map className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">{t('page.viewMode.map')}</span>
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!hasAuthTokens()) {
                    rememberAuthReturn('/saved-searches')
                    router.push('/login?next=%2Fsaved-searches')
                    return
                  }
                  router.push('/saved-searches')
                }}
                className="hidden sm:flex"
              >
                <Bookmark className="mr-2 h-4 w-4" />
                {t('page.savedSearchesLink')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden"
              >
                <Filter className="mr-2 h-4 w-4" />
                {tc('filters')}
                {filteredProperties.length > 0 && (
                  <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                    {filteredProperties.length}
                  </span>
                )}
              </Button>
            </div>
          </div>
          <div className="mt-4 min-w-0 space-y-3">
            <AISearchBar
              onSearch={handleAISearch}
              queryFromUrl={aiQueryParam ?? ''}
              loading={aiLoading}
              parsedQuery={aiParsed}
            />
            {aiError && (
              <p className="text-sm text-destructive">{aiError}</p>
            )}
            {usingAiMatch && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearAISearch}
                className="h-8 px-2 text-muted-foreground"
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                {t('page.ai.clear')}
              </Button>
            )}
            <DiscoverCategoryTabs
              value={selectedType}
              onChange={applyCategory}
              labels={{
                all: t('page.propertyTypes.all'),
                mess: t('page.propertyTypes.mess'),
                apartment: t('page.propertyTypes.apartment'),
                hostel: t('page.propertyTypes.hostel'),
                hotel: t('page.propertyTypes.hotel'),
              }}
            />
            <div className="flex flex-wrap gap-x-4">
              {(selectedType === 'mess' ||
                selectedType === 'all') && (
                <Button variant="link" size="sm" className="h-auto px-0" asChild>
                  <Link href="/messes">{t('page.browseAllMesses')}</Link>
                </Button>
              )}
              {(selectedType === 'hotel' ||
                selectedType === 'all') && (
                <Button variant="link" size="sm" className="h-auto px-0" asChild>
                  <Link href="/hotels">{t('page.browseAllHotels')}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
          {showFilters ? (
            <button
              type="button"
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
              aria-label={tc('close')}
              onClick={() => setShowFilters(false)}
            />
          ) : null}
          {/* Filters: modal on mobile, sidebar from lg up */}
          <div
            className={
              showFilters
                ? 'fixed inset-x-4 top-10 bottom-10 z-[60] flex overflow-hidden rounded-2xl border bg-background shadow-2xl sm:inset-x-auto sm:left-1/2 sm:w-[min(28rem,calc(100%-3rem))] sm:-translate-x-1/2 lg:static lg:inset-auto lg:z-auto lg:block lg:h-auto lg:w-80 lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none'
                : 'hidden lg:relative lg:block lg:w-80 lg:shrink-0'
            }
          >
            <Card className="flex h-full min-h-0 flex-col overflow-hidden border-border/50 shadow-sm lg:h-auto lg:overflow-visible">
              <CardHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 border-b pb-4">
                <CardTitle className="text-lg font-semibold">{tc('filters')}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 space-y-5 overflow-y-auto pt-6 lg:overflow-visible">
                <form onSubmit={handleSubmit(() => {})} className="space-y-5">
                  {/* City Selection */}
                  <div className="space-y-2.5">
                    <Label className="text-sm font-semibold">{t('page.filters.city')}</Label>
                    <Select
                      value={selectedCity}
                      onValueChange={handleCityChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('page.filters.selectCity')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('page.filters.allCities')}</SelectItem>
                        {cities.map(city => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Area Selection */}
                  {selectedCity &&
                    selectedCity !== 'all' &&
                    availableAreas.length > 0 && (
                      <div className="space-y-2.5">
                        <Label className="text-sm font-semibold">{t('page.filters.area')}</Label>
                        <Select
                          value={formValues.area || 'all'}
                          onValueChange={handleAreaChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('page.filters.selectArea')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('page.filters.allAreas')}</SelectItem>
                            {availableAreas.map(area => (
                              <SelectItem key={area} value={area}>
                                {area}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                  {/* Property Type */}
                  <div className="space-y-2.5">
                    <Label className="text-sm font-semibold">
                      {t('page.filters.propertyType')}
                    </Label>
                    <RadioGroup
                      value={selectedType}
                      onValueChange={value =>
                        applyCategory(value as DiscoverCategory)
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="type-all" />
                        <Label
                          htmlFor="type-all"
                          className="font-normal cursor-pointer"
                        >
                          {t('page.propertyTypes.all')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="mess" id="type-mess" />
                        <Label
                          htmlFor="type-mess"
                          className="font-normal cursor-pointer"
                        >
                          {t('page.propertyTypes.mess')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="apartment" id="type-apartment" />
                        <Label
                          htmlFor="type-apartment"
                          className="font-normal cursor-pointer"
                        >
                          {t('page.propertyTypes.apartment')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hostel" id="type-hostel" />
                        <Label
                          htmlFor="type-hostel"
                          className="font-normal cursor-pointer"
                        >
                          {t('page.propertyTypes.hostel')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hotel" id="type-hotel" />
                        <Label
                          htmlFor="type-hotel"
                          className="font-normal cursor-pointer"
                        >
                          {t('page.propertyTypes.hotel')}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Rent Range */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">
                        {t('page.filters.rentRange')}
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        ৳{formValues.rentRange[0].toLocaleString()} - ৳
                        {formValues.rentRange[1].toLocaleString()}
                      </span>
                    </div>
                    <Slider
                      value={formValues.rentRange}
                      onValueChange={value =>
                        setValue('rentRange', value as [number, number])
                      }
                      min={minRent}
                      max={maxRent}
                      step={500}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>৳{minRent.toLocaleString()}</span>
                      <span>৳{maxRent.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Availability Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">
                        {t('page.filters.availableOnly')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t('page.filters.availableOnlyHint')}
                      </p>
                    </div>
                    <Switch
                      checked={formValues.availableOnly}
                      onCheckedChange={checked =>
                        setValue('availableOnly', checked)
                      }
                    />
                  </div>

                  {/* Verified Only Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">
                        {t('page.filters.verifiedOnly')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t('page.filters.verifiedOnlyHint')}
                      </p>
                    </div>
                    <Switch
                      checked={formValues.verifiedOnly || false}
                      onCheckedChange={checked =>
                        setValue('verifiedOnly', checked)
                      }
                    />
                  </div>

                  {/* Gender (for Mess/Hostel) */}
                  {(selectedType === 'mess' ||
                    selectedType === 'hostel' ||
                    selectedType === 'all') && (
                    <div className="space-y-2.5">
                      <Label className="text-sm font-semibold">{t('page.filters.gender')}</Label>
                      <Select
                        value={formValues.gender || 'all'}
                        onValueChange={value =>
                          setValue(
                            'gender',
                            value === 'all' ? null : (value as Gender)
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('page.filters.selectGender')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('page.gender.all')}</SelectItem>
                          <SelectItem value="male">{t('page.gender.male')}</SelectItem>
                          <SelectItem value="female">{t('page.gender.female')}</SelectItem>
                          <SelectItem value="mixed">{t('page.gender.mixed')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Seat Type (for Mess/Hostel) */}
                  {(selectedType === 'mess' ||
                    selectedType === 'hostel' ||
                    selectedType === 'all') && (
                    <div className="space-y-2.5">
                      <Label className="text-sm font-semibold">{t('page.filters.seatType')}</Label>
                      <Select
                        value={formValues.seatType || 'all'}
                        onValueChange={value =>
                          setValue(
                            'seatType',
                            value === 'all' ? null : (value as SeatType)
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('page.filters.selectSeatType')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('page.seatTypes.all')}</SelectItem>
                          <SelectItem value="single">{t('page.seatTypes.single')}</SelectItem>
                          <SelectItem value="shared">{t('page.seatTypes.shared')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Meal Included (for Mess) */}
                  {selectedType === 'mess' && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">
                          {t('page.filters.mealIncluded')}
                        </Label>
                        <Switch
                          checked={formValues.mealIncluded || false}
                          onCheckedChange={checked =>
                            setValue('mealIncluded', checked)
                          }
                        />
                      </div>
                      {formValues.mealIncluded && (
                        <Select
                          value={formValues.mealPlan || 'all'}
                          onValueChange={value =>
                            setValue(
                              'mealPlan',
                              value === 'all' ? null : (value as MealPlan)
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('page.filters.selectMealPlan')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('page.mealPlans.all')}</SelectItem>
                            <SelectItem value="breakfast">
                              {t('page.mealPlans.breakfast')}
                            </SelectItem>
                            <SelectItem value="lunch">{t('page.mealPlans.lunch')}</SelectItem>
                            <SelectItem value="dinner">{t('page.mealPlans.dinner')}</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}

                  {/* Location-based Search */}
                  <div className="space-y-3 border-t pt-5">
                    <Label className="text-sm font-semibold">
                      {t('page.filters.locationSearch')}
                    </Label>
                    <div className="space-y-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleGetCurrentLocation}
                        disabled={locationLoading}
                      >
                        <Navigation className="mr-2 h-4 w-4" />
                        {locationLoading
                          ? t('page.actions.gettingLocation')
                          : t('page.actions.useMyLocation')}
                      </Button>
                      {userLocation && (
                        <div className="space-y-2 rounded border p-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {t('page.filters.searchRadius')}
                            </span>
                            <span className="font-medium">
                              {formatDistance(searchRadius)}
                            </span>
                          </div>
                          <Slider
                            value={[searchRadius]}
                            onValueChange={value => setSearchRadius(value[0])}
                            min={1}
                            max={50}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>1km</span>
                            <span>50km</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="searchByLocation"
                              checked={searchByLocation}
                              onChange={e =>
                                setSearchByLocation(e.target.checked)
                              }
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label
                              htmlFor="searchByLocation"
                              className="text-sm font-normal cursor-pointer"
                            >
                              {t('page.filters.filterByDistance')}
                            </Label>
                          </div>
                          {searchByLocation && (
                            <p className="text-xs text-muted-foreground">
                              {t('page.filters.showingWithin', {
                                distance: formatDistance(searchRadius),
                              })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Advanced Filters Toggle */}
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-between"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <span className="font-semibold">{t('page.filters.advanced')}</span>
                    {showAdvancedFilters ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>

                  {/* Advanced Filters */}
                  {showAdvancedFilters && (
                    <div className="space-y-5 border-t pt-5">
                      {/* Nearby Facilities */}
                      <div className="space-y-2.5">
                        <Label className="text-sm font-semibold">
                          {t('page.filters.nearbyFacilities')}
                        </Label>
                        <div className="space-y-2">
                          {allNearbyFacilities.map(facility => (
                            <div
                              key={facility}
                              className="flex items-center space-x-2"
                            >
                              <Switch
                                checked={
                                  formValues.nearbyFacilities?.includes(
                                    facility
                                  ) || false
                                }
                                onCheckedChange={() =>
                                  handleNearbyFacilityToggle(facility)
                                }
                              />
                              <Label className="text-sm font-normal cursor-pointer">
                                {facility}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Building Age */}
                      <div className="space-y-2.5">
                        <Label className="text-sm font-semibold">
                          {t('page.filters.buildingAge', {
                            value:
                              formValues.buildingAge ||
                              t('page.filters.buildingAgeAny'),
                          })}
                        </Label>
                        <Slider
                          value={[formValues.buildingAge || 50]}
                          onValueChange={value =>
                            setValue(
                              'buildingAge',
                              value[0] === 50 ? undefined : value[0]
                            )
                          }
                          min={0}
                          max={50}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      {/* Floor Level */}
                      <div className="space-y-2.5">
                        <Label className="text-sm font-semibold">
                          {t('page.filters.floorLevel', {
                            value:
                              formValues.floorLevel ||
                              t('page.filters.buildingAgeAny'),
                          })}
                        </Label>
                        <Slider
                          value={[formValues.floorLevel || 20]}
                          onValueChange={value =>
                            setValue(
                              'floorLevel',
                              value[0] === 20 ? undefined : value[0]
                            )
                          }
                          min={0}
                          max={20}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      {/* Apartment layout filters */}
                      {(selectedType === 'apartment' ||
                        selectedType === 'all') && (
                        <div className="space-y-4 rounded-lg border bg-muted/20 p-3">
                          <Label className="text-sm font-semibold">
                            {t('page.filters.apartmentSection')}
                          </Label>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">
                                {t('page.filters.bedrooms')}
                              </Label>
                              <Select
                                value={
                                  formValues.bedrooms != null
                                    ? String(formValues.bedrooms)
                                    : 'any'
                                }
                                onValueChange={v =>
                                  setValue(
                                    'bedrooms',
                                    v === 'any' ? undefined : Number(v),
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="any">
                                    {t('page.filters.buildingAgeAny')}
                                  </SelectItem>
                                  {[1, 2, 3, 4, 5].map(n => (
                                    <SelectItem key={n} value={String(n)}>
                                      {t('page.filters.bedroomsMin', {
                                        count: n,
                                      })}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">
                                {t('page.filters.bathrooms')}
                              </Label>
                              <Select
                                value={
                                  formValues.bathrooms != null
                                    ? String(formValues.bathrooms)
                                    : 'any'
                                }
                                onValueChange={v =>
                                  setValue(
                                    'bathrooms',
                                    v === 'any' ? undefined : Number(v),
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="any">
                                    {t('page.filters.buildingAgeAny')}
                                  </SelectItem>
                                  {[1, 2, 3, 4].map(n => (
                                    <SelectItem key={n} value={String(n)}>
                                      {t('page.filters.bathroomsMin', {
                                        count: n,
                                      })}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">
                              {t('page.filters.tenantType')}
                            </Label>
                            <Select
                              value={formValues.tenantType || 'any'}
                              onValueChange={v =>
                                setValue(
                                  'tenantType',
                                  v === 'any'
                                    ? null
                                    : (v as
                                        | 'family'
                                        | 'bachelor'
                                        | 'office'
                                        | 'any'),
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="any">
                                  {t('page.tenantTypes.any')}
                                </SelectItem>
                                <SelectItem value="family">
                                  {t('page.tenantTypes.family')}
                                </SelectItem>
                                <SelectItem value="bachelor">
                                  {t('page.tenantTypes.bachelor')}
                                </SelectItem>
                                <SelectItem value="office">
                                  {t('page.tenantTypes.office')}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2.5">
                            <Label className="text-xs text-muted-foreground">
                              {t('page.filters.sizeSqftMin', {
                                value:
                                  formValues.sizeSqftMin ||
                                  t('page.filters.buildingAgeAny'),
                              })}
                            </Label>
                            <Slider
                              value={[formValues.sizeSqftMin || 0]}
                              onValueChange={value =>
                                setValue(
                                  'sizeSqftMin',
                                  value[0] === 0 ? undefined : value[0],
                                )
                              }
                              min={0}
                              max={3000}
                              step={50}
                              className="w-full"
                            />
                          </div>
                        </div>
                      )}

                      {/* Furnishing */}
                      <div className="space-y-2.5">
                        <Label className="text-sm font-semibold">
                          {t('page.filters.furnishing')}
                        </Label>
                        <Select
                          value={formValues.furnishing || 'all'}
                          onValueChange={value =>
                            setValue(
                              'furnishing',
                              value === 'all'
                                ? null
                                : (value as FurnishingStatus)
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('page.filters.selectFurnishing')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('page.furnishing.all')}</SelectItem>
                            <SelectItem value="furnished">{t('page.furnishing.furnished')}</SelectItem>
                            <SelectItem value="semi-furnished">
                              {t('page.furnishing.semiFurnished')}
                            </SelectItem>
                            <SelectItem value="unfurnished">
                              {t('page.furnishing.unfurnished')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Parking */}
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">
                          {t('page.filters.parkingAvailable')}
                        </Label>
                        <Switch
                          checked={formValues.parking || false}
                          onCheckedChange={checked =>
                            setValue('parking', checked || undefined)
                          }
                        />
                      </div>

                      {/* Security */}
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">
                          {t('page.filters.security')}
                        </Label>
                        <Switch
                          checked={formValues.security || false}
                          onCheckedChange={checked =>
                            setValue('security', checked || undefined)
                          }
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    type="button"
                    className="w-full lg:hidden"
                    onClick={() => setShowFilters(false)}
                  >
                    {t('page.actions.showResults')}
                  </Button>

                  {/* Save Search Button */}
                  <Button
                    type="button"
                    variant={isSearchSaved ? 'default' : 'outline'}
                    onClick={openSaveSearch}
                    className="w-full"
                  >
                    {isSearchSaved ? (
                      <>
                        <BookmarkCheck className="mr-2 h-4 w-4" />
                        {t('page.actions.searchSaved')}
                      </>
                    ) : (
                      <>
                        <Bookmark className="mr-2 h-4 w-4" />
                        {t('page.actions.saveSearch')}
                      </>
                    )}
                  </Button>

                  {/* Reset Button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="w-full"
                  >
                    {tc('resetFilters')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="flex-1">
            {totalResults === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Filter className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {t('page.noResultsTitle')}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
                    {t('page.noResultsDesc')}
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="mt-6"
                  >
                    {tc('resetFilters')}
                  </Button>
                </CardContent>
              </Card>
            ) : viewMode === 'list' ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
                {!usingAiMatch &&
                  filteredHotels.map(hotel => (
                    <HotelCard key={`hotel-${hotel.id}`} hotel={hotel} />
                  ))}
                {displayProperties.map(property => {
                  // Calculate distance if location search is enabled
                  let distance: string | undefined
                  if (
                    searchByLocation &&
                    userLocation &&
                    property.latitude &&
                    property.longitude
                  ) {
                    const dist = calculateDistance(
                      userLocation.lat,
                      userLocation.lng,
                      property.latitude,
                      property.longitude
                    )
                    distance = formatDistance(dist)
                  }

                  return (
                    <div key={property.id} className="relative">
                      <PropertyCard
                        property={property}
                        onViewDetails={handleViewDetails}
                        onCall={handleCall}
                        compareSelected={compareList.some(
                          p => p.id === property.id
                        )}
                        onCompareToggle={handleCompareToggle}
                        compareDisabled={
                          compareList.length >= 3 &&
                          !compareList.some(p => p.id === property.id)
                        }
                      />
                      {distance && (
                        <div className="absolute bottom-[7.5rem] left-3 z-10 rounded-full bg-primary/90 px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-md backdrop-blur-sm">
                          <MapPin className="mr-1 inline h-3 w-3" />
                          {distance}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <PropertyMap
                    properties={displayProperties}
                    onPropertyClick={handleViewDetails}
                    center={userLocation || undefined}
                    height="calc(100vh - 300px)"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Property Detail Dialog */}
        <PropertyDetailDialog
          property={selectedProperty}
          open={isDialogOpen}
          onOpenChange={open => {
            setIsDialogOpen(open)
            if (!open) setBookingError(null)
          }}
          onRequest={handleRequest}
          onBookingSubmit={handleBookingSubmit}
          onCall={handleCall}
          bookingError={bookingError}
        />

        {/* Booking Confirmation */}
        <BookingConfirmation
          booking={lastBooking}
          open={showBookingConfirmation}
          onOpenChange={setShowBookingConfirmation}
          onViewBookings={() => {
            window.location.href = '/my-bookings'
          }}
        />

        {/* Save Search Dialog */}
        <SaveSearchDialog
          open={showSaveSearchDialog}
          onOpenChange={setShowSaveSearchDialog}
          filters={formValues}
          onSave={handleSaveSearch}
        />

        <CompareBar
          selected={compareList}
          onRemove={id =>
            setCompareList(prev => prev.filter(p => p.id !== id))
          }
          onClear={() => setCompareList([])}
        />
      </div>
    </Layout>
  )
}
