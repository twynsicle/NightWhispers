# Phase 4: Core Messaging - Research

**Researched:** 2026-01-19
**Domain:** Supabase Realtime messaging (Broadcast, Presence, Postgres Changes)
**Confidence:** HIGH

## Summary

Phase 4 implements real-time private messaging between Storyteller and players using Supabase Realtime. The standard approach uses **Broadcast for message delivery** (low-latency, high throughput), **Postgres for message persistence** (database storage), and **Presence for typing indicators** (ephemeral state sync). This hybrid pattern separates concerns: Broadcast handles ephemeral real-time events while Postgres ensures messages survive reconnection.

Broadcast achieves 224,000 msgs/sec with 32,000 concurrent users (6ms median latency), dramatically outperforming Postgres Changes which processes on a single thread and triggers RLS checks for every subscribed user. For chat messaging, Broadcast with database persistence is the proven pattern—messages flow through WebSocket channels for instant delivery while being written to database for history retrieval.

**Primary recommendation:** Use Broadcast channels per room for message delivery with `ack: true` for send confirmation, persist messages to Postgres with `last_read_at` timestamps for unread tracking, use Presence with debounced typing state, and implement cursor-based pagination for message history loading.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | 2.90.0 | Broadcast, Presence, Postgres Changes | Official client, handles WebSocket lifecycle automatically |
| PostgreSQL (via Supabase) | Latest | Message persistence, unread tracking | ACID guarantees, RLS policies, full-text search capabilities |
| React | 19.x | UI state management | Already in stack, useEffect for subscription lifecycle |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @mantine/core | 8.x | ScrollArea, TextInput, Notification | Message list UI, input controls, delivery feedback |
| @mantine/hooks | 8.x | useDebouncedValue | Typing indicator throttling (prevent spam) |
| date-fns | Latest | Message timestamp formatting | "2 minutes ago", "Jan 19 at 2:30 PM" |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Broadcast for messaging | Postgres Changes | Postgres Changes: 10,000 msgs/sec max, single-threaded, 100 RLS checks per insert for 100 users |
| Presence for typing | Manual Broadcast events | Presence has built-in CRDT for state merging, auto-cleanup on disconnect |
| PostgreSQL for persistence | In-memory only (Redis) | Ephemeral messages acceptable per requirements, but reconnection requirement (MSG-06) needs persistence |
| Cursor-based pagination | Offset/limit | Offset/limit breaks when new messages arrive mid-pagination |

**Installation:**
All core dependencies already in package.json. Optional: `npm install date-fns` for timestamp formatting.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── hooks/
│   ├── useMessages.ts           # Broadcast subscription + message history
│   ├── useTypingIndicator.ts    # Presence tracking for typing state
│   └── useUnreadCount.ts        # Track unread messages per conversation
├── components/
│   ├── MessageList.tsx          # Scrollable message history with pagination
│   ├── MessageInput.tsx         # Text input with typing indicator emission
│   ├── ConversationList.tsx     # Player cards with unread badges
│   └── TypingIndicator.tsx      # "Storyteller is typing..." display
└── lib/
    └── message-helpers.ts       # Message sending, broadcast helpers
```

### Pattern 1: Broadcast Channel Architecture
**What:** Room-scoped channel for all messaging within a game session
**When to use:** Real-time message delivery between Storyteller and players
**Example:**
```typescript
// Source: https://supabase.com/docs/guides/realtime/broadcast
// Channel naming: room:{roomId} (all participants subscribe to same channel)
const messagesChannel = supabase.channel(`room:${roomId}`, {
  config: {
    broadcast: {
      ack: true,        // Confirm server receipt
      self: false,      // Don't receive own messages via Broadcast (use optimistic UI)
    },
    presence: {
      key: participantId, // Unique presence key per participant
    },
  },
})

