import { useState, useEffect } from 'react'
import {
  Stack,
  Switch,
  TextInput,
  Group,
  ActionIcon,
  Text,
  Paper,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconX } from '@tabler/icons-react'
import type { Database } from '../lib/supabase'
import { toggleDead, setCustomStatus } from '../hooks/usePlayerStatus'

type Participant = Database['public']['Tables']['participants']['Row']

interface PlayerStatusControlsProps {
  participant: Participant
}

/**
 * UI controls for managing player status (death toggle and custom status).
 *
 * Storyteller-only component for tracking game state:
 * - Toggle player between alive/dead status
 * - Set custom status text (e.g., "Poisoned", "Protected", "Mayor")
 *
 * Uses debounced updates for custom status to reduce database writes.
 * Gothic theme styling with crimson accents.
 *
 * @param participant - Participant to manage status for
 */
export function PlayerStatusControls({
  participant,
}: PlayerStatusControlsProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [customStatusValue, setCustomStatusValue] = useState(
    participant.custom_status || ''
  )
  const [debouncedCustomStatus] = useDebouncedValue(customStatusValue, 1000)

  // Track if initial value, to avoid triggering update on mount
  const [hasInitialized, setHasInitialized] = useState(false)

  // Update local state when participant changes (e.g., from real-time sync)
  useEffect(() => {
    setCustomStatusValue(participant.custom_status || '')
    setHasInitialized(false)
  }, [participant.id, participant.custom_status])

  // Save debounced custom status to database
  useEffect(() => {
    // Skip initial mount
    if (!hasInitialized) {
      setHasInitialized(true)
      return
    }

    // Only update if value actually changed
    const currentDbValue = participant.custom_status || ''
    if (debouncedCustomStatus === currentDbValue) {
      return
    }

    const saveCustomStatus = async () => {
      try {
        await setCustomStatus(participant.id, debouncedCustomStatus || null)
        notifications.show({
          title: 'Status updated',
          message: debouncedCustomStatus
            ? `Custom status set to "${debouncedCustomStatus}"`
            : 'Custom status cleared',
          color: 'green',
        })
      } catch (error) {
        notifications.show({
          title: 'Update failed',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to update custom status',
          color: 'red',
        })
      }
    }

    saveCustomStatus()
  }, [
    debouncedCustomStatus,
    hasInitialized,
    participant.id,
    participant.custom_status,
  ])

  const handleToggleDead = async () => {
    setIsUpdating(true)
    try {
      const newStatus = await toggleDead(participant.id)
      notifications.show({
        title: 'Status updated',
        message: `Player marked as ${newStatus}`,
        color: newStatus === 'dead' ? 'gray' : 'green',
      })
    } catch (error) {
      notifications.show({
        title: 'Update failed',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update player status',
        color: 'red',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClearCustomStatus = async () => {
    setCustomStatusValue('')
    try {
      await setCustomStatus(participant.id, null)
      notifications.show({
        title: 'Status cleared',
        message: 'Custom status has been removed',
        color: 'green',
      })
    } catch (error) {
      notifications.show({
        title: 'Update failed',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to clear custom status',
        color: 'red',
      })
    }
  }

  return (
    <Paper p="sm" radius="md" withBorder>
      <Stack gap="sm">
        {/* Section header */}
        <Text size="sm" fw={500} c="dimmed">
          Player Status
        </Text>

        {/* Death toggle */}
        <Switch
          label="Mark as Dead"
          checked={participant.status === 'dead'}
          onChange={handleToggleDead}
          disabled={isUpdating}
          color="crimson"
          size="sm"
        />

        {/* Custom status input */}
        <Group gap="xs" align="flex-end">
          <TextInput
            flex={1}
            size="sm"
            label="Custom Status"
            placeholder="e.g., Poisoned, Protected, Mayor"
            value={customStatusValue}
            onChange={e => setCustomStatusValue(e.currentTarget.value)}
            maxLength={50}
            description={`${customStatusValue.length}/50 characters`}
          />
          {customStatusValue && (
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={handleClearCustomStatus}
              aria-label="Clear custom status"
              mb={24}
            >
              <IconX size={16} />
            </ActionIcon>
          )}
        </Group>
      </Stack>
    </Paper>
  )
}
