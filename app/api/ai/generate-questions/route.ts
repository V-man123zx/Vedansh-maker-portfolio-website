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
      
      // Check if it's a rate limit error (429)
      if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        const delay = initialDelay * Math.pow(2, i)
        console.log(`[v0] Rate limited, retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`)
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
    const { title, category, technologies, currentDescription } = await request.json()

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ error: "Google API key not configured" }, { status: 500 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const prompt = `You are helping a maker/engineer document their project for a portfolio website.

Project Details:
- Title: ${title || "Untitled Project"}
- Category: ${category || "General"}
- Technologies: ${technologies || "Not specified"}
${currentDescription ? `- Current Description: ${currentDescription}` : ""}

Generate exactly 5 short, specific questions to help the maker describe their project better. Focus on:
1. The problem it solves or purpose
2. Technical implementation details
3. Challenges faced and solutions
4. Unique features or innovations
5. Future plans or lessons learned

Format: Return ONLY a JSON array of 5 question strings, no other text.
Example: ["What problem does this project solve?", "How did you implement the core functionality?", ...]`

    const result = await withRetry(() => model.generateContent(prompt))
    const response = await result.response
    const text = response.text()

    // Parse the JSON array from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
    }

    const questions = JSON.parse(jsonMatch[0])

    return NextResponse.json({ questions })
  } catch (error) {
    console.error("[v0] Gemini API error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to generate questions"
    
    // Provide a user-friendly message for rate limits
    if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json(
        { error: "AI service is temporarily busy. Please wait a moment and try again, or upgrade your Google API plan." },
        { status: 429 }
      )
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
