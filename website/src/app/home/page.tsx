"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  BookOpen,
  LineChart,
  Plus,
  Play,
  Sparkles,
  Trophy,
  Users,
  Zap,
  Calendar,
  CheckCircle,
  ArrowRight,
  Flame,
  Award,
  Star,
  Loader2,
  PlusCircle,
  Lightbulb,
  Share2,
  Download,
} from "lucide-react"
import ShareLessonModal from "../components/share-lesson-modal"
import AddSharedLessonModal from "../components/add-shared-lesson-modal"
import { checkAchievements, updateStreak } from "../utils/achievements"
import type { Achievement, UserStats, SharedLesson } from "../types/dashboard"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Lesson {
  id: string
  name: string
  description?: string
  image_url?: string
  questions: any[]
  user_id: string
  created_at: string
}

interface ParticipationRecord {
  id: string
  session_id: string
  user_id: string
  score: number
  created_at: string
  lesson: {
    id: string
    name: string
    image_url?: string
    user_id: string
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([])
  const [popularLessons, setPopularLessons] = useState<Lesson[]>([])
  const [sharedLessons, setSharedLessons] = useState<SharedLesson[]>([])
  const [participationHistory, setParticipationHistory] = useState<ParticipationRecord[]>([])
  const [userStats, setUserStats] = useState<UserStats>({
    totalLessonsCreated: 0,
    totalLessonsCompleted: 0,
    totalScore: 0,
    averageScore: 0,
    bestScore: 0,
    streak: {
      current: 0,
      longest: 0,
      lastActivityDate: "",
    },
  })
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [showShareModal, setShowShareModal] = useState(false)
  const [showAddSharedModal, setShowAddSharedModal] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [recentlyUnlockedAchievement, setRecentlyUnlockedAchievement] = useState<Achievement | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push("/login")
          return
        }

        setUser(user)

        // Update user streak
        const streak = await updateStreak(user.id)

        // Fetch user's created lessons
        const { data: lessonData, error: lessonError } = await supabase
          .from("lessons")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(4)

        if (lessonError) throw lessonError
        setRecentLessons(lessonData || [])

