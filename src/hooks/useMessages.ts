import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Message } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { sendMessage as sendMessageHelper } from '../lib/message-helpers'

/**
 * Real-time messaging hook with Broadcast subscription.
 *
 * Implements RESEARCH.md Pattern 6 (Subscription Lifecycle):
 * - Loads initial message history from database (cursor-based pagination)
 * - Subscribes to Broadcast channel for real-time message delivery
 * - Filters messages by conversation (1-to-1 or broadcast)
 * - Uses self: false to prevent duplicate messages (optimistic UI handles sender's own messages)
 *
 * Use Broadcast (not Postgres Changes) for messaging per RESEARCH.md:
 * - 224K msgs/sec vs 10K for Postgres Changes (22x faster)
 * - No RLS bottleneck (100 RLS checks per message for 100 users)
 * - Lower latency (6ms median vs 100ms+)
 *
 * @param roomId - Room ID to load messages for
 * @param participantId - Current user's participant ID
 * @param recipientId - Conversation recipient ID (null for broadcast messages)
 * @returns Messages array, loading state, sendMessage function, and channel instance
 */
export function useMessages(
  roomId: string,
  participantId: string,
  recipientId: string | null
): {
  messages: Message[]
  loading: boolean
  sendMessage: (content: string) => Promise<Message>
  channel: RealtimeChannel | null
} {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    // Load initial message history
    const loadHistory = async () => {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50) // Initial load: 50 messages (per RESEARCH.md Open Questions)

      // Filter by conversation type (Pattern 5: Conversation Filters)
      if (recipientId) {
        // 1-to-1 conversation: messages between participantId and recipientId OR broadcasts
        query = query.or(
          `and(sender_id.eq.${participantId},recipient_id.eq.${recipientId}),` +
            `and(sender_id.eq.${recipientId},recipient_id.eq.${participantId}),` +
            `is_broadcast.eq.true`
        )
      } else {
        // Broadcast messages only (is_broadcast = true)
        query = query.eq('is_broadcast', true)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading message history:', error)
        setLoading(false)
        return
      }

      setMessages(data || [])
      setLoading(false)
    }

    loadHistory()

    // Subscribe to real-time Broadcast (Pattern 1: Broadcast Channel Architecture)
    const messagesChannel = supabase.channel(`room:${roomId}`, {
      config: {
        broadcast: {
          ack: true, // Confirm server receipt
          self: false, // Don't receive own messages (optimistic UI handles that)
        },
      },
    })

    messagesChannel
      .on('broadcast', { event: 'message' }, (payload) => {
        const newMessage = payload.payload as Message

        // Filter: only add if relevant to this conversation
        const isRelevant = recipientId
          ? newMessage.recipient_id === recipientId ||
            newMessage.sender_id === recipientId ||
            newMessage.is_broadcast
          : newMessage.is_broadcast

        if (isRelevant) {
          setMessages((prev) => {
            // Prevent duplicates (message might already exist from database or optimistic UI)
            if (prev.some((m) => m.id === newMessage.id)) {
              return prev
            }
            return [...prev, newMessage]
          })
        }
      })
      .subscribe()

    setChannel(messagesChannel)

    // Cleanup on unmount (CRITICAL for memory leak prevention - RESEARCH.md Pitfall 2)
    return () => {
      supabase.removeChannel(messagesChannel)
    }
  }, [roomId, participantId, recipientId])

  // Send message function with optimistic UI
  const sendMessage = async (content: string): Promise<Message> => {
    // Call helper function with current channel
    const message = await sendMessageHelper(
      roomId,
      participantId,
      recipientId,
      content,
      channel
    )

    // Optimistically add to UI (sender won't receive via Broadcast due to self: false)
    setMessages((prev) => {
      // Prevent duplicates
      if (prev.some((m) => m.id === message.id)) {
        return prev
      }
      return [...prev, message]
    })

    return message
  }

  return { messages, loading, sendMessage, channel }
}
