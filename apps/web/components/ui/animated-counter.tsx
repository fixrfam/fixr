"use client"

/**
 * An odometer style counter, after RareUI's AnimatedCounter
 * (https://www.rareui.com/components/animatedcounter).
 *
 * Each digit is a wheel of eleven faces, the ten digits plus a repeat of zero,
 * so the wrap from nine back to zero lands on an identical face instead of
 * spinning the long way round. The roll is direction aware: a value going up
 * rolls its wheels up, a value coming down rolls them down. Places that appear
 * as the number grows roll in from zero, places that disappear fade out.
 */

import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react"
import { type ReactNode, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

const FACES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
/** Each face sits in a box taller than the glyph so the fade never touches a resting digit. */
const FACE_EM = 1.5
const BOUNCE = 0.18
/** A column on its way out goes quickly and does not spring. */
const LEAVE_SECONDS = 0.18
const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const

/** Eased stops: a linear fade of the same width reads as a hard edge. */
const WHEEL_FADE =
  "linear-gradient(to bottom, transparent 0%, rgb(0 0 0 / 0.06) 5.5%, rgb(0 0 0 / 0.5) 11%, rgb(0 0 0 / 0.94) 16.5%, #000 22%, #000 78%, rgb(0 0 0 / 0.94) 83.5%, rgb(0 0 0 / 0.5) 89%, rgb(0 0 0 / 0.06) 94.5%, transparent 100%)"

function mod(value: number, by: number) {
  return ((value % by) + by) % by
}

type Cell =
  | { kind: "digit"; key: string; digit: number }
  | { kind: "mark"; key: string; char: string }

/** Splits the formatted number into cells keyed by their place from the right. */
function toCells(text: string): Cell[] {
  const cells: Cell[] = []
  let place = 0
  for (let i = text.length - 1; i >= 0; i--) {
    const char = text[i] as string
    if (char >= "0" && char <= "9") {
      cells.unshift({ kind: "digit", key: `d${place}`, digit: Number(char) })
      place++
    } else {
      cells.unshift({ kind: "mark", key: `m${place}`, char })
    }
  }
  return cells
}

function format(
  magnitude: number,
  decimals: number,
  padStart: number,
  separator: string,
  decimalSeparator: string
) {
  const scaled = Math.min(
    Math.round(magnitude * 10 ** decimals),
    Number.MAX_SAFE_INTEGER
  )
  const digits = String(scaled).padStart(decimals + padStart, "0")
  const whole = digits.slice(0, digits.length - decimals)
  const fraction = digits.slice(digits.length - decimals)
  const grouped = separator
    ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    : whole
  return { scaled, text: fraction ? `${grouped}${decimalSeparator}${fraction}` : grouped }
}

function Wheel({
  digit,
  from,
  heading,
  duration,
}: {
  digit: number
  /** The face the wheel starts on: its own digit on first paint, zero when it appears later. */
  from: number
  heading: 1 | -1
  duration: number
}) {
  const reduceMotion = useReducedMotion()
  // The position counts turns; only its remainder decides which face shows.
  const position = useMotionValue(from)
  const goal = useRef(from)
  const controls = useRef<ReturnType<typeof animate> | null>(null)
  const y = useTransform(position, (p) => `${-mod(p, 10) * FACE_EM}em`)

  useEffect(() => {
    if (reduceMotion) {
      goal.current = digit
      position.jump(digit)
      return
    }
    // Re-aim only when the face changed, so a reversal alone does not send the
    // wheel the long way round to the face it already shows.
    if (mod(goal.current, 10) === digit) {
      return
    }
    // Aim from where the wheel is, not where it was sent, so fast changes do
    // not queue up a backlog of turns.
    const current = position.get()
    goal.current =
      heading < 0
        ? current - mod(current - digit, 10)
        : current + mod(digit - current, 10)
    // Not stopped in an effect cleanup: StrictMode runs effects twice on mount,
    // and the second run would find the goal already set and leave the wheel
    // frozen on its starting face.
    controls.current?.stop()
    controls.current = animate(position, goal.current, {
      type: "spring",
      visualDuration: duration,
      bounce: BOUNCE,
    })
  }, [digit, heading, duration, position, reduceMotion])

  return (
    <span
      className="relative inline-block overflow-hidden"
      style={{
        height: `${FACE_EM}em`,
        maskImage: WHEEL_FADE,
        WebkitMaskImage: WHEEL_FADE,
      }}
    >
      <motion.span className="flex flex-col" style={{ y }}>
        {FACES.map((face, index) => (
          <span
            className="flex items-center justify-center"
            // biome-ignore lint/suspicious/noArrayIndexKey: the faces are fixed; zero appears twice
            key={index}
            style={{ height: `${FACE_EM}em` }}
          >
            {face}
          </span>
        ))}
      </motion.span>
    </span>
  )
}

export function AnimatedCounter({
  value,
  decimals = 0,
  duration = 0.6,
  padStart = 1,
  separator = "",
  decimalSeparator = ",",
  signDisplay = "auto",
  prefix,
  suffix,
  className,
}: {
  value: number
  /** How many decimal places to show. */
  decimals?: number
  /** How long a roll takes, in seconds. */
  duration?: number
  /** The minimum number of whole digits, padded with leading zeros. */
  padStart?: number
  /** The grouping separator; empty for none. */
  separator?: string
  decimalSeparator?: string
  /** `"exceptZero"` shows a plus sign on positive values, like `Intl.NumberFormat`. */
  signDisplay?: "auto" | "exceptZero"
  prefix?: ReactNode
  suffix?: ReactNode
  className?: string
}) {
  // A value that is not a number would never compare equal again and never settle.
  const amount = Number.isFinite(value) ? value : 0
  const { scaled, text } = format(
    Math.abs(amount),
    Math.max(0, Math.min(decimals, 15)),
    Math.max(1, padStart),
    separator,
    decimalSeparator
  )
  const negative = amount < 0 && scaled > 0
  const positive = amount > 0 && scaled > 0
  const sign = negative ? "-" : positive && signDisplay === "exceptZero" ? "+" : ""

  // The wheels show the magnitude, so they turn by it: -1 to -2 rolls up, not
  // down the long way round. Adjusting state while rendering keeps the heading
  // in step with the value.
  const [last, setLast] = useState({ scaled, heading: 1 as 1 | -1 })
  if (last.scaled !== scaled) {
    setLast({ scaled, heading: scaled > last.scaled ? 1 : -1 })
  }

  // Places on screen at first paint start settled; later ones roll in from zero.
  const settled = useRef<Set<string> | null>(null)
  const cells = toCells(text)
  if (settled.current === null) {
    settled.current = new Set(cells.map((cell) => cell.key))
  } else {
    // A place that left and comes back should roll in again.
    for (const key of settled.current) {
      if (!cells.some((cell) => cell.key === key)) {
        settled.current.delete(key)
      }
    }
  }
  const initial = settled.current

  return (
    <span
      className={cn(
        "relative inline-flex items-center whitespace-nowrap tabular-nums",
        className
      )}
    >
      <span className="sr-only">{`${sign}${text}`}</span>
      <span aria-hidden className="inline-flex items-center">
        {prefix}
        {sign}
        <AnimatePresence initial={false} mode="popLayout">
          {cells.map((cell) => (
            <motion.span
              animate={{ opacity: 1 }}
              className="inline-flex"
              exit={{
                opacity: 0,
                transition: { duration: LEAVE_SECONDS, ease: EASE_OUT_QUINT },
              }}
              initial={{ opacity: 0 }}
              key={cell.key}
              layout="position"
              transition={{ type: "spring", visualDuration: duration, bounce: BOUNCE }}
            >
              {cell.kind === "digit" ? (
                <Wheel
                  digit={cell.digit}
                  duration={duration}
                  from={initial.has(cell.key) ? cell.digit : 0}
                  heading={last.heading}
                />
              ) : (
                cell.char
              )}
            </motion.span>
          ))}
        </AnimatePresence>
        {suffix}
      </span>
    </span>
  )
}