        // Fetch user's participation history
        const { data: participationData, error: participationError } = await supabase
          .from("participants")
          .select(`
            id, 
            session_id, 
            user_id, 
            score, 
            created_at,
            lesson:live_sessions(
              id,
              lesson_id,
              lesson:lessons(
                id, 
                name, 
                image_url,
                user_id
              )
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5)

        if (participationError) throw participationError

        // Transform the nested data structure
        const transformedParticipation =
          participationData
            ?.map((record) => {
              const sessionData = record.lesson[0]
              const lessonData = sessionData?.lesson[0]

              return {
                id: record.id,
                session_id: record.session_id,
                user_id: record.user_id,
                score: record.score,
                created_at: record.created_at,
                lesson: lessonData
                  ? {
                      id: lessonData.id,
                      name: lessonData.name,
                      image_url: lessonData.image_url,
                      user_id: lessonData.user_id,
                    }
                  : null,
              }
            })
            .filter((record) => record.lesson !== null) || []

        setParticipationHistory(transformedParticipation)

        // Fetch shared lessons
        const { data: sharedData, error: sharedError } = await supabase
          .from("shared_lessons")
          .select(`
            id,
            lesson_id,
            shared_by,
            shared_with,
            created_at,
            lesson:lessons(
              id,
              name,
              description,
              image_url,
              user_id,
              created_at
            )
          `)
          .eq("shared_with", user.id)
          .order("created_at", { ascending: false })

        if (sharedError) throw sharedError

        // Transform shared lessons data
        const transformedSharedLessons =
          sharedData?.map((record) => ({
            id: record.id,
            lesson_id: record.lesson_id,
            shared_by: record.shared_by,
            shared_with: record.shared_with,
            created_at: record.created_at,
            lesson: record.lesson[0],
          })) || []

        setSharedLessons(transformedSharedLessons)

        // Calculate user stats
        const stats: UserStats = {
          totalLessonsCreated: lessonData?.length || 0,
          totalLessonsCompleted: transformedParticipation.length,
          totalScore: transformedParticipation.reduce((sum, record) => sum + record.score, 0),
          averageScore:
            transformedParticipation.length > 0
              ? Math.round(
                  transformedParticipation.reduce((sum, record) => sum + record.score, 0) /
                    transformedParticipation.length,
                )
              : 0,
          bestScore:
            transformedParticipation.length > 0
              ? Math.max(...transformedParticipation.map((record) => record.score))
              : 0,
          streak: streak,
        }

        setUserStats(stats)

        // Check achievements
        const userAchievements = await checkAchievements(user.id, stats)
        setAchievements(userAchievements)

        // Check for newly unlocked achievements
        const previousAchievements = localStorage.getItem("achievements")
        if (previousAchievements) {
          const parsedPrevious = JSON.parse(previousAchievements)
          const newlyUnlocked = userAchievements.find(
            (a) => a.completed && !parsedPrevious.some((p: Achievement) => p.id === a.id && p.completed),
          )

          if (newlyUnlocked) {
            setRecentlyUnlockedAchievement(newlyUnlocked)
            setTimeout(() => setRecentlyUnlockedAchievement(null), 5000)
          }
        }

        // Save current achievements to localStorage
        localStorage.setItem("achievements", JSON.stringify(userAchievements))

        // Fetch popular lessons (not created by the user)
        const { data: popularData, error: popularError } = await supabase
          .from("lessons")
          .select("*")
          .neq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(4)

        if (popularError) throw popularError
        setPopularLessons(popularData || [])
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Placeholder image for lessons without an image
  const placeholderImage = (index: number) => {
    const colors = ["bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-green-500", "bg-yellow-500"]
    return colors[index % colors.length]
  }

  // Function to handle sharing a lesson
  const handleShareLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson)
    setShowShareModal(true)
  }

  // Function to refresh data after adding a shared lesson
  const handleSharedLessonAdded = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Fetch updated shared lessons
      const { data: sharedData } = await supabase
        .from("shared_lessons")
        .select(`
          id,
          lesson_id,
          shared_by,
          shared_with,
          created_at,
          lesson:lessons(
            id,
            name,
            description,
            image_url,
            user_id,
            created_at
          )
        `)
        .eq("shared_with", user.id)
        .order("created_at", { ascending: false })

      if (sharedData) {
        const transformedSharedLessons = sharedData.map((record) => ({
          id: record.id,
          lesson_id: record.lesson_id,
          shared_by: record.shared_by,
          shared_with: record.shared_with,
          created_at: record.created_at,
          lesson: record.lesson[0],
        }))

        setSharedLessons(transformedSharedLessons)
      }

      // Check for "Social Learner" achievement
      const updatedAchievements = await checkAchievements(user.id, userStats)
      setAchievements(updatedAchievements)

      // Check for newly unlocked achievements
      const newlyUnlocked = updatedAchievements.find(
        (a) => a.completed && a.id === 7 && !achievements.find((prev) => prev.id === 7)?.completed,
      )

      if (newlyUnlocked) {
        setRecentlyUnlockedAchievement(newlyUnlocked)
        setTimeout(() => setRecentlyUnlockedAchievement(null), 5000)
      }
    } catch (error) {
      console.error("Error refreshing shared lessons:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-blue-800 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-6 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome section */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 md:py-10 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">
                    Welcome back, {user?.email?.split("@")[0] || "User"}!
                  </h1>
                  <p className="mt-2 text-blue-100">Here's an overview of your learning journey</p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/lesson-create"
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
                  >
                    <Plus size={18} />
                    <span>Create Lesson</span>
                  </Link>
                  <Link
                    href="/live/join"
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors shadow-sm"
                  >
                    <Play size={18} />
                    <span>Join Session</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
              <div className="bg-blue-50 rounded-xl p-4 flex flex-col items-center text-center">
                <div className="bg-blue-100 p-2 rounded-full mb-3">
                  <BookOpen className="text-blue-600" size={24} />
                </div>
                <span className="text-2xl font-bold text-gray-800">{userStats.totalLessonsCreated}</span>
                <span className="text-sm text-gray-500">Lessons Created</span>
              </div>

              <div className="bg-purple-50 rounded-xl p-4 flex flex-col items-center text-center">
                <div className="bg-purple-100 p-2 rounded-full mb-3">
                  <CheckCircle className="text-purple-600" size={24} />
                </div>
                <span className="text-2xl font-bold text-gray-800">{userStats.totalLessonsCompleted}</span>
                <span className="text-sm text-gray-500">Lessons Completed</span>
              </div>

              <div className="bg-amber-50 rounded-xl p-4 flex flex-col items-center text-center">
                <div className="bg-amber-100 p-2 rounded-full mb-3">
                  <Trophy className="text-amber-600" size={24} />
                </div>
                <span className="text-2xl font-bold text-gray-800">{userStats.bestScore}</span>
                <span className="text-sm text-gray-500">Best Score</span>
              </div>

              <div className="bg-green-50 rounded-xl p-4 flex flex-col items-center text-center">
                <div className="bg-green-100 p-2 rounded-full mb-3">
                  <Flame className="text-green-600" size={24} />
                </div>
                <span className="text-2xl font-bold text-gray-800">{userStats.streak.current}</span>
                <span className="text-sm text-gray-500">Day Streak</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent lessons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <BookOpen className="text-blue-600" size={20} />
                  <h2 className="text-xl font-semibold text-gray-800">Your Recent Lessons</h2>
                </div>
                <Link
                  href="/my-lessons"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                >
                  View All <ArrowRight size={14} />
                </Link>
              </div>

              <div className="p-6">
                {recentLessons.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {recentLessons.map((lesson, index) => (
                      <div
                        key={lesson.id}
                        className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="h-32 overflow-hidden">
                          {lesson.image_url ? (
                            <img
                              src={lesson.image_url || "/placeholder.svg"}
                              alt={lesson.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className={`w-full h-full ${placeholderImage(index)} flex items-center justify-center`}
                            >
                              <span className="text-white text-opacity-75 text-lg font-semibold">
                                {lesson.name.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{lesson.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                            <Calendar size={14} />
                            <span>{formatDate(lesson.created_at)}</span>
                          </div>

                          <div className="flex gap-2">
                            <Link
                              href={`/live/${lesson.id}`}
                              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium text-center"
                            >
                              Go Live
                            </Link>
                            <button
                              onClick={() => handleShareLesson(lesson)}
                              className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                            >
                              <Share2 size={16} />
                            </button>
                            <Link
                              href={`/lesson-create?edit=${lesson.id}`}
                              className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium text-center"
                            >
                              Edit
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="mx-auto text-gray-300 mb-3" size={48} />
                    <p className="text-gray-500 mb-4">You haven't created any lessons yet</p>
                    <Link
                      href="/lesson-create"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus size={16} />
                      Create Your First Lesson
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Shared lessons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Users className="text-indigo-600" size={20} />
                  <h2 className="text-xl font-semibold text-gray-800">Shared Lessons</h2>
                </div>
                <button
                  onClick={() => setShowAddSharedModal(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                >
                  <Plus size={14} /> Add Shared Lesson
                </button>
              </div>

              <div className="p-6">
                {sharedLessons.length > 0 ? (
                  <div className="space-y-3">
                    {sharedLessons.map((sharedLesson, index) => (
                      <div
                        key={sharedLesson.id}
                        className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 ${
                            sharedLesson.lesson?.image_url ? "" : placeholderImage(index)
                          }`}
                        >
                          {sharedLesson.lesson?.image_url ? (
                            <img
                              src={sharedLesson.lesson.image_url || "/placeholder.svg"}
                              alt={sharedLesson.lesson.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-white text-opacity-75 text-sm font-semibold">
                                {sharedLesson.lesson?.name.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-800 truncate">{sharedLesson.lesson?.name}</h3>
                          <p className="text-sm text-gray-500">Added on {formatDate(sharedLesson.created_at)}</p>
                        </div>

                        <Link
                          href={`/lesson/${sharedLesson.lesson_id}`}
                          className="flex-shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          Start Lesson
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="mx-auto text-gray-300 mb-3" size={48} />
                    <p className="text-gray-500 mb-4">No shared lessons yet</p>
                    <button
                      onClick={() => setShowAddSharedModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download size={16} />
                      Add Shared Lesson
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Participation history */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <LineChart className="text-green-600" size={20} />
                  <h2 className="text-xl font-semibold text-gray-800">Your Learning History</h2>
                </div>
              </div>

              <div className="p-6">
                {participationHistory.length > 0 ? (
                  <div className="space-y-4">
                    {participationHistory.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="bg-blue-100 p-2 rounded-full">
                          <CheckCircle className="text-blue-600" size={20} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-800 truncate">{record.lesson?.name}</h3>
                          <p className="text-sm text-gray-500">Completed on {formatDate(record.created_at)}</p>
                        </div>

                        <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                          <Trophy size={16} className="text-green-600" />
                          <span className="font-medium text-green-700">{record.score} points</span>
                        </div>

                        <Link
                          href={`/lesson/${record.lesson?.id}`}
                          className="flex-shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          Try Again
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <LineChart className="mx-auto text-gray-300 mb-3" size={48} />
                    <p className="text-gray-500 mb-4">You haven't completed any lessons yet</p>
                    <Link
                      href="/live/join"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Play size={16} />
                      Join a Session
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Quick actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800">Quick Actions</h2>
              </div>

              <div className="p-6 space-y-3">
                <Link
                  href="/lesson-create"
                  className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                >
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Plus className="text-blue-600" size={18} />
                  </div>
                  <span className="font-medium text-gray-800">Create New Lesson</span>
                </Link>

                <Link
                  href="/live/join"
                  className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
                >
                  <div className="bg-green-100 p-2 rounded-full">
                    <Play className="text-green-600" size={18} />
                  </div>
                  <span className="font-medium text-gray-800">Join a Session</span>
                </Link>

                <button
                  onClick={() => setShowAddSharedModal(true)}
                  className="flex items-center gap-3 p-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors w-full text-left"
                >
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <Download className="text-indigo-600" size={18} />
                  </div>
                  <span className="font-medium text-gray-800">Add Shared Lesson</span>
                </button>

                <Link
                  href="/my-lessons"
                  className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
                >
                  <div className="bg-purple-100 p-2 rounded-full">
                    <BookOpen className="text-purple-600" size={18} />
                  </div>
                  <span className="font-medium text-gray-800">View My Lessons</span>
                </Link>
              </div>
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Award className="text-amber-500" size={20} />
                  <h2 className="text-xl font-semibold text-gray-800">Achievements</h2>
                </div>
                <div className="bg-amber-100 px-2 py-1 rounded-full text-xs font-medium text-amber-700">
                  {achievements.filter((a) => a.completed).length}/{achievements.length} Unlocked
                </div>
              </div>

              <div className="p-6 space-y-3">
                {achievements.map((achievement) => {
                  // Determine which icon to use based on the icon name
                  let IconComponent
                  switch (achievement.icon) {
                    case "BookOpen":
                      IconComponent = BookOpen
                      break
                    case "Star":
                      IconComponent = Star
                      break
                    case "Flame":
                      IconComponent = Flame
                      break
                    case "PlusCircle":
                      IconComponent = PlusCircle
                      break
                    case "Trophy":
                      IconComponent = Trophy
                      break
                    case "Share2":
                      IconComponent = Share2
                      break
                    case "Users":
                      IconComponent = Users
                      break
                    case "Zap":
                      IconComponent = Zap
                      break
                    default:
                      IconComponent = Award
                  }

                  return (
                    <div
                      key={achievement.id}
                      className={`flex items-center gap-3 p-3 rounded-xl ${
                        achievement.completed ? "bg-amber-50" : "bg-gray-50"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-full ${
                          achievement.completed ? "bg-amber-100 text-amber-600" : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        <IconComponent size={20} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-medium ${achievement.completed ? "text-gray-800" : "text-gray-500"}`}>
                          {achievement.name}
                        </h3>
                        <p className="text-sm text-gray-500">{achievement.description}</p>
                      </div>
                      {achievement.completed && (
                        <div className="bg-amber-100 p-1 rounded-full">
                          <CheckCircle className="text-amber-600" size={16} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* Popular lessons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Sparkles className="text-blue-600" size={20} />
                  <h2 className="text-xl font-semibold text-gray-800">Discover Lessons</h2>
                </div>
              </div>

              <div className="p-6 space-y-3">
                {popularLessons.length > 0 ? (
                  popularLessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <div
                        className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 ${
                          lesson.image_url ? "" : placeholderImage(index)
                        }`}
                      >
                        {lesson.image_url ? (
                          <img
                            src={lesson.image_url || "/placeholder.svg"}
                            alt={lesson.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-white text-opacity-75 text-sm font-semibold">
                              {lesson.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 truncate">{lesson.name}</h3>
                        <p className="text-sm text-gray-500 truncate">
                          {lesson.description || `Created on ${formatDate(lesson.created_at)}`}
                        </p>
                      </div>

                      <Link
                        href={`/lesson/${lesson.id}`}
                        className="flex-shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        Try
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No lessons to discover yet</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Daily tip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg overflow-hidden text-white p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <Lightbulb className="text-yellow-300" size={24} />
                <h2 className="text-xl font-semibold">Daily Tip</h2>
              </div>

              <p className="mb-4">
                Share your lessons with friends and colleagues! Click the share button on any lesson to get a shareable
                ID or link.
              </p>

              <Link
                href="/my-lessons"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
              >
                Share a lesson <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Achievement unlocked notification */}
      {recentlyUnlockedAchievement && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 right-6 bg-amber-500 text-white p-4 rounded-xl shadow-lg flex items-center gap-3 max-w-md"
        >
          <div className="bg-white bg-opacity-20 p-2 rounded-full">
            <Trophy size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Achievement Unlocked!</h3>
            <p>
              {recentlyUnlockedAchievement.name} - {recentlyUnlockedAchievement.description}
            </p>
          </div>
        </motion.div>
      )}

      {/* Share lesson modal */}
      {selectedLesson && (
        <ShareLessonModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false)
            setSelectedLesson(null)
          }}
          lessonId={selectedLesson.id}
          lessonName={selectedLesson.name}
        />
      )}

      {/* Add shared lesson modal */}
      <AddSharedLessonModal
        isOpen={showAddSharedModal}
        onClose={() => setShowAddSharedModal(false)}
        onSuccess={handleSharedLessonAdded}
      />
    </div>
  )
}

