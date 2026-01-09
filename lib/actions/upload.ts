"use server"

import { createClient } from "@/lib/supabase/server"

export async function uploadProjectImage(formData: FormData): Promise<string | null> {
  const file = formData.get("file") as File
  if (!file) return null

  const supabase = await createClient()

  // Generate unique filename
  const fileExt = file.name.split(".").pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `projects/${fileName}`

  const { data, error } = await supabase.storage.from("project-images").upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) {
    console.error("Upload error:", error)
    return null
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from("project-images").getPublicUrl(data.path)

  return urlData.publicUrl
}

export async function deleteProjectImage(imageUrl: string): Promise<boolean> {
  const supabase = await createClient()

  // Extract path from URL
  const url = new URL(imageUrl)
  const pathParts = url.pathname.split("/project-images/")
  if (pathParts.length < 2) return false

  const filePath = pathParts[1]

  const { error } = await supabase.storage.from("project-images").remove([filePath])

  if (error) {
    console.error("Delete error:", error)
    return false
  }

  return true
}
