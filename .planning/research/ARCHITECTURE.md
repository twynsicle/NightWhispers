# Architecture Research: Realtime Messaging Apps with Supabase

**Domain:** Realtime messaging / private communication apps
**Researched:** 2026-01-19
**Confidence:** HIGH (based on official Supabase documentation)

## Component Overview

### System Architecture Diagram

```
+------------------+     +-------------------+     +------------------+
|   React Client   |     |  Supabase Edge    |     |   PostgreSQL     |
|                  |     |                   |     |                  |
| +-------------+  |     | +---------------+ |     | +-------------+  |
| | Auth Context|<------->| Edge Functions | |     | | rooms       |  |
| +-------------+  |     | +---------------+ |     | +-------------+  |
|                  |     |        |         |     |        |         |
| +-------------+  |     |        v         |     | +-------------+  |
| | Room Context|  |     | +---------------+ |     | | participants|  |
| +-------------+  |     | | Supabase Auth | |     | +-------------+  |
|        |        |     | +---------------+ |     |        |         |
| +-------------+  |     |        |         |     | +-------------+  |
| | Message     |  |     |        v         |     | | messages    |  |
| | State       |  |     | +---------------+ |     | +-------------+  |
| +-------------+  |     | | PostgREST     |<------>                  |
|        |        |     | +---------------+ |     |                  |
|        v        |     |                   |     |                  |
| +-------------+  |     | +---------------+ |     |                  |
| | Supabase    |<------->| Realtime      |<------>                  |
| | Client      |  |     | | (Elixir)     | |     | (WAL via         |
| +-------------+  |     | +---------------+ |     |  Logical Rep)    |
+------------------+     +-------------------+     +------------------+
```

### Major Components

| Component | Responsibility | Technology |
|-----------|----------------|------------|
| **React Client** | UI rendering, local state, user interactions | React + TypeScript |
| **Auth Context** | Session management, anonymous auth state | React Context + Supabase Auth |
| **Room Context** | Room membership, participant tracking | React Context |
| **Message State** | Message display, optimistic updates | React state (useState/useReducer) |
| **Supabase Client** | API calls, realtime subscriptions | @supabase/supabase-js |
| **Edge Functions** | Room lifecycle, session token generation | Deno/TypeScript |
| **Supabase Auth** | Anonymous authentication, JWT issuance | Built-in Supabase service |
| **PostgREST** | REST API for database operations | Built-in Supabase service |
| **Realtime Server** | WebSocket connections, broadcast delivery | Elixir/Phoenix (built-in) |
| **PostgreSQL** | Data persistence, RLS policies | Supabase-managed Postgres |

### Component Boundaries

**Client-Side Boundaries:**
- Auth Context: Handles ONLY authentication state (user, session, tokens)
- Room Context: Handles ONLY room state (current room, participants, role)
- Message State: Handles ONLY message display (list, sending state, errors)
- Supabase Client: Single instance, shared via context or module singleton

**Server-Side Boundaries:**
- Edge Functions: Business logic only (no direct client state manipulation)
- Database: Data storage and access control (RLS enforces security)
- Realtime: Message delivery only (not persistence - that's the database's job)

## Data Flow

### Message Sending Flow (Storyteller to Player)

```
1. Storyteller types message
         |
         v
2. UI shows optimistic update (pending state)
         |
         v
3. Client sends via Broadcast channel
   channel.send({
     type: 'broadcast',
     event: 'new_message',
     payload: { content, recipientId }
   })
         |
         v
4. Realtime server delivers to recipient
   (via WebSocket to player's channel subscription)
         |
         v
5. (Parallel) Client persists to database
   supabase.from('messages').insert({...})
         |
         v
6. Database confirms insert
         |
         v
7. UI updates optimistic state to confirmed
```

### Message Receiving Flow (Player)

```
1. Player subscribes to room channel on join
   supabase.channel(`room:${roomId}`)
     .on('broadcast', { event: 'new_message' }, handler)
     .subscribe()
         |
         v
2. Realtime server pushes message via WebSocket
         |
         v
3. Client handler receives payload
         |
         v
4. Update local message state
         |
         v
5. UI re-renders with new message
```

### Room Join Flow (Anonymous User)

```
1. User enters room code
         |
         v
2. Client calls Edge Function: create-session
   POST /functions/v1/create-session
   { roomCode, displayName }
         |
         v
3. Edge Function:
   - Validates room exists and is active
   - Creates participant record
   - Generates session token
   - Returns { sessionToken, roomId, participantId }
         |
         v
4. Client:
   - Stores session token in localStorage
   - Signs in anonymously to Supabase Auth
   - Subscribes to room channel
         |
         v
5. Realtime:
   - Validates subscription via RLS
   - Adds client to channel
```

