# Project State: Night Whispers

**Last Updated:** 2026-01-20
**Session:** 9

---

## Project Reference

**Core Value:** Storyteller can privately message any player, players can only respond to Storyteller - no player-to-player communication. Zero friction (no accounts, no downloads, just a room code).

**Current Focus:** Phase 5 - Game State & Views (in progress)

**Tech Stack:** React 19 + Vite 7 + Mantine 8 + Supabase + TypeScript

---

## Current Position

**Phase:** 5 of 6 (Game State & Views)
**Plan:** 3 of 4 in phase
**Status:** In progress
**Last activity:** 2026-01-20 - Completed 05-03-PLAN.md (Game Reset)

**Progress:**
```
Phase 1: Foundation         [██████████] 100%
Phase 2: Session & Room     [██████████] 100%
Phase 3: Lobby & Management [██████████] 100%
Phase 4: Core Messaging     [██████████] 100% (verified)
Phase 5: Game State & Views [███████...] 75% (3/4 plans)
Phase 6: Polish & PWA       [..........] 0%

Overall: 15/18 plans complete (83% of planned work)
```

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Plans Completed | 15 |
| Requirements Delivered | 28/43 |
| Phases Completed | 4/6 |
| Session Count | 7 |

---

## Accumulated Context

### Key Decisions

| Decision | Rationale | Phase |
|----------|-----------|-------|
| Use Supabase Broadcast for messaging | Better performance than Postgres Changes for chat | Research |
| Anonymous auth for sessions | Ephemeral games don't need persistent accounts | Research |
| Mobile-first, desktop secondary | Primary use case is in-person game night on phones | PROJECT.md |
| Mantine 8 split CSS imports | v8 architecture requires 4 CSS files for optimal tree-shaking | 01-01 |
| System fonts over custom fonts | Faster mobile loading, no font download latency | 01-01 |
| Crimson primary color | Gothic theme aesthetic for Night Whispers | 01-01 |
| RLS helper functions use SECURITY DEFINER | Allows helpers to query participants table from RLS context | 01-02 |
| Storyteller sees all messages in room | Separate policy grants full message visibility for game management | 01-02 |
| Manual Database types | Defined inline as placeholder until Supabase type generation added | 01-02 |
| Anonymous auth with localStorage | Zero-friction UX, sessions persist across refreshes without accounts | 02-01 |
| 4-letter room codes via nanoid | 1M combinations, excludes confusing chars, collision-resistant | 02-01 |
| Upsert for participant joining | Prevents duplicates on reconnection, race-condition safe | 02-01 |
| Gothic emoji avatars | Zero assets, accessible, mobile-friendly, instant rendering | 02-02 |
| Loader-based route protection | Prevents FOUC, SEO-safe, blocks child loaders before rendering | 02-02 |
| localStorage for displayName/avatar | Decouples session setup from room flow, allows profile reuse | 02-02 |
| Postgres Changes for participant list | Guarantees database consistency for state synchronization | 03-01 |
| Filter to is_active=true participants | Excludes kicked users from participant list | 03-01 |
| Auto-sort by sort_order on updates | Maintains consistent ordering on real-time participant updates | 03-01 |
| QR code colors match gothic theme | Crimson for dark pixels, dark.9 for background maintains visual consistency | 03-03 |
| Join URL includes pre-filled room code | Better UX - users proceed directly to session setup after scanning | 03-03 |
| QR code modal available to all participants | Enables flexible sharing scenarios (players showing code to latecomers) | 03-03 |
| Edge Function uses service role key | Bypasses RLS for admin-level deletion operations | 03-03 |
| Soft delete for kicked participants | is_active=false preserves audit trail and enables reconnection detection | 03-02 |
| Real-time kick detection via postgres_changes | Kicked players need immediate notification, not just on next page load | 03-02 |
| Room status in useParticipants hook | Efficient single hook for participants + status (rare status changes) | 03-02 |
| Script selector disabled for v1 | Only "None" option, ready for v2 Trouble Brewing expansion | 03-02 |
| Broadcast over Postgres Changes for messaging | 22x faster (224K vs 10K msgs/sec), no RLS bottleneck, 6ms latency | 04-01 |
| Dual-write pattern for messages | DB ensures persistence (MSG-06), Broadcast provides speed (MSG-03) | 04-01 |
| self: false in Broadcast config | Prevents duplicate messages (sender sees optimistic UI, not own Broadcast) | 04-01 |
| Initial load 50 messages | Per RESEARCH.md for mobile-first use case with short message bursts | 04-01 |
| Channel stored in hook state | sendMessage needs channel reference for Broadcast delivery | 04-01 |
| Auto-scroll to bottom on new messages | Standard chat UX pattern (Discord, Slack, iMessage) - users expect latest messages visible | 04-02 |
| Textarea with Enter to send | Mobile-friendly keyboard UX, supports multiline messages with Shift+Enter | 04-02 |
| Broadcast card first in Storyteller dashboard | Most common action for Storyteller (night phase announcements) | 04-02 |
| Player view renders full-screen chat | Players only interact with Storyteller - no need for dashboard complexity | 04-02 |
| Storyteller dashboard uses card grid | Mobile-first SimpleGrid (1 col mobile, 2 cols desktop) for player selection | 04-02 |
| Presence with 1s debounce for typing | Prevents spam (1 update/sec vs 10+/sec), balances UX and network efficiency | 04-03 |
| 3s auto-clear for typing state | Standard chat UX, prevents stale indicators | 04-03 |
| last_read_at timestamp pattern | Race-condition safe vs separate unread_count column | 04-03 |
| Server timestamp (NOW()) for read state | Prevents clock skew between client and server | 04-03 |
| 5s polling interval for unread counts | Balances real-time UX with query performance | 04-03 |
| Filter stale typing indicators (>10s) | Presence cleanup takes 30s, client-side filter prevents stale displays | 04-03 |
| Mark conversation read on open | Not on every message - prevents constant writes | 04-03 |
| Only show badges when count > 0 | Clean UI, red color for visibility | 04-03 |
| OR pattern for broadcast filtering | Players need both 1-to-1 AND broadcast messages in conversation view | 04-04 |
| Reset button uses subtle red styling | Destructive action should be visible but not prominent | 05-03 |
| Sequential database operations for reset | Delete messages, update room phase, update participants - each can fail independently | 05-03 |
| Reset placed at bottom of dashboard | Less prominent placement for rarely-used destructive action | 05-03 |
| Separate usePhase hook from useParticipants | Phase updates are independent; single-responsibility pattern | 05-01 |
| Phase icon based on Night/Day | Moon for Night, Sun for Day provides immediate visual context | 05-01 |
| Show next phase preview in controls | Storyteller can verify transition before clicking | 05-01 |

