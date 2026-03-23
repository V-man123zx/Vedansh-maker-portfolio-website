import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")

export async function POST(request: Request) {
  try {
    const { title, category, technologies, answers } = await request.json()

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ error: "Google API key not configured" }, { status: 500 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const answersText = answers
      .map((a: { question: string; answer: string }) => `Q: ${a.question}\nA: ${a.answer}`)
      .join("\n\n")

    const prompt = `You are helping a maker/engineer create professional descriptions for their portfolio project.

Project Details:
- Title: ${title || "Untitled Project"}
- Category: ${category || "General"}
- Technologies: ${technologies || "Not specified"}

User's Answers to Questions:
${answersText}

Based on these answers, generate TWO descriptions:

1. SHORT DESCRIPTION (2-3 sentences): A concise overview suitable for a project card preview.

2. DETAILED DESCRIPTION (2-4 paragraphs): A comprehensive description covering the project's purpose, implementation, challenges, and outcomes. Write in first person.

Format your response as JSON:
{
  "shortDescription": "...",
  "detailedDescription": "..."
}

Return ONLY the JSON object, no other text.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse the JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
    }

    const descriptions = JSON.parse(jsonMatch[0])

    return NextResponse.json(descriptions)
  } catch (error) {
    console.error("[v0] Gemini API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate summary" },
      { status: 500 }
    )
  }
}
