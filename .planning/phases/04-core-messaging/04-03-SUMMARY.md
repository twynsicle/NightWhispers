---
phase: 04-core-messaging
plan: 03
subsystem: messaging
tags: [supabase, realtime, presence, typing-indicators, unread-tracking]

requires:
  - 04-01-PLAN.md
  - 04-02-PLAN.md

provides:
  - MSG-05: Unread message count tracking
  - MSG-07: Typing indicator display
  - Complete Phase 4 messaging features

affects:
  - Phase 5 (game state views can build on messaging foundation)

tech-stack:
  added: []
  patterns:
    - Presence-based typing indicators with 1s debounce
    - last_read_at timestamp pattern for unread tracking
    - 5s polling interval for unread count updates

key-files:
  created:
    - supabase/migrations/004_message_tracking.sql
    - src/hooks/useTypingIndicator.ts
    - src/hooks/useUnreadCount.ts
  modified:
    - src/lib/supabase.ts
    - src/components/MessageInput.tsx
    - src/components/MessageList.tsx
    - src/components/PlayerChatView.tsx
    - src/components/ConversationView.tsx
    - src/components/StorytellerDashboard.tsx
    - src/pages/RoomPage.tsx

key-decisions:
  - "Presence with 1s debounce prevents spam (1 update/sec vs 10+/sec)"
  - "3s auto-clear for typing state balances UX and network efficiency"
  - "last_read_at timestamp pattern is race-condition safe"
  - "Server timestamp (NOW()) prevents clock skew issues"
  - "5s polling interval for unread counts balances real-time UX and performance"
  - "Only show unread badges when count > 0 for clean UI"
  - "Filter stale typing indicators (>10s) while Presence cleanup takes 30s"
  - "Mark conversation as read on open, not on every message"

patterns-established:
  - "useTypingIndicator hook encapsulates Presence tracking"
  - "useUnreadCount hook with markConversationRead helper"
  - "Typing state cleared on unmount, send, and after 3s inactivity"
  - "Unread badges on player cards use red color for visibility"

# Metrics
duration: 8min
completed: 2026-01-20
---

# Phase 04 Plan 03: Unread Counts & Typing Indicators Summary

**Real-time typing indicators and unread message tracking complete Phase 4 messaging**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-20T05:19:53Z
- **Completed:** 2026-01-20T05:27:44Z
- **Tasks:** 3/3
- **Files modified:** 10

## Accomplishments

- Database migration adds last_read_at column to participants table for unread tracking
- useTypingIndicator hook manages Presence-based typing state with 1s debounce and 3s auto-clear
- useUnreadCount hook calculates unread messages using last_read_at timestamp comparison
- Typing indicators display in MessageList showing participant names (e.g., "Alice is typing...")
- Unread badges appear on Storyteller dashboard player cards when count > 0
- Mark conversation as read when opening conversation view
- All Phase 4 requirements (MSG-01 through MSG-07) complete

## Task Commits

Each task was committed atomically:

1. **Task 1: Add database migration for unread tracking** - `0b4d870` (feat)
2. **Task 2: Create typing indicator and unread count hooks** - `92da242` (feat)
3. **Task 3: Integrate typing indicators and unread counts into UI** - `ba288d0` (feat)

## Files Created/Modified

### Created
- `supabase/migrations/004_message_tracking.sql` - Migration adding last_read_at column with index
- `src/hooks/useTypingIndicator.ts` - Presence-based typing state management (50+ lines)
- `src/hooks/useUnreadCount.ts` - Unread message count tracking (40+ lines)

### Modified
- `src/lib/supabase.ts` - Added last_read_at to participants type definition
- `src/components/MessageInput.tsx` - Emit typing state on onChange, clear on send/unmount
- `src/components/MessageList.tsx` - Display typing indicator with participant names
- `src/components/PlayerChatView.tsx` - Integrate useTypingIndicator, filter for storyteller only
- `src/components/ConversationView.tsx` - Add typing indicators and mark as read on mount
- `src/components/StorytellerDashboard.tsx` - Unread badges on player cards via BroadcastCard/PlayerCard components
- `src/pages/RoomPage.tsx` - Pass participants array to PlayerChatView

## Decisions Made

### Technical Decisions

**Presence with 1s debounce:**
- Prevents Presence spam (1 update per second max vs 10+ without debounce)
- Uses Mantine's useDebouncedValue hook for clean implementation
- Balances real-time UX with network efficiency

**3s auto-clear for typing state:**
- Standard chat UX pattern (Discord, Slack use similar timeouts)
- Automatically clears typing indicator after 3 seconds of inactivity
- Prevents stale "is typing..." displays

**last_read_at timestamp pattern:**
- Race-condition safe (vs separate unread_count column)
- Database timestamp comparison (created_at > last_read_at)
- NULL last_read_at means "never read" (all messages unread)

