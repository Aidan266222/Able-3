"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Loader2 } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface AddSharedLessonModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddSharedLessonModal({ isOpen, onClose, onSuccess }: AddSharedLessonModalProps) {
  const [lessonId, setLessonId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [lessonPreview, setLessonPreview] = useState<any>(null)

  const handleLessonIdChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.value
    setLessonId(id)
    setError("")
    setLessonPreview(null)

    // If ID is valid UUID format, try to fetch lesson preview
    if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        const { data, error } = await supabase
          .from("lessons")
          .select("id, name, description, image_url, user_id")
          .eq("id", id)
          .single()

        if (error) return

        // Check if user owns this lesson
        if (data.user_id === user.id) {
          setError("You cannot add your own lesson to shared lessons")
          return
        }

        setLessonPreview(data)
      } catch (err) {
        console.error("Error fetching lesson preview:", err)
      }
    }
  }

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!lessonId.trim()) {
      setError("Please enter a lesson ID")
      return
    }

    try {
      setLoading(true)
      setError("")

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("You must be logged in to add shared lessons")
      }

      // Check if lesson exists
      const { data: lessonData, error: lessonError } = await supabase
        .from("lessons")
        .select("id, user_id")
        .eq("id", lessonId)
        .single()

      if (lessonError) {
        throw new Error("Lesson not found. Please check the ID and try again.")
      }

      // Check if user owns this lesson
      if (lessonData.user_id === user.id) {
        throw new Error("You cannot add your own lesson to shared lessons")
      }

      // Check if lesson is already in user's shared lessons
      const { data: existingShare, error: shareCheckError } = await supabase
        .from("shared_lessons")
        .select("id")
        .eq("lesson_id", lessonId)
        .eq("shared_with", user.id)
        .single()

      if (existingShare) {
        throw new Error("This lesson is already in your shared lessons")
      }

      // Add to shared lessons
      const { error: addError } = await supabase.from("shared_lessons").insert({
        lesson_id: lessonId,
        shared_by: lessonData.user_id,
        shared_with: user.id,
      })

      if (addError) throw addError

      // Success
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to add shared lesson")
      console.error("Add shared lesson error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Add Shared Lesson</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-600 mb-6">Enter a lesson ID that was shared with you</p>

            <form onSubmit={handleAddLesson}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lesson ID</label>
                  <input
                    type="text"
                    value={lessonId}
                    onChange={handleLessonIdChange}
                    placeholder="Enter lesson ID"
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                {lessonPreview && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h3 className="font-medium text-gray-800 mb-1">{lessonPreview.name}</h3>
                    {lessonPreview.description && (
                      <p className="text-sm text-gray-600 mb-2">{lessonPreview.description}</p>
                    )}
                    <div className="text-xs text-blue-600">
                      Lesson found! Click Add to add it to your shared lessons.
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-red-600 text-sm">{error}</div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !!error}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Add Lesson
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

