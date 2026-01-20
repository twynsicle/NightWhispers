import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Unread message count hook.
 *
 * Implements RESEARCH.md Pattern 3 (Unread Message Tracking with last_read_at).
 * Uses database timestamp comparison for race-condition safe unread counting.
 *
 * Pattern: created_at > last_read_at
 * - NULL last_read_at means "never read" (all messages are unread)
 * - Database server timestamps prevent clock skew issues
 *
 * @param roomId - Room ID
 * @param participantId - Current user's participant ID
 * @param conversationParticipantId - Conversation partner's participant ID (null for broadcast)
 * @returns Unread message count
 */
export function useUnreadCount(
  roomId: string,
  participantId: string,
  conversationParticipantId: string | null
): number {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        // Get current user's last_read_at for this conversation
        const { data: participant, error: participantError } = await supabase
          .from('participants')
          .select('last_read_at')
          .eq('id', participantId)
          .single()

        if (participantError) {
          console.error('Error fetching participant:', participantError)
          return
        }

        // Default to epoch if never read (all messages unread)
        const lastReadAt = participant?.last_read_at || '1970-01-01T00:00:00Z'

        // Count messages created after last_read_at
        let query = supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', roomId)
          .gt('created_at', lastReadAt)

        // Filter by conversation type
        if (conversationParticipantId) {
          // 1-to-1 conversation: count messages FROM the other participant TO current user
          // (Don't count messages current user sent to them)
          query = query
            .eq('sender_id', conversationParticipantId)
            .eq('recipient_id', participantId)
        } else {
          // Broadcast messages only
          query = query.eq('is_broadcast', true)
        }

        const { count, error: countError } = await query

        if (countError) {
          console.error('Error counting unread messages:', countError)
          return
        }

        setUnreadCount(count || 0)
      } catch (error) {
        console.error('Error in useUnreadCount:', error)
      }
    }

    fetchUnreadCount()

    // Refetch on interval (optional - could subscribe to Broadcast for real-time updates)
    const interval = setInterval(fetchUnreadCount, 5000) // Refetch every 5 seconds

    return () => clearInterval(interval)
  }, [roomId, participantId, conversationParticipantId])

  return unreadCount
}

/**
 * Mark conversation as read.
 *
 * Updates last_read_at to current database server timestamp.
 * Uses NOW() to prevent clock skew issues between client and server.
 *
 * @param participantId - Current user's participant ID
 */
export async function markConversationRead(
  participantId: string
): Promise<void> {
  // Use database server timestamp (NOW()) not client timestamp
  const { error } = await supabase
    .from('participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('id', participantId)

  if (error) {
    console.error('Error marking conversation read:', error)
  }
}
