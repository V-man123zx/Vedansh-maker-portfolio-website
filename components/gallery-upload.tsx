"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, Link, Plus, ChevronLeft, ChevronRight } from "lucide-react"

interface GalleryUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
}

export function GalleryUpload({ images, onChange, maxImages = 10 }: GalleryUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [mode, setMode] = useState<"upload" | "url">("upload")
  const [urlInput, setUrlInput] = useState("")
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remainingSlots = maxImages - images.length
    const filesToUpload = Array.from(files).slice(0, remainingSlots)

    setIsUploading(true)
    const newUrls: string[] = []

    for (const file of filesToUpload) {
      if (!file.type.startsWith("image/")) continue
      if (file.size > 5 * 1024 * 1024) continue

      try {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        const result = await response.json()

        if (response.ok && result.url) {
          newUrls.push(result.url)
        }
      } catch (error) {
        console.error("Upload failed:", error)
      }
    }

    if (newUrls.length > 0) {
      onChange([...images, ...newUrls])
    }
    setIsUploading(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUrlSubmit = () => {
    if (urlInput && images.length < maxImages) {
      onChange([...images, urlInput])
      setUrlInput("")
    }
  }

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
  }

  const moveImage = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) {
      console.log("[v0] Gallery moveImage: invalid index, skipping", { fromIndex, toIndex, length: images.length })
      return
    }
    console.log("[v0] Gallery moveImage: reordering", { fromIndex, toIndex })
    const newImages = [...images]
    const [moved] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, moved)
    onChange(newImages)
  }, [images, onChange])

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", index.toString())
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (draggedIndex !== null && index !== draggedIndex) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      console.log("[v0] Gallery reorder: moving image from index", draggedIndex, "to index", toIndex)
      moveImage(draggedIndex, toIndex)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>
          Gallery Images ({images.length}/{maxImages})
        </Label>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={mode === "upload" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("upload")}
          >
            <Upload className="mr-1 h-3 w-3" />
            Upload
          </Button>
          <Button type="button" variant={mode === "url" ? "default" : "ghost"} size="sm" onClick={() => setMode("url")}>
            <Link className="mr-1 h-3 w-3" />
            URL
          </Button>
        </div>
      </div>

      {/* Existing Images Grid with Drag & Drop */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative aspect-square cursor-grab overflow-hidden rounded-lg border transition-all active:cursor-grabbing ${
                draggedIndex === index 
                  ? "opacity-50 border-primary" 
                  : dragOverIndex === index 
                    ? "border-primary border-2 scale-105" 
                    : "border-border"
              }`}
            >
              <Image src={url || "/placeholder.svg"} alt={`Gallery image ${index + 1}`} fill className="object-cover pointer-events-none" />
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white hover:bg-white/20"
                  onClick={(e) => { e.stopPropagation(); moveImage(index, index - 1); }}
                  disabled={index === 0}
                  title="Move left"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => { e.stopPropagation(); handleRemove(index); }}
                  title="Remove"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white hover:bg-white/20"
                  onClick={(e) => { e.stopPropagation(); moveImage(index, index + 1); }}
                  disabled={index === images.length - 1}
                  title="Move right"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              {index === 0 && (
                <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add More */}
      {images.length < maxImages && (
        <>
          {mode === "upload" ? (
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="mt-2 text-sm text-muted-foreground">Uploading...</span>
                </div>
              ) : (
                <>
                  <Plus className="mb-1 h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium">Add images</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG up to 5MB each</span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleUrlSubmit())}
              />
              <Button type="button" onClick={handleUrlSubmit} disabled={!urlInput}>
                Add
              </Button>
            </div>
          )}
        </>
      )}

      <p className="text-xs text-muted-foreground">First image will be used as the project cover. Drag images to reorder, or use arrow buttons on hover.</p>
    </div>
  )
}
