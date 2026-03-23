import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 2000): Promise<T> {
  let lastError: Error | null = null
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error))
      const errorMessage = lastError.message || ""
      
      if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        const delay = initialDelay * Math.pow(2, i)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw lastError
    }
  }
  throw lastError
}

export async function POST(request: Request) {
  try {
    const { audio, mimeType } = await request.json()

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ error: "Google API key not configured" }, { status: 500 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const result = await withRetry(() => model.generateContent([
      {
        inlineData: {
          mimeType: mimeType || "audio/webm",
          data: audio,
        },
      },
      "Transcribe this audio to text. Return ONLY the transcribed text, nothing else. If the audio is unclear or empty, return an empty string.",
    ]))

    const response = await result.response
    const text = response.text().trim()

    return NextResponse.json({ text })
  } catch (error) {
    console.error("[v0] Transcription error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to transcribe audio"
    
    if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json(
        { error: "AI service is temporarily busy. Please wait a moment and try again." },
        { status: 429 }
      )
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
