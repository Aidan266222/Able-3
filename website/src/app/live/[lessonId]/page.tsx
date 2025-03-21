"use client"

import { useEffect, useState, useRef, useCallback, memo } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import { motion, AnimatePresence } from "framer-motion"
import {
  Copy,
  Users,
  Trophy,
  AlertCircle,
  Play,
  Power,
  ArrowUp,
  ArrowDown,
  Clock,
  BarChart3,
  Zap,
  Share2,
  PauseCircle,
  ChevronRight,
  Crown,
  Loader2,
  Info,
  ArrowLeft,
} from "lucide-react"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Isolated timer component to prevent re-renders of parent
const SessionTimer = memo(({ isActive }: { isActive: boolean }) => {
  const [time, setTime] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isActive) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1)
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isActive])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  return (
    <div className="flex items-center gap-2 text-gray-700">
      <Clock size={18} />
      <span className="font-medium">{formatTime(time)}</span>
    </div>
  )
})

SessionTimer.displayName = "SessionTimer"

// Memoized chart component
const AnswersChart = memo(
  ({
    correctAnswers,
    incorrectAnswers,
  }: {
    correctAnswers: number
    incorrectAnswers: number
  }) => {
    const total = correctAnswers + incorrectAnswers
    const correctPercentage = total > 0 ? (correctAnswers / total) * 100 : 0
    const incorrectPercentage = total > 0 ? (incorrectAnswers / total) * 100 : 0

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-green-600">Correct: {correctAnswers}</span>
          <span className="font-medium text-red-600">Incorrect: {incorrectAnswers}</span>
        </div>
        <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
          <div className="flex h-full">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${correctPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="bg-green-500 h-full"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${incorrectPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="bg-red-500 h-full"
            />
          </div>
        </div>
        <div className="text-xs text-gray-500 text-center">{total} total answers</div>
      </div>
    )
  },
)

AnswersChart.displayName = "AnswersChart"

// Memoized leaderboard item
const LeaderboardItem = memo(
  ({
    player,
    index,
    xpAnimations,
  }: {
    player: any
    index: number
    xpAnimations: Record<string, number>
  }) => {
    const positionChange = player.prevPosition - player.position
    const hasImproved = positionChange > 0
    const isNew = player.prevPosition === Number.POSITIVE_INFINITY
    const isTopThree = index < 3

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`flex items-center justify-between relative p-3 rounded-lg ${
          isTopThree ? "bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200" : "hover:bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`relative flex items-center justify-center w-8 h-8 rounded-full ${
              index === 0
                ? "bg-amber-500 text-white"
                : index === 1
                  ? "bg-gray-400 text-white"
                  : index === 2
                    ? "bg-amber-700 text-white"
                    : "bg-gray-100 text-gray-700"
            }`}
          >
            {index === 0 ? <Crown size={14} /> : index + 1}
          </div>
          <div className="relative">
            <span className="font-medium text-gray-800">{player.name}</span>
            <AnimatePresence>
              {positionChange !== 0 && !isNew && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={`absolute -right-6 ${hasImproved ? "text-green-500" : "text-red-500"}`}
                >
                  {hasImproved ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Move the XP animation inside the player info container */}
            <AnimatePresence>
              {xpAnimations[player.id] && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 0 }}
                  animate={{ opacity: 1, scale: 1, y: -20 }}
                  exit={{ opacity: 0, scale: 0.5, y: -30 }}
                  className="flex items-center gap-1 text-green-500 font-bold absolute -top-6 left-0"
                >
                  +{xpAnimations[player.id]} pts
                  <Zap size={14} className="fill-green-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <span className="font-bold text-blue-600">{player.score} pts</span>
      </motion.div>
    )
  },
)

LeaderboardItem.displayName = "LeaderboardItem"

// Memoized participants list
const ParticipantsList = memo(({ participants }: { participants: any[] }) => {
  if (participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Users size={48} className="text-gray-300 mb-3" />
        <p className="text-gray-400">No participants yet</p>
        <p className="text-gray-400 text-sm mt-1">Share the join code to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {participants.map((participant) => (
        <div key={participant.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
          <span className="font-medium text-gray-700">{participant.name}</span>
          <span className="text-blue-600 font-semibold">{participant.score} pts</span>
        </div>
      ))}
    </div>
  )
})

ParticipantsList.displayName = "ParticipantsList"

export default function HostLivePage() {
  const router = useRouter()
  const { lessonId } = useParams()
  const [session, setSession] = useState<any>(null)
  const [lesson, setLesson] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [xpAnimations, setXpAnimations] = useState<Record<string, number>>({})
  const sessionCreatedRef = useRef(false)
  const prevParticipantsRef = useRef<any[]>([])
  const prevLeaderboardRef = useRef<string>("")
  const [isDisconnected, setIsDisconnected] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [sessionStatus, setSessionStatus] = useState<"waiting" | "active" | "paused">("waiting")
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [totalQuestions, setTotalQuestions] = useState(10)
  const [showCopiedNotification, setShowCopiedNotification] = useState(false)
  const [sessionStats, setSessionStats] = useState({
    correctAnswers: 0,
    incorrectAnswers: 0,
    averageScore: 0,
  })
  const [loading, setLoading] = useState(true)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastFetchTimeRef = useRef<number>(0)

  useEffect(() => {
    const initializeSession = async () => {
      if (sessionCreatedRef.current) return
      sessionCreatedRef.current = true

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push("/login")
          return
        }

        const { data: lessonData, error: lessonError } = await supabase
          .from("lessons")
          .select("*, user_id")
          .eq("id", lessonId)
          .single()

        if (lessonError || !lessonData || lessonData.user_id !== user.id) {
          router.push("/my-lessons")
          return
        }

        setIsOwner(true)
        setTotalQuestions(lessonData.questions?.length || 10)

        const { data: sessionData, error: sessionError } = await supabase
          .from("live_sessions")
          .select("*")
          .eq("lesson_id", lessonId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (sessionError || !sessionData) {
          // Create new session
          const { data: newSession, error: createError } = await supabase
            .from("live_sessions")
            .insert({
              host_id: user.id,
              lesson_id: lessonId,
              join_code: Math.floor(100000 + Math.random() * 900000).toString(),
            })
            .select("*")
            .single()

          if (createError || !newSession) {
            throw new Error("Failed to create session")
          }

          setSession(newSession)
          setupRealtime(newSession.id)
          fetchParticipants(newSession.id)
        } else {
          setSession(sessionData)
          setupRealtime(sessionData.id)
          fetchParticipants(sessionData.id)

          if (sessionData.has_started) {
            setSessionStatus(sessionData.is_active ? "active" : "paused")
          }
        }

        setLesson(lessonData)
      } catch (error) {
        console.error("Error initializing session:", error)
      } finally {
        setLoading(false)
      }
    }

    initializeSession()
  }, [lessonId, router])

  // Modified setupRealtime to handle participant changes more effectively
  const setupRealtime = (sessionId: string) => {
    const channel = supabase
      .channel(`session_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          // Debounce participant updates to prevent rapid UI refreshes
          const now = Date.now()
          if (now - lastFetchTimeRef.current > 1000) {
            // Only fetch if it's been more than 1 second since last fetch
            console.log("Participant change detected:", payload.eventType)
            lastFetchTimeRef.current = now

            // Clear any pending fetch
            if (fetchTimeoutRef.current) {
              clearTimeout(fetchTimeoutRef.current)
            }

            // Schedule a new fetch with a slight delay to batch multiple rapid changes
            fetchTimeoutRef.current = setTimeout(() => {
              fetchParticipants(sessionId)
            }, 300)
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          // Only update session if there are actual changes
          const newSession = payload.new
          if (!session) return // Skip if session not initialized yet

          const hasChanges =
            session.has_started !== newSession.has_started || session.is_active !== newSession.is_active

          if (hasChanges) {
            console.log("Session updated from database:", newSession)
            setSession(newSession)

            // Update session status based on new session state
            if (newSession.has_started && newSession.is_active) {
              setSessionStatus("active")
            } else if (newSession.has_started && !newSession.is_active) {
              setSessionStatus("paused")
            } else {
              setSessionStatus("waiting")
            }
          }
        },
      )
      .subscribe()

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
      channel.unsubscribe()
    }
  }

  // Use a ref to track if we should fetch participants periodically
  const shouldFetchRef = useRef(true)

  useEffect(() => {
    // Update the ref when session status changes
    shouldFetchRef.current = sessionStatus === "active"
  }, [sessionStatus])

  useEffect(() => {
    if (session && session.id) {
      const interval = setInterval(() => {
        // Only fetch if session is active (using the ref to avoid re-renders)
        if (shouldFetchRef.current) {
          fetchParticipants(session.id)
        }
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [session])

  // Enhanced fetchParticipants with better error handling
  const fetchParticipants = useCallback(async (sessionId: string) => {
    try {
      // First get participants
      const { data: participantsData, error } = await supabase
        .from("participants")
        .select("id, name, score, user_id, correct_answers, incorrect_answers, session_id")
        .eq("session_id", sessionId)
        .order("score", { ascending: false })

      if (error) throw error

      // If we have participants, get their user metadata
      if (participantsData && participantsData.length > 0) {
        // Get user data for all participants
        const userIds = participantsData.map((p) => p.user_id).filter(Boolean)

        if (userIds.length > 0) {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("id, email")
            .in("id", userIds)

          if (!userError && userData) {
            // Create a map of user_id to email
            const userMap = new Map(userData.map((u) => [u.id, u.email]))

            // Enhance participants with user email as fallback
            participantsData.forEach((participant) => {
              if (participant.user_id && userMap.has(participant.user_id)) {
                const email = userMap.get(participant.user_id) || ""
                // Use email username as fallback if name isn't set
                if (!participant.name || participant.name === "Anonymous") {
                  participant.name = email.split("@")[0]
                }
              }
            })
          }
        }
      }

      // Check if there are actual changes before updating state
      const participants = participantsData || []

      // Create a simplified version for comparison
      const simplifiedParticipants = participants.map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        correct_answers: p.correct_answers || 0,
        incorrect_answers: p.incorrect_answers || 0,
      }))

      const currentParticipantsString = JSON.stringify(simplifiedParticipants)
      const prevParticipantsString = JSON.stringify(
        prevParticipantsRef.current.map((p) => ({
          id: p.id,
          name: p.name,
          score: p.score,
          correct_answers: p.correct_answers || 0,
          incorrect_answers: p.incorrect_answers || 0,
        })),
      )

      // Only update if there are actual changes
      if (currentParticipantsString !== prevParticipantsString) {
        console.log("Participants changed, updating UI")
        setParticipants(participants)
        updateLeaderboard(participants)

        // Update session stats with more accurate calculations
        if (participants.length > 0) {
          const totalCorrect = participants.reduce((sum, p) => sum + (p.correct_answers || 0), 0)
          const totalIncorrect = participants.reduce((sum, p) => sum + (p.incorrect_answers || 0), 0)
          const avgScore = participants.reduce((sum, p) => sum + p.score, 0) / participants.length

          setSessionStats({
            correctAnswers: totalCorrect,
            incorrectAnswers: totalIncorrect,
            averageScore: Math.round(avgScore),
          })
        }
      } else {
        console.log("No changes in participants data, skipping update")
      }
    } catch (err) {
      console.error("Failed to fetch participants:", err)
    }
  }, [])

  // Completely revised updateLeaderboard with strict change detection
  const updateLeaderboard = useCallback((players: any[]) => {
    // Create a simplified version of players for comparison
    const simplifiedPlayers = players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
    }))

    // Stringify for deep comparison
    const currentLeaderboardString = JSON.stringify(simplifiedPlayers)

    // Only update if there are actual changes
    if (currentLeaderboardString === prevLeaderboardRef.current) {
      console.log("Leaderboard unchanged, skipping animation")
      return // No changes, skip update
    }

    console.log("Leaderboard changed, updating with animations")

    // Store current state for next comparison
    prevLeaderboardRef.current = currentLeaderboardString

    const newXpAnimations: Record<string, number> = {}
    const prevPlayers = new Map(prevParticipantsRef.current.map((p) => [p.id, p]))

    const updatedPlayers = players.map((player) => {
      const prev = prevPlayers.get(player.id)
      return {
        ...player,
        prevPosition: prev?.position || Number.POSITIVE_INFINITY,
        position: players.findIndex((p) => p.id === player.id) + 1,
      }
    })

    updatedPlayers.forEach((player) => {
      const prevScore = prevPlayers.get(player.id)?.score || 0
      if (player.score > prevScore) {
        const diff = player.score - prevScore
        newXpAnimations[player.id] = diff
      }
    })

    if (Object.keys(newXpAnimations).length > 0) {
      setXpAnimations((prev) => ({ ...prev, ...newXpAnimations }))
      setTimeout(() => setXpAnimations({}), 2000)
    }

    setLeaderboard(updatedPlayers.slice(0, 10))
    prevParticipantsRef.current = updatedPlayers
  }, [])

  const startSession = useCallback(async () => {
    if (participants.length === 0) return

    // Only update local state if needed
    if (!session.has_started || !session.is_active) {
      console.log("Starting session - updating local state")
      setSession((prev: any) => ({
        ...prev,
        has_started: true,
        is_active: true,
      }))
      setSessionStatus("active")
    }

    // Update in database but don't trigger additional UI updates from this
    try {
      console.log("Updating session in database")
      await supabase
        .from("live_sessions")
        .update({
          has_started: true,
          is_active: true,
        })
        .eq("id", session.id)
    } catch (err) {
      console.error("Failed to update session:", err)
    }
  }, [participants.length, session])

  const pauseSession = useCallback(async () => {
    setSessionStatus("paused")

    await supabase.from("live_sessions").update({ is_active: false }).eq("id", session.id)
  }, [session])

  const resumeSession = useCallback(async () => {
    setSessionStatus("active")

    await supabase.from("live_sessions").update({ is_active: true }).eq("id", session.id)
  }, [session])

  const endSession = useCallback(async () => {
    await supabase.from("live_sessions").update({ is_active: false }).eq("id", session.id)
    await supabase.from("live_sessions").delete().eq("id", session.id)
    router.push("/my-lessons")
  }, [router, session])

  const endSessionAndDelete = useCallback(async () => {
    if (session && session.id) {
      await supabase.from("live_sessions").delete().eq("id", session.id)
      router.push("/my-lessons")
    }
  }, [router, session])

  const nextQuestion = useCallback(() => {
    if (currentQuestion < totalQuestions) {
      setCurrentQuestion((prev) => prev + 1)
    }
  }, [currentQuestion, totalQuestions])

  const copyJoinCode = useCallback(() => {
    navigator.clipboard.writeText(session?.join_code)
    setShowCopiedNotification(true)
    setTimeout(() => setShowCopiedNotification(false), 2000)
  }, [session?.join_code])

  useEffect(() => {
    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      if (session && session.id) {
        await supabase.from("live_sessions").delete().eq("id", session.id)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [session])

  useEffect(() => {
    const handleOffline = () => {
      setIsDisconnected(true)
      setCountdown(30)
    }
    const handleOnline = () => {
      setIsDisconnected(false)
      setCountdown(null)
    }
    window.addEventListener("offline", handleOffline)
    window.addEventListener("online", handleOnline)
    return () => {
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("online", handleOnline)
    }
  }, [])

  useEffect(() => {
    if (isDisconnected && countdown !== null) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev && prev <= 1) {
            clearInterval(interval)
            endSessionAndDelete()
            return 0
          }
          return (prev || 0) - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isDisconnected, countdown, endSessionAndDelete])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-blue-800 font-medium">Loading session...</p>
        </div>
      </div>
    )
  }

  if (!isOwner || !session || !lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to access this session or it doesn't exist.</p>
          <Link
            href="/my-lessons"
            className="button-primary"
          >
            <ArrowLeft size={18} />
            Return to My Lessons
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8">
      {isDisconnected && countdown !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md"
          >
            <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2">Connection Lost</h2>
            <p className="text-lg mb-6 text-gray-600">
              Session will end in <span className="font-bold text-red-500">{countdown}</span> seconds
            </p>
            <button
              onClick={() => {
                setIsDisconnected(false)
                setCountdown(null)
              }}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Reconnect
            </button>
          </motion.div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-2 bg-blue-500 rounded-full"></div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{lesson?.name}</h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <div className="bg-blue-100 px-4 py-2 rounded-lg flex items-center gap-2 border-2 border-blue-200">
                    <span className="text-2xl font-bold text-blue-600 tracking-wider">{session?.join_code}</span>
                  </div>
                  <AnimatePresence>
                    {showCopiedNotification && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute -top-8 left-0 right-0 text-center text-green-600 font-medium text-sm"
                      >
                        Copied!
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button
                  onClick={copyJoinCode}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Copy size={16} />
                  Copy Code
                </button>
                <button
                  onClick={() => {
                    // Share functionality would go here
                    alert("Share functionality would be implemented here")
                  }}
                  className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium border border-gray-300 transition-colors"
                >
                  <Share2 size={16} />
                  Share Link
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full lg:w-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                {sessionStatus === "waiting" ? (
                  <button
                    onClick={startSession}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-colors w-full sm:w-auto ${
                      participants.length === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
                    }`}
                    disabled={participants.length === 0}
                  >
                    <Play size={18} />
                    {participants.length === 0 ? "Waiting for participants..." : "Start Lesson"}
                  </button>
                ) : sessionStatus === "active" ? (
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      onClick={pauseSession}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors w-full sm:w-auto"
                    >
                      <PauseCircle size={18} />
                      Pause
                    </button>
                    <button
                      onClick={endSession}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors w-full sm:w-auto"
                    >
                      <Power size={18} />
                      End
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={resumeSession}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors w-full sm:w-auto"
                  >
                    <Play size={18} />
                    Resume
                  </button>
                )}
              </div>

              {sessionStatus !== "waiting" && (
                <div className="flex items-center justify-between bg-gray-100 rounded-lg p-3">
                  <SessionTimer isActive={sessionStatus === "active"} />
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">
                      Question {currentQuestion}/{totalQuestions}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column - Participants */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden h-full"
            >
              <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users size={20} />
                    <h3 className="text-lg font-semibold">Participants</h3>
                  </div>
                  <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                    {participants.length}
                  </div>
                </div>
              </div>

              <div className="p-4 max-h-[500px] overflow-y-auto">
                <ParticipantsList participants={participants} />
              </div>
            </motion.div>
          </div>

          {/* Middle column - Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy size={20} />
                  <h3 className="text-lg font-semibold">Leaderboard</h3>
                </div>
                <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                  Top {Math.min(10, leaderboard.length)}
                </div>
              </div>
            </div>

            <div className="p-4 max-h-[500px] overflow-y-auto">
              {leaderboard.length > 0 ? (
                <div className="space-y-2">
                  <AnimatePresence>
                    {leaderboard.map((player, index) => (
                      <LeaderboardItem
                        key={`${player.id}-${player.position}`}
                        player={player}
                        index={index}
                        xpAnimations={xpAnimations}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Trophy size={48} className="text-gray-300 mb-3" />
                  <p className="text-gray-400">No scores yet</p>
                  <p className="text-gray-400 text-sm mt-1">Scores will appear as participants answer questions</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right column - Session info and controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
              <div className="p-4 bg-gradient-to-r from-green-500 to-teal-500 text-white">
                <div className="flex items-center gap-3">
                  <BarChart3 size={20} />
                  <h3 className="text-lg font-semibold">Session Stats</h3>
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-800 mb-2">Answer Distribution</h4>
                    <AnswersChart
                      correctAnswers={sessionStats.correctAnswers}
                      incorrectAnswers={sessionStats.incorrectAnswers}
                    />
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <div className="text-blue-600 text-sm font-medium">Average Score</div>
                    <div className="text-2xl font-bold text-gray-800">{sessionStats.averageScore}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                <div className="flex items-center gap-3">
                  <Info size={20} />
                  <h3 className="text-lg font-semibold">Joining Instructions</h3>
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-4 text-gray-700">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 mt-0.5">
                      1
                    </div>
                    <p>Share the join code with participants</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 mt-0.5">
                      2
                    </div>
                    <p>
                      Participants visit:{" "}
                      <Link href="/live/join" className="text-blue-600 hover:underline font-medium">
                        {typeof window !== "undefined" && window.location.origin}
                        /live/join
                      </Link>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 mt-0.5">
                      3
                    </div>
                    <p>Enter the join code when prompted</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 mt-0.5">
                      4
                    </div>
                    <p>Participants will appear in the list once joined</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Session controls */}
        {sessionStatus !== "waiting" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg p-6 mt-6"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-semibold text-gray-800">Question Controls</h3>
                <p className="text-gray-500">
                  Currently on question {currentQuestion} of {totalQuestions}
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={nextQuestion}
                  disabled={currentQuestion >= totalQuestions}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                    currentQuestion >= totalQuestions
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  Next Question
                  <ChevronRight size={18} />
                </button>
                {sessionStatus === "active" ? (
                  <button
                    onClick={pauseSession}
                    className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
                  >
                    <PauseCircle size={18} />
                    Pause Session
                  </button>
                ) : (
                  <button
                    onClick={resumeSession}
                    className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                  >
                    <Play size={18} />
                    Resume Session
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

