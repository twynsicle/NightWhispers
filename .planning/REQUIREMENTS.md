# Requirements: Night Whispers

**Defined:** 2026-01-19
**Core Value:** Storyteller can privately message any player, players can only respond to Storyteller—no player-to-player communication

## v1 Requirements

### Room Management

- [ ] **ROOM-01**: Storyteller can create a room and receive a 4-letter code
- [ ] **ROOM-02**: Player can join a room by entering a 4-letter code
- [x] **ROOM-03**: Storyteller can generate QR code for room join URL
- [x] **ROOM-04**: Rooms auto-delete after 1 hour of inactivity
- [x] **ROOM-05**: Storyteller can kick a player from the room
- [ ] **ROOM-06**: Participants can view room code for sharing/rejoining

### Session & Identity

- [ ] **SESS-01**: User can set display name before joining game
- [ ] **SESS-02**: User can select avatar from pre-made set
- [ ] **SESS-03**: Session token persists in localStorage for reconnection
- [ ] **SESS-04**: User auto-rejoins room on app reload if session valid
- [ ] **SESS-05**: User sees error and returns to home if session expired/kicked

### Messaging

- [x] **MSG-01**: Storyteller can send message to individual player
- [x] **MSG-02**: Player can send message to Storyteller
- [x] **MSG-03**: Messages display in real-time without page refresh
- [x] **MSG-04**: Storyteller can broadcast message to all players
- [x] **MSG-05**: Unread message count displays on player cards
- [x] **MSG-06**: Messages persist across reconnection (not lost on refresh)
- [x] **MSG-07**: Typing indicator shows when other party is typing

### Push Notifications

- [ ] **PUSH-01**: App requests notification permission on game start
- [ ] **PUSH-02**: User receives push notification when new message arrives (app backgrounded)
- [ ] **PUSH-03**: Notification tap opens app to relevant chat

### Game State

- [x] **GAME-01**: Storyteller can start game from lobby
- [ ] **GAME-02**: Current phase displays to all participants (Night 1, Day 1, etc.)
- [ ] **GAME-03**: Storyteller can advance phase manually
- [ ] **GAME-04**: Storyteller can toggle player as dead (greys avatar)
- [ ] **GAME-05**: Storyteller can set custom status text per player
- [ ] **GAME-06**: Storyteller can reset game (clears messages, resets phase, keeps players)

### Storyteller Dashboard

- [ ] **DASH-01**: Storyteller sees all players as cards on mobile
- [ ] **DASH-02**: Tapping player card expands to show recent messages + quick send
- [ ] **DASH-03**: Storyteller can open full chat view with player
- [ ] **DASH-04**: Desktop shows split-panel (player list + chat)
- [ ] **DASH-05**: Storyteller can drag-and-drop to reorder player cards

### Player View

- [ ] **PLAY-01**: Player sees private chat with Storyteller only
- [ ] **PLAY-02**: Player cannot see or message other players
- [ ] **PLAY-03**: Player sees current game phase in header
- [ ] **PLAY-04**: Player can access settings to leave game or view room code

### Visual & UX

- [ ] **UX-01**: Gothic visual theme (dark background, crimson/gold accents)
- [ ] **UX-02**: Mobile-first responsive design
- [ ] **UX-03**: Desktop breakpoint (>1024px) shows optimized layout
- [ ] **UX-04**: PWA installable with app manifest
- [ ] **UX-05**: Smooth animations for card expand, new messages, phase advance

### Lobby

- [x] **LOBBY-01**: Storyteller can select script (None only for v1)
- [x] **LOBBY-02**: Players see list of who has joined
- [x] **LOBBY-03**: Storyteller can edit player names
- [x] **LOBBY-04**: Players see waiting indicator until game starts

## v2 Requirements

### Role Assignment

- **ROLE-01**: Storyteller can assign role to player (private reference)
- **ROLE-02**: Role displays on player card (Storyteller-only)
- **ROLE-03**: Role dropdown shows roles from selected script

### Message Templates

- **TMPL-01**: Storyteller can access message templates for selected script
- **TMPL-02**: Templates grouped by role/situation
- **TMPL-03**: Tap template to insert into message field (editable before send)

### Scripts

- **SCRIPT-01**: Trouble Brewing script with full role list and templates

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
| ROOM-01 | Phase 2 | Pending |
| ROOM-02 | Phase 2 | Pending |
| ROOM-03 | Phase 3 | Complete |
| ROOM-04 | Phase 3 | Complete |
| ROOM-05 | Phase 3 | Complete |
| ROOM-06 | Phase 2 | Pending |
| SESS-01 | Phase 2 | Pending |
| SESS-02 | Phase 2 | Pending |
| SESS-03 | Phase 2 | Pending |
| SESS-04 | Phase 2 | Pending |
| SESS-05 | Phase 2 | Pending |
| MSG-01 | Phase 4 | Complete |
| MSG-02 | Phase 4 | Complete |
| MSG-03 | Phase 4 | Complete |
| MSG-04 | Phase 4 | Complete |
| MSG-05 | Phase 4 | Complete |
| MSG-06 | Phase 4 | Complete |
| MSG-07 | Phase 4 | Complete |
| PUSH-01 | Phase 6 | Pending |
| PUSH-02 | Phase 6 | Pending |
| PUSH-03 | Phase 6 | Pending |
| GAME-01 | Phase 3 | Complete |
| GAME-02 | Phase 5 | Pending |
| GAME-03 | Phase 5 | Pending |
| GAME-04 | Phase 5 | Pending |
| GAME-05 | Phase 5 | Pending |
| GAME-06 | Phase 5 | Pending |
| DASH-01 | Phase 5 | Pending |
| DASH-02 | Phase 5 | Pending |
| DASH-03 | Phase 5 | Pending |
| DASH-04 | Phase 6 | Pending |
| DASH-05 | Phase 6 | Pending |
| PLAY-01 | Phase 5 | Pending |
| PLAY-02 | Phase 5 | Pending |
| PLAY-03 | Phase 5 | Pending |
| PLAY-04 | Phase 5 | Pending |
| UX-01 | Phase 2 | Pending |
| UX-02 | Phase 2 | Pending |
| UX-03 | Phase 6 | Pending |
| UX-04 | Phase 6 | Pending |
| UX-05 | Phase 6 | Pending |
| LOBBY-01 | Phase 3 | Complete |
| LOBBY-02 | Phase 3 | Complete |
| LOBBY-03 | Phase 3 | Complete |
| LOBBY-04 | Phase 3 | Complete |

**Coverage:**
- v1 requirements: 43 total
- Mapped to phases: 43
- Unmapped: 0

---
*Requirements defined: 2026-01-19*
*Last updated: 2026-01-19 after roadmap creation*
