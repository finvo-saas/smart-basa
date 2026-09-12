'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Layout } from '@/components/layout/Layout'
import { PageContainer, PageHeader, LoadingState } from '@/components/page'
import { Button } from '@/components/ui/button'
import {
  deleteMediaFile,
  fetchMediaLibrary,
  type OwnerMediaAsset,
} from '@/lib/api/media'
import { toast } from '@/lib/feedback/toast'
import { Images, Trash2 } from 'lucide-react'

export default function OwnerMediaPage() {
  const [items, setItems] = useState<OwnerMediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await fetchMediaLibrary({ images: true, limit: 120 })
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setItems(result.data)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const remove = async (item: OwnerMediaAsset) => {
    const result = await deleteMediaFile({
      url: item.url,
      key: item.key,
    })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setItems(prev => prev.filter(row => row.id !== item.id))
    toast.success('Removed from your media')
  }

  return (
    <Layout>
      <PageContainer>
        <PageHeader
          title="My media"
          description="Photos you uploaded. Only you can see this library. Pick them when editing a mess, listing, or hotel instead of uploading again."
          actions={
            <Button variant="outline" onClick={() => void load()} disabled={loading}>
              Refresh
            </Button>
          }
        />
        {loading ? <LoadingState /> : null}
        {error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {!loading && !error && items.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            No photos yet. Upload a cover on a mess or listing and it will show up here.
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map(item => (
            <div
              key={item.id}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
            >
              <Image
                src={item.url}
                alt={item.name || 'Uploaded photo'}
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/55 px-2 py-1 text-[11px] text-white">
                <span className="truncate">{item.kind}</span>
                <button
                  type="button"
                  className="rounded p-1 hover:bg-white/20"
                  title="Delete from Spaces"
                  onClick={() => void remove(item)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {!loading && items.length > 0 ? (
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Images className="h-3.5 w-3.5" />
            {items.length} photo{items.length === 1 ? '' : 's'} in your library
          </p>
        ) : null}
      </PageContainer>
    </Layout>
  )
}
