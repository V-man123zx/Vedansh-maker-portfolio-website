import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.log("[v0] No file provided")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] Uploading file:", file.name, "Size:", file.size)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Generate unique filename
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `projects/${fileName}`

    const arrayBuffer = await file.arrayBuffer()

    const uploadUrl = `${supabaseUrl}/storage/v1/object/project-images/${filePath}`

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        "Content-Type": file.type,
        "x-upsert": "false",
      },
      body: arrayBuffer,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.log("[v0] Supabase upload error status:", uploadResponse.status)
      console.log("[v0] Supabase upload error body:", errorText)
      return NextResponse.json({ error: `Upload failed: ${errorText}` }, { status: 500 })
    }

    // Supabase Storage returns text/plain on success, not JSON
    const responseText = await uploadResponse.text()
    console.log("[v0] Upload successful. Response:", responseText)

    // Construct public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/project-images/${filePath}`

    console.log("[v0] Public URL:", publicUrl)
    return NextResponse.json({ url: publicUrl, success: true })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Upload failed"
    console.log("[v0] Upload catch error:", errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
