"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X, ArrowRight } from "lucide-react"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const calculatePoints = (questionIndex: number, totalQuestions: number, questionType: string) => {
  const basePoints = Math.round((100 * (questionIndex + 1)) / totalQuestions)
  return questionType === "Input Answer" ? basePoints * 1.5 : basePoints
}

export default function PlayLivePage() {
  const { sessionId } = useParams()
  const router = useRouter()
  const [lesson, setLesson] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{
    type: "correct" | "incorrect" | "revealed" | null
    points?: number
  }>(null)
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [inputAnswer, setInputAnswer] = useState("")
  const [lockedAnswers, setLockedAnswers] = useState<string[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [isParticipant, setIsParticipant] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifyParticipant = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      if (user) {
        const { data } = await supabase
          .from("participants")
          .select("id, user_id")
          .eq("session_id", sessionId)
          .eq("user_id", user.id)
          .single()

        if (!data) {
          router.push(`/live/join?redirect=/live/play/${sessionId}`)
          return
        }
        setParticipantId(data.id)
        setIsParticipant(true)
      }
      setLoading(false)
    }

    verifyParticipant()
  }, [sessionId, router])

  useEffect(() => {
    const loadSession = async () => {
      const { data: sessionData, error } = await supabase
        .from("live_sessions")
        .select("*, lesson:lesson_id(*)")
        .eq("id", sessionId)
        .single()

      if (error || !sessionData) {
        router.push("/")
        return
      }

      if (!sessionData.is_active) {
        router.push(`/lesson-finished/${sessionId}`)
        return
      }

      setSession(sessionData)
      setLesson(sessionData.lesson)

      const channel = supabase
        .channel(`session_${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "live_sessions",
            filter: `id=eq.${sessionId}`,
          },
          (payload) => {
            if (!payload.new.is_active) {
              router.push(`/lesson-finished/${sessionId}`)
            }
            setSession(payload.new)
          },
        )
        .subscribe()

      return () => channel.unsubscribe()
    }

    loadSession()
  }, [sessionId, router])

  const handleAnswerSelection = (answerText: string) => {
    if (!feedback?.type && !lockedAnswers.includes(answerText)) {
      setSelectedAnswer(answerText)
    }
  }

  const handleCheckAnswer = async () => {
    if (!lesson || !session || !userId || !isParticipant || !participantId) return

    const currentQuestion = lesson.questions[currentQuestionIndex]
    let isCorrect = false
    let answerValue = ""

    if (currentQuestion.type === "Input Answer") {
      answerValue = inputAnswer.trim().toLowerCase()
      isCorrect = currentQuestion.answers.some((a: any) => a.text.toLowerCase() === answerValue)
    } else {
      answerValue = selectedAnswer || ""
      isCorrect = currentQuestion.answers.some((a: any) => a.text === answerValue && a.isCorrect)
    }

    const points = isCorrect ? calculatePoints(currentQuestionIndex, lesson.questions.length, currentQuestion.type) : 0

    console.log("Answer check:", {
      isCorrect,
      participantId,
      points,
      answerValue,
      questionType: currentQuestion.type,
    })

    if (isCorrect) {
      try {
        // First, get current participant data
        const { data: participant, error: fetchError } = await supabase
          .from("participants")
          .select("score, correct_answers")
          .eq("id", participantId)
          .single()

        if (fetchError) {
          console.error("Failed to fetch participant data:", fetchError)
          return
        }

        console.log("Current participant data:", participant)

        // Calculate new values
        const newScore = (participant.score || 0) + points
        const newCorrectAnswers = (participant.correct_answers || 0) + 1

        console.log("Updating participant with:", {
          score: newScore,
          correct_answers: newCorrectAnswers,
        })

        // Update participant directly
        const { error: updateError } = await supabase
          .from("participants")
          .update({
            score: newScore,
            correct_answers: newCorrectAnswers,
          })
          .eq("id", participantId)

        if (updateError) {
          console.error("Failed to update participant:", updateError)
        } else {
          console.log("Successfully updated participant score and correct answers")
        }
      } catch (err) {
        console.error("Failed to update score:", err)
      }
    } else {
      // Track incorrect answers
      try {
        const { data: participant } = await supabase
          .from("participants")
          .select("incorrect_answers")
          .eq("id", participantId)
          .single()

        if (participant) {
          const newIncorrectAnswers = (participant.incorrect_answers || 0) + 1

          console.log("Updating incorrect answers to:", newIncorrectAnswers)

          const { error } = await supabase
            .from("participants")
            .update({ incorrect_answers: newIncorrectAnswers })
            .eq("id", participantId)

          if (error) {
            console.error("Failed to update incorrect answers:", error)
          } else {
            console.log("Successfully updated incorrect answers")
          }
        }
      } catch (err) {
        console.error("Failed to update incorrect answers:", err)
      }
    }

    setFeedback(isCorrect ? { type: "correct", points } : { type: "incorrect" })

    if (!isCorrect && currentQuestion.type !== "Input Answer") {
      setLockedAnswers((prev) => [...prev, answerValue])
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex === lesson.questions.length - 1) {
      supabase.from("live_sessions").update({ is_active: false }).eq("id", sessionId)
      router.push(`/lesson-finished/${sessionId}`)
    } else {
      setCurrentQuestionIndex((prev) => prev + 1)
      setSelectedAnswer(null)
      setInputAnswer("")
      setFeedback(null)
      setShowCorrectAnswer(false)
      setLockedAnswers([])
    }
  }

  const handleShowAnswer = () => {
    const correct = lesson.questions[currentQuestionIndex].answers.find((a: any) => a.isCorrect)
    const incorrectAnswers = lesson.questions[currentQuestionIndex].answers
      .filter((a: any) => !a.isCorrect)
      .map((a: any) => a.text)

    setLockedAnswers(incorrectAnswers)
    if (lesson.questions[currentQuestionIndex].type === "Input Answer") {
      setInputAnswer(correct.text)
    }
    setShowCorrectAnswer(true)
    setFeedback({ type: "revealed" })
    setSelectedAnswer(null)
  }

  const handleTryAgain = () => {
    setFeedback(null)
    setSelectedAnswer(null)
    setInputAnswer("")
    setShowCorrectAnswer(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-700">Verifying access...</div>
      </div>
    )
  }

  if (!isParticipant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Access Required</h1>
          <p className="text-slate-600">Please join the session first</p>
          <button onClick={() => router.push("/live/join")} className="button-primary">
            Join Session
          </button>
        </div>
      </div>
    )
  }

  if (!lesson || !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-700">Loading Session...</div>
      </div>
    )
  }

  if (!session.has_started) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Session Starting Soon</h1>
          <p className="text-slate-600">The host will begin the lesson shortly</p>
        </div>
      </div>
    )
  }

  const currentQuestion = lesson.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === lesson.questions.length - 1
  const correctAnswer = currentQuestion.answers.find((a: any) => a.isCorrect)

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto relative">
        <div className="grid grid-cols-4 gap-2 mb-6">
          {lesson.questions.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx <= currentQuestionIndex ? "bg-blue-500" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-800 mb-4 md:mb-6">{currentQuestion.text}</h2>

          {currentQuestion.type === "Input Answer" ? (
            <div className="mb-6">
              <input
                type="text"
                value={inputAnswer}
                onChange={(e) => setInputAnswer(e.target.value)}
                className={`w-full p-4 border-2 rounded-lg focus:ring-2 transition-all ${
                  feedback?.type === "incorrect"
                    ? "border-red-500 bg-red-50"
                    : "border-slate-200 focus:border-blue-500 focus:ring-blue-200"
                }`}
                placeholder="Type your answer here"
                disabled={!!feedback?.type}
              />
              {showCorrectAnswer && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-green-600">Correct answer: {correctAnswer.text}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {currentQuestion.answers.map((answer: any) => {
                const isCorrect = answer.isCorrect
                const showAsCorrect = feedback?.type === "correct" && isCorrect
                const showAsRevealed = feedback?.type === "revealed" && isCorrect
                const showAsIncorrect = feedback?.type === "incorrect" && selectedAnswer === answer.text
                const isLocked = lockedAnswers.includes(answer.text)
                const isSelected = selectedAnswer === answer.text

                return (
                  <motion.button
                    key={answer.text}
                    className={`p-4 text-left rounded-lg border-2 transition-colors
                      ${
                        showAsCorrect || showAsRevealed
                          ? "bg-green-50 border-green-500 cursor-default"
                          : showAsIncorrect
                            ? "bg-red-50 border-red-500 cursor-default"
                            : isLocked
                              ? "bg-slate-100 border-slate-200 cursor-default opacity-50"
                              : isSelected
                                ? "border-blue-500 bg-blue-50 cursor-pointer"
                                : "border-slate-200 bg-white hover:border-blue-300 cursor-pointer"
                      }`}
                    initial={false}
                    animate={
                      showAsIncorrect
                        ? {
                            x: [-5, 5, -5, 5, 0],
                            backgroundColor: "#FEE2E2",
                            borderColor: "#EF4444",
                          }
                        : {}
                    }
                    transition={{ duration: 0.4 }}
                    onClick={() => handleAnswerSelection(answer.text)}
                    disabled={!!feedback?.type || isLocked}
                  >
                    <div className="flex items-center justify-between">
                      <span>{answer.text}</span>
                      {(showAsCorrect || showAsRevealed) && <Check className="text-green-500" />}
                      {showAsIncorrect && <X className="text-red-500" />}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          )}

          <button
            onClick={handleCheckAnswer}
            disabled={
              (currentQuestion.type === "Input Answer" && !inputAnswer.trim()) ||
              (!selectedAnswer && currentQuestion.type !== "Input Answer") ||
              !!feedback?.type
            }
            className={`w-full button-primary
              ${
                feedback?.type === "correct"
                  ? "bg-green-500 hover:bg-green-600"
                  : feedback?.type === "incorrect"
                    ? "bg-red-500 hover:bg-red-600"
                    : ""
              }`}
          >
            {feedback?.type === "correct" ? "Correct!" : feedback?.type === "incorrect" ? "Incorrect" : "Check Answer"}
          </button>
        </div>

        <AnimatePresence>
          {feedback?.type === "incorrect" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-xl shadow-xl p-6 border border-red-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-500 p-2 rounded-full">
                  <X className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Incorrect Answer</h3>
                  <p className="text-sm text-red-600">
                    {showCorrectAnswer ? "Here's the correct answer" : "Try again or see solution"}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                {!showCorrectAnswer ? (
                  <>
                    <button onClick={handleTryAgain} className="button-danger">
                      Try Again
                    </button>
                    <button onClick={handleShowAnswer} className="button-secondary">
                      Show Answer
                    </button>
                  </>
                ) : (
                  <button onClick={handleNextQuestion} className="w-full button-success">
                    Continue
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {feedback?.type === "correct" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-xl shadow-xl p-6 border border-green-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 p-2 rounded-full">
                    <Check className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Correct Answer!</h3>
                    <p className="text-sm text-green-600">Earned {feedback.points} XP</p>
                  </div>
                </div>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                  +{feedback.points} XP
                </span>
              </div>
              <button onClick={handleNextQuestion} className="w-full button-success gap-2">
                {isLastQuestion ? "Finish Lesson" : "Continue"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {feedback?.type === "revealed" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-xl shadow-xl p-6 border border-green-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 p-2 rounded-full">
                    <Check className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Correct Answer Revealed</h3>
                    <p className="text-sm text-green-600">Study this solution before continuing</p>
                  </div>
                </div>
              </div>
              <button onClick={handleNextQuestion} className="w-full button-success gap-2">
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-xl shadow-sm p-8 prose prose-slate max-w-none">{lesson.content}</div>
      </div>
    </div>
  )
}

