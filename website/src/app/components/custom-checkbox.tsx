"use client"
import { motion } from "framer-motion"

export const CustomCheckbox = ({ checked, onChange, disabled = false }) => {
  return (
    <label className={`inline-flex items-center cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="sr-only" />
      <motion.span
        className="w-5 h-5 inline-block rounded flex items-center justify-center border"
        animate={{
          backgroundColor: checked ? "#2563eb" : "#ffffff",
          borderColor: checked ? "#2563eb" : "#D1D5DB",
        }}
        transition={{ duration: 0.1 }}
      >
        <motion.svg
          className="w-3 h-3"
          viewBox="0 0 24 24"
          fill="none"
          initial={{ scale: 0 }}
          animate={{ scale: checked ? 1 : 0 }}
          transition={{ duration: 0.1 }}
        >
          <path d="M20 6L9 17l-5-5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </motion.span>
    </label>
  )
}

