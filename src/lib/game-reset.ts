import { supabase } from './supabase'

/**
 * Resets the game state while preserving all participants.
 *
 * This function performs the following operations:
 * 1. Deletes all messages in the room (clears chat history)
 * 2. Resets the room phase to "Night 1" (starting phase)
 * 3. Resets all participants to "alive" status with cleared custom_status
 *
 * What it does NOT change:
 * - Room code, status, or storyteller
 * - Participant list (no one is kicked)
 * - Participant display names or avatars
 * - Room expiration time
 *
 * Use case: Storyteller wants to restart the game (practice run, false start,
 * rule changes) without making everyone rejoin the room.
 *
 * @param roomId - The UUID of the room to reset
 * @throws Error if any database operation fails
 */
export async function resetGame(roomId: string): Promise<void> {
  // Step 1: Delete all messages in the room
  const { error: messagesError } = await supabase
    .from('messages')
    .delete()
    .eq('room_id', roomId)

  if (messagesError) {
    throw new Error(`Failed to delete messages: ${messagesError.message}`)
  }

  // Step 2: Reset room phase to "Night 1"
  const { error: roomError } = await supabase
    .from('rooms')
    .update({ phase: 'Night 1' })
    .eq('id', roomId)

  if (roomError) {
    throw new Error(`Failed to reset room phase: ${roomError.message}`)
  }

  // Step 3: Reset all participants to alive status with cleared custom_status
  const { error: participantsError } = await supabase
    .from('participants')
    .update({ status: 'alive', custom_status: null })
    .eq('room_id', roomId)

  if (participantsError) {
    throw new Error(
      `Failed to reset participant status: ${participantsError.message}`
    )
  }
}
