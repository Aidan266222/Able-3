"use client"

import { useParams, useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle, Trophy, ArrowLeft, Home, Sparkles, Share2 } from "lucide-react"
import confetti from "canvas-confetti"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function LessonFinishedPage() {
  const params = useParams()
  const router = useRouter()
  const [score, setScore] = useState(0)
  const [lessonName, setLessonName] = useState("")
  const [loading, setLoading] = useState(true)
  const sessionId = params.sessionId as string

  useEffect(() => {
    // Trigger confetti when component mounts
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      // Since particles fall down, start a bit higher than random
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch score
        const { data: pointsData } = await supabase.from("live_answers").select("points").eq("session_id", sessionId)

        const totalPoints = pointsData?.reduce((acc, curr) => acc + curr.points, 0) || 0

        // Fetch session to get lesson ID
        const { data: sessionData } = await supabase
          .from("live_sessions")
          .select("lesson_id")
          .eq("id", sessionId)
          .single()

        if (sessionData?.lesson_id) {
          // Fetch lesson name
          const { data: lessonData } = await supabase
            .from("lessons")
            .select("name")
            .eq("id", sessionData.lesson_id)
            .single()

          if (lessonData) {
            setLessonName(lessonData.name)
          }
        }

        setScore(totalPoints)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (sessionId) {
      fetchData()
    }
  }, [sessionId])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full"
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-white bg-opacity-20 rounded-full mx-auto flex items-center justify-center mb-4"
          >
            <CheckCircle size={40} className="text-white" />
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Lesson Completed!</h1>
          {lessonName && <p className="text-blue-100 text-lg">{lessonName}</p>}
        </div>

        <div className="p-6 md:p-8">
          <div className="bg-blue-50 rounded-xl p-6 mb-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Trophy className="text-amber-500" size={24} />
              <h2 className="text-xl font-semibold text-gray-800">Your Score</h2>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-4xl font-bold text-blue-600"
            >
              {loading ? "..." : score} <span className="text-lg text-blue-400">points</span>
            </motion.div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/my-lessons"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Home size={18} />
              Return to My Lessons
            </Link>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft size={18} />
                Go Back
              </button>

              <button
                onClick={() => {
                  // Share functionality would go here
                  alert("Share functionality would be implemented here")
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Share2 size={18} />
                Share
              </button>
            </div>
          </div>
        </div>

        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <Sparkles size={16} className="text-amber-500" />
            <span className="text-sm font-medium">Great job completing this lesson!</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

