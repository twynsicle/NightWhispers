import { Box, Skeleton, Text, Title } from '@mantine/core'
import { usePhase } from '../hooks/usePhase'

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
      <Title
        order={3}
        ta="center"
        c="crimson"
        style={{
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
    </Box>
  )
}
