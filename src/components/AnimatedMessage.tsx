import { Transition } from '@mantine/core'
import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface AnimatedMessageProps {
  children: ReactNode
  index: number
  isNew?: boolean
}

/**
 * Animated wrapper for message bubbles.
 *
 * New messages slide up with stagger effect.
 * Uses Mantine Transition for simple enter animations.
 * Respects prefers-reduced-motion for accessibility.
 *
 * Implements UX-05: Smooth animations for new messages.
 */
export function AnimatedMessage({
  children,
  index,
  isNew = false,
}: AnimatedMessageProps) {
  const [mounted, setMounted] = useState(false)

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Trigger mount animation on initial render
  useEffect(() => {
    setMounted(true)
  }, [])

  // Skip animation if not new or reduced motion preferred
  if (!isNew || prefersReducedMotion) {
    return <>{children}</>
  }

  return (
    <Transition
      mounted={mounted}
      transition="slide-up"
      duration={200}
      timingFunction="ease-out"
      enterDelay={Math.min(index * 30, 150)} // Stagger with max delay
    >
      {(styles) => <div style={styles}>{children}</div>}
    </Transition>
  )
}
