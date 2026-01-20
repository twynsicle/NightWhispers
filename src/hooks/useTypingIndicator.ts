import { useState, useEffect } from 'react'
import { useDebouncedValue } from '@mantine/hooks'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Typing indicator timing constants
const TYPING_DEBOUNCE_MS = 1000 // Debounce typing updates to max once per second
const TYPING_AUTO_CLEAR_MS = 3000 // Auto-clear typing after 3s inactivity
const TYPING_STALE_THRESHOLD_MS = 10000 // Consider entries stale after 10s (Presence cleanup: 30s)

/**
 * Typing indicator hook using Supabase Presence.
 *
 * Implements RESEARCH.md Pattern 4 (Typing Indicator with Presence + Debounce).
 * Uses Presence CRDT for conflict-free state merging and automatic cleanup on disconnect.
 *
 * Debouncing prevents spam:
 * - 1s debounce: Updates Presence max once per second (not on every keystroke)
 * - 3s auto-clear: Typing indicator disappears after 3 seconds of inactivity
 *
 * @param channel - Realtime channel for Presence tracking
 * @param participantId - Current user's participant ID
 * @returns setIsTyping function and typingUsers array
 */
export function useTypingIndicator(
  channel: RealtimeChannel | null,
  participantId: string
): {
  setIsTyping: (typing: boolean) => void
  typingUsers: string[]
} {
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [debouncedTyping] = useDebouncedValue(isTyping, TYPING_DEBOUNCE_MS)

  // Update Presence when debounced state changes
  useEffect(() => {
    if (!channel) return

    channel.track({
      participantId,
      typing: debouncedTyping,
      timestamp: new Date().toISOString(),
    })
  }, [debouncedTyping, channel, participantId])

  // Auto-clear typing after inactivity
  useEffect(() => {
    if (!isTyping) return

    const timeout = setTimeout(() => setIsTyping(false), TYPING_AUTO_CLEAR_MS)
    return () => clearTimeout(timeout)
  }, [isTyping])

  // Subscribe to Presence sync events
  useEffect(() => {
    if (!channel) return

    const handlePresenceSync = () => {
      const presenceState = channel.presenceState()
      const users = getTypingUsers(presenceState, participantId)
      setTypingUsers(users)
    }

    // Subscribe to presence events
    channel.on('presence', { event: 'sync' }, handlePresenceSync)

    // Initial state
    handlePresenceSync()

    // No cleanup needed - channel cleanup handled by parent component
  }, [channel, participantId])

  return { setIsTyping, typingUsers }
}

/**
 * Presence state entry from Supabase Realtime
 */
interface PresenceEntry {
  participantId: string
  typing: boolean
  timestamp: string
}

/**
 * Extract typing users from Presence state.
 *
 * Filters out:
 * - Current participant (don't show "You are typing...")
 * - Stale entries (older than 10 seconds - Presence cleanup takes 30s)
 *
 * Note: Returns empty array if all entries are stale, which correctly hides
 * the typing indicator in the UI (MessageList checks typingUsers.length > 0)
 *
 * @param presenceState - Presence state from channel.presenceState()
 * @param currentParticipantId - Current user's participant ID
 * @returns Array of participant IDs currently typing (empty if none)
 */
export function getTypingUsers(
  presenceState: Record<string, unknown[]>,
  currentParticipantId: string
): string[] {
  const typingUsers: string[] = []

  for (const [, presences] of Object.entries(presenceState)) {
    // Each key can have multiple presence entries (CRDT merging)
    // Take first presence (latest via CRDT)
    const latestPresence = presences[0] as PresenceEntry | undefined

    if (
      latestPresence?.typing &&
      latestPresence.participantId !== currentParticipantId
    ) {
      // Filter out stale entries
      const timestamp = new Date(latestPresence.timestamp)
      const age = Date.now() - timestamp.getTime()

      if (age < TYPING_STALE_THRESHOLD_MS) {
        typingUsers.push(latestPresence.participantId)
      }
    }
  }

  return typingUsers
}
