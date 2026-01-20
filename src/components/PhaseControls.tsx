import { useState } from 'react'
import { Button, Stack, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { usePhase } from '../hooks/usePhase'
import { getNextPhase } from '../lib/phase-helpers'

interface PhaseControlsProps {
  roomId: string
}

/**
 * Storyteller-only phase advancement controls.
 *
 * Provides "Advance Phase" button to increment game phase.
 * Shows loading state while updating and success/error notifications.
 *
 * Gothic themed: crimson button variant.
 * Mobile-first with full-width button.
 */
export function PhaseControls({ roomId }: PhaseControlsProps) {
  const { phase, advancePhase } = usePhase(roomId)
  const [isAdvancing, setIsAdvancing] = useState(false)

  const handleAdvancePhase = async () => {
    setIsAdvancing(true)

    // Compute next phase for success notification
    const nextPhase = getNextPhase(phase)

    await advancePhase()

    // Success notification
    notifications.show({
      title: 'Phase Advanced',
      message: `Phase advanced to ${nextPhase}`,
      color: 'green',
    })

    setIsAdvancing(false)
  }

  return (
    <Stack gap="xs" align="center">
      <Button
        color="crimson"
        variant="filled"
        size="md"
        fullWidth
        onClick={handleAdvancePhase}
        loading={isAdvancing}
        disabled={isAdvancing}
      >
        Advance Phase
      </Button>
      <Text size="xs" c="dimmed">
        Current: {phase} → Next: {getNextPhase(phase)}
      </Text>
    </Stack>
  )
}
