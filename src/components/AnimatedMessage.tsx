import { Transition } from '@mantine/core'
import type { ReactNode } from 'react'
import {
  ANIMATION_DURATION_MS,
  ANIMATION_STAGGER_MS,
  ANIMATION_MAX_DELAY_MS,
} from '../lib/constants'

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
  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Skip animation if not new or reduced motion preferred
  if (!isNew || prefersReducedMotion) {
    return <>{children}</>
  }

  // Mantine Transition handles enter animation automatically when mounted=true
  return (
    <Transition
      mounted={true}
      transition="slide-up"
      duration={ANIMATION_DURATION_MS}
      timingFunction="ease-out"
      enterDelay={Math.min(index * ANIMATION_STAGGER_MS, ANIMATION_MAX_DELAY_MS)}
    >
      {styles => <div style={styles}>{children}</div>}
    </Transition>
  )
}
