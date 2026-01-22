import { useState } from 'react'
import { useOutletContext } from 'react-router'
import {
  Stack,
  Title,
  Text,
  Code,
  Modal,
  Button,
  Skeleton,
  Select,
  Loader,
} from '@mantine/core'
import { IconQrcode } from '@tabler/icons-react'
import type { RoomOutletContext } from '../RoomLayout/types'
import { QRCodeGenerator } from './components/QRCodeGenerator'
import { EditNameModal } from './components/EditNameModal'
import { ParticipantList } from '../../components/ParticipantList/ParticipantList'
import { useLobbyActions } from './hooks/useLobbyActions'

/**
 * Lobby page for room setup before game starts.
 *
 * Displays:
 * - Room code and QR code for sharing
 * - Script selector (Storyteller only, disabled in v1)
 * - Participant list with real-time updates
 * - Start game button (Storyteller only)
 *
 * Uses shared context from RoomLayout via useOutletContext.
 */
export function LobbyPage() {
  const context = useOutletContext<RoomOutletContext>()
  const {
    participants,
    loading,
    roomId,
    userId,
    isStoryteller,
    roomCode,
    joinUrl,
  } = context

  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [script, setScript] = useState('none')
  const [editingParticipant, setEditingParticipant] = useState<{
    id: string
    name: string
  } | null>(null)

  const { handleKick, handleEditSave, handleStartGame } = useLobbyActions()

  // Handler: Open edit modal
  const handleEditOpen = (participantId: string, currentName: string) => {
    setEditingParticipant({ id: participantId, name: currentName })
  }

  // Handler: Save edit and close modal
  const onEditSave = async (participantId: string, newName: string) => {
    const success = await handleEditSave(participantId, newName)
    if (success) {
      setEditingParticipant(null)
    }
    return success
  }

  return (
    <>
      {/* Title with role-specific messaging */}
      <Title order={2} c="crimson">
        {isStoryteller
          ? `Lobby - Room ${roomCode}`
          : 'Waiting for Storyteller...'}
      </Title>

      {/* Room Code Display */}
      <Stack gap="xs">
        <Text size="sm" c="dimmed">
          Room Code:
        </Text>
        <Code block fz="xl" ta="center">
          {roomCode}
        </Code>
        <Text size="xs" c="dimmed" ta="center">
          Share this code for others to join
        </Text>
      </Stack>

      {/* QR Code Button */}
      <Button
        variant="light"
        leftSection={<IconQrcode size={20} />}
        onClick={() => setQrModalOpen(true)}
        fullWidth
      >
        Show QR Code
      </Button>

      {/* QR Code Modal */}
      <Modal
        opened={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title="Scan to Join Room"
        centered
      >
        <QRCodeGenerator url={joinUrl} />
      </Modal>

      {/* Storyteller: Script Selector */}
      {isStoryteller && (
        <Select
          label="Script"
          description="Select game script (v1 supports None only)"
          data={[{ value: 'none', label: 'None (No Roles)' }]}
          value={script}
          onChange={value => setScript(value || 'none')}
          disabled
        />
      )}

      {/* Participant List Section */}
      <Stack gap="xs" mt="md">
        <Text size="sm" c="dimmed" fw={500}>
          Participants
        </Text>

        {loading ? (
          <Stack gap="sm">
            <Skeleton height={48} />
            <Skeleton height={48} />
            <Skeleton height={48} />
          </Stack>
        ) : (
          <ParticipantList
            participants={participants}
            currentUserId={userId}
            showRole={true}
            isStoryteller={isStoryteller}
            onKick={isStoryteller ? handleKick : undefined}
            onEdit={isStoryteller ? handleEditOpen : undefined}
          />
        )}
      </Stack>

      {/* Storyteller: Start Game Button */}
      {isStoryteller && (
        <Button
          size="lg"
          fullWidth
          color="crimson"
          onClick={() => handleStartGame(roomId)}
          disabled={participants.length < 1}
          mt="md"
        >
          Start Game
        </Button>
      )}

      {/* Role-specific hints */}
      {isStoryteller ? (
        <Text size="sm" c="dimmed" ta="center" mt="xs">
          Ready to start the game
        </Text>
      ) : (
        <Stack gap="xs" align="center" mt="md">
          <Loader type="dots" size="sm" />
          <Text size="sm" c="dimmed">
            The game will start soon
          </Text>
        </Stack>
      )}

      {/* Edit Name Modal */}
      <EditNameModal
        editingParticipant={editingParticipant}
        onClose={() => setEditingParticipant(null)}
        onSave={onEditSave}
      />
    </>
  )
}
