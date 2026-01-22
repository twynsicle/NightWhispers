import { useEffect } from 'react'
import {
  useLoaderData,
  redirect,
  useNavigate,
  useLocation,
  Outlet,
} from 'react-router'
import { Container, Stack } from '@mantine/core'
import { supabase } from '../../lib/supabase'
import { useParticipants } from '../GamePage/hooks/useParticipants'
import { useKickDetection } from './hooks/useKickDetection'
import type {
  RoomLoaderData,
  RoomOutletContext,
  ParticipantWithRoom,
} from './types'

/**
 * Protected route loader for room pages.
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
 * Parent layout component for room pages (lobby and game).
 *
 * Responsibilities:
 * - Loads participant data via roomLoader (runs once)
 * - Subscribes to real-time participant updates
 * - Watches room status and auto-navigates between /lobby and /game
 * - Provides shared context to child routes via Outlet
 * - Handles kick detection (protects both lobby and game views)
 *
 * Child routes access shared state via useOutletContext<RoomOutletContext>().
 */
export function RoomLayout() {
  const { participant } = useLoaderData<RoomLoaderData>()
  const navigate = useNavigate()
  const location = useLocation()

  // Extract room and user IDs
  const roomId = participant.rooms.id
  const userId = participant.user_id
  const participantId = participant.id
  const isStoryteller = participant.role === 'storyteller'
  const roomCode = participant.rooms.code

  // Subscribe to real-time participant updates
  const { participants, loading, roomStatus } = useParticipants(roomId)

  // Real-time detection of being kicked
  useKickDetection(participantId)

  // Construct join URL with pre-filled room code
  const joinUrl = `${window.location.origin}/join?code=${roomCode}`

  // Status-based navigation between lobby and game
  useEffect(() => {
    if (loading) return

    const basePath = `/room/${roomId}`

    if (roomStatus === 'lobby' && !location.pathname.endsWith('/lobby')) {
      navigate(`${basePath}/lobby`, { replace: true })
    } else if (roomStatus === 'active' && !location.pathname.endsWith('/game')) {
      navigate(`${basePath}/game`, { replace: true })
    } else if (roomStatus === 'ended') {
      navigate('/', { replace: true })
    }
  }, [roomStatus, loading, roomId, navigate, location.pathname])

  // Context passed to child routes
  const context: RoomOutletContext = {
    participant,
    participants,
    loading,
    roomStatus,
    roomId,
    userId,
    participantId,
    isStoryteller,
    roomCode,
    joinUrl,
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Outlet context={context} />
      </Stack>
    </Container>
  )
}
