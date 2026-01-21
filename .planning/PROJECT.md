# Night Whispers

## Current State

**Version:** v1 MVP (shipped 2026-01-20)
**Status:** Production-ready
**Codebase:** 5,926 LOC TypeScript, React 19 + Vite 7 + Mantine 8 + Supabase

## What This Is

A mobile-first web application for managing private Storyteller-to-player communications during social deduction game night phases. Replaces the impractical "eyes closed" mechanic with private digital messaging, preserving game integrity by preventing secret player-to-player communication.

## Core Value

The Storyteller can privately message any player, and players can only respond to the Storyteller—no player-to-player communication allowed. Zero friction (no accounts, no downloads, just a room code).

## Requirements

### Validated

- Room management (create, join, QR code, auto-delete, kick) — v1
- Session persistence with auto-rejoin — v1
- Real-time private messaging (1-to-1 + broadcasts) — v1
- Typing indicators and unread counts — v1
- Push notifications for backgrounded app — v1
- Game phase tracking and player status — v1
- Storyteller dashboard (mobile cards + desktop split-panel) — v1
- Player view (private chat + settings) — v1
- PWA installable with gothic theme — v1

### Active

(None — define for v2 milestone)

### Out of Scope

- OAuth/social login — session tokens are sufficient for ephemeral game sessions
- Real-time chat (player-to-player) — deliberately excluded to preserve game integrity
- Video/audio — text-only by design
- Custom script creation UI — v2 feature
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
- React 19 with Vite 7
- Mantine 8 UI + custom CSS for gothic theme
- Supabase (PostgreSQL + Realtime + Edge Functions)
- PWA with Web Push API
- Vitest for testing

## Constraints

- **Tech stack**: React + Vite + Mantine + Supabase — specified in original design
- **Room limits**: Max 20 players per room, max 100 concurrent rooms system-wide
- **Session duration**: Rooms auto-expire after 1 hour of inactivity
- **Mobile-first**: Primary design target is mobile; desktop is secondary
- **Script support**: v1 limited to None only; v2 adds Trouble Brewing

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase for backend | Realtime built-in, Edge Functions, no server management | ✓ Good |
| Session tokens over accounts | Ephemeral game sessions don't need persistent identity | ✓ Good |
| No player-to-player chat | Core game mechanic requires Storyteller as sole communication hub | ✓ Good |
| Mantine 8 UI | Component library with good defaults, customizable for gothic theme | ✓ Good |
| 4-letter room codes | Easy to share verbally, low collision risk for expected room count | ✓ Good |
| Anonymous auth | Zero friction for joining games | ✓ Good |
| Dual-write messaging | DB persistence + Broadcast for reliability and speed | ✓ Good |
| VAPID push via Edge Functions | Works across browsers including iOS PWA | ✓ Good |

## Next Milestone Goals

**v2 — Roles & Scripts**
- Role assignment (Storyteller reference only)
- Message templates grouped by role/situation
- Trouble Brewing script with full role list

---
*Last updated: 2026-01-20 after v1 milestone*
