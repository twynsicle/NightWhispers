# Project State: Night Whispers

**Last Updated:** 2026-01-20
**Session:** 4

---

## Project Reference

**Core Value:** Storyteller can privately message any player, players can only respond to Storyteller - no player-to-player communication. Zero friction (no accounts, no downloads, just a room code).

**Current Focus:** Phase 3 - Lobby & Room Management (in progress)

**Tech Stack:** React 19 + Vite 7 + Mantine 8 + Supabase + TypeScript

---

## Current Position

**Phase:** 3 of 6 (Lobby & Room Management)
**Plan:** 2 of 3 in phase (plan 03-02 skipped, 03-03 complete)
**Status:** In progress
**Last activity:** 2026-01-20 - Completed 03-03-PLAN.md

**Progress:**
```
Phase 1: Foundation         [██████████] 100%
Phase 2: Session & Room     [██████████] 100%
Phase 3: Lobby & Management [██████....] 67%
Phase 4: Core Messaging     [..........] 0%
Phase 5: Game State & Views [..........] 0%
Phase 6: Polish & PWA       [..........] 0%

Overall: 7/8 plans complete (88% of planned work)
```

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Plans Completed | 7 |
| Requirements Delivered | 15/43 |
| Phases Completed | 2/6 |
| Session Count | 4 |

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

### Architecture Notes

- **Messaging:** Broadcast for real-time delivery, Postgres for persistence
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
- [ ] Execute 03-02-PLAN.md (Room Controls) - skipped
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

Completed plan 03-03: QR Code Sharing & Room Cleanup. Installed qrcode library and created QRCodeGenerator component with gothic theme colors (crimson for dark pixels). Added QR code modal to RoomPage with "Show QR Code" button available to all participants. Join URL includes pre-filled room code query param for seamless scan-to-join experience. Created Supabase Edge Function for automated deletion of expired rooms with cascading participant/message cleanup. Edge Function deployed but requires external scheduler setup (pg_cron, Vercel Cron, or GitHub Actions). Phase 3 now 67% complete (2 of 3 plans, plan 03-02 skipped).

### Next Session Entry Point

Phase 3 nearly complete. Consider executing remaining Phase 3 plan if exists, or proceed to Phase 4: Core Messaging.

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

---

*State initialized: 2026-01-19*
*Last execution: 03-03-PLAN.md completed 2026-01-20*
*Phase 1 complete: 2026-01-19*
*Phase 2 complete: 2026-01-20 (all 3 plans: 02-01, 02-02, 02-03)*
*Phase 3 in progress: 2/3 plans complete (03-01, 03-03; 03-02 skipped)*
