import { supabase } from './supabase'
import type { Database } from './supabase'
import { generateRoomCode } from './room-codes'

type Room = Database['public']['Tables']['rooms']['Row']
type Participant = Database['public']['Tables']['participants']['Row']

/**
 * Creates a new room with unique 4-letter code.
 *
 * Handles code collisions via recursive retry (rare: <1% at <1K rooms).
 * Creates both room and initial participant (storyteller) records.
 *
 * @param {string} userId - Authenticated user ID (from session.user.id)
 * @param {boolean} isStoryteller - Whether user is storyteller (true) or player (false)
 * @param {string} displayName - User's chosen display name (2-20 chars)
 * @param {string} avatar - Avatar identifier/emoji
 * @param {number} maxRetries - Maximum number of collision retry attempts (default: 5)
 * @returns {Promise<{room: Room, participant: Participant}>} Created room and participant
 * @throws {Error} If room creation fails (non-collision error) or max retries exceeded
 */
export async function createRoom(
  userId: string,
  isStoryteller: boolean,
  displayName: string,
  avatar: string,
  maxRetries: number = 5
): Promise<{ room: Room; participant: Participant }> {
  const code = generateRoomCode()

  // Insert room with generated code
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({
      code,
      storyteller_id: userId,
    })
    .select()
    .single()

  // Handle collision: unique constraint violation (PostgreSQL error 23505)
  if (roomError?.code === '23505') {
    if (maxRetries <= 0) {
      throw new Error('Failed to generate unique room code after multiple attempts')
    }
    // Retry with new code (recursive)
    return createRoom(userId, isStoryteller, displayName, avatar, maxRetries - 1)
  }

  if (roomError) throw roomError
  if (!room) throw new Error('Room creation failed: no data returned')

  // Create participant record for creator
  const { data: participant, error: participantError } = await supabase
    .from('participants')
    .insert({
      room_id: room.id,
      user_id: userId,
      display_name: displayName,
      avatar_id: avatar,
      role: isStoryteller ? 'storyteller' : 'player',
    })
    .select()
    .single()

  if (participantError) throw participantError
  if (!participant) throw new Error('Participant creation failed: no data returned')

  return { room, participant }
}

/**
 * Joins an existing room or updates participant if already joined.
 *
 * Uses upsert to prevent duplicate participants on reconnection.
 * Database composite unique constraint (room_id, user_id) ensures idempotency.
 *
 * @param {string} roomCode - 4-letter room code (case-insensitive)
 * @param {string} userId - Authenticated user ID (from session.user.id)
 * @param {string} displayName - User's chosen display name (2-20 chars)
 * @param {string} avatar - Avatar identifier/emoji
 * @returns {Promise<Participant>} Participant record (inserted or updated)
 * @throws {Error} If room not found or join fails
 */
export async function joinRoom(
  roomCode: string,
  userId: string,
  displayName: string,
  avatar: string
): Promise<Participant> {
  // Find room by code
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('id')
    .eq('code', roomCode.toUpperCase())
    .single()

  if (roomError || !room) {
    throw new Error('Room not found')
  }

  // Upsert participant (insert if new, update if exists)
  const { data: participant, error: participantError } = await supabase
    .from('participants')
    .upsert(
      {
        room_id: room.id,
        user_id: userId,
        display_name: displayName,
        avatar_id: avatar,
        role: 'player',
      },
      {
        onConflict: 'room_id,user_id',
        ignoreDuplicates: false, // Update existing record
      }
    )
    .select()
    .single()

  if (participantError) throw participantError
  if (!participant) throw new Error('Failed to join room: no data returned')

  return participant
}

/**
 * Retrieves room by code.
 *
 * @param {string} code - 4-letter room code (case-insensitive)
 * @returns {Promise<Room | null>} Room if found, null otherwise
 */
export async function getRoomByCode(code: string): Promise<Room | null> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single()

  if (error) return null
  return data
}

/**
 * Kicks a participant from the room (soft delete).
 *
 * Sets is_active to false instead of hard deleting to preserve data
 * for reconnection detection and audit trail.
 *
 * @param {string} participantId - ID of participant to kick
 * @throws {Error} If update fails
 */
export async function kickParticipant(participantId: string): Promise<void> {
  const { error } = await supabase
    .from('participants')
    .update({ is_active: false })
    .eq('id', participantId)

  if (error) throw error
}

/**
 * Updates a participant's display name.
 *
 * Includes updated_at timestamp for audit trail.
 *
 * @param {string} participantId - ID of participant to update
 * @param {string} displayName - New display name (2-20 chars)
 * @throws {Error} If update fails
 */
export async function updateParticipantName(
  participantId: string,
  displayName: string
): Promise<void> {
  const { error } = await supabase
    .from('participants')
    .update({
      display_name: displayName,
      updated_at: new Date().toISOString(),
    })
    .eq('id', participantId)

  if (error) throw error
}

/**
 * Starts the game by changing room status to active.
 *
 * Simple status transition - no phase change yet (Phase 5 will handle phase advancement).
 *
 * @param {string} roomId - ID of room to start
 * @throws {Error} If update fails
 */
export async function startGame(roomId: string): Promise<void> {
  const { error } = await supabase
    .from('rooms')
    .update({ status: 'active' })
    .eq('id', roomId)

  if (error) throw error
}