### Architecture Notes

- **Messaging:** Broadcast for real-time delivery (224K msgs/sec), Postgres for persistence, dual-write pattern
- **Message delivery:** Broadcast with ack: true, self: false for optimistic UI without duplicates
- **State sync:** Postgres Changes for room/participant state (not messages)
- **Presence:** Supabase Presence for typing indicators
- **Session:** localStorage token + Supabase anonymous auth (useAuth hook with getSession/onAuthStateChange)
- **Auth:** Session recovery on mount, auto-refresh tokens, signInAnonymously with duplicate prevention
- **Room codes:** nanoid customAlphabet, 4 letters, 32-char safe alphabet, recursive collision retry
- **Room joining:** Upsert with onConflict(room_id, user_id) for idempotent reconnection
- **Build:** Vite 7 with React plugin, path aliases (@/* -> ./src/*)
- **Theme:** MantineProvider with dark colorScheme default
- **Database:** Supabase with rooms, participants, messages tables; RLS policies for room isolation
- **Client:** Single Supabase client instance from src/lib/supabase.ts
- **Routing:** React Router 7 with createBrowserRouter + loaders for protected routes
- **Pages:** Home, SessionSetup, CreateRoom, JoinRoom, Room (protected with loader)
- **Avatars:** 12 gothic emoji options (🧙‍♂️🧛‍♀️🧟‍♂️👻🎭🕵️🦇🌙⚰️🔮🗡️🛡️)
- **Real-time:** useParticipants hook with Postgres Changes subscription (INSERT/UPDATE/DELETE)
- **Participant list:** ParticipantList component with avatars, names, role badges, current user highlighting
- **Lobby views:** Role-specific UI (Storyteller: management hints, Player: waiting state)
- **QR code sharing:** QRCodeGenerator component with gothic theme colors, clipboard copy, Modal-based UI
- **Room cleanup:** Supabase Edge Function for automated deletion of expired rooms (requires external scheduler)
- **Room controls:** Storyteller can kick players, edit names, select script (None only), and start game
- **Kicked detection:** Real-time postgres_changes subscription on participant.is_active for immediate redirect
- **Status transitions:** Room status (lobby/active/ended) drives UI via postgres_changes on rooms table
- **Game start:** Start Game button disabled until 2+ participants, transitions all users to active view
- **Messaging UI:** MessageList (auto-scroll) + MessageInput (Enter to send) shared across Player and Storyteller views
- **Player view:** Full-screen chat with Storyteller, receives 1-to-1 and broadcast messages
- **Storyteller view:** Player cards dashboard with broadcast option, tap card to open conversation
- **Message bubbles:** Crimson for sent, dark.6 for received, broadcast badge for announcements
- **Game reset:** resetGame function clears messages, resets phase to Night 1, sets all participants to alive
- **Confirmation modal:** GameResetModal with warning text, cancel/confirm buttons, loading state
- **Phase management:** usePhase hook with postgres_changes on rooms.phase, getNextPhase helper for cycle logic
- **Phase display:** PhaseHeader shows current phase (Night 1, Day 2, etc.) with moon/sun icons for all participants
- **Phase controls:** PhaseControls component for Storyteller-only phase advancement

### Open TODOs

- [x] Create Phase 1 plan via `/gsd:plan-phase 1`
- [x] Execute 01-01-PLAN.md (Project Setup & Tooling)
- [x] Execute 01-02-PLAN.md (Supabase Database Setup)
- [x] Create Phase 2 plan via `/gsd:plan-phase 2`
- [x] Execute 02-01-PLAN.md (Auth & Room Management Infrastructure)
- [x] Execute 02-02-PLAN.md (Session Setup UI)
- [x] Execute 02-03-PLAN.md (Room Integration & Verification)
- [x] Create Phase 3 plan via `/gsd:plan-phase 3`
- [x] Execute 03-01-PLAN.md (Real-time Lobby Foundation)
- [x] Execute 03-02-PLAN.md (Room Controls)
- [x] Execute 03-03-PLAN.md (QR Code Sharing & Room Cleanup)

### Blockers

None currently.

### Deferred Items

- Role assignment UI (v2)
- Trouble Brewing script templates (v2)
- Message templates (v2)

---

## Session Continuity

### Last Session Summary

Executed plan 05-01: Phase Management. Created usePhase hook with postgres_changes subscription on rooms.phase for real-time phase synchronization. Created getNextPhase helper for phase cycle logic (Night X -> Day X -> Night X+1). Created PhaseHeader component displaying current phase with moon/sun icons. Created PhaseControls component for Storyteller phase advancement with loading state and notifications. Integrated both components into RoomPage active game view - PhaseHeader visible to all participants, PhaseControls for Storyteller only. GAME-02, GAME-03, PLAY-03 requirements delivered. TypeScript compiles without errors. 3 commits, 11 minutes.

### Next Session Entry Point

Phase 5 plan 1 of 4 complete. Continue with remaining Phase 5 plans (05-02 Player Status if not complete, or 05-04 End Game).

### Context to Preserve

- Research recommends Broadcast over Postgres Changes for messaging
- RLS policies already deployed - authentication required for all data access
- iOS PWA push notifications require "Add to Home Screen"
- Phase 4 and 6 flagged for potential research needs
- Database schema ready for anonymous auth sessions (Phase 2)
- Connection verification expects RLS permission errors for unauthenticated users
- iOS WebKit 7-day localStorage cap requires session validation on every mount
- Room codes have 1M combinations, 50% collision at ~1K rooms (monitor for scaling)
- Upsert pattern prevents duplicate participants on reconnection
- Router loader pattern prevents FOUC on protected routes
- displayName and avatar stored in localStorage for CreateRoom/JoinRoom flows
- All pages follow gothic theme: dark background, crimson accents, mobile-first
- Postgres Changes used for participant list (state sync), Broadcast for messaging (ephemeral)
- useParticipants hook pattern: useState for data + loading, useEffect for subscription + cleanup
- ParticipantList filters to is_active=true to exclude kicked participants
- Real-time updates use INSERT/UPDATE/DELETE event handlers with local state synchronization
- QR code generation uses qrcode library with gothic theme colors (crimson/dark.9)
- Join URL format: ${origin}/join?code=XXXX for pre-filled room code
- Edge Function cleanup requires external scheduler (not auto-scheduled)
- Kicked participants: soft delete (is_active=false), real-time detection via postgres_changes
- Room status tracking: useParticipants hook subscribes to rooms table for status updates
- Status-driven UI: RoomPage conditionally renders lobby/active/ended views based on roomStatus
- Start Game validation: button disabled until 2+ participants (Storyteller + at least 1 player)
- Edit modal pattern: local state → validation (2-20 chars) → update → notification → close
- useMessages hook pattern: Broadcast subscription + database history loading + optimistic UI
- Dual-write messaging: insert to DB first (get ID), then broadcast with message object
- Broadcast config: ack: true (server confirmation), self: false (sender uses optimistic UI)
- Message filtering: 1-to-1 uses .or() with bidirectional sender/recipient, broadcast uses is_broadcast=true
- Channel lifecycle: create on mount, store in state for sendMessage access, cleanup on unmount
- Message type export: convenience type from Database definition for hook/helper type safety
- MessageList auto-scroll: useEffect with messages.length dependency, scrollIntoView on bottomRef
- MessageInput keyboard: Enter sends, Shift+Enter newlines, onKeyDown prevents default on Enter
- Component composition: MessageList/MessageInput shared across PlayerChatView and ConversationView
- PlayerChatView: full-screen chat, uses useMessages with recipientId=storytellerId
- StorytellerDashboard: player cards grid, useState for selectedParticipant, broadcast card first
- ConversationView: reusable chat with onBack prop, supports recipientId=null for broadcast
- Active game views: RoomPage renders PlayerChatView (player) or StorytellerDashboard (Storyteller)
- Storyteller lookup: participants.find(p => p.role === 'storyteller') for PlayerChatView props
- useTypingIndicator pattern: Presence with 1s debounce, 3s auto-clear, filter stale >10s entries
- useUnreadCount pattern: last_read_at timestamp comparison, 5s polling interval
- Typing indicators: MessageInput emits on onChange, clears on send/unmount
- Unread badges: BroadcastCard/PlayerCard components with useUnreadCount, only show when > 0
- Mark as read: ConversationView calls markConversationRead on mount
- Database migration 004: last_read_at column requires manual application via Supabase dashboard
- Presence CRDT: Auto-merges state, handles concurrent updates, cleanup takes 30s on disconnect
- Typing users filtered: PlayerChatView shows only storyteller, ConversationView shows only recipient
- Broadcast filtering uses OR pattern: Players receive both 1-to-1 messages AND broadcasts in conversation
- useMessages query includes is_broadcast.eq.true when recipientId is set (lines 51-61)
- useMessages subscription filter checks newMessage.is_broadcast in isRelevant logic (lines 92-96)
- Game reset: resetGame(roomId) deletes messages, resets phase to Night 1, sets participants to alive
- Confirmation modal: GameResetModal prevents accidental resets with warning text
- Reset button placement: subtle red button at bottom of StorytellerDashboard, below player cards
- usePhase hook: returns { phase, loading, advancePhase }, subscribes to postgres_changes on rooms table
- getNextPhase helper: Night X -> Day X -> Night X+1 pattern via regex parsing
- PhaseHeader placement: above active game content, visible to all participants
- PhaseControls placement: below PhaseHeader, inside isStoryteller branch (Storyteller only)

---

*State initialized: 2026-01-19*
*Last execution: 05-01 complete 2026-01-20*
*Phase 1 complete: 2026-01-19*
*Phase 2 complete: 2026-01-19 (all 3 plans: 02-01, 02-02, 02-03)*
*Phase 3 complete: 2026-01-19 (all 3 plans: 03-01, 03-02, 03-03)*
*Phase 4 complete: 2026-01-20 (all 4 plans: 04-01, 04-02, 04-03, 04-04-gap-closure)*
*Phase 5 in progress: 2026-01-20 (05-01 complete)*
