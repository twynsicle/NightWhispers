import { supabase } from '../../../lib/supabase'

/**
 * Leave a room by soft-deleting the participant.
 *
 * This performs a soft delete by setting is_active = false rather than
 * removing the participant record. This approach:
 * - Preserves audit trail (who was in the room)
 * - Allows detection by existing postgres_changes subscriptions
 * - Enables potential future "rejoin" functionality
 *
 * The existing useParticipants hook filters to is_active = true,
 * so the participant will disappear from participant lists.
 *
 * The existing kicked detection in RoomPage (postgres_changes on
 * participants.is_active) will trigger automatic redirect for
 * the leaving participant.
 *
 * @param participantId - The participant's UUID to soft-delete
 * @throws Error if the database update fails
 */
export async function leaveRoom(participantId: string): Promise<void> {
  const { error } = await supabase
    .from('participants')
    .update({ is_active: false })
    .eq('id', participantId)

  if (error) {
    throw new Error(`Failed to leave room: ${error.message}`)
  }
}
