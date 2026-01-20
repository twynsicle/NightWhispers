---
phase: 02-session-a-room-entry
plan: 03
subsystem: authentication
tags: [session-recovery, error-handling, auto-rejoin, react-router-loader]

dependency-graph:
  requires: [02-01, 02-02]
  provides: [session-recovery, auto-rejoin, error-feedback]
  affects: [03-01, 04-01]

tech-stack:
  added: []
  patterns: [loader-based-auth, error-redirect, session-recovery-on-mount]

key-files:
  created: []
  modified:
    - src/App.tsx
    - src/pages/RoomPage.tsx
    - src/pages/HomePage.tsx

decisions:
  - id: session-recovery-at-root
    choice: Root-level session recovery in App.tsx before router rendering
    rationale: Ensures session is restored from localStorage before any routing logic executes, enabling seamless auto-rejoin

  - id: error-redirect-with-codes
    choice: Redirect to home with URL param error codes instead of inline alerts
    rationale: Keeps error state in URL for better UX (can share/bookmark), separates concerns (HomePage handles all errors)

  - id: loader-pattern-for-protection
    choice: React Router loader for route protection with redirect
    rationale: Prevents FOUC (flash of unauthenticated content), SEO-safe, blocks child loaders before rendering

metrics:
  duration: ~2 minutes
  completed: 2026-01-19
---

# Phase 02 Plan 03: Room Integration & Verification Summary

**One-liner:** Root-level session recovery with auto-rejoin flow using React Router loaders, error-redirect pattern with user-friendly messages, and room code display for sharing.

## What Was Built

### Task 1: Implement session recovery and auto-rejoin flow
- **App.tsx:** Added root-level useAuth hook call with loading state
  - Shows Mantine Loader while `session.loading` is true
  - Renders RouterProvider only after session recovery completes
  - Enables auto-rejoin: session restored before routing logic executes
  - Follows RESEARCH.md Pattern 1 (Session Recovery)

- **RoomPage.tsx:** Added room code display UI
  - Shows room code using Mantine Code component with block prop
  - Displays helper text: "Share this code for others to join"
  - Styled with crimson color for gothic theme consistency
  - Room code accessible from participant.rooms.code (joined data from loader)

### Task 2: Add error handling and user feedback for session failures
- **HomePage.tsx:** Error message display system
  - Reads error codes from URL searchParams
  - Maps error codes to user-friendly messages:
    - `session-invalid` → "Your session is no longer valid. Please join again."
    - `not-participant` → "You are not in this room. You may have been kicked or the room was deleted."
    - `no-session` → "Your session has expired. Please join again."
  - Displays Alert component (red, filled, with close button)
  - Clears error by navigating to '/' on close

- **RoomPage.tsx (loader):** Updated redirects with specific error codes
  - No session: `redirect('/?error=session-invalid')`
  - No participant: `redirect('/?error=not-participant')`
  - Provides clear context for error display on HomePage

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Session recovery before routing | Ensures session restored from localStorage before any route logic | Auto-rejoin works seamlessly on browser refresh |
| Loading skeleton during recovery | Prevents flicker or premature redirects | Better UX, no FOUC |
| Error codes in URL params | Keeps error state shareable/bookmarkable | Cleaner separation of concerns |
| Centralized error display on HomePage | Single source of truth for error messages | Easier to maintain, consistent UX |
| Room code display with Code component | Mantine component designed for code display | Better visual hierarchy, copy-paste friendly |

## Verification Results

| Check | Status |
|-------|--------|
| TypeScript compiles | PASS - npx tsc --noEmit |
| App.tsx uses useAuth hook | PASS - imports and calls useAuth() |
| App.tsx shows Loader during loading | PASS - renders Center + Loader when loading=true |
| RoomPage displays room code | PASS - Code component with participant.rooms.code |
| HomePage reads error from searchParams | PASS - useSearchParams() implementation found |
| HomePage shows Alert for errors | PASS - Alert component with error messages |
| RoomPage loader redirects with error codes | PASS - both session-invalid and not-participant found |

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 0d7cee7 | feat | Implement session recovery and auto-rejoin flow |
| 0dfa8d4 | feat | Add error handling and user feedback for session failures |

## Requirements Delivered

Plan 02-03 completes all Phase 2 requirements:

- ✅ **SESS-01:** User can set display name before joining game (from 02-02)
- ✅ **SESS-02:** User can select avatar from pre-made set (from 02-02)
- ✅ **SESS-03:** Session token persists in localStorage for reconnection
- ✅ **SESS-04:** User auto-rejoins room on app reload if session valid
- ✅ **SESS-05:** User sees error and returns to home if session expired/kicked
- ✅ **ROOM-01:** Storyteller can create a room and receive a 4-letter code (from 02-02)
- ✅ **ROOM-02:** Player can join a room by entering a 4-letter code (from 02-02)
- ✅ **ROOM-06:** Participants can view room code for sharing/rejoining
- ✅ **UX-01:** Gothic visual theme (dark background, crimson/gold accents) (from 02-01, 02-02)
- ✅ **UX-02:** Mobile-first responsive design (from 02-02)

**Phase 2 Status:** COMPLETE (10/10 requirements delivered)

## Next Phase Readiness

**Ready for Phase 3: Lobby & Room Management**
- Session management fully functional (auth, recovery, auto-rejoin)
- Room creation and joining working end-to-end
- Error handling provides clear user feedback
- Protected route pattern established for secure pages
- Gothic theme applied consistently across all pages

**Dependencies for Phase 3:**
- Realtime subscriptions for lobby participant list (Supabase Broadcast or Postgres Changes)
- Player kick functionality (delete participant + notify)
- QR code generation for room sharing
- Game start state transition

**No blockers or concerns.**

## Files Modified

```
src/
├── App.tsx                    # Root-level session recovery + loading state
├── pages/
│   ├── HomePage.tsx          # Error message display system
│   └── RoomPage.tsx          # Room code display + loader error redirects
```

## Technical Notes

**Session Recovery Flow:**
1. App.tsx mounts → useAuth() called
2. useAuth reads localStorage for existing session via getSession()
3. If session found, sets session state and loading=false
4. If no session, loading=false immediately (no session to recover)
5. App.tsx shows Loader while loading=true
6. Once loading=false, RouterProvider renders and routing begins
7. Protected routes (RoomPage) access session via getSession() in loader

**Auto-Rejoin Flow:**
1. User in room at `/room/:roomId`
2. User refreshes browser (F5)
3. App.tsx mounts, useAuth recovers session from localStorage
4. RouterProvider renders, roomLoader executes
5. roomLoader finds valid session + participant
6. User lands back in room - no re-authentication needed

**Error Handling Flow:**
1. Protected route loader detects invalid session or missing participant
2. Loader redirects to `/?error={code}` (session-invalid or not-participant)
3. HomePage mounts, reads error from URL searchParams
4. HomePage displays Alert with user-friendly message
5. User clicks close → navigates to `/` (clears error param)

**iOS WebKit Considerations:**
- localStorage tokens expire after 7 days on iOS Safari/WebKit
- Session recovery on mount handles this gracefully
- If session expired, loader redirects to home with error
- User sees clear message and can rejoin room with new session

---
*Phase: 02-session-a-room-entry*
*Completed: 2026-01-19*
