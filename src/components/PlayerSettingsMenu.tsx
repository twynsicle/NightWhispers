import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Modal,
  Stack,
  Text,
  Code,
  Button,
  Group,
  CopyButton,
  ActionIcon,
  Divider,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconCopy, IconCheck, IconLogout } from '@tabler/icons-react'
import { leaveRoom } from '../lib/leave-room'

interface PlayerSettingsMenuProps {
  /** 4-letter room code for display and sharing */
  roomCode: string
  /** Current participant's ID for leave operation */
  participantId: string
  /** Controls modal visibility */
  opened: boolean
  /** Callback when modal should close */
  onClose: () => void
}

/**
 * Settings menu for players in the active game view.
 *
 * Features:
 * - Displays room code for sharing with others
 * - Copy room code to clipboard
 * - Leave game with confirmation modal
 *
 * The leave action performs a soft delete (is_active = false).
 * Redirect to home is handled by RoomPage's postgres_changes subscription.
 */
export function PlayerSettingsMenu({
  roomCode,
  participantId,
  opened,
  onClose,
}: PlayerSettingsMenuProps) {
  const navigate = useNavigate()
  const [confirmLeaveOpened, setConfirmLeaveOpened] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const handleLeaveConfirm = async () => {
    setLeaving(true)
    try {
      await leaveRoom(participantId)
      notifications.show({
        title: 'Left Game',
        message: 'You have left the game.',
        color: 'green',
      })
      // Navigate to home page
      // Note: RoomPage's postgres_changes subscription will also detect
      // is_active = false and redirect, but we navigate immediately for
      // better UX (don't wait for real-time event)
      navigate('/')
    } catch (error) {
      notifications.show({
        title: 'Error',
        message:
          error instanceof Error ? error.message : 'Failed to leave game',
        color: 'red',
      })
    } finally {
      setLeaving(false)
      setConfirmLeaveOpened(false)
    }
  }

  return (
    <>
      {/* Main Settings Modal */}
      <Modal
        opened={opened}
        onClose={onClose}
        title="Game Settings"
        centered
        size="sm"
      >
        <Stack gap="md">
          {/* Room Code Section */}
          <Stack gap="xs">
            <Text size="sm" c="dimmed" fw={500}>
              Room Code
            </Text>
            <Group gap="xs" justify="center">
              <Code
                fz="xl"
                ff="monospace"
                p="md"
                style={{ letterSpacing: '0.2em' }}
              >
                {roomCode}
              </Code>
              <CopyButton value={roomCode}>
                {({ copied, copy }) => (
                  <ActionIcon
                    variant="light"
                    color={copied ? 'green' : 'gray'}
                    onClick={() => {
                      copy()
                      notifications.show({
                        title: 'Copied',
                        message: 'Room code copied!',
                        color: 'green',
                      })
                    }}
                    size="lg"
                  >
                    {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                  </ActionIcon>
                )}
              </CopyButton>
            </Group>
            <Text size="xs" c="dimmed" ta="center">
              Share this code for others to join
            </Text>
          </Stack>

          <Divider />

          {/* Leave Game Section */}
          <Stack gap="xs">
            <Text size="xs" c="dimmed">
              Leaving will remove you from the game. You will need the room code
              to rejoin.
            </Text>
            <Button
              variant="light"
              color="red"
              leftSection={<IconLogout size={18} />}
              onClick={() => setConfirmLeaveOpened(true)}
              fullWidth
            >
              Leave Game
            </Button>
          </Stack>
        </Stack>
      </Modal>

      {/* Leave Confirmation Modal */}
      <Modal
        opened={confirmLeaveOpened}
        onClose={() => setConfirmLeaveOpened(false)}
        title="Leave Game?"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to leave? You will be removed from the room.
          </Text>
          <Group gap="sm" justify="flex-end">
            <Button
              variant="light"
              onClick={() => setConfirmLeaveOpened(false)}
              disabled={leaving}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleLeaveConfirm}
              loading={leaving}
              leftSection={!leaving && <IconLogout size={18} />}
            >
              Leave Game
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