// Subscribe to Broadcast events and Presence
messagesChannel
  .on('broadcast', { event: 'message' }, (payload) => {
    // Real-time message delivery
    setMessages((prev) => [...prev, payload.payload])
  })
  .on('presence', { event: 'sync' }, () => {
    // Update typing indicators from presence state
    const state = messagesChannel.presenceState()
    setTypingUsers(extractTypingUsers(state))
  })
  .subscribe()
```

### Pattern 2: Message Persistence with Broadcast
**What:** Write to database + broadcast to channel (dual write pattern)
**When to use:** Sending messages that must survive reconnection
**Example:**
```typescript
// Source: https://supabase.com/docs/guides/realtime/broadcast
async function sendMessage(content: string, recipientId: string | null) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  // 1. Persist to database (for history retrieval)
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      room_id: roomId,
      sender_id: participantId,
      recipient_id: recipientId, // null for broadcast
      content: content,
      is_broadcast: recipientId === null,
    })
    .select()
    .single()

  if (error) throw error

  // 2. Broadcast to real-time channel (for instant delivery)
  const ackResponse = await messagesChannel.send({
    type: 'broadcast',
    event: 'message',
    payload: message,
  })

  // ackResponse = 'ok' if ack: true in channel config
  if (ackResponse !== 'ok') {
    console.error('Broadcast failed, message persisted but not delivered')
  }

  return message
}
```

### Pattern 3: Unread Message Tracking with last_read_at
**What:** Track per-user last read timestamp to calculate unread count
**When to use:** Display unread badges on player cards (MSG-05 requirement)
**Example:**
```typescript
// Source: https://dev.to/anoopfranc/how-would-you-make-it-efficient-and-optimized-way-of-tracking-unread-message-per-user-3o00
// Database schema: Add last_read_at to participants table
// ALTER TABLE participants ADD COLUMN last_read_at TIMESTAMPTZ;

