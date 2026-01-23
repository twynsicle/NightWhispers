import { useState } from 'react'
import { useOutletContext } from 'react-router'
import { Modal, Button, Skeleton, Stack, Text } from '@mantine/core'
import type { RoomOutletContext } from '../RoomLayout/types'
import { QRCodeGenerator } from './components/QRCodeGenerator'
import { EditNameModal } from './components/EditNameModal'
import { LobbyHeader } from './components/LobbyHeader'
import { GameSetupSection } from './components/GameSetupSection'
import { ParticipantList } from '../../components/ParticipantList/ParticipantList'
import { useLobbyActions } from './hooks/useLobbyActions'
import { MIN_PLAYERS_TO_START } from '../../lib/constants'
import styles from './LobbyPage.module.css'

/**
 * Lobby page for room setup before game starts.
 *
 * Fixed full-screen layout with:
 * - Header: App icon, room code, QR button
 * - Content: Game setup (Storyteller), participant list
 * - Footer: Start game button (Storyteller only)
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

  // Count players (non-storyteller participants)
  const playerCount = participants.filter(p => p.role === 'player').length

  return (
    <div className={styles.container}>
      {/* Fixed Header */}
      <div className={styles.header}>
        <LobbyHeader
          roomCode={roomCode}
          onQrClick={() => setQrModalOpen(true)}
        />
      </div>

      {/* Scrollable Content */}
      <div className={styles.content}>
        {isStoryteller ? (
          <>
            {/* Game Setup Section (Storyteller only) */}
            <GameSetupSection script={script} onScriptChange={setScript} />

            {/* Player Count Header */}
            <div className={styles.playersHeader}>Players ({playerCount})</div>

            {/* Participant List */}
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
                onKick={handleKick}
                onEdit={handleEditOpen}
              />
            )}
          </>
        ) : (
          /* Non-Storyteller View */
          <>
            <div className={styles.playersHeader}>Players ({playerCount})</div>

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
                isStoryteller={false}
              />
            )}

            <Text className={styles.waitingMessage}>
              Waiting for Storyteller to start the game...
            </Text>
          </>
        )}
      </div>

      {/* Fixed Footer (Storyteller only) */}
      {isStoryteller && (
        <div className={styles.footer}>
          <Button
            size="lg"
            fullWidth
            color="crimson"
            onClick={() => handleStartGame(roomId)}
            disabled={participants.length < MIN_PLAYERS_TO_START}
          >
            Start Game
          </Button>
        </div>
      )}

      {/* QR Code Modal */}
      <Modal
        opened={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title="Scan to Join Room"
        centered
      >
        <QRCodeGenerator url={joinUrl} />
      </Modal>

      {/* Edit Name Modal */}
      <EditNameModal
        editingParticipant={editingParticipant}
        onClose={() => setEditingParticipant(null)}
        onSave={onEditSave}
      />
    </div>
  )
}
