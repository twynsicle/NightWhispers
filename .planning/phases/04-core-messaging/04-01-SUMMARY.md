---
phase: "04"
plan: "01"
plan_name: "Message Infrastructure"
subsystem: "messaging"
completed: "2026-01-20"
duration: "5 minutes"

tags:
  - supabase
  - broadcast
  - realtime
  - messaging
  - websocket

dependency_graph:
  requires:
    - "01-02: Database schema with messages table and RLS policies"
    - "02-01: Supabase client and authentication"
  provides:
    - "Message type exports"
    - "useMessages hook for real-time messaging"
    - "sendMessage and sendBroadcastMessage helpers"
    - "Broadcast channel subscription infrastructure"
  affects:
    - "04-02: Message UI components will use useMessages hook"
    - "04-03: Player view will use recipientId=null for Storyteller conversation"
    - "04-04: Storyteller view will use recipientId per player for 1-to-1 chats"

tech_stack:
  added:
    - library: "@supabase/supabase-js Broadcast"
      purpose: "Real-time message delivery (224K msgs/sec vs 10K for Postgres Changes)"
      version: "existing"
  patterns:
    - name: "Dual-write pattern"
      description: "Database persistence + Broadcast delivery for reliability and speed"
    - name: "Cursor-based pagination ready"
      description: "Initial 50-message load with infrastructure for cursor-based history loading"
    - name: "Optimistic UI"
      description: "Sender sees message immediately, self: false prevents Broadcast duplicate"
    - name: "Channel lifecycle management"
      description: "Create on mount, cleanup on unmount to prevent memory leaks"

key_files:
  created:
    - path: "src/lib/message-helpers.ts"
      purpose: "Dual-write message sending utilities"
      exports: ["sendMessage", "sendBroadcastMessage"]
      lines: 92
    - path: "src/hooks/useMessages.ts"
      purpose: "Real-time messaging hook with Broadcast subscription"
      exports: ["useMessages"]
      lines: 140
  modified:
    - path: "src/lib/supabase.ts"
      changes: "Added Message type export"
      lines_added: 3

decisions:
  - decision: "Use Broadcast for messaging (not Postgres Changes)"
    rationale: "22x faster (224K vs 10K msgs/sec), no RLS bottleneck, 6ms latency"
    phase: "04-01"
  - decision: "Dual-write pattern (DB + Broadcast)"
    rationale: "Database ensures persistence (MSG-06 requirement), Broadcast provides speed (MSG-03 requirement)"
    phase: "04-01"
  - decision: "self: false in Broadcast config"
    rationale: "Prevents duplicate messages (sender sees optimistic UI, not own Broadcast)"
    phase: "04-01"
  - decision: "Initial load 50 messages"
    rationale: "Per RESEARCH.md recommendation for mobile-first use case with short message bursts"
    phase: "04-01"
  - decision: "Channel stored in state for sendMessage access"
    rationale: "sendMessage needs channel reference for Broadcast, stored in hook state"
    phase: "04-01"

metrics:
  tasks_completed: 2
  tests_added: 0
  components_added: 0
  hooks_added: 1
  files_created: 2
  files_modified: 1
  lines_added: 235
---

# Phase 4 Plan 1: Message Infrastructure Summary

**One-liner:** Dual-write messaging foundation with Broadcast channels for real-time delivery and Postgres persistence

## What Was Built

Created the core messaging infrastructure for Night Whispers using Supabase Broadcast for real-time message delivery and PostgreSQL for persistence. Implemented the dual-write pattern where messages are inserted into the database (for history and reconnection) and broadcast to WebSocket channels (for instant delivery).

### Key Components

1. **Message Type Export** (`src/lib/supabase.ts`)
   - Added convenience type: `export type Message = Database['public']['Tables']['messages']['Row']`
   - Used throughout messaging infrastructure for type safety

2. **Message Helpers** (`src/lib/message-helpers.ts`)
   - `sendMessage()`: Dual-write pattern - inserts to DB, broadcasts to channel, returns created message
   - `sendBroadcastMessage()`: Wrapper for Storyteller broadcasts (recipient_id = null)
   - Input validation (empty content, missing IDs)
   - Broadcast acknowledgment with `ack: true` config
   - Error handling for database and Broadcast failures

3. **useMessages Hook** (`src/hooks/useMessages.ts`)
   - Loads initial message history (50 messages, chronological order)
   - Subscribes to Broadcast channel with `ack: true, self: false`
   - Filters messages by conversation:
     - **1-to-1**: `(sender=A AND recipient=B) OR (sender=B AND recipient=A)`
     - **Broadcast**: `is_broadcast = true`
   - Prevents duplicate messages (checks existing by ID)
   - Optimistic UI for sent messages
   - Channel cleanup on unmount (prevents memory leaks)
   - Returns: `{ messages, loading, sendMessage, channel }`