// Update last read timestamp when user views conversation
async function markConversationRead(conversationParticipantId: string) {
  await supabase
    .from('participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('id', participantId)
}

// Query unread count (efficient single query)
async function getUnreadCount(conversationParticipantId: string) {
  // Get their last_read_at timestamp
  const { data: participant } = await supabase
    .from('participants')
    .select('last_read_at')
    .eq('id', participantId)
    .single()

  // Count messages created after last_read_at from that conversation
  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', roomId)
    .or(`sender_id.eq.${conversationParticipantId},recipient_id.eq.${conversationParticipantId}`)
    .gt('created_at', participant?.last_read_at || '1970-01-01')

  return count || 0
}
```

### Pattern 4: Typing Indicator with Presence + Debounce
**What:** Use Presence to sync typing state, debounce to prevent spam
**When to use:** MSG-07 typing indicator requirement
**Example:**
```typescript
// Source: https://supabase.com/docs/guides/realtime/presence
// Source: https://www.developerway.com/posts/debouncing-in-react
import { useDebouncedValue } from '@mantine/hooks'

function useTypingIndicator(channel: RealtimeChannel, participantId: string) {
  const [isTyping, setIsTyping] = useState(false)
  const [debouncedTyping] = useDebouncedValue(isTyping, 1000) // 1s debounce

  // Update Presence when debounced state changes
  useEffect(() => {
    if (!channel) return

    channel.track({
      participantId,
      typing: debouncedTyping,
      timestamp: new Date().toISOString(),
    })
  }, [debouncedTyping, channel, participantId])

  // Clear typing state after 3 seconds of inactivity
  useEffect(() => {
    if (!isTyping) return

    const timeout = setTimeout(() => setIsTyping(false), 3000)
    return () => clearTimeout(timeout)
  }, [isTyping])

  return { setIsTyping }
}

// Extract typing users from presence state
function extractTypingUsers(presenceState: Record<string, any[]>) {
  const typingUsers: string[] = []

  for (const [key, presences] of Object.entries(presenceState)) {
    // Each key can have multiple presence entries (CRDT merging)
    const latestPresence = presences[0]
    if (latestPresence?.typing) {
      typingUsers.push(latestPresence.participantId)
    }
  }

  return typingUsers
}
```

### Pattern 5: Message History with Cursor-Based Pagination
**What:** Load message history using ID-based pagination (not offset)
**When to use:** Initial message load, "Load More" history scrolling
**Example:**
```typescript
// Source: https://getstream.io/chat/docs/react/channel_pagination/
// Source: https://api.slack.com/methods/conversations.history
async function loadMessageHistory(
  roomId: string,
  recipientId: string | null,
  cursor?: string, // UUID of oldest message currently loaded
  limit = 50
) {
  let query = supabase
    .from('messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(limit)

  // Filter by conversation (1-to-1 or broadcast)
  if (recipientId) {
    // Private conversation: messages where sender or recipient matches
    query = query.or(
      `and(sender_id.eq.${participantId},recipient_id.eq.${recipientId}),` +
      `and(sender_id.eq.${recipientId},recipient_id.eq.${participantId})`
    )
  } else {
    // Broadcast messages only
    query = query.eq('is_broadcast', true)
  }

  // Cursor-based pagination: load messages older than cursor
  if (cursor) {
    query = query.lt('id', cursor)
  }

  const { data, error } = await query

  if (error) throw error

  // Return messages in chronological order (reverse DESC query)
  return data?.reverse() || []
}
```

### Pattern 6: Subscription Lifecycle with Cleanup
**What:** Proper channel subscription and cleanup in React useEffect
**When to use:** All Broadcast/Presence subscriptions in components
**Example:**
```typescript
// Source: https://github.com/orgs/supabase/discussions/8573
// Source: https://www.codu.co/niall/real-time-table-changes-in-supabase-with-react-js-next-js-swmgqmq9
function useMessages(roomId: string, recipientId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Load initial message history
    loadMessageHistory(roomId, recipientId).then((data) => {
      setMessages(data)
      setLoading(false)
    })

    // 2. Subscribe to real-time Broadcast
    const channel = supabase
      .channel(`room:${roomId}`)
      .on('broadcast', { event: 'message' }, (payload) => {
        const newMessage = payload.payload as Message

        // Filter: only add if it belongs to this conversation
        const isRelevant = recipientId
          ? newMessage.recipient_id === recipientId || newMessage.sender_id === recipientId
          : newMessage.is_broadcast

        if (isRelevant) {
          setMessages((prev) => [...prev, newMessage])
        }
      })
      .subscribe()

    // 3. Cleanup on unmount (CRITICAL for memory leak prevention)
    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, recipientId])

  return { messages, loading }
}
```

### Pattern 7: Broadcast to Multiple Recipients
**What:** Storyteller sends same message to all players (MSG-04 requirement)
**When to use:** Storyteller broadcast feature (e.g., "Night falls...")
**Example:**
```typescript
// Source: https://blog.bytebytego.com/p/messaging-patterns-explained-pub
// Pub-Sub pattern: Single insert, all subscribers receive via Broadcast
async function sendBroadcastMessage(content: string) {
  // 1. Persist as broadcast message (recipient_id = null, is_broadcast = true)
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      room_id: roomId,
      sender_id: storytellerParticipantId,
      recipient_id: null, // NULL indicates broadcast
      content: content,
      is_broadcast: true,
    })
    .select()
    .single()

  if (error) throw error

  // 2. Broadcast to channel (all room participants subscribed)
  await messagesChannel.send({
    type: 'broadcast',
    event: 'message',
    payload: message,
  })

  // RLS policies ensure all players see is_broadcast=true messages
  // No need to iterate over players - pub-sub handles fan-out
  return message
}
```

### Anti-Patterns to Avoid
- **Using Postgres Changes for chat messages:** Single-threaded, triggers 100 RLS checks for 100 subscribers, max 10K msgs/sec vs 224K for Broadcast
- **Broadcast without database persistence:** Messages lost on reconnection (violates MSG-06)
- **Offset/limit pagination:** Breaks when new messages arrive (use cursor-based `id_lt` instead)
- **No typing indicator debounce:** Spams Presence updates on every keystroke (throttle to 1-2 seconds)
- **Forgetting channel cleanup:** Memory leaks from unclosed WebSocket connections (always `removeChannel` in useEffect cleanup)
- **Creating new channel on every render:** Use useMemo/useRef to persist channel instance across renders
- **Storing all messages in state:** Memory issues with long conversations (use pagination, load on demand)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Message ordering | Custom timestamp comparison | PostgreSQL `ORDER BY created_at` + cursor pagination | Database handles clock skew, index optimization, consistent ordering |
| Typing indicator state sync | Manual Broadcast events | Supabase Presence with CRDT | Presence auto-merges state, handles disconnection cleanup, conflict-free |
| Unread count calculation | In-memory message tracking | Database query with `last_read_at` timestamp | Survives refresh, works across devices, handles concurrent updates |
| Message delivery confirmation | Custom acknowledgment events | Broadcast `ack: true` config | Built-in server acknowledgment, promise resolves on confirmation |
| WebSocket reconnection | Manual reconnect logic | Supabase client auto-reconnect | Handles exponential backoff, network state detection, authentication refresh |
| Presence state merging | Manual conflict resolution | Presence CRDT (Conflict-free Replicated Data Type) | Mathematically proven consistency, handles concurrent updates, auto-cleanup |
| Message history pagination | Load all messages, filter client-side | Cursor-based database queries | Scales to thousands of messages, reduces bandwidth, faster load times |

**Key insight:** Supabase Realtime handles complex distributed systems challenges (state merging, reconnection, message ordering) that are error-prone to implement manually. Broadcast's built-in acknowledgment and Presence's CRDT are production-hardened for chat applications.

## Common Pitfalls

### Pitfall 1: Broadcast Message Ordering Not Guaranteed
**What goes wrong:** Messages arrive out of order due to network conditions. User sends "Hello" then "How are you?" but recipient sees them reversed.
**Why it happens:** Broadcast is UDP-like (fire-and-forget), doesn't guarantee ordering across multiple send() calls. Network latency varies per packet.
**How to avoid:**
- Always use database `created_at` timestamps as source of truth for ordering
- Sort messages by `created_at` in UI, not by arrival time
- For critical ordering (game state transitions), use Postgres Changes or add sequence numbers
- Display timestamp on each message for debugging
**Warning signs:** User reports "messages appear in wrong order," happens intermittently under poor network conditions.

### Pitfall 2: Memory Leaks from Unclosed Channels
**What goes wrong:** App slows down over time, browser memory usage grows unbounded, WebSocket connections accumulate.
**Why it happens:** Channel subscriptions not cleaned up when component unmounts. Each navigation creates new channel without closing old one.
**How to avoid:**
- Always return cleanup function from useEffect: `return () => supabase.removeChannel(channel)`
- Use React DevTools Profiler to detect mounting/unmounting issues
- Monitor WebSocket connections in browser Network tab (should be 1 per tab, not growing)
- Verify channel.state === 'closed' after unmount in tests
**Warning signs:** Memory profiler shows growing WebSocket array, Supabase dashboard shows stale connections, app freezes after navigation.

### Pitfall 3: Duplicate Messages from Dual Write Pattern
**What goes wrong:** User sees message twice—once from optimistic UI, again from Broadcast.
**Why it happens:** Message written to database, then broadcast to channel. Sender receives Broadcast event for their own message if `self: true`.
**How to avoid:**
- Set `broadcast: { self: false }` in channel config (sender doesn't receive own broadcasts)
- Add message to UI optimistically (before database insert)
- Use temporary client-side ID (UUID) for optimistic message, replace with database ID on insert
- Don't add message from Broadcast if sender is current user
**Warning signs:** Message list shows duplicate entries with same content, happens only for sender.

### Pitfall 4: Typing Indicator Spam (No Debounce)
**What goes wrong:** Presence track() called on every keystroke, network spam, poor performance.
**Why it happens:** `onChange` handler directly calls `channel.track({ typing: true })` without debouncing.
**How to avoid:**
- Use `useDebouncedValue(isTyping, 1000)` to throttle Presence updates
- Set typing=false after 3 seconds of inactivity
- Don't call track() more than once per second
- Consider throttle (regular intervals) instead of debounce (wait for pause)
**Warning signs:** Network tab shows constant Presence messages, typing indicator flickers rapidly, WebSocket bandwidth spikes.

### Pitfall 5: RLS Policy Blocks Broadcast Message Retrieval
**What goes wrong:** Player doesn't see broadcast messages in history, only 1-to-1 messages load.
**Why it happens:** RLS policy `is_broadcast = true` check missing in SELECT policy, or `recipient_id IS NULL` not handled.
**How to avoid:**
- Verify RLS policy includes `OR is_broadcast = true` clause
- Test with player account (not Storyteller) to verify broadcast visibility
- Check database directly: `SELECT * FROM messages WHERE is_broadcast = true`
- Review policy: "participants_can_view_own_messages" must allow NULL recipient_id
**Warning signs:** Storyteller sees broadcast messages, players don't. Database has messages but query returns empty.

### Pitfall 6: Last Read Timestamp Race Condition
**What goes wrong:** Unread count shows wrong number, sometimes negative, inconsistent across refreshes.
**Why it happens:** `last_read_at` updated in separate transaction from message insert. New message arrives between read timestamp update and count query.
**How to avoid:**
- Update `last_read_at` in single transaction when querying messages
- Use database server timestamp (`NOW()`) not client timestamp
- Query unread count with `created_at > last_read_at` (not >=)
- Consider eventual consistency acceptable (unread count doesn't need perfect accuracy)
**Warning signs:** Unread badge shows "1" then "0" then "1" without new messages, count varies on refresh.

### Pitfall 7: Pagination Breaks with Offset/Limit
**What goes wrong:** "Load More" shows duplicate messages or skips messages when new ones arrive.
**Why it happens:** Offset-based pagination (`OFFSET 50 LIMIT 50`) shifts when new messages insert at top. Message at position 50 becomes 51, appears twice.
**How to avoid:**
- Use cursor-based pagination with `lt('id', cursor)` (load messages older than last ID)
- Pass last message ID as cursor, not offset number
- For "load newer," use `gt('id', cursor)` with ascending order
- Offset/limit only safe for static datasets (archives, reports)
**Warning signs:** User sees same message twice when loading history, messages disappear from list, gaps in conversation.

### Pitfall 8: Presence State Not Cleaned Up on Disconnect
**What goes wrong:** Typing indicator shows "User is typing..." forever after user closes tab.
**Why it happens:** Relying on manual `untrack()` call on unmount. Ungraceful disconnect (tab close, network drop) skips cleanup.
**How to avoid:**
- Supabase auto-cleanup: Presence entries removed 30 seconds after disconnect (don't rely on manual untrack)
- Add client-side timeout: Remove typing indicator after 5 seconds
- Use `timestamp` in presence payload, filter out stale entries (older than 10 seconds)
- Test by killing tab (don't click logout), verify presence cleared within 30s
**Warning signs:** "X is typing" persists after user left, presence state grows unbounded, stale entries in presenceState().

## Code Examples

Verified patterns from official sources:

### Complete useMessages Hook with Broadcast + Persistence
```typescript
// Source: https://supabase.com/docs/guides/realtime/broadcast
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface Message {
  id: string
  room_id: string
  sender_id: string
  recipient_id: string | null
  content: string
  is_broadcast: boolean
  created_at: string
}

