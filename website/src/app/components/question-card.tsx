"use client"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Trash2, Copy, Edit3, CheckSquare, ToggleLeft, Type } from "lucide-react"

export function QuestionCard({ question, index, onEdit, onDuplicate, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getQuestionTypeIcon = () => {
    switch (question.type) {
      case "Multiple Choice":
        return <CheckSquare size={16} className="text-blue-500" />
      case "True/False":
        return <ToggleLeft size={16} className="text-green-500" />
      case "Input Answer":
        return <Type size={16} className="text-purple-500" />
      default:
        return <CheckSquare size={16} className="text-blue-500" />
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all ${
        isDragging ? "shadow-lg" : "shadow-sm hover:shadow"
      }`}
    >
      <div className="flex items-center p-4">
        <div
          {...attributes}
          {...listeners}
          className="mr-3 cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
        >
          <GripVertical size={18} className="text-gray-400" />
        </div>

        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium mr-3">
          {index}
        </div>

        <div className="flex-1">
          <h3 className="font-medium text-gray-800 line-clamp-1">{question.text}</h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            {getQuestionTypeIcon()}
            <span>{question.type}</span>
            <span className="text-gray-300">•</span>
            <span>
              {question.answers.length} option{question.answers.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Edit question"
          >
            <Edit3 size={18} />
          </button>
          <button
            onClick={onDuplicate}
            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
            title="Duplicate question"
          >
            <Copy size={18} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Delete question"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

