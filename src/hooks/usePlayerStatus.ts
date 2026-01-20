import { supabase } from '../lib/supabase'
import { MAX_CUSTOM_STATUS_LENGTH } from '../lib/constants'

/**
 * Toggle a participant's alive/dead status.
 *
 * Fetches current status and toggles between 'alive' and 'dead'.
 * Updates participants table with new status.
 *
 * @param participantId - ID of participant to toggle
 * @returns Updated status ('alive' or 'dead')
 * @throws Error if participant not found or update fails
 */
export async function toggleDead(
  participantId: string
): Promise<'alive' | 'dead'> {
  // Fetch current status
  const { data: participant, error: fetchError } = await supabase
    .from('participants')
    .select('status')
    .eq('id', participantId)
    .single()

  if (fetchError) {
    throw new Error(`Failed to fetch participant: ${fetchError.message}`)
  }

  if (!participant) {
    throw new Error('Participant not found')
  }

  // Toggle status
  const newStatus: 'alive' | 'dead' =
    participant.status === 'alive' ? 'dead' : 'alive'

  // Update status in database
  const { error: updateError } = await supabase
    .from('participants')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', participantId)

  if (updateError) {
    throw new Error(`Failed to update status: ${updateError.message}`)
  }

  return newStatus
}

/**
 * Set custom status text for a participant.
 *
 * Updates participants.custom_status column.
 * Pass null to clear custom status.
 *
 * @param participantId - ID of participant to update
 * @param customStatus - Custom status text (max 50 chars) or null to clear
 * @throws Error if update fails
 */
export async function setCustomStatus(
  participantId: string,
  customStatus: string | null
): Promise<void> {
  // Validate custom status length
  if (customStatus && customStatus.length > MAX_CUSTOM_STATUS_LENGTH) {
    throw new Error(
      `Custom status must be ${MAX_CUSTOM_STATUS_LENGTH} characters or less`
    )
  }

  const { error } = await supabase
    .from('participants')
    .update({
      custom_status: customStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', participantId)

  if (error) {
    throw new Error(`Failed to update custom status: ${error.message}`)
  }
}
