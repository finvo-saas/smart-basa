'use client'

import { useCallback, useState } from 'react'
import Image from 'next/image'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchMediaLibrary, type OwnerMediaAsset } from '@/lib/api/media'
import { cn } from '@/lib/utils'

interface OwnerMediaPickerProps {
  selected?: string[]
  onSelect: (asset: OwnerMediaAsset) => void
  className?: string
}

export function OwnerMediaPicker({
  selected = [],
  onSelect,
  className,
}: OwnerMediaPickerProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<OwnerMediaAsset[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await fetchMediaLibrary({ images: true, limit: 80 })
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setItems(result.data)
  }, [])

  const toggle = async () => {
    const next = !open
    setOpen(next)
    if (next && items.length === 0) {
      await load()
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={toggle}>
          {open ? 'Hide my photos' : 'Choose from my photos'}
        </Button>
        {open ? (
          <Button type="button" variant="ghost" size="sm" onClick={load} disabled={loading}>
            Refresh
          </Button>
        ) : null}
      </div>
      {open ? (
        <div className="rounded-lg border bg-muted/20 p-2">
          {loading ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              Loading your photos…
            </p>
          ) : error ? (
            <p className="px-2 py-4 text-sm text-destructive">{error}</p>
          ) : items.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              No photos yet. Upload one and it will appear here for reuse.
            </p>
          ) : (
            <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
              {items.map(item => {
                const active = selected.includes(item.url)
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={cn(
                      'relative aspect-square overflow-hidden rounded-md border bg-muted',
                      active && 'ring-2 ring-primary',
                    )}
                    title={item.name || item.kind}
                    onClick={() => onSelect(item)}
                  >
                    <Image
                      src={item.url}
                      alt={item.name || 'Uploaded photo'}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {active ? (
                      <span className="absolute right-1 top-1 rounded-full bg-primary p-0.5 text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
