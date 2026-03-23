"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, MicOff, Sparkles, ChevronRight, Check, Loader2 } from "lucide-react"

interface Answer {
  question: string
  answer: string
}

interface AIDescriptionAssistantProps {
  title: string
  category: string
  technologies: string
  currentDescription: string
  onDescriptionsGenerated: (shortDesc: string, detailedDesc: string) => void
}

export function AIDescriptionAssistant({
  title,
  category,
  technologies,
  currentDescription,
  onDescriptionsGenerated,
}: AIDescriptionAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [questions, setQuestions] = useState<string[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const generateQuestions = async () => {
    setIsLoadingQuestions(true)
    setError(null)
    try {
      const response = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, technologies, currentDescription }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setQuestions(data.questions)
      setCurrentQuestionIndex(0)
      setAnswers([])
      setCurrentAnswer("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate questions")
    } finally {
      setIsLoadingQuestions(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" })
        await transcribeAudio(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      setError("Microphone access denied. Please allow microphone access to use voice input.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      // Convert to base64 for Gemini
      const arrayBuffer = await audioBlob.arrayBuffer()
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      )

      const response = await fetch("/api/ai/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64Audio, mimeType: audioBlob.type }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setCurrentAnswer((prev) => (prev ? prev + " " + data.text : data.text))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to transcribe audio")
    }
  }

  const submitAnswer = () => {
    if (!currentAnswer.trim()) return

    const newAnswer: Answer = {
      question: questions[currentQuestionIndex],
      answer: currentAnswer.trim(),
    }

    setAnswers([...answers, newAnswer])
    setCurrentAnswer("")

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const generateSummary = async () => {
    setIsGeneratingSummary(true)
    setError(null)
    try {
      const response = await fetch("/api/ai/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, technologies, answers }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      onDescriptionsGenerated(data.shortDescription, data.detailedDescription)
      setIsOpen(false)
      setQuestions([])
      setAnswers([])
      setCurrentQuestionIndex(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summary")
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const allQuestionsAnswered = answers.length === questions.length && questions.length > 0

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setIsOpen(true)
          generateQuestions()
        }}
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        AI Description Assistant
      </Button>
    )
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Description Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {isLoadingQuestions ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Generating questions...</span>
          </div>
        ) : questions.length > 0 ? (
          <>
            {/* Progress indicator */}
            <div className="flex gap-1">
              {questions.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    idx < answers.length
                      ? "bg-primary"
                      : idx === currentQuestionIndex
                        ? "bg-primary/50"
                        : "bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Current question */}
            {!allQuestionsAnswered && (
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
                <p className="text-foreground">{questions[currentQuestionIndex]}</p>

                <div className="relative">
                  <Textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Type your answer or use the microphone..."
                    rows={3}
                    className="pr-12"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant={isRecording ? "destructive" : "ghost"}
                    className="absolute bottom-2 right-2"
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={submitAnswer}
                    disabled={!currentAnswer.trim()}
                    className="gap-1"
                  >
                    {currentQuestionIndex < questions.length - 1 ? (
                      <>
                        Next <ChevronRight className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Done <Check className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      if (currentQuestionIndex < questions.length - 1) {
                        setCurrentQuestionIndex(currentQuestionIndex + 1)
                        setCurrentAnswer("")
                      }
                    }}
                    disabled={currentQuestionIndex >= questions.length - 1}
                  >
                    Skip
                  </Button>
                </div>
              </div>
            )}

            {/* Summary of answers */}
            {answers.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Your answers:</p>
                <div className="max-h-32 space-y-2 overflow-y-auto">
                  {answers.map((a, idx) => (
                    <div key={idx} className="rounded bg-background p-2 text-xs">
                      <p className="font-medium text-muted-foreground">{a.question}</p>
                      <p className="text-foreground">{a.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generate button */}
            {allQuestionsAnswered && (
              <Button
                type="button"
                onClick={generateSummary}
                disabled={isGeneratingSummary}
                className="w-full gap-2"
              >
                {isGeneratingSummary ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating descriptions...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Descriptions
                  </>
                )}
              </Button>
            )}
          </>
        ) : null}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsOpen(false)
            setQuestions([])
            setAnswers([])
            setError(null)
          }}
          className="w-full"
        >
          Cancel
        </Button>
      </CardContent>
    </Card>
  )
}