### Data Persistence Strategy

**What gets persisted (PostgreSQL):**
- Rooms (id, code, storyteller_id, created_at, expires_at)
- Participants (id, room_id, display_name, role, session_token, is_active)
- Messages (id, room_id, sender_id, recipient_id, content, created_at)

**What is transient (Broadcast only):**
- Typing indicators
- Presence updates
- Read receipts (optional)

**Persistence timing:**
- Messages: Persist on send (before broadcast for guaranteed durability)
- Rooms: Persist on creation via Edge Function
- Participants: Persist on join via Edge Function

## Supabase Realtime Patterns

### Pattern 1: Broadcast for Messaging (Recommended)

Supabase explicitly recommends Broadcast over Postgres Changes for messaging apps.

**Why:**
- Lower latency (direct client-to-client via server)
- No database load for message delivery
- More control over message format
- No RLS overhead on message delivery path

**Implementation:**
```typescript
// Subscribe to room channel
const channel = supabase.channel(`room:${roomId}`, {
  config: { private: true }  // Requires RLS policies
})

// Listen for messages
channel.on('broadcast', { event: 'new_message' }, (payload) => {
  addMessage(payload.payload)
})

// Send message
channel.send({
  type: 'broadcast',
  event: 'new_message',
  payload: {
    id: crypto.randomUUID(),
    content: messageText,
    senderId: participantId,
    recipientId: recipientId,  // null for Storyteller broadcasts
    createdAt: new Date().toISOString()
  }
})
```

### Pattern 2: Private Channels with RLS

For the asymmetric messaging constraint (Storyteller can message anyone, players cannot message each other), use RLS policies on `realtime.messages`.

**Channel Authorization:**
```sql
-- Enable RLS on realtime.messages
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to receive broadcasts in their room
CREATE POLICY "receive_room_broadcasts" ON realtime.messages
FOR SELECT
TO authenticated
USING (
  extension = 'broadcast'
  AND realtime.topic() ~ '^room:[a-f0-9-]+$'
  AND EXISTS (
    SELECT 1 FROM public.participants
    WHERE room_id = (regexp_match(realtime.topic(), 'room:([a-f0-9-]+)'))[1]::uuid
    AND session_token = current_setting('request.jwt.claims')::json->>'session_token'
    AND is_active = true
  )
);

-- Only Storytellers can send broadcasts to the room
CREATE POLICY "storyteller_can_broadcast" ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  extension = 'broadcast'
  AND EXISTS (
    SELECT 1 FROM public.participants
    WHERE room_id = (regexp_match(realtime.topic(), 'room:([a-f0-9-]+)'))[1]::uuid
    AND session_token = current_setting('request.jwt.claims')::json->>'session_token'
    AND role = 'storyteller'
  )
);
```

### Pattern 3: Initial Load + Subscription

Avoid missing messages between page load and subscription:

```typescript
async function loadRoomMessages(roomId: string) {
  // 1. Subscribe FIRST (captures new messages during load)
  const channel = supabase.channel(`room:${roomId}`)
    .on('broadcast', { event: 'new_message' }, handleNewMessage)
    .subscribe()

  // 2. Load existing messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })

  // 3. Set initial state
  setMessages(messages || [])

  return channel
}
```

### Pattern 4: Presence for Active Participants

Track who is currently in the room:

```typescript
const channel = supabase.channel(`room:${roomId}`)
  .on('presence', { event: 'sync' }, () => {
    const presenceState = channel.presenceState()
    setActiveParticipants(Object.values(presenceState).flat())
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        participantId,
        displayName,
        role,
        joinedAt: new Date().toISOString()
      })
    }
  })
```

### Pattern 5: Optimistic Updates with Rollback

```typescript
async function sendMessage(content: string, recipientId: string | null) {
  const tempId = crypto.randomUUID()
  const tempMessage = {
    id: tempId,
    content,
    senderId: currentParticipant.id,
    recipientId,
    createdAt: new Date().toISOString(),
    status: 'pending'
  }

  // 1. Optimistic update
  setMessages(prev => [...prev, tempMessage])

  try {
    // 2. Persist to database
    const { data, error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        sender_id: currentParticipant.id,
        recipient_id: recipientId,
        content
      })
      .select()
      .single()

    if (error) throw error

    // 3. Broadcast to recipients
    await channel.send({
      type: 'broadcast',
      event: 'new_message',
      payload: data
    })

    // 4. Update local state with confirmed message
    setMessages(prev =>
      prev.map(m => m.id === tempId ? { ...data, status: 'sent' } : m)
    )
  } catch (error) {
    // 5. Rollback on failure
    setMessages(prev => prev.filter(m => m.id !== tempId))
    showError('Failed to send message')
  }
}
```

