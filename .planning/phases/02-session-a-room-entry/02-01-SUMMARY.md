---
phase: 02-session-a-room-entry
plan: 01
subsystem: authentication
tags: [supabase-auth, anonymous-auth, room-management, nanoid]

dependency-graph:
  requires: [01-02]
  provides: [auth-hook, room-creation, room-joining]
  affects: [02-02, 03-01]

tech-stack:
  added: [nanoid@5.0.0]
  patterns: [session-recovery, upsert-pattern, collision-retry]

key-files:
  created:
    - src/hooks/useAuth.ts
    - src/lib/room-codes.ts
    - src/lib/rooms.ts
  modified: []

decisions:
  - id: use-anonymous-auth
    choice: Supabase anonymous auth with localStorage persistence
    rationale: Zero-friction UX, no email required, sessions persist across refreshes

  - id: 4-letter-room-codes
    choice: nanoid customAlphabet with 32-char safe alphabet
    rationale: 1M combinations supports ~1K concurrent rooms before collisions, excludes confusing chars (I/1, O/0, L)

  - id: upsert-for-reconnection
    choice: Database upsert with onConflict on (room_id, user_id) composite key
    rationale: Prevents duplicate participants when users reconnect, race-condition safe

metrics:
  duration: ~2 minutes
  completed: 2026-01-20
---

# Phase 02 Plan 01: Auth & Room Management Infrastructure Summary

**One-liner:** Anonymous auth with session recovery using Supabase, collision-resistant 4-letter room codes via nanoid, and reconnection-safe room joining via upsert.

## What Was Built

### Task 1: Create useAuth hook with session recovery and state management
- Implemented session recovery via `supabase.auth.getSession()` on mount
- Added auth state listener via `onAuthStateChange()` for token refresh detection
- Created `signInAnonymously()` helper with duplicate prevention check
- Exported `{ session, loading, signInAnonymously }` for component use
- Follows Pattern 1 (Session Recovery) and Pattern 2 (Anonymous Auth) from RESEARCH.md

### Task 2: Create room code generation and room management utilities
- **room-codes.ts:** 4-letter code generator using nanoid customAlphabet
  - Alphabet: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (excludes I/1, O/0, L)
  - 1,048,576 combinations (32^4)
  - Documented collision probability (50% at ~1K rooms)

- **rooms.ts:** Room creation and joining functions
  - `createRoom()`: Generates code, inserts room, retries on 23505 collision, creates storyteller participant
  - `joinRoom()`: Finds room by code, upserts participant with `onConflict: 'room_id,user_id'`
  - `getRoomByCode()`: Lookups room by code
  - All functions use proper Database types from supabase.ts

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Session recovery on mount | Persists auth across browser refreshes via localStorage | Users don't need to re-authenticate |
| Check existing session before signInAnonymously | Prevents duplicate user creation on rapid reloads (Pitfall 2) | Avoids orphaned anonymous users |
| Recursive retry on code collision | Handles rare duplicate codes (error 23505) gracefully | Robust room creation at scale |
| Upsert with onConflict | Prevents duplicate participants when user reconnects | Idempotent room joining |
| Case-insensitive room code lookup | Converts input to uppercase before query | Better UX (users can type lowercase) |

## Verification Results

| Check | Status |
|-------|--------|
| TypeScript compiles | PASS - npx tsc --noEmit |
| useAuth exports session, loading, signInAnonymously | PASS - grep verified |
| getSession + onAuthStateChange present | PASS - grep verified |
| generateRoomCode uses customAlphabet | PASS - grep verified |
| createRoom, joinRoom, getRoomByCode exported | PASS - grep verified |
| upsert with onConflict present | PASS - grep verified |

## Commits

| Hash | Type | Description |
|------|------|-------------|
| dc1d037 | feat | Create auth hook and room management utilities |

## Next Phase Readiness

**Ready for Plan 02-02:** Session Setup UI (Display Name & Avatar)
- `useAuth` hook provides session state for protected routes
- `signInAnonymously()` ready to call on app load or when session missing
- Room management functions ready for UI integration

**Ready for Plan 03-01:** Room Lobby
- `createRoom()` and `joinRoom()` can be called from UI forms
- Room codes are collision-resistant and user-friendly
- Participant upsert handles reconnection scenarios

**Dependencies for future plans:**
- UI components (forms, avatars) needed to collect display name and avatar
- Protected routes will use `session` from useAuth to verify authentication
- Realtime subscriptions (Phase 4) will use `session.user.id` for RLS

## Files Created

```
src/
├── hooks/
│   └── useAuth.ts          # Session recovery + auth state management
└── lib/
    ├── room-codes.ts       # 4-letter room code generation
    └── rooms.ts            # Room create/join/lookup functions
```

## Technical Notes

**Session Management:**
- Supabase client automatically handles localStorage persistence (persistSession: true default)
- Auto-refresh enabled (autoRefreshToken: true default)
- Tokens expire after 1 hour, refreshed automatically before expiry
- iOS WebKit 7-day localStorage cap handled by always validating session on mount

**Room Code Strategy:**
- 4 letters = 1M combinations
- Birthday paradox: 50% collision at ~1,000 rooms
- Database unique constraint on rooms.code prevents duplicates
- Recursive retry on collision (rare: <1% at <1K rooms)
- Consider 5-letter codes if collision rate exceeds 1%

**Reconnection Handling:**
- Composite unique constraint on participants(room_id, user_id)
- Upsert with `ignoreDuplicates: false` updates existing records
- Prevents race conditions (no check-then-insert pattern)
- Updates display_name and avatar_id on rejoin (allows profile changes)
