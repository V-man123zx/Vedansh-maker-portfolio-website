"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageGalleryProps {
  images: string[]
  projectTitle: string
}

export function ImageGallery({ images, projectTitle }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  if (images.length === 0) return null

  const openLightbox = (index: number) => {
    setCurrentIndex(index)
    setLightboxOpen(true)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrevious()
    if (e.key === "ArrowRight") goToNext()
    if (e.key === "Escape") setLightboxOpen(false)
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-foreground">Gallery</h3>

      {/* Thumbnail Grid */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {images.map((url, index) => (
          <button
            key={`${url}-${index}`}
            onClick={() => openLightbox(index)}
            className="group relative aspect-square overflow-hidden rounded-lg border border-border transition-all hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <Image
              src={url || "/placeholder.svg"}
              alt={`${projectTitle} - Image ${index + 1}`}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
              <ZoomIn className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className="max-h-[95vh] max-w-[95vw] border-none bg-black/95 p-0 sm:max-w-5xl"
          onKeyDown={handleKeyDown}
        >
          <div className="relative flex h-[80vh] items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 z-10 h-10 w-10 text-white hover:bg-white/20"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 z-10 h-10 w-10 text-white hover:bg-white/20"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Main Image */}
            <div className="relative h-full w-full">
              <Image
                src={images[currentIndex] || "/placeholder.svg"}
                alt={`${projectTitle} - Image ${currentIndex + 1}`}
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-sm text-white">
              {currentIndex + 1} / {images.length}
            </div>
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex justify-center gap-2 bg-black/80 p-3">
              {images.map((url, index) => (
                <button
                  key={`thumb-${url}-${index}`}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "relative h-12 w-12 overflow-hidden rounded border-2 transition-all",
                    index === currentIndex ? "border-primary" : "border-transparent opacity-60 hover:opacity-100",
                  )}
                >
                  <Image src={url || "/placeholder.svg"} alt={`Thumbnail ${index + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
