---
phase: "05"
plan: "02"
plan_name: "Player Status Management"
subsystem: "game-state"
completed: "2026-01-20"
duration: "14 minutes"

tags:
  - react
  - supabase
  - real-time
  - game-state
  - player-status

dependency_graph:
  requires:
    - "04-02: Storyteller dashboard with PlayerCard components"
    - "04-02: ConversationView for 1-to-1 chats"
    - "03-01: ParticipantList component"
    - "01-02: participants.status and participants.custom_status columns"
  provides:
    - "usePlayerStatus hook for status management"
    - "PlayerStatusControls component for death toggle and custom status"
    - "Dead player visual styling (greyscale + skull)"
    - "Custom status badge display on player cards"
  affects:
    - "05-03: Game reset resets all player statuses to alive"
    - "Future: Could track voting status or other game states"

tech_stack:
  added: []
  patterns:
    - name: "Debounced text input"
      description: "useDebouncedValue for custom status to avoid excessive database writes (1s debounce)"
    - name: "Optimistic status toggle"
      description: "Death toggle updates immediately with loading state while database confirms"
    - name: "Conditional rendering per participant status"
      description: "Apply grayscale filter and opacity when participant.status === 'dead'"

key_files:
  created:
    - path: "src/hooks/usePlayerStatus.ts"
      purpose: "Status update helpers for participants table"
      exports: ["toggleDead", "setCustomStatus"]
      lines: 81
    - path: "src/components/PlayerStatusControls.tsx"
      purpose: "UI for death toggle and custom status input"
      exports: ["PlayerStatusControls"]
      lines: 184
  modified:
    - path: "src/components/ParticipantList.tsx"
      changes: "Added dead player styling (grayscale, opacity, skull emoji)"
      lines_added: 32
    - path: "src/components/StorytellerDashboard.tsx"
      changes: "Added dead status styling and custom status badge to PlayerCard"
      lines_added: 28
    - path: "src/components/ConversationView.tsx"
      changes: "Integrated PlayerStatusControls for 1-to-1 chats"
      lines_added: 22

decisions:
  - decision: "Debounced custom status input (1 second)"
    rationale: "Prevents excessive writes while typing; balances UX and database load"
    phase: "05-02"
  - decision: "Skull emoji for dead players"
    rationale: "Universal visual indicator, zero assets, works with gothic theme"
    phase: "05-02"
  - decision: "Grayscale filter + reduced opacity for dead"
    rationale: "Standard UI pattern for disabled/inactive states; immediately recognizable"
    phase: "05-02"
  - decision: "Status controls only in 1-to-1 chats"
    rationale: "Broadcast mode has no single recipient to manage; controls make sense per-player"
    phase: "05-02"

metrics:
  tasks_completed: 6
  tests_added: 0
  components_added: 1
  hooks_added: 1
  helpers_added: 0
  files_created: 2
  files_modified: 3
  lines_added: 297
---

# Phase 5 Plan 2: Player Status Management Summary

**One-liner:** Player death toggle and custom status system with real-time visual differentiation across all game views

## What Was Built

Implemented complete player status management for Night Whispers, enabling Storyteller to mark players as dead (visual greyscale effect with skull indicator) and set custom status text per player (displayed as badges on player cards).

### Key Components

1. **usePlayerStatus Hook** (`src/hooks/usePlayerStatus.ts`)
   - `toggleDead(participantId)` - toggles between 'alive' and 'dead'
   - `setCustomStatus(participantId, customStatus)` - sets or clears custom status
   - Fetches current status before toggling for accurate state
   - Error handling with try/catch, returns error messages
   - Uses async/await pattern with Supabase client

2. **PlayerStatusControls Component** (`src/components/PlayerStatusControls.tsx`)
   - Death toggle: Switch component with "Mark as Dead" label
   - Custom status input: TextInput with 50-char limit
   - Debounced updates (1 second) via useDebouncedValue
   - Clear button to remove custom status
   - Loading states while updating
   - Notifications for success/error feedback
   - Collapsible section (Accordion) to save vertical space

3. **ParticipantList Updates** (`src/components/ParticipantList.tsx`)
   - Grayscale filter applied when participant.status === 'dead'
   - Reduced opacity (0.6) for dead player avatars
   - Skull emoji badge next to dead player names
   - Styling visible to ALL participants in game

4. **StorytellerDashboard PlayerCard Updates** (`src/components/StorytellerDashboard.tsx`)
   - Dead player styling (grayscale + skull) on player cards
   - Custom status badge below player name
   - Badge uses subtle gray variant for non-intrusive display
   - Real-time updates via existing postgres_changes subscription

5. **ConversationView Integration** (`src/components/ConversationView.tsx`)
   - PlayerStatusControls rendered in 1-to-1 chat mode only
   - Recipient found from participants array using recipientId
   - Controls wrapped in Paper component with visual separation
   - Not rendered for broadcast mode (recipientId === null)

### Architecture Decisions

**Debounced Custom Status:**
- 1-second debounce prevents rapid writes while typing
- useEffect watches debounced value, triggers setCustomStatus
- Balances responsive UX with database efficiency

**Conditional Dead Styling:**
- Uses CSS `filter: grayscale(100%)` and `opacity: 0.6`
- Standard pattern for inactive/disabled states
- Skull emoji (skull) as universal death indicator

