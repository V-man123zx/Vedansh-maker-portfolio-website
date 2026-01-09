"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, ImageIcon, Link } from "lucide-react"
import { uploadProjectImage } from "@/lib/actions/upload"

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [mode, setMode] = useState<"upload" | "url">("upload")
  const [urlInput, setUrlInput] = useState(value || "")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB")
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const url = await uploadProjectImage(formData)
      if (url) {
        onChange(url)
      } else {
        alert("Failed to upload image")
      }
    } catch (error) {
      console.error("Upload failed:", error)
      alert("Failed to upload image")
    } finally {
      setIsUploading(false)
    }
  }

  const handleUrlSubmit = () => {
    if (urlInput) {
      onChange(urlInput)
    }
  }

  const handleClear = () => {
    onChange("")
    setUrlInput("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Project Image</Label>
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

      {value ? (
        <div className="relative aspect-video overflow-hidden rounded-lg border border-border">
          <Image src={value || "/placeholder.svg"} alt="Project preview" fill className="object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : mode === "upload" ? (
        <div
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary"
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="mt-2 text-sm text-muted-foreground">Uploading...</span>
            </div>
          ) : (
            <>
              <ImageIcon className="mb-2 h-10 w-10 text-muted-foreground" />
              <span className="text-sm font-medium">Click to upload</span>
              <span className="text-xs text-muted-foreground">PNG, JPG up to 5MB</span>
            </>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
          <Button type="button" onClick={handleUrlSubmit} disabled={!urlInput}>
            Add
          </Button>
        </div>
      )}
    </div>
  )
}
