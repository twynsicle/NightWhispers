import { useState, useEffect } from 'react'
import { useLoaderData, redirect, useNavigate } from 'react-router'
import {
  Container,
  Stack,
  Title,
  Text,
  Code,
  Modal,
  Button,
  Skeleton,
  Loader,
  Select,
  TextInput,
} from '@mantine/core'
import { IconQrcode } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'
import { QRCodeGenerator } from '../components/QRCodeGenerator'
import { useParticipants } from '../hooks/useParticipants'
import { ParticipantList } from '../components/ParticipantList'
import { PlayerChatView } from '../components/PlayerChatView'
import { StorytellerDashboard } from '../components/StorytellerDashboard'
import { PhaseHeader } from '../components/PhaseHeader'
import { PhaseControls } from '../components/PhaseControls'
import { PushNotificationPrompt } from '../components/PushNotificationPrompt'
import { kickParticipant, updateParticipantName, startGame } from '../lib/rooms'

type Participant = Database['public']['Tables']['participants']['Row']
type Room = Database['public']['Tables']['rooms']['Row']

type ParticipantWithRoom = Participant & { rooms: Room }

interface RoomLoaderData {
  participant: ParticipantWithRoom
}

/**
 * Protected route loader for RoomPage.
 *
 * Follows RESEARCH.md Pattern 3 (protected route with auto-redirect).
 * Verifies session and participant membership before rendering.
 *
 * Security:
 * 1. Checks for valid session (redirects to home if none)
 * 2. Verifies user is participant in room (prevents unauthorized access)
 * 3. Uses database RLS policies for additional security
 *
 * @param params - Route params containing roomId
 * @returns {RoomLoaderData} Participant with joined room data
 * @throws {Response} Redirect response if unauthorized
 */
// eslint-disable-next-line react-refresh/only-export-components
export async function roomLoader({
  params,
}: {
  params: { roomId?: string }
}): Promise<RoomLoaderData> {
  // Check for session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return redirect('/?error=session-invalid') as never
  }

  // Verify user is participant in this room
  const { data: participant, error } = await supabase
    .from('participants')
    .select('*, rooms(*)')
    .eq('room_id', params.roomId)
    .eq('user_id', session.user.id)
    .single()

  if (error || !participant) {
    return redirect('/?error=not-participant') as never
  }

  // Type assertion: single() with select('*, rooms(*)') returns joined data
  return { participant: participant as ParticipantWithRoom }
}

/**
 * Protected room page (game interface).
 *
 * Only accessible if:
 * - User has valid session
 * - User is participant in the room
 *
 * Loader pattern prevents FOUC (flash of unauthenticated content).
 * Room interface components will be added in Phase 3.
 */
