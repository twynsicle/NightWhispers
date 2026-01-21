# Requirements Archive: v1 MVP

**Archived:** 2026-01-20
**Status:** SHIPPED

This is the archived requirements specification for v1.
For current requirements, see `.planning/REQUIREMENTS.md` (created for next milestone).

---

# Requirements: Night Whispers v1

**Defined:** 2026-01-19
**Core Value:** Storyteller can privately message any player, players can only respond to Storyteller—no player-to-player communication

## v1 Requirements

### Room Management

- [x] **ROOM-01**: Storyteller can create a room and receive a 4-letter code
- [x] **ROOM-02**: Player can join a room by entering a 4-letter code
- [x] **ROOM-03**: Storyteller can generate QR code for room join URL
- [x] **ROOM-04**: Rooms auto-delete after 1 hour of inactivity
- [x] **ROOM-05**: Storyteller can kick a player from the room
- [x] **ROOM-06**: Participants can view room code for sharing/rejoining

### Session & Identity

- [x] **SESS-01**: User can set display name before joining game
- [x] **SESS-02**: User can select avatar from pre-made set
- [x] **SESS-03**: Session token persists in localStorage for reconnection
- [x] **SESS-04**: User auto-rejoins room on app reload if session valid
- [x] **SESS-05**: User sees error and returns to home if session expired/kicked

### Messaging

- [x] **MSG-01**: Storyteller can send message to individual player
- [x] **MSG-02**: Player can send message to Storyteller
- [x] **MSG-03**: Messages display in real-time without page refresh
- [x] **MSG-04**: Storyteller can broadcast message to all players
- [x] **MSG-05**: Unread message count displays on player cards
- [x] **MSG-06**: Messages persist across reconnection (not lost on refresh)
- [x] **MSG-07**: Typing indicator shows when other party is typing

### Push Notifications

- [x] **PUSH-01**: App requests notification permission on game start
- [x] **PUSH-02**: User receives push notification when new message arrives (app backgrounded)
- [x] **PUSH-03**: Notification tap opens app to relevant chat

### Game State

- [x] **GAME-01**: Storyteller can start game from lobby
- [x] **GAME-02**: Current phase displays to all participants (Night 1, Day 1, etc.)
- [x] **GAME-03**: Storyteller can advance phase manually
- [x] **GAME-04**: Storyteller can toggle player as dead (greys avatar)
- [x] **GAME-05**: Storyteller can set custom status text per player
- [x] **GAME-06**: Storyteller can reset game (clears messages, resets phase, keeps players)

### Storyteller Dashboard

- [x] **DASH-01**: Storyteller sees all players as cards on mobile
- [x] **DASH-02**: Tapping player card expands to show recent messages + quick send
- [x] **DASH-03**: Storyteller can open full chat view with player
- [x] **DASH-04**: Desktop shows split-panel (player list + chat)
- [x] **DASH-05**: Storyteller can drag-and-drop to reorder player cards

### Player View

- [x] **PLAY-01**: Player sees private chat with Storyteller only
- [x] **PLAY-02**: Player cannot see or message other players
- [x] **PLAY-03**: Player sees current game phase in header
- [x] **PLAY-04**: Player can access settings to leave game or view room code

### Visual & UX

- [x] **UX-01**: Gothic visual theme (dark background, crimson/gold accents)
- [x] **UX-02**: Mobile-first responsive design
- [x] **UX-03**: Desktop breakpoint (>1024px) shows optimized layout
- [x] **UX-04**: PWA installable with app manifest
- [x] **UX-05**: Smooth animations for card expand, new messages, phase advance

### Lobby

- [x] **LOBBY-01**: Storyteller can select script (None only for v1)
- [x] **LOBBY-02**: Players see list of who has joined
- [x] **LOBBY-03**: Storyteller can edit player names
- [x] **LOBBY-04**: Players see waiting indicator until game starts

## Out of Scope

| Feature | Reason |
|---------|--------|
| Player-to-player chat | Core game mechanic requires Storyteller as sole communication hub |
| User accounts/OAuth | Ephemeral sessions don't need persistent identity |
| Video/audio chat | Text-only by design, keeps focus on written communication |
| Custom script creation | v2 feature, v1 ships with "None" script only |
| Game history/export | Rooms are ephemeral, no data retention after expiry |
| Multiple concurrent sessions | One game at a time per user |
| Rich media (images/files) | Text messaging only for v1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ROOM-01 | Phase 2 | Complete |
| ROOM-02 | Phase 2 | Complete |
| ROOM-03 | Phase 3 | Complete |
| ROOM-04 | Phase 3 | Complete |
| ROOM-05 | Phase 3 | Complete |
| ROOM-06 | Phase 2 | Complete |
| SESS-01 | Phase 2 | Complete |
| SESS-02 | Phase 2 | Complete |
| SESS-03 | Phase 2 | Complete |
| SESS-04 | Phase 2 | Complete |
| SESS-05 | Phase 2 | Complete |
| MSG-01 | Phase 4 | Complete |
| MSG-02 | Phase 4 | Complete |
| MSG-03 | Phase 4 | Complete |
| MSG-04 | Phase 4 | Complete |
| MSG-05 | Phase 4 | Complete |
| MSG-06 | Phase 4 | Complete |
| MSG-07 | Phase 4 | Complete |
| PUSH-01 | Phase 6 | Complete |
| PUSH-02 | Phase 6 | Complete |
| PUSH-03 | Phase 6 | Complete |
| GAME-01 | Phase 3 | Complete |
| GAME-02 | Phase 5 | Complete |
| GAME-03 | Phase 5 | Complete |
| GAME-04 | Phase 5 | Complete |
| GAME-05 | Phase 5 | Complete |
| GAME-06 | Phase 5 | Complete |
| DASH-01 | Phase 5 | Complete |
| DASH-02 | Phase 5 | Complete |
| DASH-03 | Phase 5 | Complete |
| DASH-04 | Phase 6 | Complete |
| DASH-05 | Phase 6 | Complete |
| PLAY-01 | Phase 5 | Complete |
| PLAY-02 | Phase 5 | Complete |
| PLAY-03 | Phase 5 | Complete |
| PLAY-04 | Phase 5 | Complete |
| UX-01 | Phase 2 | Complete |
| UX-02 | Phase 2 | Complete |
| UX-03 | Phase 6 | Complete |
| UX-04 | Phase 6 | Complete |
| UX-05 | Phase 6 | Complete |
| LOBBY-01 | Phase 3 | Complete |
| LOBBY-02 | Phase 3 | Complete |
| LOBBY-03 | Phase 3 | Complete |
| LOBBY-04 | Phase 3 | Complete |

---

## Milestone Summary

**Shipped:** 43 of 43 v1 requirements (100%)
**Adjusted:** None
**Dropped:** None

---
*Archived: 2026-01-20 as part of v1 milestone completion*