### Architecture Decisions

**Broadcast over Postgres Changes:**
- RESEARCH.md benchmarks: 224K msgs/sec vs 10K (22x faster)
- No RLS bottleneck (Postgres Changes triggers 100 RLS checks for 100 users)
- Lower latency: 6ms median vs 100ms+
- Fire-and-forget delivery (database ensures persistence)

**Dual-Write Pattern:**
- **Database insert**: Ensures message survives reconnection (MSG-06 requirement)
- **Broadcast send**: Instant delivery to online users (MSG-03 requirement)
- If Broadcast fails, message still persisted and loads on next history fetch

**self: false Config:**
- Sender doesn't receive own message via Broadcast
- Optimistic UI shows message immediately for sender
- Prevents duplicate message in sender's view

**Channel Lifecycle:**
- Created on mount: `supabase.channel(\`room:${roomId}\`)`
- Cleanup on unmount: `supabase.removeChannel(channel)`
- Critical for memory leak prevention (RESEARCH.md Pitfall 2)

## Requirements Delivered

### Must-Haves Verified

✅ **Artifacts:**
- `src/hooks/useMessages.ts` exists (140 lines, exports useMessages) ✓
- `src/lib/message-helpers.ts` exists (92 lines, exports sendMessage and sendBroadcastMessage) ✓
- `src/lib/supabase.ts` contains Message type export ✓

✅ **Key Links:**
- useMessages → supabase.channel().on('broadcast') ✓
- sendMessage → supabase.from('messages').insert ✓
- sendMessage → channel.send() for Broadcast delivery ✓

### Success Criteria Met

✅ Message infrastructure ready for UI integration (hooks + helpers exported)
✅ Dual-write pattern implemented (database persistence + Broadcast delivery)
✅ useMessages hook loads message history and subscribes to real-time updates
✅ sendMessage functions write to DB and broadcast to channel with ack confirmation
✅ No Postgres Changes used for messaging (Broadcast only per RESEARCH.md)

## Testing & Verification

### Automated Checks
- TypeScript compilation: ✅ No errors in new files
- Message type export: ✅ `export type Message` found
- Helper exports: ✅ sendMessage and sendBroadcastMessage exported
- Dual-write pattern: ✅ .insert() and channel.send() verified
- Broadcast subscription: ✅ .on('broadcast') found
- Channel config: ✅ ack: true, self: false verified
- Cleanup: ✅ removeChannel() in useEffect return
- Conversation filters: ✅ .or() for 1-to-1, is_broadcast for broadcasts

### Manual Verification Needed (Phase 4 Complete)
1. **Real-time delivery**: Send message, verify appears within 1 second
2. **Persistence**: Send message, refresh browser, verify message reloads
3. **Optimistic UI**: Send message, verify appears immediately in sender's view
4. **Broadcast filtering**: Storyteller sends broadcast, verify all players see it
5. **1-to-1 filtering**: Storyteller sends to Player A, verify Player B doesn't see it
6. **Channel cleanup**: Navigate away from room, verify WebSocket connections close

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

### Blockers

None.

### Concerns

1. **Pre-existing build errors**: Project has TypeScript errors from missing @tabler/icons-react (introduced in Phase 3). Not blocking messaging functionality but should be resolved.

### Prerequisites for 04-02 (Message UI)

✅ Message infrastructure complete (useMessages hook ready)
✅ Broadcast subscription working (ready for UI integration)
✅ sendMessage utilities available (ready for MessageInput component)
✅ Message type definitions exported (ready for component props)

## Lessons Learned

1. **Broadcast configuration critical**: `self: false` prevents subtle duplication bug (sender sees message twice)
2. **Channel lifecycle matters**: Memory leaks from unclosed channels are common pitfall (RESEARCH.md Pitfall 2)
3. **Filter complexity**: 1-to-1 conversation filter requires OR with bidirectional sender/recipient check
4. **Optimistic UI coordination**: With `self: false`, sender MUST add to UI immediately (won't receive via Broadcast)

## Files Changed

### Created
- `src/lib/message-helpers.ts` (92 lines)
- `src/hooks/useMessages.ts` (140 lines)

### Modified
- `src/lib/supabase.ts` (+3 lines: Message type export)

## Commits

- `fb1fcb2`: feat(04-01): add message helpers with dual-write pattern
- `ed6ce9b`: feat(04-01): add useMessages hook with Broadcast subscription

## Metadata

**Completed:** 2026-01-20
**Duration:** 5 minutes
**Tasks:** 2/2 complete
**Wave:** 1 (parallel-eligible, no dependencies)
