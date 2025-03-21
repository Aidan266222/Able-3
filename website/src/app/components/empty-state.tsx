"use client"
import { motion } from "framer-motion"
import { FileQuestion, Plus } from "lucide-react"

export function EmptyState({ onAddQuestion }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
        <FileQuestion size={32} className="text-blue-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">No questions yet</h3>
      <p className="text-gray-500 max-w-md mb-8">
        Start building your lesson by adding questions. You can create multiple choice, true/false, or input answer
        questions.
      </p>
      <button
        onClick={onAddQuestion}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <Plus size={18} />
        Add Your First Question
      </button>
    </motion.div>
  )
}