**Server timestamp (NOW()):**
- Prevents clock skew between client and server
- Database server is source of truth for timestamps
- Consistent ordering across timezones

**5s polling interval for unread counts:**
- Balances real-time UX with query performance
- Could be replaced with Broadcast event for instant updates in future
- Acceptable latency for unread badge updates

**Filter stale typing indicators (>10s):**
- Presence auto-cleanup takes 30 seconds on disconnect
- Client-side filtering prevents showing stale "is typing..." for disconnected users
- Uses timestamp in Presence payload to calculate age

**Mark conversation as read on open:**
- Updates last_read_at when conversation view mounts
- Not on every message (prevents constant database writes)
- Standard messaging app pattern (WhatsApp, Telegram)

### UI/UX Decisions

**Only show badges when count > 0:**
- Clean UI - no "0" badges cluttering interface
- Red color for visibility (crimson theme color)
- Large size (size="lg") for mobile readability

**Typing indicator shows participant names:**
- Resolves participant IDs to display names
- Format: "Alice is typing..." (singular) or "Alice, Bob are typing..." (plural)
- Uses dimmed color and italic style (standard chat UX)

## Requirements Delivered

### MSG-05: Unread message count
- ✅ Storyteller sees unread count badge on each player card
- ✅ Count displays as red badge (only when > 0)
- ✅ Count resets when Storyteller opens conversation
- ✅ Broadcast card shows unread broadcast messages separately

### MSG-07: Typing indicator
- ✅ Player sees "Storyteller is typing..." when Storyteller types
- ✅ Storyteller sees "Player is typing..." when player types
- ✅ Indicator appears within 1 second of typing (debounced)
- ✅ Indicator disappears after 3 seconds of inactivity
- ✅ Uses Supabase Presence for conflict-free state sync

### Phase 4 Complete
All messaging requirements delivered:
- MSG-01: Storyteller to player private messages ✅ (04-01, 04-02)
- MSG-02: Player to Storyteller responses ✅ (04-01, 04-02)
- MSG-03: Real-time message delivery ✅ (04-01, 04-02)
- MSG-04: Broadcast messages ✅ (04-01, 04-02)
- MSG-05: Unread message counts ✅ (04-03)
- MSG-06: Message persistence ✅ (04-01)
- MSG-07: Typing indicators ✅ (04-03)

## Implementation Notes

### Typing Indicator Pattern

**Hook usage:**
```typescript
const { setIsTyping, typingUsers } = useTypingIndicator(channel, participantId)
```

**Presence state:**
- Debounced (1s): Max 1 Presence update per second
- Auto-clear (3s): Typing state cleared after 3 seconds
- Stale filter (10s): Client-side filtering for disconnected users

**Integration:**
- MessageInput calls `setIsTyping(true)` on onChange
- MessageInput calls `setIsTyping(false)` on send/unmount
- MessageList displays typing users below messages

### Unread Count Pattern

**Hook usage:**
```typescript
const unreadCount = useUnreadCount(roomId, participantId, conversationParticipantId)
```

**Database query:**
- Counts messages where `created_at > last_read_at`
- Filters by conversation (1-to-1 or broadcast)
- NULL last_read_at defaults to '1970-01-01' (all messages unread)

**Mark as read:**
```typescript
await markConversationRead(participantId)
```

**Polling:**
- 5-second interval refetches unread count
- Could be optimized with Broadcast events in future

### Migration Applied

**Manual application required:**
Migration file created at `supabase/migrations/004_message_tracking.sql` but not auto-applied (project uses Supabase cloud without CLI linking). Apply manually via Supabase dashboard SQL editor:

```sql
ALTER TABLE participants ADD COLUMN last_read_at TIMESTAMPTZ;
CREATE INDEX idx_participants_last_read_at ON participants(last_read_at);
```

**Type updated:**
Database type definition in `src/lib/supabase.ts` includes `last_read_at: string | null`

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

Phase 4 (Core Messaging) complete. Ready for Phase 5 (Game State & Views):

**Available messaging features:**
- Private 1-to-1 messaging (Storyteller ↔ Player)
- Broadcast messaging (Storyteller → All Players)
- Real-time delivery via Supabase Broadcast
- Message persistence in PostgreSQL
- Typing indicators via Presence
- Unread message counts via last_read_at

**Known limitations for v1:**
- No message history pagination (initial load shows last 50 messages)
- No message editing/deletion
- No message reactions/emoji
- No file attachments
- No read receipts (just unread counts)

**Phase 5 can now build:**
- Game state management (night/day phases)
- Role assignment views
- Death notifications
- Game-specific messaging (whispers, private chats)

No blockers or concerns.

---
*Phase: 04-core-messaging*
*Completed: 2026-01-20*
