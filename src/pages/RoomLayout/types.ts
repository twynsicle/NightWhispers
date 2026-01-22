import type { Database } from '../../lib/supabase'

export type Participant = Database['public']['Tables']['participants']['Row']
export type Room = Database['public']['Tables']['rooms']['Row']

export type ParticipantWithRoom = Participant & { rooms: Room }

export interface RoomLoaderData {
  participant: ParticipantWithRoom
}

/**
 * Context passed from RoomLayout to child routes via useOutletContext.
 *
 * Contains all shared state needed by both LobbyPage and GamePage:
 * - participant: Current user's participant record with joined room data
 * - participants: All active participants in the room (real-time updated)
 * - loading: Whether initial participant data is still being fetched
 * - roomStatus: Current room status (lobby, active, ended)
 * - roomId: UUID of the room
 * - userId: UUID of the current user
 * - participantId: UUID of the current participant
 * - isStoryteller: Whether current user is the Storyteller
 * - roomCode: 4-letter room code for sharing
 * - joinUrl: Full URL for joining the room
 */
export interface RoomOutletContext {
  participant: ParticipantWithRoom
  participants: Participant[]
  loading: boolean
  roomStatus: 'lobby' | 'active' | 'ended'
  roomId: string
  userId: string
  participantId: string
  isStoryteller: boolean
  roomCode: string
  joinUrl: string
}
