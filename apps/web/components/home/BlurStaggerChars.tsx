"use client"

import { motion } from "framer-motion"

export default function BlurStaggerChars({
  children,
  speed = 1,
  delay = 0,
}: {
  children: string
  speed?: number
  delay?: number
}) {
  const text = typeof children === "string" ? children : ""

  return (
    <>
      {text.split("").map((char, i) => (
        <motion.span
          initial={{ y: 10, opacity: 0, filter: "blur(10px)" }}
          whileInView={{ y: 0, opacity: 100, filter: "blur(0px)" }}
          transition={{
            duration: 0.25,
            delay: i / (10 * speed) + delay,
          }}
          key={i}
        >
          {char}
        </motion.span>
      ))}
    </>
  )
}
