# Requirements: Night Whispers

**Defined:** 2026-01-19
**Core Value:** Storyteller can privately message any player, players can only respond to Storyteller—no player-to-player communication

## v1 Requirements

### Room Management

- [ ] **ROOM-01**: Storyteller can create a room and receive a 4-letter code
- [ ] **ROOM-02**: Player can join a room by entering a 4-letter code
- [ ] **ROOM-03**: Storyteller can generate QR code for room join URL
- [ ] **ROOM-04**: Rooms auto-delete after 1 hour of inactivity
- [ ] **ROOM-05**: Storyteller can kick a player from the room
- [ ] **ROOM-06**: Participants can view room code for sharing/rejoining

### Session & Identity

- [ ] **SESS-01**: User can set display name before joining game
- [ ] **SESS-02**: User can select avatar from pre-made set
- [ ] **SESS-03**: Session token persists in localStorage for reconnection
- [ ] **SESS-04**: User auto-rejoins room on app reload if session valid
- [ ] **SESS-05**: User sees error and returns to home if session expired/kicked

### Messaging

- [ ] **MSG-01**: Storyteller can send message to individual player
- [ ] **MSG-02**: Player can send message to Storyteller
- [ ] **MSG-03**: Messages display in real-time without page refresh
- [ ] **MSG-04**: Storyteller can broadcast message to all players
- [ ] **MSG-05**: Unread message count displays on player cards
- [ ] **MSG-06**: Messages persist across reconnection (not lost on refresh)
- [ ] **MSG-07**: Typing indicator shows when other party is typing

### Push Notifications

- [ ] **PUSH-01**: App requests notification permission on game start
- [ ] **PUSH-02**: User receives push notification when new message arrives (app backgrounded)
- [ ] **PUSH-03**: Notification tap opens app to relevant chat

### Game State

- [ ] **GAME-01**: Storyteller can start game from lobby
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

- [ ] **LOBBY-01**: Storyteller can select script (None only for v1)
- [ ] **LOBBY-02**: Players see list of who has joined
- [ ] **LOBBY-03**: Storyteller can edit player names
- [ ] **LOBBY-04**: Players see waiting indicator until game starts

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
| ROOM-01 | TBD | Pending |
| ROOM-02 | TBD | Pending |
| ROOM-03 | TBD | Pending |
| ROOM-04 | TBD | Pending |
| ROOM-05 | TBD | Pending |
| ROOM-06 | TBD | Pending |
| SESS-01 | TBD | Pending |
| SESS-02 | TBD | Pending |
| SESS-03 | TBD | Pending |
| SESS-04 | TBD | Pending |
| SESS-05 | TBD | Pending |
| MSG-01 | TBD | Pending |
| MSG-02 | TBD | Pending |
| MSG-03 | TBD | Pending |
| MSG-04 | TBD | Pending |
| MSG-05 | TBD | Pending |
| MSG-06 | TBD | Pending |
| MSG-07 | TBD | Pending |
| PUSH-01 | TBD | Pending |
| PUSH-02 | TBD | Pending |
| PUSH-03 | TBD | Pending |
| GAME-01 | TBD | Pending |
| GAME-02 | TBD | Pending |
| GAME-03 | TBD | Pending |
| GAME-04 | TBD | Pending |
| GAME-05 | TBD | Pending |
| GAME-06 | TBD | Pending |
| DASH-01 | TBD | Pending |
| DASH-02 | TBD | Pending |
| DASH-03 | TBD | Pending |
| DASH-04 | TBD | Pending |
| DASH-05 | TBD | Pending |
| PLAY-01 | TBD | Pending |
| PLAY-02 | TBD | Pending |
| PLAY-03 | TBD | Pending |
| PLAY-04 | TBD | Pending |
| UX-01 | TBD | Pending |
| UX-02 | TBD | Pending |
| UX-03 | TBD | Pending |
| UX-04 | TBD | Pending |
| UX-05 | TBD | Pending |
| LOBBY-01 | TBD | Pending |
| LOBBY-02 | TBD | Pending |
| LOBBY-03 | TBD | Pending |
| LOBBY-04 | TBD | Pending |

**Coverage:**
- v1 requirements: 43 total
- Mapped to phases: 0
- Unmapped: 43 ⚠️

---
*Requirements defined: 2026-01-19*
*Last updated: 2026-01-19 after initial definition*