export function RoomPage() {
  const { participant } = useLoaderData<RoomLoaderData>()
  const navigate = useNavigate()
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [script, setScript] = useState('none')
  const [editingParticipant, setEditingParticipant] = useState<{
    id: string
    name: string
  } | null>(null)
  const [editedName, setEditedName] = useState('')
  const [showPushPrompt, setShowPushPrompt] = useState(true)

  // Extract room and user IDs for hooks
  const roomId = participant.rooms.id
  const userId = participant.user_id
  const participantId = participant.id
  const isStoryteller = participant.role === 'storyteller'

  // Subscribe to real-time participant updates
  const { participants, loading, roomStatus } = useParticipants(roomId)

  // Construct join URL with pre-filled room code
  const joinUrl = `${window.location.origin}/join?code=${participant.rooms.code}`

  // Real-time detection of being kicked
  useEffect(() => {
    const channel = supabase
      .channel(`participant:${participantId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'participants',
          filter: `id=eq.${participantId}`,
        },
        payload => {
          if (payload.new.is_active === false) {
            // User was kicked
            notifications.show({
              title: 'Removed from Room',
              message: 'You were removed from the room by the Storyteller.',
              color: 'red',
            })
            navigate('/?error=kicked')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [participantId, navigate])

  // Handler: Kick participant
  const handleKick = async (participantId: string) => {
    try {
      await kickParticipant(participantId)
      notifications.show({
        title: 'Player Removed',
        message: 'Player has been kicked from the room.',
        color: 'green',
      })
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to kick player. Please try again.',
        color: 'red',
      })
    }
  }

  // Handler: Edit participant name
  const handleEditOpen = (participantId: string, currentName: string) => {
    setEditingParticipant({ id: participantId, name: currentName })
    setEditedName(currentName)
  }

  const handleEditSave = async () => {
    if (!editingParticipant) return

    // Validate name length
    if (editedName.length < 2 || editedName.length > 20) {
      notifications.show({
        title: 'Invalid Name',
        message: 'Display name must be 2-20 characters.',
        color: 'red',
      })
      return
    }

    try {
      await updateParticipantName(editingParticipant.id, editedName)
      notifications.show({
        title: 'Name Updated',
        message: 'Player name has been updated.',
        color: 'green',
      })
      setEditingParticipant(null)
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to update name. Please try again.',
        color: 'red',
      })
    }
  }

  // Handler: Start game
  const handleStartGame = async () => {
    try {
      await startGame(roomId)
      notifications.show({
        title: 'Game Started!',
        message: 'The game is now active.',
        color: 'green',
      })
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to start game. Please try again.',
        color: 'red',
      })
    }
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        {/* Title with role-specific messaging */}
        <Title order={2} c="crimson">
          {roomStatus === 'lobby'
            ? isStoryteller
              ? `Lobby - Room ${participant.rooms.code}`
              : 'Waiting for Storyteller...'
            : `Room ${participant.rooms.code}`}
        </Title>

        {/* Game Status: Show different UI based on room status */}
        {roomStatus === 'lobby' ? (
          <>
            {/* LOBBY VIEW */}
            {/* Room Code Display */}
            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                Room Code:
              </Text>
              <Code block fz="xl" ta="center">
                {participant.rooms.code}
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
                onClick={handleStartGame}
                disabled={participants.length < 2}
                mt="md"
              >
                Start Game
              </Button>
            )}

            {/* Role-specific hints */}
            {isStoryteller ? (
              <Text size="sm" c="dimmed" ta="center" mt="xs">
                {participants.length < 2
                  ? 'Need at least 2 participants to start'
                  : 'Ready to start the game'}
              </Text>
            ) : (
              <Stack gap="xs" align="center" mt="md">
                <Loader type="dots" size="sm" />
                <Text size="sm" c="dimmed">
                  The game will start soon
                </Text>
              </Stack>
            )}
          </>
        ) : roomStatus === 'active' ? (
          <>
            {/* ACTIVE GAME VIEW - Phase Header + Messaging Interface */}

            {/* Push Notification Prompt - shown on game start (Storyteller only - Player gets it inside PlayerChatView) */}
            {showPushPrompt && isStoryteller && (
              <PushNotificationPrompt
                participantId={participantId}
                onDismiss={() => setShowPushPrompt(false)}
              />
            )}

            {/* Phase Header - visible to all participants */}
            <PhaseHeader roomId={roomId} />

            {isStoryteller ? (
              // Storyteller view: Phase controls + Player cards dashboard
              <Stack gap="md">
                {/* Phase Controls - Storyteller only */}
                <PhaseControls roomId={roomId} />

                <StorytellerDashboard
                  roomId={roomId}
                  participantId={participantId}
                  participants={participants}
                />
              </Stack>
            ) : (
              // Player view: Full-screen chat with Storyteller
              (() => {
                const storyteller = participants.find(
                  p => p.role === 'storyteller'
                )
                if (!storyteller) {
                  return (
                    <Text size="sm" ta="center" c="dimmed" py="xl">
                      Waiting for Storyteller...
                    </Text>
                  )
                }
                return (
                  <PlayerChatView
                    roomId={roomId}
                    participantId={participantId}
                    storytellerId={storyteller.id}
                    storytellerName={storyteller.display_name}
                    participants={participants}
                    roomCode={participant.rooms.code}
                    showPushPrompt={showPushPrompt}
                    onDismissPushPrompt={() => setShowPushPrompt(false)}
                  />
                )
              })()
            )}
          </>
        ) : (
          <>
            {/* ENDED GAME VIEW */}
            <Text size="lg" ta="center" c="dimmed" py="xl">
              Game has ended
            </Text>
          </>
        )}

        {/* Edit Name Modal */}
        <Modal
          opened={editingParticipant !== null}
          onClose={() => setEditingParticipant(null)}
          title="Edit Player Name"
          centered
        >
          <Stack gap="md">
            <TextInput
              label="Display Name"
              description="2-20 characters"
              value={editedName}
              onChange={e => setEditedName(e.currentTarget.value)}
              maxLength={20}
              error={
                editedName.length < 2 || editedName.length > 20
                  ? 'Name must be 2-20 characters'
                  : undefined
              }
            />
            <Button fullWidth onClick={handleEditSave}>
              Save
            </Button>
            <Button
              fullWidth
              variant="light"
              onClick={() => setEditingParticipant(null)}
            >
              Cancel
            </Button>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  )
}
