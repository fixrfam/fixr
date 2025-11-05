'use client'

import { useEffect, useState } from 'react'

/**
 * useScrollPosition
 *
 * A React hook to track the vertical scroll position of the window
 * and determine whether the user has scrolled away from the top.
 *
 * @returns An object containing:
 * - `scrollY`: current vertical scroll position in pixels
 * - `hasScrolled`: boolean indicating if `scrollY` is greater than 0
 */
export const useScrollPosition = (): {
  scrollY: number
  hasScrolled: boolean
} => {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = (): void => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    // Initialize scrollY in case user is already scrolled
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return {
    scrollY,
    hasScrolled: scrollY > 0,
  }
}