## Suggested Build Order

Based on component dependencies, here is the recommended build order:

### Phase 1: Foundation (No Realtime Yet)

**Build:**
1. Database schema (rooms, participants, messages tables)
2. RLS policies for data access
3. Supabase client configuration
4. Basic React app structure

**Why first:** Everything depends on the database schema and client setup. Get this right before adding realtime complexity.

**Dependencies:** None

### Phase 2: Authentication & Session

**Build:**
1. Anonymous authentication flow
2. Session token generation (Edge Function)
3. Auth Context in React
4. localStorage session persistence

**Why second:** All room operations require authenticated sessions. Anonymous auth is simpler than full auth but still needs careful implementation.

**Dependencies:** Phase 1 (database schema)

### Phase 3: Room Management

**Build:**
1. Room creation (Storyteller flow)
2. Room joining (Player flow via code)
3. Edge Function for room lifecycle
4. Room Context in React
5. Participant tracking

**Why third:** Rooms are the container for all messaging. Cannot test messaging without rooms.

**Dependencies:** Phase 2 (authentication)

### Phase 4: Messaging Core

**Build:**
1. Realtime channel subscription
2. Broadcast message sending
3. Message receiving and display
4. Message persistence
5. Optimistic updates

**Why fourth:** This is the core feature but requires all previous phases.

**Dependencies:** Phase 3 (rooms), Phase 2 (auth)

### Phase 5: Privacy & Roles

**Build:**
1. Private channel authorization
2. RLS policies for realtime.messages
3. Asymmetric messaging enforcement
4. Storyteller-only broadcast capability

**Why fifth:** Get basic messaging working first, then add access control.

**Dependencies:** Phase 4 (messaging)

### Phase 6: Polish & Edge Cases

**Build:**
1. Presence tracking
2. Room expiration handling
3. Reconnection logic
4. Error states and recovery

**Why last:** These improve UX but aren't core functionality.

**Dependencies:** All previous phases

### Build Order Summary

```
Phase 1: Foundation
    |
    v
Phase 2: Auth & Session
    |
    v
Phase 3: Room Management
    |
    v
Phase 4: Messaging Core  <-- Core value delivered here
    |
    v
Phase 5: Privacy & Roles
    |
    v
Phase 6: Polish & Edge Cases
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Using Postgres Changes for Chat

**What:** Subscribing to INSERT events on messages table instead of using Broadcast.

**Why bad:**
- Higher latency (database write -> WAL -> realtime -> client)
- More database load
- RLS evaluation on every message delivery
- Doesn't scale as well

**Instead:** Use Broadcast for message delivery, persist separately.

### Anti-Pattern 2: Storing Session State Only in React

**What:** Keeping session tokens only in React state without localStorage.

**Why bad:**
- Page refresh loses session
- Browser tab close loses access
- Poor UX requiring re-join

**Instead:** Persist session token to localStorage, hydrate on mount.

### Anti-Pattern 3: Relying on Broadcast for Durability

**What:** Only sending messages via Broadcast without database persistence.

**Why bad:**
- Messages lost if recipient offline
- No message history on rejoin
- Supabase explicitly warns: "not guaranteed to arrive if the client disconnects"

**Instead:** Always persist to database, use Broadcast for live delivery.

### Anti-Pattern 4: Creating New Supabase Clients Per Component

**What:** Calling `createClient()` in multiple components.

**Why bad:**
- Multiple WebSocket connections
- Auth state desynchronization
- Memory leaks

**Instead:** Create single client instance, share via module or context.

### Anti-Pattern 5: Public Channels in Production

**What:** Using public channels (no `private: true` config) for sensitive data.

**Why bad:**
- Anyone with room ID can subscribe
- No authorization on message delivery
- Security vulnerability

**Instead:** Always use private channels with RLS policies in production.

## Sources

### Official Supabase Documentation (HIGH confidence)
- [Realtime Architecture](https://supabase.com/docs/guides/realtime/architecture)
- [Realtime Concepts](https://supabase.com/docs/guides/realtime/concepts)
- [Broadcast](https://supabase.com/docs/guides/realtime/broadcast)
- [Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Realtime Chat Component](https://supabase.com/ui/docs/nextjs/realtime-chat)

### Community Resources (MEDIUM confidence)
- [Using React Context for Supabase state management](https://edvins.io/using-react-context-for-supabase-state-management)
- [Multi-Tenant Applications with RLS on Supabase](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/)
