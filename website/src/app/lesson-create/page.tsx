"use client"

import { useState, useRef, useEffect } from "react"
import { DndContext, closestCenter, DragOverlay } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import {
  ImageIcon,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Edit3,
  FileText,
  AlignLeft,
  CheckSquare,
  Type,
  ToggleLeft,
} from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { motion } from "framer-motion"
import QuestionModal from "../components/question-modal"
import { QuestionCard } from "../components/question-card"
import { EmptyState } from "../components/empty-state"
import { useSearchParams } from "next/navigation"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function LessonCreatePage() {
  const [step, setStep] = useState(1)
  const [lessonName, setLessonName] = useState("")
  const [lessonDescription, setLessonDescription] = useState("")
  const [lessonImage, setLessonImage] = useState<File | null>(null)
  const [lessonImagePreview, setLessonImagePreview] = useState<string | null>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [currentEditingQuestion, setCurrentEditingQuestion] = useState<any>(null)
  const [activeId, setActiveId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  const [isEditMode, setIsEditMode] = useState(false)

  // Add this useEffect right before the handleDragStart function
  useEffect(() => {
    const loadExistingLesson = async () => {
      if (editId) {
        try {
          const { data: lessonData, error } = await supabase.from("lessons").select("*").eq("id", editId).single()

          if (error) throw error

          if (lessonData) {
            setIsEditMode(true)
            setLessonName(lessonData.name || "")
            setLessonDescription(lessonData.description || "")

            if (lessonData.image_url) {
              setLessonImagePreview(lessonData.image_url)
            }

            if (lessonData.questions && lessonData.questions.length > 0) {
              // Add ID to each question if not present
              const questionsWithIds = lessonData.questions.map((q, index) => ({
                ...q,
                id: q.id || Date.now() + index,
                answers: q.answers.map((a, idx) => ({
                  ...a,
                  id: a.id || Date.now() + idx,
                })),
              }))
              setQuestions(questionsWithIds)
            }
          }
        } catch (err) {
          console.error("Error loading lesson:", err)
        }
      }
    }

    loadExistingLesson()
  }, [editId])

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    setActiveId(null)

    if (active.id !== over?.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const openNewQuestionModal = () => {
    setCurrentEditingQuestion(null)
    setShowQuestionModal(true)
  }

  const openEditQuestionModal = (question: any) => {
    setCurrentEditingQuestion(question)
    setShowQuestionModal(true)
  }

  const handleSaveQuestion = (question: any) => {
    setQuestions((prev) => {
      const index = prev.findIndex((q) => q.id === question.id)
      if (index !== -1) {
        const newArr = [...prev]
        newArr[index] = question
        return newArr
      } else {
        return [...prev, question]
      }
    })
    setShowQuestionModal(false)
    setCurrentEditingQuestion(null)
  }

  const handleDuplicateQuestion = (question: any) => {
    const duplicated = {
      ...question,
      id: Date.now(),
      answers: question.answers.map((a: any) => ({
        ...a,
        id: Date.now() + Math.random(),
      })),
    }
    setQuestions([...questions, duplicated])
  }

  const handleDeleteQuestion = (id: number) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const handleSubmitLesson = async () => {
    try {
      if (!lessonName.trim()) {
        throw new Error("Please enter a lesson name")
      }

      if (questions.length === 0) {
        throw new Error("Please add at least one question")
      }

      setIsSaving(true)

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error("Authentication required")
      }

      // Upload image if exists
      let imageUrl = null
      if (lessonImage) {
        const fileExt = lessonImage.name.split(".").pop()
        const fileName = `${Math.random()}.${fileExt}`
        const { error: uploadError, data } = await supabase.storage.from("lesson-images").upload(fileName, lessonImage)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("lesson-images").getPublicUrl(fileName)

        imageUrl = publicUrl
      }

      const lessonData = {
        name: lessonName,
        description: lessonDescription,
        questions: questions.map((q) => ({
          text: q.text,
          type: q.type,
          answers: q.answers,
        })),
        user_id: user.id,
      }

      if (imageUrl) {
        lessonData.image_url = imageUrl
      } else if (lessonImagePreview && !lessonImage) {
        // Keep existing image if we have a preview but no new upload
        lessonData.image_url = lessonImagePreview
      }

      let error

      if (isEditMode && editId) {
        // Update existing lesson
        const { error: updateError } = await supabase.from("lessons").update(lessonData).eq("id", editId)

        error = updateError
      } else {
        // Create new lesson
        const { error: insertError } = await supabase.from("lessons").insert([lessonData])

        error = insertError
      }

      if (error) throw error

      setSaveSuccess(true)
      setTimeout(() => {
        window.location.href = "/my-lessons"
      }, 1500)
    } catch (err: any) {
      alert(err.message || "Failed to save lesson")
      console.error("Submission error:", err)
      setIsSaving(false)
    }
  }

  // Step 1: Lesson Setup
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="p-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Create New Lesson</h1>
              <p className="text-gray-500 mb-8">Start by adding basic information about your lesson</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Name</label>
                  <input
                    type="text"
                    value={lessonName}
                    onChange={(e) => setLessonName(e.target.value)}
                    className="w-full"
                    placeholder="e.g., Introduction to Photosynthesis"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                  <textarea
                    value={lessonDescription}
                    onChange={(e) => setLessonDescription(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Briefly describe what students will learn"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image (optional)</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`h-48 rounded-lg cursor-pointer transition-all flex items-center justify-center overflow-hidden ${
                      lessonImagePreview
                        ? "border-0"
                        : "border-2 border-dashed border-gray-300 hover:border-blue-400 bg-gray-50"
                    }`}
                  >
                    {lessonImagePreview ? (
                      <div className="relative w-full h-full group">
                        <img
                          src={lessonImagePreview || "/placeholder.svg"}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-all">
                            <Edit3 className="text-white" size={24} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        <ImageIcon className="mx-auto mb-2" size={32} />
                        <p>Click to upload image</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setLessonImage(e.target.files[0])
                        setLessonImagePreview(URL.createObjectURL(e.target.files[0]))
                      }
                    }}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
              </div>
            </div>

            <div className="px-8 py-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => {
                  if (!lessonName.trim()) {
                    alert("Please enter a lesson name")
                    return
                  }
                  setStep(2)
                }}
                className="button-primary gap-2"
              >
                Continue to Questions <ArrowLeft className="rotate-180" size={16} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Step 2: Question Builder
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button onClick={() => setStep(1)} className="mr-4 text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-3">
                {lessonImagePreview && (
                  <div className="w-8 h-8 rounded overflow-hidden">
                    <img
                      src={lessonImagePreview || "/placeholder.svg"}
                      alt="Lesson"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <input
                  type="text"
                  value={lessonName}
                  onChange={(e) => setLessonName(e.target.value)}
                  className=""
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {saveSuccess ? (
                <div className="flex items-center text-green-600 gap-1.5">
                  <CheckCircle2 size={18} />
                  <span>Saved successfully!</span>
                </div>
              ) : (
                <button
                  onClick={handleSubmitLesson}
                  disabled={isSaving}
                  className={`px-5 py-2 ml-10 button-primary ${
                    isSaving
                      ? ""
                      : ""
                  }`}
                >
                  {isSaving ? "Saving..." : "Publish Lesson"}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={openNewQuestionModal}
              className="w-full button-primary gap-2"
            >
              <Plus size={18} />
              Add Question
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Question Types</h3>
              <button
                onClick={() => {
                  setCurrentEditingQuestion({ type: "Multiple Choice" })
                  setShowQuestionModal(true)
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 flex items-center gap-2 text-gray-700"
              >
                <CheckSquare size={16} className="text-blue-500" />
                Multiple Choice
              </button>
              <button
                onClick={() => {
                  setCurrentEditingQuestion({ type: "True/False" })
                  setShowQuestionModal(true)
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 flex items-center gap-2 text-gray-700"
              >
                <ToggleLeft size={16} className="text-green-500" />
                True/False
              </button>
              <button
                onClick={() => {
                  setCurrentEditingQuestion({ type: "Input Answer" })
                  setShowQuestionModal(true)
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 flex items-center gap-2 text-gray-700"
              >
                <Type size={16} className="text-purple-500" />
                Input Answer
              </button>
            </div>

            <div className="mt-8">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Lesson Info</div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                <div className="flex items-start gap-2 mb-2">
                  <FileText size={14} className="mt-0.5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-700">Questions</p>
                    <p>{questions.length} total</p>
                  </div>
                </div>
                {lessonDescription && (
                  <div className="flex items-start gap-2">
                    <AlignLeft size={14} className="mt-0.5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-700">Description</p>
                      <p className="line-clamp-2">{lessonDescription}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-auto p-6">
          <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="max-w-3xl mx-auto">
              {questions.length > 0 ? (
                <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        index={index + 1}
                        onEdit={() => openEditQuestionModal(question)}
                        onDuplicate={() => handleDuplicateQuestion(question)}
                        onDelete={() => handleDeleteQuestion(question.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              ) : (
                <EmptyState onAddQuestion={openNewQuestionModal} />
              )}

              <DragOverlay>
                {activeId ? (
                  <div className="bg-white border border-blue-500 shadow-lg rounded-lg p-4 opacity-80 w-full max-w-3xl">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                        {questions.findIndex((q) => q.id === activeId) + 1}
                      </div>
                      <div className="font-medium">{questions.find((q) => q.id === activeId)?.text}</div>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </div>
          </DndContext>

          {questions.length > 0 && (
            <div className="max-w-3xl mx-auto mt-6 flex justify-center">
              <button
                onClick={openNewQuestionModal}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors py-2 px-4"
              >
                <Plus size={18} />
                Add Another Question
              </button>
            </div>
          )}
        </div>
      </div>

      <QuestionModal
        show={showQuestionModal}
        onClose={() => {
          setShowQuestionModal(false)
          setCurrentEditingQuestion(null)
        }}
        onSave={handleSaveQuestion}
        initialData={currentEditingQuestion}
      />
    </div>
  )
}

