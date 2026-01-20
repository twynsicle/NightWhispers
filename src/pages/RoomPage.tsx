import { useState } from 'react'
import { useLoaderData, redirect } from 'react-router'
import { Container, Stack, Title, Text, Badge, Code, Modal, Button, Skeleton, Loader } from '@mantine/core'
import { IconQrcode } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'
import { QRCodeGenerator } from '../components/QRCodeGenerator'
import { useParticipants } from '../hooks/useParticipants'
import { ParticipantList } from '../components/ParticipantList'

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
  const [qrModalOpen, setQrModalOpen] = useState(false)

  // Extract room and user IDs for hooks
  const roomId = participant.rooms.id
  const userId = participant.user_id
  const isStoryteller = participant.role === 'storyteller'

  // Subscribe to real-time participant updates
  const { participants, loading } = useParticipants(roomId)

  // Construct join URL with pre-filled room code
  const joinUrl = `${window.location.origin}/join?code=${participant.rooms.code}`

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Title order={2} c="crimson">
          Room: {participant.rooms.code}
        </Title>

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

        <Button
          variant="light"
          leftSection={<IconQrcode size={20} />}
          onClick={() => setQrModalOpen(true)}
          fullWidth
        >
          Show QR Code
        </Button>

        <Modal
          opened={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          title="Scan to Join Room"
          centered
        >
          <QRCodeGenerator url={joinUrl} />
        </Modal>

        <Stack gap="xs">
          <Text>
            {participant.avatar_id} {participant.display_name}
          </Text>

          <Badge
            color={participant.role === 'storyteller' ? 'crimson' : 'gray'}
            variant="filled"
          >
            {participant.role === 'storyteller' ? 'Storyteller' : 'Player'}
          </Badge>
        </Stack>

        <Text c="dimmed" size="sm" mt="xl">
          Room interface coming in Phase 3: Lobby & Management
        </Text>
      </Stack>
    </Container>
  )
}
