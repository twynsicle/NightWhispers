# Night Whispers

## What This Is

A mobile-first web application for managing private Storyteller-to-player communications during social deduction game night phases. Replaces the impractical "eyes closed" mechanic with private digital messaging, preserving game integrity by preventing secret player-to-player communication.

## Core Value

The Storyteller can privately message any player, and players can only respond to the Storyteller—no player-to-player communication allowed. Zero friction (no accounts, no downloads, just a room code).

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Room creation with 4-letter codes
- [ ] Session-based reconnection (localStorage tokens)
- [ ] Storyteller dashboard with all player conversations
- [ ] Player chat view (private with Storyteller only)
- [ ] Phase tracking (Night 1, Day 1, etc.)
- [ ] Real-time messaging via Supabase Realtime
- [ ] Push notifications for new messages
- [ ] Role assignment (Storyteller reference only)
- [ ] Player status tracking (dead, custom text)
- [ ] Script support: None + Trouble Brewing templates
- [ ] QR code sharing for room join
- [ ] Mobile-first responsive design
- [ ] Desktop split-panel view for Storyteller
- [ ] Gothic visual theme
- [ ] PWA support

### Out of Scope

- OAuth/social login — session tokens are sufficient for ephemeral game sessions
- Real-time chat (player-to-player) — deliberately excluded to preserve game integrity
- Video/audio — text-only by design
- Custom script creation UI — v2 feature, v1 uses hardcoded Trouble Brewing templates
- Multiple concurrent games per user — one session at a time
- Persistent game history — rooms expire after 1 hour of inactivity

## Context

**Target Users:**
- Primary: In-person Blood on the Clocktower groups
- Secondary: Other social deduction games (Werewolf, etc.)

**Problem:**
Social deduction games require players to close eyes during night phases while Storyteller privately communicates with individuals. This is impractical in bright rooms, public spaces, or for players with accessibility needs.

**Solution Approach:**
- Asymmetric UX: Storyteller sees all conversations; players see only their private chat
- Zero friction: Room codes, no accounts
- Game-aware: Role tagging, status tracking, phase advancement
- Resilient: Automatic reconnection for the reality of players switching apps

**Technical Environment:**
- React 18+ with Vite
- Mantine UI + custom CSS for gothic theme
- Supabase (PostgreSQL + Realtime + Edge Functions)
- PWA with Web Push API
- Vitest for testing

**Avatar Assets:**
- 12 player avatars + 4 Storyteller avatars (user-provided)
- Gothic character illustrations

## Constraints

- **Tech stack**: React + Vite + Mantine + Supabase — specified in original design
- **Room limits**: Max 20 players per room, max 100 concurrent rooms system-wide
- **Session duration**: Rooms auto-expire after 1 hour of inactivity
- **Mobile-first**: Primary design target is mobile; desktop is secondary
- **Script support**: v1 limited to None + Trouble Brewing only

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase for backend | Realtime built-in, Edge Functions, no server management | — Pending |
| Session tokens over accounts | Ephemeral game sessions don't need persistent identity | — Pending |
| No player-to-player chat | Core game mechanic requires Storyteller as sole communication hub | — Pending |
| Mantine UI | Component library with good defaults, customizable for gothic theme | — Pending |
| 4-letter room codes | Easy to share verbally, low collision risk for expected room count | — Pending |

---
*Last updated: 2026-01-19 after initialization*
