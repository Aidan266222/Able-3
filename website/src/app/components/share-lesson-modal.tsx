"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, X, Share2, Check } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface ShareLessonModalProps {
  isOpen: boolean
  onClose: () => void
  lessonId: string
  lessonName: string
}

export default function ShareLessonModal({ isOpen, onClose, lessonId, lessonName }: ShareLessonModalProps) {
  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/shared-lesson/${lessonId}` : `/shared-lesson/${lessonId}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareViaEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      setError("Please enter an email address")
      return
    }

    try {
      setSending(true)
      setError("")

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("You must be logged in to share lessons")
      }

      // Check if user with this email exists
      const { data: userData, error: userError } = await supabase.from("users").select("id").eq("email", email).single()

      if (userError) {
        // User doesn't exist, we'll just record the share attempt
        // In a real app, you might send an invitation email
        console.log("User not found, would send invitation email")
      }

      // Record the share in the database
      const { error: shareError } = await supabase.from("shared_lessons").insert({
        lesson_id: lessonId,
        shared_by: user.id,
        shared_with: userData?.id || email,
        is_email_share: !userData?.id,
      })

      if (shareError) throw shareError

      setSent(true)
      setTimeout(() => {
        setSent(false)
        setEmail("")
      }, 3000)
    } catch (err: any) {
      setError(err.message || "Failed to share lesson")
      console.error("Share error:", err)
    } finally {
      setSending(false)
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
              <h2 className="text-xl font-bold text-gray-800">Share Lesson</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-600 mb-6">Share "{lessonName}" with others</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lesson ID</label>
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-100 p-3 rounded-l-lg border border-gray-300 font-mono text-sm">
                    {lessonId}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(lessonId)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    className="p-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Others can add this lesson using this ID</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Share Link</label>
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-100 p-3 rounded-l-lg border border-gray-300 truncate text-sm">
                    {shareUrl}
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="p-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <form onSubmit={shareViaEmail}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Share via Email</label>
                  <div className="flex items-center">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="flex-1 p-3 rounded-l-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="submit"
                      disabled={sending || sent}
                      className={`p-3 rounded-r-lg transition-colors flex items-center justify-center min-w-[48px] ${
                        sent ? "bg-green-500 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {sending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : sent ? (
                        <Check size={18} />
                      ) : (
                        <Share2 size={18} />
                      )}
                    </button>
                  </div>
                  {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                  {sent && <p className="text-green-500 text-sm mt-1">Shared successfully!</p>}
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

