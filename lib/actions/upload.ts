"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function uploadProjectImage(formData: FormData): Promise<string | null> {
  const file = formData.get("file") as File
  if (!file) {
    console.log("[v0] No file provided")
    return null
  }

  console.log("[v0] Uploading file:", file.name, "Size:", file.size)

  const supabase = createAdminClient()

  // Generate unique filename
  const fileExt = file.name.split(".").pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `projects/${fileName}`

  // Convert File to ArrayBuffer for upload
  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { data, error } = await supabase.storage.from("project-images").upload(filePath, buffer, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  })

  if (error) {
    console.log("[v0] Upload error:", error.message, error)
    return null
  }

  console.log("[v0] Upload successful:", data.path)

  // Get public URL
  const { data: urlData } = supabase.storage.from("project-images").getPublicUrl(data.path)

  console.log("[v0] Public URL:", urlData.publicUrl)
  return urlData.publicUrl
}

export async function deleteProjectImage(imageUrl: string): Promise<boolean> {
  const supabase = createAdminClient()

  // Extract path from URL
  try {
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split("/project-images/")
    if (pathParts.length < 2) {
      console.log("[v0] Invalid image URL path")
      return false
    }

    const filePath = pathParts[1]
    console.log("[v0] Deleting file:", filePath)

    const { error } = await supabase.storage.from("project-images").remove([filePath])

    if (error) {
      console.log("[v0] Delete error:", error.message)
      return false
    }

    return true
  } catch (err) {
    console.log("[v0] Delete failed:", err)
    return false
  }
}
