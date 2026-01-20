---
phase: "05"
plan: "03"
plan_name: "Game Reset"
subsystem: "game-state"
completed: "2026-01-20"
duration: "4 minutes"

tags:
  - supabase
  - mantine
  - modal
  - reset
  - database

dependency_graph:
  requires:
    - "01-02: Database schema with rooms, participants, messages tables"
    - "04-02: StorytellerDashboard component"
  provides:
    - "Game reset functionality for Storyteller"
    - "Confirmation modal for destructive actions"
    - "Database operations for clearing/resetting game state"
  affects:
    - "05-04: Any phase advance or game control UIs that may need reset awareness"

tech_stack:
  added: []
  patterns:
    - name: "Confirmation modal for destructive actions"
      description: "GameResetModal requires explicit confirm before executing reset"
    - name: "Sequential database operations"
      description: "Three database operations (delete messages, update room, update participants) with error handling"

key_files:
  created:
    - path: "src/lib/game-reset.ts"
      purpose: "Game reset logic with three database operations"
      exports: ["resetGame"]
      lines: 53
    - path: "src/components/GameResetModal.tsx"
      purpose: "Confirmation modal for game reset"
      exports: ["GameResetModal"]
      lines: 91
  modified:
    - path: "src/components/StorytellerDashboard.tsx"
      changes: "Added reset button with modal integration"
      lines_added: 24

decisions:
  - decision: "Reset button uses subtle red styling"
    rationale: "Destructive action should be visible but not prominent (not mixed with primary actions)"
    phase: "05-03"
  - decision: "Reset placed at bottom of dashboard with divider"
    rationale: "Less prominent placement for rarely-used destructive action"
    phase: "05-03"
  - decision: "Sequential database operations with error handling"
    rationale: "Each operation can fail independently; throw descriptive errors for debugging"
    phase: "05-03"

metrics:
  tasks_completed: 3
  tests_added: 0
  components_added: 1
  hooks_added: 0
  files_created: 2
  files_modified: 1
  lines_added: 168
---

# Phase 5 Plan 3: Game Reset Summary

**One-liner:** Storyteller can reset game (clears messages, resets phase to Night 1, sets all players to alive) via confirmation modal

## What Was Built

Created game reset functionality allowing Storyteller to restart a game without requiring players to rejoin the room. This is useful for practice runs, false starts, or rule changes mid-game.

### Key Components

1. **Game Reset Logic** (`src/lib/game-reset.ts`)
   - `resetGame(roomId)`: Performs three database operations:
     1. Delete all messages in room
     2. Reset room phase to "Night 1"
     3. Reset all participants to "alive" status with cleared custom_status
   - Preserves: participants, room code, room status, storyteller assignment
   - Error handling with descriptive messages for each operation

2. **Confirmation Modal** (`src/components/GameResetModal.tsx`)
   - Warning text listing all reset effects
   - Cancel and Confirm buttons
   - Loading state during reset operation
   - Success/error notifications via Mantine
   - Danger styling (red) for confirm button

3. **Dashboard Integration** (`src/components/StorytellerDashboard.tsx`)
   - "Reset Game" button with IconRefresh icon
   - Subtle red styling (variant="subtle", color="red")
   - Placed at bottom of dashboard below player cards
   - Divider separates from primary actions
   - State management for modal open/close

### Architecture Decisions

**Sequential Database Operations:**
- Messages deleted first (most data)
- Room phase reset second (game state)
- Participants reset last (prepares for new game)
- If any operation fails, error thrown with specific message

**Button Placement:**
- Reset is destructive action, placed at bottom with visual separator
- Not mixed with Broadcast card or player cards (primary actions)
- Subtle variant makes it less prominent than primary actions

**Real-time Propagation:**
- Existing postgres_changes subscriptions automatically reflect reset
- useMessages hook sees empty message list after reset
- usePhase hook sees "Night 1" after reset
- Player status changes visible in participant list

## Requirements Delivered

### GAME-06: Storyteller can reset game

- Reset clears all messages from database
- Reset returns phase to "Night 1"
- Reset keeps all participants in room (no kicked players)
- Reset sets all players to alive status
- Confirmation modal prevents accidental resets
- All participants see reset in real-time (empty chat, phase reset)

### Must-Haves Verified

**Artifacts:**
- `src/lib/game-reset.ts` exists (53 lines, exports resetGame)
- `src/components/GameResetModal.tsx` exists (91 lines, exports GameResetModal)
- `src/components/StorytellerDashboard.tsx` modified (256 lines total, added 24)

**Key Links:**
- GameResetModal calls `resetGame(roomId)` on confirm
- game-reset.ts performs `.delete().eq('room_id', roomId)` on messages
- game-reset.ts performs `.update({ phase: 'Night 1' })` on rooms
- game-reset.ts performs `.update({ status: 'alive' })` on participants

## Testing & Verification

### Automated Checks
- TypeScript compilation: No errors
- resetGame exported: Verified
- GameResetModal component exists: Verified
- StorytellerDashboard imports GameResetModal: Verified
- Reset button renders in Storyteller view: Verified

### Manual Verification Checklist
1. Start game as Storyteller with at least 1 player
2. Send several messages back and forth
3. Advance phase to "Day 2"
4. Mark a player as dead
5. Tap "Reset Game" button in Storyteller view
6. Verify modal appears with warning text
7. Tap "Cancel", verify modal closes without changes
8. Tap "Reset Game" again, then tap "Confirm"
9. Verify notification "Game reset successfully"
10. Verify messages disappear for both Storyteller and Player
11. Verify phase resets to "Night 1" in header
12. Verify dead player's avatar returns to normal (alive status)
13. Verify both participants still in room (not kicked)
14. Send new message, verify it appears (messaging still works)

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

### Blockers
None.

### Concerns
None.

### Phase 5 Status
- Plan 05-01: Complete (Phase Display & Controls)
- Plan 05-02: Complete (Player Status)
- Plan 05-03: Complete (Game Reset) <- this plan

## Files Changed

### Created
- `src/lib/game-reset.ts` (53 lines)
- `src/components/GameResetModal.tsx` (91 lines)

### Modified
- `src/components/StorytellerDashboard.tsx` (+24 lines: reset button, modal integration)

## Commits

- `6821f4d`: feat(05-03): add game reset logic
- `d50c2c2`: feat(05-03): add GameResetModal confirmation component
- `bb46aee`: feat(05-03): integrate reset button into StorytellerDashboard

## Metadata

**Completed:** 2026-01-20
**Duration:** 4 minutes
**Tasks:** 3/3 complete
**Wave:** 1 (parallel-eligible, no dependencies)
