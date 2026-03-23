import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")

export async function POST(request: Request) {
  try {
    const { audio, mimeType } = await request.json()

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ error: "Google API key not configured" }, { status: 500 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType || "audio/webm",
          data: audio,
        },
      },
      "Transcribe this audio to text. Return ONLY the transcribed text, nothing else. If the audio is unclear or empty, return an empty string.",
    ])

    const response = await result.response
    const text = response.text().trim()

    return NextResponse.json({ text })
  } catch (error) {
    console.error("[v0] Transcription error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to transcribe audio" },
      { status: 500 }
    )
  }
}