export function useMessages(roomId: string, participantId: string, recipientId: string | null) {
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
        .limit(50)

      // Filter by conversation type
      if (recipientId) {
        // 1-to-1 conversation
        query = query.or(
          `and(sender_id.eq.${participantId},recipient_id.eq.${recipientId}),` +
          `and(sender_id.eq.${recipientId},recipient_id.eq.${participantId})`
        )
      } else {
        // Broadcast messages
        query = query.eq('is_broadcast', true)
      }

      const { data, error } = await query

      if (!error && data) {
        setMessages(data)
      }
      setLoading(false)
    }

    loadHistory()

    // Subscribe to real-time Broadcast
    const messagesChannel = supabase
      .channel(`room:${roomId}`, {
        config: {
          broadcast: { ack: true, self: false },
        },
      })
      .on('broadcast', { event: 'message' }, (payload) => {
        const newMessage = payload.payload as Message

        // Filter: only add if relevant to this conversation
        const isRelevant = recipientId
          ? newMessage.recipient_id === recipientId || newMessage.sender_id === recipientId
          : newMessage.is_broadcast

        if (isRelevant) {
          setMessages((prev) => {
            // Prevent duplicates (message might already exist from database)
            if (prev.some((m) => m.id === newMessage.id)) return prev
            return [...prev, newMessage]
          })
        }
      })
      .subscribe()

    setChannel(messagesChannel)

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(messagesChannel)
    }
  }, [roomId, participantId, recipientId])

  // Send message function
  const sendMessage = async (content: string) => {
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        sender_id: participantId,
        recipient_id: recipientId,
        content: content,
        is_broadcast: recipientId === null,
      })
      .select()
      .single()

    if (error) throw error

    // Optimistically add to UI
    setMessages((prev) => [...prev, message])

    // Broadcast to channel
    if (channel) {
      const ackResponse = await channel.send({
        type: 'broadcast',
        event: 'message',
        payload: message,
      })

      if (ackResponse !== 'ok') {
        console.error('Broadcast acknowledgment failed')
      }
    }

    return message
  }

  return { messages, loading, sendMessage }
}
```

### Typing Indicator with Presence and Debounce
```typescript
// Source: https://supabase.com/docs/guides/realtime/presence
// Source: https://www.developerway.com/posts/debouncing-in-react
import { useEffect, useState } from 'react'
import { useDebouncedValue } from '@mantine/hooks'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useTypingIndicator(
  channel: RealtimeChannel | null,
  participantId: string
) {
  const [isTyping, setIsTyping] = useState(false)
  const [debouncedTyping] = useDebouncedValue(isTyping, 1000) // 1s debounce

  // Update Presence when debounced state changes
  useEffect(() => {
    if (!channel) return

    channel.track({
      participantId,
      typing: debouncedTyping,
      timestamp: new Date().toISOString(),
    })
  }, [debouncedTyping, channel, participantId])

  // Auto-clear typing after 3 seconds
  useEffect(() => {
    if (!isTyping) return

    const timeout = setTimeout(() => setIsTyping(false), 3000)
    return () => clearTimeout(timeout)
  }, [isTyping])

  return { setIsTyping }
}

