# Project State: Night Whispers

**Last Updated:** 2026-01-20
**Session:** 5

---

## Project Reference

**Core Value:** Storyteller can privately message any player, players can only respond to Storyteller - no player-to-player communication. Zero friction (no accounts, no downloads, just a room code).

**Current Focus:** Phase 4 - Core Messaging (in progress)

**Tech Stack:** React 19 + Vite 7 + Mantine 8 + Supabase + TypeScript

---

## Current Position

**Phase:** 4 of 6 (Core Messaging)
**Plan:** 2 of 3 in phase
**Status:** In progress
**Last activity:** 2026-01-20 - Completed 04-02-PLAN.md (Message UI Components)

**Progress:**
```
Phase 1: Foundation         [██████████] 100%
Phase 2: Session & Room     [██████████] 100%
Phase 3: Lobby & Management [██████████] 100%
Phase 4: Core Messaging     [██████....] 67%
Phase 5: Game State & Views [..........] 0%
Phase 6: Polish & PWA       [..........] 0%

Overall: 10/14 plans complete (71% of planned work)
```

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Plans Completed | 10 |
| Requirements Delivered | 26/43 |
| Phases Completed | 3/6 |
| Session Count | 5 |

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

Executed plan 04-02: Message UI Components. Created Player and Storyteller messaging views with real-time chat interface. Built 5 shared components: MessageList (auto-scroll, sent/received styling), MessageInput (Enter to send, Shift+Enter newline), PlayerChatView (full-screen chat with Storyteller), StorytellerDashboard (player cards grid with broadcast), ConversationView (reusable chat with back button). Integrated into RoomPage with status-driven rendering for active games. All verifications passed: components export correctly, useMessages hook integrated, state management working, RoomPage renders role-specific views. Delivered 8 requirements: MSG-01 (Storyteller to player), MSG-02 (player to Storyteller), MSG-03 (real-time), MSG-04 (broadcast), MSG-06 (persistence), PLAY-01 (player private chat), DASH-01 (player cards), DASH-03 (full chat view). No deviations from plan. 2/2 tasks complete in 4 minutes.

### Next Session Entry Point

Continue Phase 4: Execute plan 04-03 (Unread Counts & Typing Indicators) to complete messaging phase.

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

---

*State initialized: 2026-01-19*
*Last execution: 04-02 complete 2026-01-20*
*Phase 1 complete: 2026-01-19*
*Phase 2 complete: 2026-01-19 (all 3 plans: 02-01, 02-02, 02-03)*
*Phase 3 complete: 2026-01-19 (all 3 plans: 03-01, 03-02, 03-03)*
