'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'

/** Labels include the words the listing score matchers look for. */
export const FACILITY_GROUPS = [
  {
    title: 'Living condition',
    hint: 'Food, water, power, cleanliness, internet, bathroom, and location',
    options: [
      'Meals included',
      'Common kitchen',
      'Dining room',
      'Water supply',
      'Water filter',
      'Generator',
      'IPS backup',
      'Housekeeping',
      'Laundry',
      'WiFi',
      'Broadband',
      'Attached bath',
      'Common bathroom',
      'Lift',
      'Balcony',
      'Parking',
    ],
  },
  {
    title: 'Safety',
    hint: 'Guard, CCTV, lighting, police, hospital, and transport',
    options: [
      'Security',
      'Security guard',
      'CCTV',
      'Street lighting',
      'Near police station',
      'Near hospital',
      'Near clinic',
      'Bus stop nearby',
      'Metro access',
    ],
  },
  {
    title: 'Other',
    hint: 'Comfort extras that do not change the scores',
    options: ['AC', 'Common room'],
  },
] as const

export const FACILITY_OPTIONS = FACILITY_GROUPS.flatMap(group => [
  ...group.options,
])

export const NEARBY_OPTIONS = [
  'Bus stop nearby',
  'Metro access',
  'Near hospital',
  'Near clinic',
  'Near police station',
  'Street lighting',
  'CNG stand',
  'University',
  'Market',
  'Shopping mall',
  'School',
]

export function sameFacility(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

function toggleValue(current: string[], value: string) {
  const exists = current.some(item => sameFacility(item, value))
  return exists
    ? current.filter(item => !sameFacility(item, value))
    : [...current, value]
}

export function ListingFacilityPicker({
  value,
  onChange,
}: {
  value: string[]
  onChange: (next: string[]) => void
}) {
  const [custom, setCustom] = useState('')

  const addCustom = () => {
    const next = custom.trim()
    if (!next) return
    if (!value.some(item => sameFacility(item, next))) {
      onChange([...value, next])
    }
    setCustom('')
  }

  const extras = value.filter(
    item => !FACILITY_OPTIONS.some(option => sameFacility(option, item)),
  )

  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1 block">Facilities</Label>
        <p className="text-xs text-muted-foreground">
          Tap what this place actually has, or type one that is missing. Living
          condition and safety scores use these. Team verification, NID, rent
          checks, and renter reviews are not selected here.
        </p>
      </div>
      {FACILITY_GROUPS.map(group => (
        <div key={group.title}>
          <p className="mb-1 text-sm font-medium">{group.title}</p>
          <p className="mb-2 text-xs text-muted-foreground">{group.hint}</p>
          <div className="flex flex-wrap gap-2">
            {group.options.map(option => (
              <Badge
                key={option}
                variant={
                  value.some(item => sameFacility(item, option))
                    ? 'default'
                    : 'outline'
                }
                className="cursor-pointer"
                onClick={() => onChange(toggleValue(value, option))}
              >
                {option}
              </Badge>
            ))}
          </div>
        </div>
      ))}
      {extras.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {extras.map(item => (
            <Badge
              key={item}
              variant="default"
              className="cursor-pointer gap-1"
              onClick={() => onChange(toggleValue(value, item))}
            >
              {item}
              <X className="h-3 w-3" />
            </Badge>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2">
        <Input
          value={custom}
          onChange={e => setCustom(e.target.value)}
          placeholder="Add a facility manually"
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addCustom()
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={addCustom}>
          Add
        </Button>
      </div>
    </div>
  )
}

export function NearbyFacilityPicker({
  value,
  onChange,
}: {
  value: string[]
  onChange: (next: string[]) => void
}) {
  const [custom, setCustom] = useState('')

  const addCustom = () => {
    const next = custom.trim()
    if (!next) return
    if (!value.some(item => sameFacility(item, next))) {
      onChange([...value, next])
    }
    setCustom('')
  }

  const extras = value.filter(
    item => !NEARBY_OPTIONS.some(option => sameFacility(option, item)),
  )

  return (
    <div className="space-y-2">
      <div>
        <Label className="mb-1 block">Nearby</Label>
        <p className="text-xs text-muted-foreground">
          Police, hospital, clinic, bus, and metro also raise the safety score.
          Add anything else by hand.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {NEARBY_OPTIONS.map(option => (
          <Badge
            key={option}
            variant={
              value.some(item => sameFacility(item, option))
                ? 'default'
                : 'outline'
            }
            className="cursor-pointer"
            onClick={() => onChange(toggleValue(value, option))}
          >
            {option}
          </Badge>
        ))}
        {extras.map(item => (
          <Badge
            key={item}
            variant="default"
            className="cursor-pointer gap-1"
            onClick={() => onChange(toggleValue(value, item))}
          >
            {item}
            <X className="h-3 w-3" />
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={custom}
          onChange={e => setCustom(e.target.value)}
          placeholder="Add a nearby place manually"
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addCustom()
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={addCustom}>
          Add
        </Button>
      </div>
    </div>
  )
}
