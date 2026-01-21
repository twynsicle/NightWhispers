import { Box, Skeleton, Text, Title, Transition } from '@mantine/core'
import { usePhase } from '../hooks/usePhase'
import { useState, useEffect, useRef } from 'react'

interface PhaseHeaderProps {
  roomId: string
}

/**
 * Phase display header for all participants.
 *
 * Shows current game phase (e.g., "Night 1", "Day 2") with appropriate icon.
 * Moon icon for Night phases, Sun icon for Day phases.
 *
 * Gothic themed: crimson text on dark background, center-aligned.
 * Mobile-first sizing with h3/h4 title.
 */
export function PhaseHeader({ roomId }: PhaseHeaderProps) {
  const { phase, loading } = usePhase(roomId)

  // Track phase changes for animation
  const [animationKey, setAnimationKey] = useState(0)
  const [showContent, setShowContent] = useState(true)
  const prevPhaseRef = useRef(phase)

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Trigger animation when phase changes
  // Using queueMicrotask to defer setState and satisfy lint rules
  useEffect(() => {
    if (phase && phase !== prevPhaseRef.current) {
      prevPhaseRef.current = phase
      if (!prefersReducedMotion) {
        // Schedule fade out/in animation via microtask
        queueMicrotask(() => {
          setShowContent(false)
          setTimeout(() => {
            setAnimationKey(k => k + 1)
            setShowContent(true)
          }, 150)
        })
      }
    }
  }, [phase, prefersReducedMotion])

  // Determine phase icon based on Night/Day
  const isNight = phase.toLowerCase().startsWith('night')
  const phaseIcon = isNight ? '🌙' : '☀️'

  if (loading) {
    return (
      <Box py="xs">
        <Skeleton height={36} width="50%" mx="auto" radius="md" />
      </Box>
    )
  }

  return (
    <Box
      py="sm"
      style={{
        borderBottom: '1px solid var(--mantine-color-dark-6)',
      }}
    >
      <Transition
        key={animationKey}
        mounted={showContent && !loading}
        transition="fade"
        duration={prefersReducedMotion ? 0 : 200}
        timingFunction="ease-out"
      >
        {styles => (
          <Title
            order={3}
            ta="center"
            c="crimson"
            style={{
              ...styles,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <Text component="span" fz="xl">
              {phaseIcon}
            </Text>
            {phase}
          </Title>
        )}
      </Transition>
    </Box>
  )
}
