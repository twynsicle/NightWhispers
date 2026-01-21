import { supabase } from './supabase'
import type { Message } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { sendPushToRecipient, sendPushToRoom } from './push-subscription'

/**
 * Send a message with dual-write pattern (database + Broadcast).
 *
 * Implements Pattern 2 from RESEARCH.md:
 * 1. Persist to database for message history
 * 2. Broadcast to real-time channel for instant delivery
 * 3. Use ack: true to confirm server receipt
 *
 * @param roomId - Room ID
 * @param senderId - Sender's participant ID
 * @param recipientId - Recipient's participant ID (null for broadcast)
 * @param content - Message content
 * @param channel - Realtime channel for broadcasting (optional)
 * @returns Promise<Message> - Created message with database-generated ID
 */
export async function sendMessage(
  roomId: string,
  senderId: string,
  recipientId: string | null,
  content: string,
  channel: RealtimeChannel | null
): Promise<Message> {
  // Validate inputs
  if (!content.trim()) {
    throw new Error('Message content cannot be empty')
  }

  if (!roomId || !senderId) {
    throw new Error('Room ID and sender ID are required')
  }

  // 1. Persist to database (for history retrieval)
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      room_id: roomId,
      sender_id: senderId,
      recipient_id: recipientId,
      content: content.trim(),
      is_broadcast: recipientId === null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error inserting message:', error)
    throw error
  }

  // 2. Broadcast to real-time channel (for instant delivery)
  if (channel) {
    const ackResponse = await channel.send({
      type: 'broadcast',
      event: 'message',
      payload: message,
    })

    // ackResponse = 'ok' if ack: true in channel config
    if (ackResponse !== 'ok') {
      console.error(
        'Broadcast acknowledgment failed, message persisted but not delivered'
      )
    }
  }

  // 3. Send push notification to recipient(s)
  // Fire-and-forget - don't block message return on push delivery
  const truncatedContent =
    content.length > 100 ? content.substring(0, 97) + '...' : content

  if (recipientId) {
    // 1-to-1 message: send to specific recipient
    sendPushToRecipient(recipientId, {
      title: 'New Message',
      body: truncatedContent,
      tag: `message-${roomId}-${recipientId}`,
      url: `/room/${roomId}`,
      roomId,
    }).catch(err => {
      console.error('Failed to send push notification:', err)
    })
  } else {
    // Broadcast message: send to all subscribed participants except sender
    sendPushToRoom(roomId, senderId, {
      title: 'Broadcast',
      body: truncatedContent,
      tag: `broadcast-${roomId}`,
      url: `/room/${roomId}`,
      roomId,
    }).catch(err => {
      console.error('Failed to send broadcast push:', err)
    })
  }

  return message
}

/**
 * Send a broadcast message to all participants in the room.
 *
 * Implements Pattern 7 from RESEARCH.md (Pub-Sub pattern):
 * - Single insert with recipient_id = null, is_broadcast = true
 * - All room participants receive via Broadcast subscription
 * - RLS policies ensure all players see broadcast messages
 *
 * @param roomId - Room ID
 * @param senderId - Sender's participant ID (typically Storyteller)
 * @param content - Message content
 * @param channel - Realtime channel for broadcasting (optional)
 * @returns Promise<Message> - Created broadcast message
 */
export async function sendBroadcastMessage(
  roomId: string,
  senderId: string,
  content: string,
  channel: RealtimeChannel | null
): Promise<Message> {
  return sendMessage(roomId, senderId, null, content, channel)
}
