'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react'
import Image from 'next/image'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface ImageGalleryProps {
  images: string[]
  propertyName: string
  startIndex?: number
}

export function ImageGallery({
  images,
  propertyName,
  startIndex = 0,
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex)
  const [isZoomed, setIsZoomed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLDivElement>(null)
  const zoomLevel = useRef(1)

  const currentImage = images[currentIndex] || images[0]

  useEffect(() => {
    setCurrentIndex(startIndex)
  }, [startIndex])

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))
    setImageError(false)
    resetZoom()
  }

  const handleNext = () => {
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))
    setImageError(false)
    resetZoom()
  }

  const updateTransform = () => {
    if (imageRef.current) {
      imageRef.current.style.transform = `scale(${zoomLevel.current}) translate(${position.x}px, ${position.y}px)`
    }
  }

  const handleZoomIn = () => {
    zoomLevel.current = Math.min(zoomLevel.current + 0.25, 3)
    setIsZoomed(zoomLevel.current > 1)
    updateTransform()
  }

  const handleZoomOut = () => {
    zoomLevel.current = Math.max(zoomLevel.current - 0.25, 1)
    if (zoomLevel.current === 1) {
      setIsZoomed(false)
      setPosition({ x: 0, y: 0 })
    }
    updateTransform()
  }

  const resetZoom = () => {
    if (imageRef.current) {
      zoomLevel.current = 1
      imageRef.current.style.transform = 'scale(1) translate(0, 0)'
      setIsZoomed(false)
      setPosition({ x: 0, y: 0 })
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isZoomed && imageRef.current) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && isZoomed) {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y
      setPosition({ x: newX, y: newY })
      updateTransform()
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleDoubleClick = () => {
    if (zoomLevel.current === 1) {
      zoomLevel.current = 2
      setIsZoomed(true)
    } else {
      resetZoom()
    }
    updateTransform()
  }

  const handleFullscreen = () => {
    setIsFullscreen(true)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isFullscreen) return
      if (e.key === 'ArrowLeft') handlePrevious()
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'Escape') setIsFullscreen(false)
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isFullscreen, currentIndex, images.length])

  if (images.length === 0) {
    return (
      <div className="relative h-64 w-full overflow-hidden rounded-lg bg-muted sm:h-80">
        <div className="flex h-full items-center justify-center">
          <span className="text-6xl">🏠</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {/* Main Image with Zoom */}
        <div className="relative h-48 w-full overflow-hidden rounded-lg bg-muted sm:h-80">
          <div
            ref={imageRef}
            className={`relative h-full w-full transition-transform duration-300 origin-center ${
              isZoomed ? 'cursor-move' : 'cursor-zoom-in'
            }`}
            style={{
              transform: `scale(${zoomLevel.current}) translate(${position.x}px, ${position.y}px)`,
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
          >
            {!imageError && currentImage ? (
              <Image
                src={currentImage}
                alt={`${propertyName} - Image ${currentIndex + 1}`}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
                sizes="(max-width: 768px) 100vw, 800px"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                <span className="text-6xl">🏠</span>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur hover:bg-background"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur hover:bg-background"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-3 py-1 text-xs font-medium backdrop-blur">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Zoom Controls */}
          <div className="absolute right-2 top-2 flex flex-col gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="bg-background/80 backdrop-blur hover:bg-background"
              onClick={handleZoomIn}
              disabled={zoomLevel.current >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            {isZoomed && (
              <Button
                variant="secondary"
                size="icon"
                className="bg-background/80 backdrop-blur hover:bg-background"
                onClick={handleZoomOut}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="secondary"
              size="icon"
              className="bg-background/80 backdrop-blur hover:bg-background"
              onClick={handleFullscreen}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Thumbnail Gallery */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx)
                  setImageError(false)
                  resetZoom()
                }}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                  currentIndex === idx
                    ? 'border-primary scale-105'
                    : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                }`}
              >
                <Image
                  src={img}
                  alt={`${propertyName} thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Slideshow */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="left-[50%] top-0 flex h-[100dvh] max-h-[100dvh] w-full max-w-full translate-x-[-50%] translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-black/95 p-0 sm:top-[50%] sm:h-[90vh] sm:max-h-[90vh] sm:w-[calc(100%-2rem)] sm:max-w-5xl sm:translate-y-[-50%] sm:rounded-lg">
          <div className="relative min-h-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-50 text-white hover:bg-white/20"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="relative h-full w-full">
              {!imageError && currentImage ? (
                <Image
                  src={currentImage}
                  alt={`${propertyName} - Image ${currentIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="95vw"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-6xl">🏠</span>
                </div>
              )}
            </div>

            {/* Fullscreen Navigation */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white">
                  {currentIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
