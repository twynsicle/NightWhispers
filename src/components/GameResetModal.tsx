import { useState } from 'react'
import {
  Modal,
  Button,
  Group,
  Text,
  List,
  Stack,
  ThemeIcon,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconAlertTriangle } from '@tabler/icons-react'
import { resetGame } from '../lib/game-reset'

interface GameResetModalProps {
  roomId: string
  opened: boolean
  onClose: () => void
}

/**
 * Confirmation modal for game reset.
 *
 * Displays warning about what reset will do:
 * - Delete all messages
 * - Reset phase to Night 1
 * - Set all players to alive
 * - Keep all participants (no kick)
 *
 * Requires explicit confirmation to prevent accidental resets.
 */
export function GameResetModal({
  roomId,
  opened,
  onClose,
}: GameResetModalProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await resetGame(roomId)
      notifications.show({
        title: 'Game Reset',
        message: 'Game reset successfully',
        color: 'green',
      })
      onClose()
    } catch (error) {
      notifications.show({
        title: 'Reset Failed',
        message:
          error instanceof Error ? error.message : 'Failed to reset game',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon color="red" variant="light" size="lg">
            <IconAlertTriangle size={20} />
          </ThemeIcon>
          <Text fw={600}>Reset Game?</Text>
        </Group>
      }
      centered
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          This will:
        </Text>

        <List size="sm" spacing="xs">
          <List.Item>Delete all messages</List.Item>
          <List.Item>Reset phase to Night 1</List.Item>
          <List.Item>Set all players to alive</List.Item>
          <List.Item>Keep all participants in the room</List.Item>
        </List>

        <Text size="sm" c="dimmed">
          This action cannot be undone.
        </Text>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button color="red" onClick={handleConfirm} loading={loading}>
            Reset Game
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