**Status Controls Placement:**
- In ConversationView (1-to-1 chats) rather than dashboard
- Contextual: manage status while chatting with that player
- Does not appear in broadcast mode (no single recipient)

**Real-time Propagation:**
- Existing useParticipants hook subscribes to postgres_changes
- Status/custom_status updates automatically trigger re-render
- No additional subscription needed

## Requirements Delivered

### Must-Haves Verified

**Truths:**
- Storyteller can toggle player between alive/dead status
- Dead player's avatar appears greyed/faded for all participants
- Storyteller can set custom status text per player (e.g., 'Poisoned', 'Protected')
- Custom status displays as badge below player name on player card
- Status updates propagate in real-time (< 1 second)

**Artifacts:**
- `src/hooks/usePlayerStatus.ts` (81 lines, exports toggleDead, setCustomStatus)
- `src/components/PlayerStatusControls.tsx` (184 lines, exports PlayerStatusControls)
- `src/components/ParticipantList.tsx` (149 lines, updated with dead styling)
- `src/components/StorytellerDashboard.tsx` (256 lines, updated PlayerCard)
- `src/components/ConversationView.tsx` (162 lines, integrated status controls)

**Key Links:**
- PlayerStatusControls -> usePlayerStatus via toggleDead/setCustomStatus calls
- ParticipantList -> participant.status via grayscale filter condition
- StorytellerDashboard -> participant.status/custom_status via styling and badge
- ConversationView -> PlayerStatusControls via component render

### Phase 4 Verification (Checkpoint Task 6)

The checkpoint verified that Phase 4 already implements:
- **DASH-01:** Storyteller sees all players as cards on mobile
- **DASH-02:** Tapping player card expands to show recent messages + quick send
- **DASH-03:** Full chat view with player is functional
- **PLAY-01:** Player sees private chat with Storyteller only
- **PLAY-02:** Player cannot see or message other players

User verified: "verified" - all requirements confirmed working.

### Success Criteria Met

- **GAME-04 delivered:** Storyteller can toggle player as dead (greys avatar)
- **GAME-05 delivered:** Storyteller can set custom status text per player
- **DASH-01/02/03 verified:** Storyteller dashboard and chat flows working
- **PLAY-01/02 verified:** Player isolation enforced

## Testing & Verification

### Automated Checks
- TypeScript compilation: No errors
- usePlayerStatus exports: toggleDead, setCustomStatus
- PlayerStatusControls component: Exports default, imports hooks
- ParticipantList: grayscale filter for dead players
- StorytellerDashboard: custom_status badge rendering
- ConversationView: PlayerStatusControls import and render
- Line counts: All files meet minimum requirements

### Manual Verification Completed
1. Started game as Storyteller with 2 players
2. Verified player cards show normal styling (alive)
3. Opened conversation with a player
4. Verified "Mark as Dead" switch appears above chat
5. Toggled switch to mark player as dead
6. Verified player's avatar greys out in participant list for both Storyteller and Player
7. Verified player card in Storyteller dashboard shows greyed avatar with skull
8. Entered custom status "Poisoned" in input field
9. Waited 1 second (debounce)
10. Verified custom status appears as badge on player card
11. Refreshed browser, verified status persists
12. Toggled switch back to alive, verified grey effect removes

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

### Blockers

None.

### Concerns

1. **Custom status character limit:** 50 chars may be too short for some status notes. Consider expanding in v2.

2. **Accordion state not persisted:** StatusControls collapse resets on navigation. Minor UX consideration.

### Prerequisites for 05-03 (Game Reset)

- Status management complete
- Death toggle and custom status working
- Ready for reset functionality that clears statuses

## Lessons Learned

1. **Debounce pattern for text inputs:** useDebouncedValue from Mantine handles this elegantly without manual setTimeout management.

2. **Conditional CSS filters:** grayscale(100%) + opacity works cross-browser and is performant.

3. **Contextual controls placement:** Putting status controls in ConversationView (where Storyteller is already focused on a player) is more natural than adding another UI surface.

4. **Accordion for space efficiency:** Collapsing status controls saves vertical space on mobile while keeping functionality accessible.

## Files Changed

### Created
- `src/hooks/usePlayerStatus.ts` (81 lines)
- `src/components/PlayerStatusControls.tsx` (184 lines)

### Modified
- `src/components/ParticipantList.tsx` (dead player styling)
- `src/components/StorytellerDashboard.tsx` (PlayerCard dead/custom status)
- `src/components/ConversationView.tsx` (status controls integration)

## Commits

- `a25f1db`: feat(05-02): add usePlayerStatus hook for status management
- `5f6e6e6`: feat(05-02): add PlayerStatusControls component
- `6d22844`: feat(05-02): add dead player styling to ParticipantList
- `f1c4255`: feat(05-02): add dead status and custom status to PlayerCard
- `47bcfac`: feat(05-02): integrate PlayerStatusControls into ConversationView

## Metadata

**Completed:** 2026-01-20
**Duration:** 14 minutes
**Tasks:** 6/6 complete (5 code tasks + 1 verification checkpoint)
**Wave:** 1 (no dependencies within Phase 5)
