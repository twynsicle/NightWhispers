---
phase: 03-lobby-room-management
plan: 02
subsystem: ui
tags: [mantine, react, supabase, realtime, postgres-changes]

# Dependency graph
requires:
  - phase: 03-01
    provides: Real-time participant list foundation with useParticipants hook
provides:
  - Storyteller lobby management controls (kick, edit name, start game)
  - Real-time kicked player detection and redirect
  - Game status transitions (lobby → active → ended)
  - Script selector UI (v1: None only)
affects: [04-core-messaging, 05-game-state-views]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Real-time participant removal detection via postgres_changes
    - Soft delete pattern for kicked participants (is_active = false)
    - Modal-based edit flows with validation
    - Status-based conditional UI rendering

key-files:
  created: []
  modified:
    - src/lib/rooms.ts
    - src/pages/RoomPage.tsx
    - src/components/ParticipantList.tsx
    - src/hooks/useParticipants.ts
    - src/pages/HomePage.tsx

key-decisions:
  - "Soft delete for kicked participants (is_active = false) preserves audit trail"
  - "Real-time kick detection via postgres_changes subscription (not loader data)"
  - "Script selector disabled in v1 (None only), ready for v2 expansion"
  - "Room status tracking via postgres_changes on rooms table"
  - "Conditional UI rendering based on roomStatus (lobby/active/ended)"

patterns-established:
  - "Participant action callbacks: onKick, onEdit props in ParticipantList"
  - "Status-driven view switching: lobby → active transitions UI completely"
  - "Edit modal pattern: local state → validation → update → notification"
  - "Dual subscription pattern: participants + room status in single hook"

# Metrics
duration: 5min
completed: 2026-01-20
---

# Phase 3 Plan 2: Room Controls Summary

**Storyteller lobby management with kick/edit controls, real-time status transitions, and game start flow**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-20T03:42:56Z
- **Completed:** 2026-01-20T03:47:51Z
- **Tasks:** 3
- **Files modified:** 5
- **Commits:** 3 task commits

## Accomplishments

- Storyteller can kick players, edit names, and start game from lobby UI
- Kicked players detect removal in real-time and redirect to home with error message
- Room status transitions from lobby → active → ended with conditional UI rendering
- Player waiting indicator replaced with game status when Storyteller starts game
- Script selector added (disabled, None only for v1)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add room management functions** - `1773180` (feat)
2. **Task 2: Add Storyteller controls to lobby UI** - `047eb94` (feat)
3. **Task 3: Add game status transition handling** - `167473f` (feat)

## Files Created/Modified

- `src/lib/rooms.ts` - Added kickParticipant, updateParticipantName, startGame functions
- `src/components/ParticipantList.tsx` - Added action buttons (edit, kick) for Storyteller
- `src/pages/RoomPage.tsx` - Added script selector, Start Game button, edit modal, kicked detection, status-based UI
- `src/hooks/useParticipants.ts` - Added roomStatus tracking via postgres_changes on rooms table
- `src/pages/HomePage.tsx` - Added "kicked" error message handling

## Decisions Made

**Soft delete for kicked participants:**
- Use `is_active = false` instead of hard delete
- Preserves data for reconnection detection and audit trail
- useParticipants filters to `is_active = true` automatically

**Real-time kick detection:**
- Kicked players need immediate notification, not just on next page load
- Use postgres_changes subscription on current participant's is_active field
- When is_active becomes false, show notification and redirect to home

**Room status in useParticipants hook:**
- Status changes are rare (once per game), so adding room subscription is efficient
- Alternative (separate useRoom hook) would be overkill for single field
- Single hook returns both participants and roomStatus

**Script selector disabled for v1:**
- Only "None (No Roles)" option available
- v2 will add Trouble Brewing and other scripts
- UI ready for expansion, just needs data array update

**Start Game button validation:**
- Disabled if < 2 participants (need at least Storyteller + 1 player)
- Shows helpful hint text about participant count requirement

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

**Ready for Phase 4 (Core Messaging):**
- Room status transitions working (lobby → active)
- Participant list updates in real-time
- Game started state shows placeholder for messaging UI
- All lobby controls functional and tested

**Phase 3 Status:**
- Plan 03-01: Complete (Real-time Lobby Foundation)
- Plan 03-02: Complete (Room Controls) ← this plan
- Plan 03-03: Complete (QR Code Sharing & Room Cleanup)
- **Phase 3: 100% complete**

**Next:**
- Phase 4: Core Messaging - Replace active game placeholder with actual messaging interface

---
*Phase: 03-lobby-room-management*
*Plan: 03-02*
*Completed: 2026-01-20*
