# Roadmap: Night Whispers

**Created:** 2026-01-19
**Depth:** Standard (6 phases)
**Coverage:** 43/43 v1 requirements mapped

---

## Overview

Night Whispers delivers asymmetric real-time messaging for social deduction games. The roadmap builds from infrastructure through core messaging to polish, with each phase delivering a verifiable capability. Foundation and session management enable room participation, messaging delivers the core value, and polish adds push notifications and desktop optimization.

---

## Phase 1: Foundation

**Goal:** Project infrastructure exists and Supabase backend is ready for development.

**Dependencies:** None

**Requirements:** None (infrastructure phase)

**Plans:** 2 plans

Plans:
- [x] 01-01-PLAN.md - Initialize React 19 + Vite 7 + TypeScript project with Mantine and dependencies
- [x] 01-02-PLAN.md - Create Supabase schema, RLS policies, and verify client connectivity

**Success Criteria:**
1. Developer can run `npm run dev` and see the app at localhost
2. Supabase project exists with database schema for rooms, participants, messages
3. RLS policies are enabled on all tables (no anonymous access without valid session)
4. Developer can connect to Supabase from the client and query tables

---

## Phase 2: Session & Room Entry

**Goal:** Users can create/join rooms with display names and avatars, persisting across browser refreshes.

**Dependencies:** Phase 1 (Foundation)

**Requirements:**
- SESS-01: User can set display name before joining game
- SESS-02: User can select avatar from pre-made set
- SESS-03: Session token persists in localStorage for reconnection
- SESS-04: User auto-rejoins room on app reload if session valid
- SESS-05: User sees error and returns to home if session expired/kicked
- ROOM-01: Storyteller can create a room and receive a 4-letter code
- ROOM-02: Player can join a room by entering a 4-letter code
- ROOM-06: Participants can view room code for sharing/rejoining
- UX-01: Gothic visual theme (dark background, crimson/gold accents)
- UX-02: Mobile-first responsive design

**Plans:** 3 plans

Plans:
- [x] 02-01-PLAN.md - Session management infrastructure (auth hook, room utilities)
- [x] 02-02-PLAN.md - User interface and routing (pages, components, React Router)
- [x] 02-03-PLAN.md - Room integration and verification (auto-rejoin, error handling)

**Success Criteria:**
1. Storyteller can create room, see 4-letter code, and share it verbally
2. Player can enter code, set name/avatar, and appear in room
3. User who refreshes browser automatically rejoins their room
4. User removed from room sees clear error and returns to home screen
5. App displays with gothic theme on mobile viewport

---

## Phase 3: Lobby & Room Management

**Goal:** Storyteller can manage the lobby and start the game when ready.

**Dependencies:** Phase 2 (Session & Room Entry)

**Requirements:**
- LOBBY-01: Storyteller can select script (None only for v1)
- LOBBY-02: Players see list of who has joined
- LOBBY-03: Storyteller can edit player names
- LOBBY-04: Players see waiting indicator until game starts
- ROOM-03: Storyteller can generate QR code for room join URL
- ROOM-04: Rooms auto-delete after 1 hour of inactivity
- ROOM-05: Storyteller can kick a player from the room
- GAME-01: Storyteller can start game from lobby

**Plans:** 3 plans

Plans:
- [x] 03-01-PLAN.md - Real-time lobby foundation (participant list with Postgres Changes)
- [x] 03-02-PLAN.md - Storyteller controls (kick, edit, start game)
- [x] 03-03-PLAN.md - QR code & room cleanup (sharing and auto-deletion)

**Success Criteria:**
1. Player in lobby sees other players who have joined (real-time updates)
2. Storyteller can kick a player, who immediately sees removal and returns to home
3. Storyteller can generate QR code that others scan to join
4. Storyteller can tap "Start Game" and all participants transition to game view
5. Room with no activity for 1 hour is automatically deleted

---

## Phase 4: Core Messaging

**Goal:** Storyteller and players can exchange private messages in real-time.

**Dependencies:** Phase 3 (Lobby & Room Management)

**Requirements:**
- MSG-01: Storyteller can send message to individual player
- MSG-02: Player can send message to Storyteller
- MSG-03: Messages display in real-time without page refresh
- MSG-04: Storyteller can broadcast message to all players
- MSG-05: Unread message count displays on player cards
- MSG-06: Messages persist across reconnection (not lost on refresh)
- MSG-07: Typing indicator shows when other party is typing

