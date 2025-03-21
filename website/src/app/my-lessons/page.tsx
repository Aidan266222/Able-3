"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { motion } from "framer-motion"
import {
  PlusCircle,
  Edit,
  Trash2,
  Play,
  BookOpen,
  Calendar,
  AlignLeft,
  Search,
  Filter,
  Clock,
  LayoutGrid,
  List,
  ChevronDown,
  Loader2,
  Users,
  Plus,
} from "lucide-react"

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

interface SharedLesson {
  id: string
  lesson_id: string
  shared_by: string
  shared_with: string
  created_at: string
  lesson?: {
    id: string
    name: string
    description?: string
    image_url?: string
    user_id: string
    created_at: string
  }
}

export default function MyLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [deleteInProgress, setDeleteInProgress] = useState<string | null>(null)
  const [sharedLessons, setSharedLessons] = useState<SharedLesson[]>([])
  const [showAddSharedModal, setShowAddSharedModal] = useState(false)
  const [activeTab, setActiveTab] = useState<"my" | "shared">("my")
  const router = useRouter()

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setLoading(true)
        setError(null)

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          throw new Error("Authentication required")
        }

        // Fetch user's lessons
        const { data, error: fetchError } = await supabase
          .from("lessons")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (fetchError) throw fetchError
        setLessons(data || [])
        setFilteredLessons(data || [])

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
      } catch (err: any) {
        setError(err.message || "Failed to load lessons")
      } finally {
        setLoading(false)
      }
    }

    fetchLessons()
  }, [])

  useEffect(() => {
    // Filter lessons when search query changes
    if (searchQuery.trim() === "") {
      setFilteredLessons(lessons)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredLessons(
        lessons.filter(
          (lesson) =>
            lesson.name.toLowerCase().includes(query) ||
            (lesson.description && lesson.description.toLowerCase().includes(query)),
        ),
      )
    }
  }, [searchQuery, lessons])

  const handleCreateLesson = () => router.push("/lesson-create")

  const handleEditLesson = (id: string) => {
    router.push(`/lesson-create?edit=${id}`)
  }

  const handleDeleteLesson = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return

    try {
      setDeleteInProgress(id)
      const { error } = await supabase.from("lessons").delete().eq("id", id)

      if (error) throw error
      setLessons((prev) => prev.filter((l) => l.id !== id))
      setFilteredLessons((prev) => prev.filter((l) => l.id !== id))
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`)
      console.error("Delete error:", err)
    } finally {
      setDeleteInProgress(null)
    }
  }

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

  const getFilteredSharedLessons = () => {
    if (searchQuery.trim() === "") {
      return sharedLessons
    } else {
      const query = searchQuery.toLowerCase()
      return sharedLessons.filter(
        (sharedLesson) =>
          sharedLesson.lesson?.name.toLowerCase().includes(query) ||
          (sharedLesson.lesson?.description && sharedLesson.lesson.description.toLowerCase().includes(query)),
      )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-blue-800 font-medium">Loading your lessons...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Error Loading Lessons</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-6 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Lessons</h1>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreateLesson}
            className="button-primary gap-2"
          >
            <PlusCircle size={18} />
            <span>Create New Lesson</span>
          </motion.button>
        </div>

        {/* Filters, tabs and search */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab("my")}
                className={`px-6 py-4 font-medium text-sm ${
                  activeTab === "my"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                My Lessons
              </button>
              <button
                onClick={() => setActiveTab("shared")}
                className={`px-6 py-4 font-medium text-sm ${
                  activeTab === "shared"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Shared With Me
                {sharedLessons.length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                    {sharedLessons.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search lessons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="border-l pl-3 hidden sm:block h-10"></div>

                <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Filter size={18} className="text-gray-500" />
                  <span className="text-gray-700">Filter</span>
                  <ChevronDown size={16} className="text-gray-500" />
                </button>

                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    className={`p-2.5 ${viewMode === "grid" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    className={`p-2.5 ${viewMode === "list" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}
                    onClick={() => setViewMode("list")}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {activeTab === "my" ? (
          <>
            {/* Empty state for My Lessons */}
            {filteredLessons.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-xl shadow-sm p-12 text-center"
              >
                <div className="mb-6 bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                  <BookOpen size={32} className="text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">No lessons found</h2>
                <p className="text-gray-500 max-w-md mx-auto mb-8">
                  {searchQuery
                    ? "No lessons match your search criteria. Try a different search term or clear the filter."
                    : "You haven't created any lessons yet. Get started by creating your first lesson."}
                </p>
                {!searchQuery && (
                  <button
                    onClick={handleCreateLesson}
                    className="button-primary gap-2"
                  >
                    <PlusCircle size={18} />
                    Create Your First Lesson
                  </button>
                )}
              </motion.div>
            )}

            {/* Grid View for My Lessons */}
            {viewMode === "grid" && filteredLessons.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredLessons.map((lesson, index) => (
                  // Keep the original lesson grid item code
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all relative group"
                  >
                    {/* Lesson Image or Placeholder */}
                    <div className="h-36 overflow-hidden relative">
                      {lesson.image_url ? (
                        <img
                          src={lesson.image_url || "/placeholder.svg"}
                          alt={lesson.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full ${placeholderImage(index)} flex items-center justify-center`}>
                          <span className="text-white text-opacity-75 text-lg font-semibold">
                            {lesson.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Quick action overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditLesson(lesson.id)}
                          className="p-2 bg-white rounded-full text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => router.push(`/live/${lesson.id}`)}
                          className="p-2 bg-white rounded-full text-green-600 hover:bg-green-50 transition-colors"
                        >
                          <Play size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(lesson.id)}
                          disabled={deleteInProgress === lesson.id}
                          className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors"
                        >
                          {deleteInProgress === lesson.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Lesson Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-gray-800 mb-1 line-clamp-2">{lesson.name}</h3>

                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <Calendar size={14} />
                        <span>{formatDate(lesson.created_at)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="py-1 px-2 rounded bg-blue-50 text-blue-700">
                          {lesson.questions?.length || 0} questions
                        </div>
                        {lesson.description && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <AlignLeft size={14} />
                            <span>Has description</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-gray-100 p-4 flex gap-2">
                      <button
                        onClick={() => router.push(`/live/${lesson.id}`)}
                        className="button-primary"
                      >
                        Go Live
                      </button>
                      <button
                        onClick={() => router.push(`/lesson/${lesson.id}`)}
                        className="button-secondary"
                      >
                        Solo Mode
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* List View for My Lessons */}
            {viewMode === "list" && filteredLessons.length > 0 && (
              <div className="space-y-4">
                {filteredLessons.map((lesson, index) => (
                  // Keep the original lesson list item code
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all"
                  >
                    <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4">
                      {/* Image/Icon */}
                      <div className="w-full sm:w-16 h-16 rounded overflow-hidden flex-shrink-0">
                        {lesson.image_url ? (
                          <img
                            src={lesson.image_url || "/placeholder.svg"}
                            alt={lesson.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full ${placeholderImage(index)} flex items-center justify-center`}>
                            <span className="text-white text-opacity-75 text-lg font-semibold">
                              {lesson.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-800 mb-1">{lesson.name}</h3>
                        {lesson.description && (
                          <p className="text-gray-500 text-sm mb-2 line-clamp-1">{lesson.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Clock size={14} />
                            <span>{formatDate(lesson.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-blue-600">
                            <BookOpen size={14} />
                            <span>{lesson.questions?.length || 0} questions</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col justify-end gap-2">
                        <button
                          onClick={() => router.push(`/live/${lesson.id}`)}
                          className="button-primary gap-2"
                        >
                          <Play size={14} />
                          Go Live
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditLesson(lesson.id)}
                            className="p-2 border border-gray-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            disabled={deleteInProgress === lesson.id}
                            className="p-2 border border-gray-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          >
                            {deleteInProgress === lesson.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Shared Lessons Tab Content */}
            {/* Empty state for Shared Lessons */}
            {getFilteredSharedLessons().length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-xl shadow-sm p-12 text-center"
              >
                <div className="mb-6 bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                  <Users size={32} className="text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">No shared lessons found</h2>
                <p className="text-gray-500 max-w-md mx-auto mb-8">
                  {searchQuery
                    ? "No shared lessons match your search criteria. Try a different search term or clear the filter."
                    : "No lessons have been shared with you yet. If you have an invite, use it at the home page in the shared lessons category!"}
                </p>
              </motion.div>
            )}

            {/* Grid View for Shared Lessons */}
            {viewMode === "grid" && getFilteredSharedLessons().length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {getFilteredSharedLessons().map((sharedLesson, index) => (
                  <motion.div
                    key={sharedLesson.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all relative group"
                  >
                    {/* Lesson Image or Placeholder */}
                    <div className="h-36 overflow-hidden relative">
                      {sharedLesson.lesson?.image_url ? (
                        <img
                          src={sharedLesson.lesson.image_url || "/placeholder.svg"}
                          alt={sharedLesson.lesson?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full ${placeholderImage(index)} flex items-center justify-center`}>
                          <span className="text-white text-opacity-75 text-lg font-semibold">
                            {sharedLesson.lesson?.name?.substring(0, 2).toUpperCase() || "SH"}
                          </span>
                        </div>
                      )}

                      {/* "Shared" badge */}
                      <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs font-medium px-2 py-1 rounded-md">
                        Shared
                      </div>
                    </div>

                    {/* Lesson Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-gray-800 mb-1 line-clamp-2">
                        {sharedLesson.lesson?.name || "Untitled Lesson"}
                      </h3>

                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <Calendar size={14} />
                        <span>Shared on {formatDate(sharedLesson.created_at)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {sharedLesson.lesson?.description && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <AlignLeft size={14} />
                            <span>Has description</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-gray-100 p-4 flex gap-2">
                      <button
                        onClick={() => router.push(`/lesson/${sharedLesson.lesson_id}`)}
                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        Start Lesson
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* List View for Shared Lessons */}
            {viewMode === "list" && getFilteredSharedLessons().length > 0 && (
              <div className="space-y-4">
                {getFilteredSharedLessons().map((sharedLesson, index) => (
                  <motion.div
                    key={sharedLesson.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all"
                  >
                    <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4">
                      {/* Image/Icon */}
                      <div className="w-full sm:w-16 h-16 rounded overflow-hidden flex-shrink-0 relative">
                        {sharedLesson.lesson?.image_url ? (
                          <img
                            src={sharedLesson.lesson.image_url || "/placeholder.svg"}
                            alt={sharedLesson.lesson?.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full ${placeholderImage(index)} flex items-center justify-center`}>
                            <span className="text-white text-opacity-75 text-lg font-semibold">
                              {sharedLesson.lesson?.name?.substring(0, 2).toUpperCase() || "SH"}
                            </span>
                          </div>
                        )}

                        {/* "Shared" badge */}
                        <div className="absolute top-0 left-0 bg-purple-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-br-md">
                          Shared
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-800 mb-1">
                          {sharedLesson.lesson?.name || "Untitled Lesson"}
                        </h3>
                        {sharedLesson.lesson?.description && (
                          <p className="text-gray-500 text-sm mb-2 line-clamp-1">{sharedLesson.lesson.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Clock size={14} />
                            <span>Shared on {formatDate(sharedLesson.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col justify-end gap-2">
                        <button
                          onClick={() => router.push(`/lesson/${sharedLesson.lesson_id}`)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <Play size={14} />
                          Start Lesson
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

