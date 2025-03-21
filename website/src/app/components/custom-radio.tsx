"use client"
import { motion } from "framer-motion"

export const CustomRadio = ({ checked, onChange }) => {
  return (
    <label className="inline-flex items-center cursor-pointer">
      <input type="radio" checked={checked} onChange={onChange} className="sr-only" />
      <motion.span
        className="w-5 h-5 inline-block rounded-full flex items-center justify-center border"
        animate={{
          borderWidth: checked ? 5 : 1,
          borderColor: checked ? "#2563eb" : "#D1D5DB",
        }}
        transition={{ duration: 0.1 }}
      ></motion.span>
    </label>
  )
}