**Plans:** 4 plans

Plans:
- [x] 04-01-PLAN.md - Message infrastructure (Broadcast + persistence, useMessages hook)
- [x] 04-02-PLAN.md - Player and Storyteller messaging views
- [x] 04-03-PLAN.md - Typing indicators and unread tracking
- [x] 04-04-PLAN.md - Fix broadcast message filtering bug (gap closure)

**Success Criteria:**
1. Storyteller sends message to player; player sees it within 1 second
2. Player replies to Storyteller; Storyteller sees it within 1 second
3. Storyteller broadcasts "Night begins"; all players see the message
4. Storyteller sees unread count badge on player cards with new messages
5. User who refreshes browser sees full message history preserved

---

## Phase 5: Game State & Views

**Goal:** Storyteller can manage game state while players see their private view with phase info.

**Dependencies:** Phase 4 (Core Messaging)

**Requirements:**
- GAME-02: Current phase displays to all participants (Night 1, Day 1, etc.)
- GAME-03: Storyteller can advance phase manually
- GAME-04: Storyteller can toggle player as dead (greys avatar)
- GAME-05: Storyteller can set custom status text per player
- GAME-06: Storyteller can reset game (clears messages, resets phase, keeps players)
- PLAY-01: Player sees private chat with Storyteller only
- PLAY-02: Player cannot see or message other players
- PLAY-03: Player sees current game phase in header
- PLAY-04: Player can access settings to leave game or view room code
- DASH-01: Storyteller sees all players as cards on mobile
- DASH-02: Tapping player card expands to show recent messages + quick send
- DASH-03: Storyteller can open full chat view with player

**Success Criteria:**
1. Storyteller advances to "Night 2"; all players see phase update in header
2. Storyteller marks player dead; player's avatar greys out for everyone
3. Player views only their own chat; no access to other players or their messages
4. Storyteller on mobile taps player card, sees recent messages, can quick-send
5. Storyteller can reset game; messages clear, phase returns to "Night 1", players remain

---

## Phase 6: Polish & PWA

**Goal:** App is installable as PWA, desktop-optimized for Storyteller, with push notifications.

**Dependencies:** Phase 5 (Game State & Views)

**Requirements:**
- DASH-04: Desktop shows split-panel (player list + chat)
- DASH-05: Storyteller can drag-and-drop to reorder player cards
- UX-03: Desktop breakpoint (>1024px) shows optimized layout
- UX-04: PWA installable with app manifest
- UX-05: Smooth animations for card expand, new messages, phase advance
- PUSH-01: App requests notification permission on game start
- PUSH-02: User receives push notification when new message arrives (app backgrounded)
- PUSH-03: Notification tap opens app to relevant chat

**Success Criteria:**
1. User on mobile can install app to home screen via browser prompt
2. User with app backgrounded receives push notification for new message
3. Tapping notification opens app directly to the relevant chat
4. Storyteller on desktop (>1024px) sees split-panel with player list and chat side-by-side
5. Storyteller can drag player cards to reorder them; order persists

---

## Progress

| Phase | Status | Requirements | Completion |
|-------|--------|--------------|------------|
| 1 - Foundation | Complete | 0 | 100% |
| 2 - Session & Room Entry | Complete | 10 | 100% |
| 3 - Lobby & Room Management | Complete | 8 | 100% |
| 4 - Core Messaging | Complete | 7 | 100% |
| 5 - Game State & Views | Pending | 12 | 0% |
| 6 - Polish & PWA | Pending | 8 | 0% |

**Overall:** 25/43 requirements complete (58%)

---

## Research Flags

| Phase | Research Needed | Reason |
|-------|-----------------|--------|
| Phase 1 | SKIP | Standard Supabase setup patterns |
| Phase 2 | MAYBE | Mobile reconnection edge cases |
| Phase 3 | SKIP | Standard CRUD patterns |
| Phase 4 | YES | Race conditions, message ordering, broadcast patterns |
| Phase 5 | SKIP | RLS patterns from Phase 1 apply |
| Phase 6 | YES | iOS PWA push notifications, caching strategies |

---

*Roadmap created: 2026-01-19*
*Last updated: 2026-01-20 (Phase 4 complete)*
