"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, MicOff, Sparkles, ChevronRight, Check, Loader2, RefreshCw } from "lucide-react"

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

// Default fallback questions to avoid API call if not needed
const DEFAULT_QUESTIONS = [
  "What problem does this project solve or what is its main purpose?",
  "What technologies and tools did you use to build it?",
  "What were the main challenges you faced and how did you solve them?",
  "What makes this project unique or what are you most proud of?",
  "What did you learn and what would you do differently next time?",
]

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
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useCustomQuestions, setUseCustomQuestions] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const questionsGeneratedRef = useRef(false)

  // Use default questions to minimize API calls - only fetch custom if user requests
  const useDefaultQuestions = useCallback(() => {
    setQuestions(DEFAULT_QUESTIONS)
    setCurrentQuestionIndex(0)
    setAnswers([])
    setCurrentAnswer("")
    setError(null)
  }, [])

  const generateQuestions = useCallback(async (forceRefresh = false) => {
    // If we already have questions and not forcing refresh, skip API call
    if (questions.length > 0 && !forceRefresh && questionsGeneratedRef.current) {
      return
    }

    // Use default questions first to avoid unnecessary API call
    if (!forceRefresh && !useCustomQuestions) {
      useDefaultQuestions()
      return
    }

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
      questionsGeneratedRef.current = true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate questions")
      // Fall back to default questions on error
      useDefaultQuestions()
    } finally {
      setIsLoadingQuestions(false)
    }
  }, [title, category, technologies, currentDescription, questions.length, useCustomQuestions, useDefaultQuestions])

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
    // Skip transcription if blob is too small (likely empty/noise)
    if (audioBlob.size < 1000) {
      setError("Recording too short. Please speak for at least a second.")
      return
    }

    setIsTranscribing(true)
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

      if (data.text && data.text.trim()) {
        setCurrentAnswer((prev) => (prev ? prev + " " + data.text : data.text))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to transcribe audio")
    } finally {
      setIsTranscribing(false)
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
          useDefaultQuestions() // Use defaults immediately, no API call
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
            <span className="ml-2 text-sm text-muted-foreground">Generating custom questions...</span>
          </div>
        ) : questions.length > 0 ? (
          <>
            {/* Option to generate custom AI questions */}
            {!questionsGeneratedRef.current && answers.length === 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUseCustomQuestions(true)
                  generateQuestions(true)
                }}
                className="mb-2 gap-1 text-xs"
              >
                <RefreshCw className="h-3 w-3" />
                Generate AI-tailored questions for this project
              </Button>
            )}

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
                    placeholder={isTranscribing ? "Transcribing..." : "Type your answer or use the microphone..."}
                    rows={3}
                    className="pr-12"
                    disabled={isTranscribing}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant={isRecording ? "destructive" : "ghost"}
                    className="absolute bottom-2 right-2"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isTranscribing}
                  >
                    {isTranscribing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isRecording ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
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
