"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2, Plus, X, HelpCircle } from "lucide-react"
import { CustomCheckbox } from "./custom-checkbox"
import { CustomRadio } from "./custom-radio"
import { CustomDropdown } from "./custom-dropdown"

const QuestionModal = ({ show, onClose, onSave, initialData }) => {
  const [questionText, setQuestionText] = useState(initialData ? initialData.text || "" : "")
  const [questionType, setQuestionType] = useState(
    initialData ? initialData.type || "Multiple Choice" : "Multiple Choice",
  )
  const [answers, setAnswers] = useState(
    initialData && initialData.answers && initialData.answers.length >= 2
      ? initialData.answers
      : [
          { id: Date.now(), text: "", isCorrect: false },
          { id: Date.now() + 1, text: "", isCorrect: false },
        ],
  )
  const [error, setError] = useState("")

  // Clear out and reinitialize answers whenever questionType changes
  useEffect(() => {
    if (questionType === "True/False") {
      setAnswers([
        { id: 1, text: "True", isCorrect: false },
        { id: 2, text: "False", isCorrect: false },
      ])
    } else if (questionType === "Input Answer") {
      setAnswers([{ id: Date.now(), text: "", isCorrect: true }])
    } else if (questionType === "Multiple Choice" && (!initialData || initialData.type !== questionType)) {
      setAnswers([
        { id: Date.now(), text: "", isCorrect: false },
        { id: Date.now() + 1, text: "", isCorrect: false },
      ])
    }
  }, [questionType, initialData])

  useEffect(() => {
    if (show) {
      setQuestionText(initialData ? initialData.text || "" : "")
      setQuestionType(initialData ? initialData.type || "Multiple Choice" : "Multiple Choice")

      if (initialData && initialData.answers && initialData.answers.length >= 1) {
        setAnswers(initialData.answers)
      } else if (initialData && initialData.type) {
        // Initialize based on type if we have a type but no answers
        if (initialData.type === "True/False") {
          setAnswers([
            { id: 1, text: "True", isCorrect: false },
            { id: 2, text: "False", isCorrect: false },
          ])
        } else if (initialData.type === "Input Answer") {
          setAnswers([{ id: Date.now(), text: "", isCorrect: true }])
        } else {
          setAnswers([
            { id: Date.now(), text: "", isCorrect: false },
            { id: Date.now() + 1, text: "", isCorrect: false },
          ])
        }
      } else {
        setAnswers([
          { id: Date.now(), text: "", isCorrect: false },
          { id: Date.now() + 1, text: "", isCorrect: false },
        ])
      }

      setError("")
    }
  }, [initialData, show])

  // Functions for Multiple Choice
  const addAnswer = () => {
    if (answers.length < 6) {
      setAnswers([...answers, { id: Date.now() + Math.random(), text: "", isCorrect: false }])
    }
  }

  const updateAnswer = (id, field, value) => {
    setAnswers(answers.map((ans) => (ans.id === id ? { ...ans, [field]: value } : ans)))
  }

  const deleteAnswer = (id) => {
    if (answers.length > 2) {
      setAnswers(answers.filter((ans) => ans.id !== id))
    }
  }

  // For True/False: use custom radio buttons to set one as correct
  const handleTFChange = (value) => {
    if (value === "True") {
      setAnswers([
        { id: 1, text: "True", isCorrect: true },
        { id: 2, text: "False", isCorrect: false },
      ])
    } else {
      setAnswers([
        { id: 1, text: "True", isCorrect: false },
        { id: 2, text: "False", isCorrect: true },
      ])
    }
  }

  // For Input Answer: update the single answer text
  const handleInputAnswerChange = (value) => {
    setAnswers([{ id: Date.now(), text: value, isCorrect: true }])
  }

  const handleSave = () => {
    // Reset error
    setError("")

    if (!questionText.trim()) {
      setError("Please enter a question")
      return
    }

    // Prevent blank answer texts for Multiple Choice
    if (questionType === "Multiple Choice") {
      if (answers.some((a) => a.text.trim() === "")) {
        setError("Please fill in all answer options")
        return
      }

      // For Multiple Choice, ensure at least one correct answer is set
      if (!answers.some((a) => a.isCorrect)) {
        setError("Please mark at least one correct answer")
        return
      }
    }

    // Prevent blank input answer text
    if (questionType === "Input Answer") {
      if (answers[0].text.trim() === "") {
        setError("Please enter a valid answer")
        return
      }
    }

    // For True/False, ensure one option is selected
    if (questionType === "True/False" && !answers.some((a) => a.isCorrect)) {
      setError("Please select either True or False as the correct answer")
      return
    }

    const newQuestion = {
      id: initialData ? initialData.id || Date.now() : Date.now(),
      text: questionText,
      type: questionType,
      answers: answers,
    }

    onSave(newQuestion)
  }

  // Count the number of correct answers (for Multiple Choice)
  const correctCount = answers.filter((a) => a.isCorrect).length

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Background overlay */}
          <motion.div
            className="absolute inset-0 bg-black opacity-50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          ></motion.div>

          <motion.div
            className="bg-white rounded-xl shadow-xl p-6 z-50 w-full max-w-lg relative"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold mb-6">
              {initialData && initialData.text ? "Edit Question" : "New Question"}
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                <input
                  type="text"
                  placeholder="Enter your question"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                <CustomDropdown
                  options={["Multiple Choice", "True/False", "Input Answer"]}
                  selected={questionType}
                  onChange={(val) => setQuestionType(val)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {questionType === "Input Answer" ? "Correct Answer" : "Answer Options"}
                  </label>

                  {questionType === "Multiple Choice" && answers.length < 6 && (
                    <button
                      onClick={addAnswer}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Option
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {questionType === "Multiple Choice" && (
                    <>
                      {answers.map((answer, index) => (
                        <div key={answer.id} className="flex items-center gap-3">
                          <CustomCheckbox
                            checked={answer.isCorrect}
                            disabled={answer.isCorrect && correctCount === 1}
                            onChange={(e) => updateAnswer(answer.id, "isCorrect", e.target.checked)}
                          />
                          <input
                            type="text"
                            placeholder={`Option ${index + 1}`}
                            value={answer.text}
                            onChange={(e) => updateAnswer(answer.id, "text", e.target.value)}
                            className={`flex-1 ${
                              answer.isCorrect ? "outline-blue-400 bg-blue-50" : "outline-gray-300"
                            }`}
                          />
                          {answers.length > 2 && (
                            <button
                              onClick={() => deleteAnswer(answer.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </>
                  )}

                  {questionType === "True/False" && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center gap-3">
                        <CustomRadio checked={answers[0]?.isCorrect} onChange={() => handleTFChange("True")} />
                        <span className="text-gray-700">True</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CustomRadio checked={answers[1]?.isCorrect} onChange={() => handleTFChange("False")} />
                        <span className="text-gray-700">False</span>
                      </div>
                    </div>
                  )}

                  {questionType === "Input Answer" && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <input
                        type="text"
                        placeholder="Enter the correct answer"
                        value={answers[0]?.text || ""}
                        onChange={(e) => handleInputAnswerChange(e.target.value)}
                        className="w-full"
                      />
                      <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                        <HelpCircle size={12} />
                        Students must type this exact answer to be correct
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Question
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default QuestionModal