// Extract typing users from Presence state
export function getTypingUsers(
  presenceState: Record<string, any[]>,
  currentParticipantId: string
): string[] {
  const typingUsers: string[] = []

  for (const [key, presences] of Object.entries(presenceState)) {
    const latestPresence = presences[0]
    if (
      latestPresence?.typing &&
      latestPresence.participantId !== currentParticipantId
    ) {
      // Filter out stale entries (older than 10 seconds)
      const timestamp = new Date(latestPresence.timestamp)
      const age = Date.now() - timestamp.getTime()
      if (age < 10000) {
        typingUsers.push(latestPresence.participantId)
      }
    }
  }

  return typingUsers
}
```

### Unread Count with last_read_at Timestamp
```typescript
// Source: https://dev.to/anoopfranc/how-would-you-make-it-efficient-and-optimized-way-of-tracking-unread-message-per-user-3o00
export async function getUnreadCount(
  roomId: string,
  participantId: string,
  conversationParticipantId: string | null
) {
  // Get current user's last_read_at for this conversation
  const { data: participant } = await supabase
    .from('participants')
    .select('last_read_at')
    .eq('id', participantId)
    .single()

  const lastReadAt = participant?.last_read_at || '1970-01-01T00:00:00Z'

  // Count messages created after last_read_at
  let query = supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', roomId)
    .gt('created_at', lastReadAt)

  // Filter by conversation
  if (conversationParticipantId) {
    // 1-to-1 conversation: messages from the other participant
    query = query
      .eq('sender_id', conversationParticipantId)
      .eq('recipient_id', participantId)
  } else {
    // Broadcast messages
    query = query.eq('is_broadcast', true)
  }

  const { count } = await query
  return count || 0
}

