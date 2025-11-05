"use client"

import { motion } from "framer-motion"

export default function StaggerWords({
  children,
  speed = 1,
}: {
  children: string
  speed?: number
}) {
  const text = typeof children === "string" ? children : ""

  return (
    <>
      {text.split(" ").map((word, i) => (
        <motion.span
          initial={{ y: 10, opacity: 0 }}
          whileInView={{ y: 0, opacity: 100 }}
          transition={{
            duration: 0.25,
            delay: i / (10 * speed),
          }}
          key={i}
        >
          {`${word} `}
        </motion.span>
      ))}
    </>
  )
}
