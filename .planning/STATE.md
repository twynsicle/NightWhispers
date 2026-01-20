# Project State: Night Whispers

**Last Updated:** 2026-01-20
**Session:** 11

---

## Project Reference

**Core Value:** Storyteller can privately message any player, players can only respond to Storyteller - no player-to-player communication. Zero friction (no accounts, no downloads, just a room code).

**Current Focus:** Phase 6 - Polish & PWA (in progress)

**Tech Stack:** React 19 + Vite 7 + Mantine 8 + Supabase + TypeScript

---

## Current Position

**Phase:** 6 of 6 (Polish & PWA)
**Plan:** 2 of 5 in phase (06-02, 06-05 complete)
**Status:** In progress
**Last activity:** 2026-01-20 - Completed 06-02-PLAN.md (Desktop Split-Panel Layout)

**Progress:**
```
Phase 1: Foundation         [██████████] 100%
Phase 2: Session & Room     [██████████] 100%
Phase 3: Lobby & Management [██████████] 100%
Phase 4: Core Messaging     [██████████] 100%
Phase 5: Game State & Views [██████████] 100% (4/4 plans)
Phase 6: Polish & PWA       [████......] 40% (2/5 plans)

Overall: 18/21 plans complete (86% of planned work)
```

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Plans Completed | 18 |
| Requirements Delivered | 32/43 |
| Phases Completed | 5/6 |
| Session Count | 11 |

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
| Soft delete for player leave (is_active = false) | Matches kick pattern, preserves audit trail, enables reconnection | 05-04 |
| Navigate immediately on leave | Better UX than waiting for postgres_changes event | 05-04 |
| Fetch room code via participants.rooms relation | Consistent with existing patterns, uses single query | 05-04 |
| Mantine Transition for enter animations | Built-in component, consistent with Mantine ecosystem | 06-05 |
| Track initialCount to detect new messages | Simple approach, messages at index >= initialCount animate | 06-05 |
| CSS modules for card hover effects | Pseudo-classes require CSS, not inline styles | 06-05 |
| All animations respect prefers-reduced-motion | Accessibility standard for users with vestibular disorders | 06-05 |
| 1024px desktop breakpoint | Per UX-03, matches common laptop width | 06-02 |
| DesktopConversationPanel for inline rendering | Mobile ConversationView uses fixed positioning, desktop needs inline | 06-02 |
| Placeholder when no selection on desktop | Better UX than empty panel, guides user to action | 06-02 |

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
- **Player view:** Full-screen chat with Storyteller, receives 1-to-1 and broadcast messages, settings button in header
- **Storyteller view:** Player cards dashboard with broadcast option, tap card to open conversation, reset button at bottom
- **Message bubbles:** Crimson for sent, dark.6 for received, broadcast badge for announcements
- **Game reset:** resetGame function clears messages, resets phase to Night 1, sets all participants to alive
- **Confirmation modal:** GameResetModal with warning text, cancel/confirm buttons, loading state
- **Phase management:** usePhase hook with postgres_changes on rooms.phase, getNextPhase helper for cycle logic
- **Phase display:** PhaseHeader shows current phase (Night 1, Day 2, etc.) with moon/sun icons for all participants
- **Phase controls:** PhaseControls component for Storyteller-only phase advancement
- **Player settings:** PlayerSettingsMenu component with room code copy and leave game confirmation
- **Leave game:** Soft delete pattern (is_active = false), immediate navigation, postgres_changes backup

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
- [x] Execute 05-01-PLAN.md (Phase Display & Controls)
- [x] Execute 05-02-PLAN.md (Player Status Management)
- [x] Execute 05-03-PLAN.md (Game Reset)
- [x] Execute 05-04-PLAN.md (Player Settings Menu)
- [x] Execute 06-05-PLAN.md (UI Animations)
- [x] Execute 06-02-PLAN.md (Desktop Split-Panel Layout)

### Blockers

None currently.

### Deferred Items

- Role assignment UI (v2)
- Trouble Brewing script templates (v2)
- Message templates (v2)

---

## Session Continuity

### Last Session Summary

Executed plan 06-02: Desktop Split-Panel Layout. Created useDesktopLayout hook with 1024px breakpoint using Mantine useMediaQuery (SSR-safe). Built SplitPanelLayout (container), PlayerSidebar (player list with unread badges), and DesktopConversationPanel (inline chat without fixed positioning). Updated StorytellerDashboard to conditionally render desktop split-panel or mobile card grid based on viewport width. Desktop shows sidebar + conversation side-by-side; mobile preserves existing full-screen overlay navigation. All 3 tasks committed individually. UX-03 and DASH-04 requirements delivered.

### Next Session Entry Point

Phase 6 in progress. Continue with remaining plans (06-01, 06-03, 06-04).

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
- PlayerChatView: full-screen chat, uses useMessages with recipientId=storytellerId, settings button in header
- StorytellerDashboard: player cards grid, useState for selectedParticipant, broadcast card first, reset button at bottom
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
- Player settings: PlayerSettingsMenu component with room code copy and leave game confirmation
- Leave room: leaveRoom() sets is_active = false, navigate immediately, postgres_changes backup
- Room code in player view: fetched via participants.rooms(code) relation on mount
- **Animations:** Mantine Transition for enter animations, CSS modules for hover states
- Message animations: AnimatedMessage wrapper with slide-up, initialCount tracking for new message detection
- Phase transition: fade out/in animation with animationKey increment on phase change
- Card hover: CSS module with translateY(-2px) on hover, press effect on active
- Accessibility: All animations check prefers-reduced-motion media query
- **Desktop layout:** useDesktopLayout hook with 1024px breakpoint for responsive Storyteller view
- Desktop components: SplitPanelLayout, PlayerSidebar, DesktopConversationPanel in src/components/desktop/
- StorytellerDashboard renders SplitPanelLayout on desktop, existing card grid on mobile
- DesktopConversationPanel renders inline (no fixed positioning), uses same MessageList/MessageInput
- PlayerSidebar shows broadcast option, player list with unread badges, reset game button

---

*State initialized: 2026-01-19*
*Last execution: 06-02 complete 2026-01-20*
*Phase 1 complete: 2026-01-19*
*Phase 2 complete: 2026-01-19 (all 3 plans: 02-01, 02-02, 02-03)*
*Phase 3 complete: 2026-01-19 (all 3 plans: 03-01, 03-02, 03-03)*
*Phase 4 complete: 2026-01-20 (all 4 plans: 04-01, 04-02, 04-03, 04-04-gap-closure)*
*Phase 5 complete: 2026-01-20 (all 4 plans: 05-01, 05-02, 05-03, 05-04)*
*Phase 6 in progress: 06-02, 06-05 complete 2026-01-20*
