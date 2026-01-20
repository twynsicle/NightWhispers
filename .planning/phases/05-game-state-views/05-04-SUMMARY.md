---
phase: 05-game-state-views
plan: 04
subsystem: player-settings
tags: [settings, leave-game, room-code, soft-delete, modal]
dependency-graph:
  requires:
    - 04-02 (PlayerChatView component)
    - 03-02 (kick pattern with soft delete)
  provides:
    - Player settings menu with room code display
    - Leave game functionality with soft delete
  affects: []
tech-stack:
  added: []
  patterns:
    - Soft delete pattern for participant leave (is_active = false)
    - Settings modal with nested confirmation
    - Room code fetch via participants.rooms relation
key-files:
  created:
    - src/lib/leave-room.ts
    - src/components/PlayerSettingsMenu.tsx
  modified:
    - src/components/PlayerChatView.tsx
decisions:
  - decision: "Soft delete for leave (is_active = false)"
    rationale: "Matches kick pattern, preserves audit trail, enables reconnection detection"
  - decision: "Navigate immediately after leave, don't wait for postgres_changes"
    rationale: "Better UX - user sees immediate response, postgres_changes acts as backup"
  - decision: "Fetch room code via participants.rooms relation"
    rationale: "Consistent with RoomPage loader pattern, uses existing join"
metrics:
  duration: 7min
  completed: 2026-01-20
---

# Phase 5 Plan 4: Player Settings Menu Summary

Settings menu for players to view room code and leave game gracefully.

## One-Liner

Player settings modal with room code copy and leave game confirmation using soft delete pattern.

## What Was Built

### Task 1: Leave Room Logic (c88a483)
Created `src/lib/leave-room.ts` with `leaveRoom(participantId)` function:
- Soft deletes participant by setting `is_active = false`
- Matches existing kick functionality pattern
- Preserves audit trail and enables existing postgres_changes subscription to trigger redirect
- JSDoc explains soft delete behavior and integration points

### Task 2: PlayerSettingsMenu Component (cecbcf2)
Created `src/components/PlayerSettingsMenu.tsx`:
- Modal with "Game Settings" title
- Room code display in large monospace font with copy button
- CopyButton uses Mantine's built-in clipboard functionality
- Notification on copy: "Room code copied!"
- Divider separates code and leave sections
- Leave Game button (red/danger variant) with IconLogout
- Nested confirmation modal: "Leave Game?"
- Loading state during leave operation
- Navigates to home immediately after successful leave
- Error handling with notifications

### Task 3: Settings Integration (f30f84c)
Updated `src/components/PlayerChatView.tsx`:
- Added roomCode state fetched from `participants.rooms(code)` on mount
- Added settingsOpened state for modal control
- Changed header from Stack to Group layout for button placement
- Added ActionIcon with IconSettings in top-right of header
- Conditionally renders PlayerSettingsMenu when roomCode is loaded
- 44x44px minimum touch target via Mantine ActionIcon size="lg"

## Key Integration Points

1. **Leave Room Flow:**
   - Player taps settings icon -> modal opens
   - Player taps "Leave Game" -> confirmation modal
   - Player confirms -> leaveRoom() sets is_active = false
   - Navigate immediately to home for responsive UX
   - RoomPage's postgres_changes subscription provides backup redirect

2. **Room Code Access:**
   - Fetched via `supabase.from('participants').select('rooms(code)')`
   - Same pattern as RoomPage loader uses for participant data
   - Displayed in modal with clipboard copy functionality

3. **Soft Delete Pattern:**
   - Matches kick functionality (03-02)
   - useParticipants filters to is_active = true
   - Participant disappears from all participant lists
   - Other participants see real-time removal

## Files Changed

| File | Lines | Change |
|------|-------|--------|
| src/lib/leave-room.ts | 31 | Created - leaveRoom function |
| src/components/PlayerSettingsMenu.tsx | 181 | Created - settings modal component |
| src/components/PlayerChatView.tsx | 153 | Modified - added settings button and menu |

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Soft delete (is_active = false) | Matches kick pattern, preserves audit trail, enables reconnection |
| Navigate immediately on leave | Better UX than waiting for postgres_changes event |
| Fetch room code via relation | Consistent with existing patterns, single query |
| Nested confirmation modal | Prevents accidental exits, standard UX pattern |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- [x] TypeScript compiles without errors
- [x] leaveRoom function exported from leave-room.ts
- [x] PlayerSettingsMenu component exists (181 lines)
- [x] PlayerChatView imports PlayerSettingsMenu
- [x] PlayerChatView has roomCode fetch query
- [x] Settings button renders in header
- [x] All file line minimums met

## Requirement Delivered

**PLAY-04:** Player can access settings to leave game or view room code

## Next Phase Readiness

Plan 05-04 is the last plan in Phase 5. Phase 5 complete.

Ready for Phase 6 (Polish & PWA).