// Mark conversation as read
export async function markConversationRead(participantId: string) {
  await supabase
    .from('participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('id', participantId)
}
```

### Cursor-Based Message History Pagination
```typescript
// Source: https://getstream.io/chat/docs/react/channel_pagination/
export async function loadMoreMessages(
  roomId: string,
  participantId: string,
  recipientId: string | null,
  oldestMessageId: string, // Cursor
  limit = 50
) {
  let query = supabase
    .from('messages')
    .select('*')
    .eq('room_id', roomId)
    .lt('id', oldestMessageId) // Cursor-based: older than this ID
    .order('created_at', { ascending: false })
    .limit(limit)

  // Filter by conversation
  if (recipientId) {
    query = query.or(
      `and(sender_id.eq.${participantId},recipient_id.eq.${recipientId}),` +
      `and(sender_id.eq.${recipientId},recipient_id.eq.${participantId})`
    )
  } else {
    query = query.eq('is_broadcast', true)
  }

  const { data, error } = await query

  if (error) throw error

  // Reverse to chronological order (DESC query returns newest first)
  return data?.reverse() || []
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Postgres Changes for all real-time | Broadcast for messaging, Postgres Changes for state | Supabase Realtime v2 (2023) | 22x throughput improvement (224K vs 10K msgs/sec), eliminates RLS bottleneck |
| Offset/limit pagination | Cursor-based (ID lt/gt) | Industry standard (2020s) | Prevents duplicate/skipped messages when new data arrives |
| Manual WebSocket management | Supabase client auto-reconnect | Supabase v2 (2022) | Handles exponential backoff, auth refresh, network state detection |
| Custom presence tracking | Presence CRDT | Supabase Presence launch (2023) | Auto-merges state, conflict-free, handles disconnection cleanup |
| In-memory unread tracking | Database last_read_at timestamp | Standard pattern (2015+) | Survives refresh, works across devices, handles concurrency |

**Deprecated/outdated:**
- **Postgres Changes for chat messaging:** Use Broadcast instead (10x-22x faster, no RLS bottleneck)
- **Self-hosted WebSocket servers:** Supabase Realtime handles scaling, connection pooling, authentication
- **Custom typing indicator events:** Use Presence CRDT instead (conflict-free state merging)
- **Socket.IO for Supabase:** Use native @supabase/supabase-js Realtime (integrated auth, better DX)

## Open Questions

Things that couldn't be fully resolved:

1. **Broadcast message delivery guarantees**
   - What we know: Supabase Broadcast doesn't guarantee delivery or ordering (fire-and-forget)
   - What's unclear: What percentage of messages drop under typical network conditions?
   - Recommendation: Use dual-write pattern (database + Broadcast). Database ensures persistence, Broadcast provides speed. If Broadcast fails, users see message on next history load. Monitor for user reports of "missing messages" in testing.

2. **Optimal message history page size**
   - What we know: Slack uses max 200 messages per page, Stream Chat uses 100, mobile apps use 25-50
   - What's unclear: What's optimal for mobile-first Blood on the Clocktower gameplay? (likely short bursts of messages)
   - Recommendation: Start with 50 messages initial load, 25 per "Load More" pagination. Monitor ScrollArea performance on low-end devices. Adjust if scrolling lags.

3. **Typing indicator timeout duration**
   - What we know: Common timeouts are 3-5 seconds for auto-clear, 1-2 seconds for debounce
   - What's unclear: What feels natural for game night messaging? (less formal than workplace chat)
   - Recommendation: Use 1s debounce + 3s auto-clear. Test with real game sessions. If "X is typing" feels spammy, increase debounce to 2s.

4. **Unread count update frequency**
   - What we know: Database query for unread count is efficient but not free (RLS check + COUNT aggregation)
   - What's unclear: Should unread count update real-time (every new message) or on-demand (when viewing conversation list)?
   - Recommendation: Update real-time via Broadcast event payload (`unread_count` field), fall back to database query on mount. Cache for 5 seconds to prevent spam.

## Sources

### Primary (HIGH confidence)
- [Broadcast | Supabase Docs](https://supabase.com/docs/guides/realtime/broadcast)
- [Presence | Supabase Docs](https://supabase.com/docs/guides/realtime/presence)
- [Subscribing to Database Changes | Supabase Docs](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes)
- [Realtime Benchmarks | Supabase Docs](https://supabase.com/docs/guides/realtime/benchmarks)
- [Realtime Concepts | Supabase Docs](https://supabase.com/docs/guides/realtime/concepts)

### Secondary (MEDIUM confidence)
- [GitHub - supabase/realtime: Broadcast, Presence, and Postgres Changes via WebSockets](https://github.com/supabase/realtime)
- [How Would You Make It: Efficient and optimized way of tracking unread message per user - DEV Community](https://dev.to/anoopfranc/how-would-you-make-it-efficient-and-optimized-way-of-tracking-unread-message-per-user-3o00)
- [Channel Pagination - React chat | Stream Chat Docs](https://getstream.io/chat/docs/react/channel_pagination/)
- [How to debounce and throttle in React without losing your mind](https://www.developerway.com/posts/debouncing-in-react)
- [Implementing Message Persistence in Real Time Chat Applications - DEV Community](https://dev.to/hexshift/implementing-message-persistence-in-real-time-chat-applications-18eo)
- [Issues with un-subscribing from real time broadcast with React 18 (Nextjs 12) · Discussion #8573](https://github.com/orgs/supabase/discussions/8573)
- [Real-time Table Changes in Supabase with React.js/Next.js | Codú](https://www.codu.co/niall/real-time-table-changes-in-supabase-with-react-js-next-js-swmgqmq9)

### Tertiary (LOW confidence)
- [Supabase Realtime | Client-Side Memory Leak - DrDroid](https://drdroid.io/stack-diagnosis/supabase-realtime-client-side-memory-leak)
- [Messaging Patterns Explained: Pub-Sub, Queues, and Event Streams | ByteByteGo](https://blog.bytebytego.com/p/messaging-patterns-explained-pub)
- [System Design — Newly Unread Message Indicator | Medium](https://medium.com/@krutilin.sergey.ks/system-design-newly-unread-message-indicator-bb118492af92)
- [Building a Chat with Typing Indicator in React, RxJS and polyrhythm - DEV Community](https://dev.to/deanius/building-a-chat-with-typing-indicator-in-rxjs-and-polyrhythm-1bgh)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Broadcast, Presence, Postgres verified in official Supabase docs
- Architecture: HIGH - Patterns extracted from official docs + verified community implementations
- Pitfalls: MEDIUM - Based on GitHub issues, community discussions, and documented limitations
- Performance: HIGH - Benchmarks from official Supabase Realtime performance testing

**Research date:** 2026-01-19
**Valid until:** 2026-02-03 (15 days - fast-moving real-time ecosystem, Supabase updates frequently)
