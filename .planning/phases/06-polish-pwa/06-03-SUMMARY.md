---
phase: 06-polish-pwa
plan: 03
subsystem: ui
tags: [drag-and-drop, dnd-kit, sortable, reordering, accessibility]
dependency-graph:
  requires: [06-02]
  provides: [player-card-reordering, sortable-ui, participant-order-persistence]
  affects: []
tech-stack:
  added: [@dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities]
  patterns: [drag-and-drop, optimistic-updates, useSortable-hook]
key-files:
  created:
    - src/components/SortablePlayerCard.tsx
    - supabase/migrations/006_participant_sort_order_index.sql
  modified:
    - src/components/StorytellerDashboard.tsx
    - src/components/desktop/PlayerSidebar.tsx
    - src/lib/rooms.ts
    - package.json
decisions:
  - id: DEC-0603-01
    title: "8px activation constraint for drag"
    choice: "Require 8px movement before drag starts"
    rationale: "Prevents accidental drags when tapping/clicking to open conversation"
  - id: DEC-0603-02
    title: "Parallel database updates"
    choice: "Use Promise.all for updating sort_order"
    rationale: "Simple implementation, fast enough for <20 players in Night Whispers"
  - id: DEC-0603-03
    title: "Optimistic UI updates"
    choice: "Update local state immediately, revert on error"
    rationale: "Instant feedback for better UX, database persistence for durability"
metrics:
  duration: 12min
  completed: 2026-01-20
---

# Phase 6 Plan 03: Player Card Drag-and-Drop Summary

**One-liner:** Drag-and-drop player card reordering with dnd-kit, supporting mobile touch, desktop mouse, and keyboard accessibility with persistent sort order.

## What Was Built

### dnd-kit Integration
Installed @dnd-kit/core (v6.3.1), @dnd-kit/sortable (v10.0.0), and @dnd-kit/utilities (v3.2.2) for drag-and-drop functionality. Successfully works with React 19 despite library age concerns.

### SortablePlayerCard Component
Created draggable player card using `useSortable` hook:
- Visual drag feedback (opacity, cursor changes)
- CSS transforms for smooth movement
- `touchAction: none` for mobile drag support
- Dead player styling preserved (grayscale, reduced opacity)
- Unread badge display
- Custom status badge support

### StorytellerDashboard Updates (Mobile)
Wrapped player cards in DndContext with:
- PointerSensor (8px activation constraint)
- KeyboardSensor (arrow key navigation)
- rectSortingStrategy for grid layout
- closestCenter collision detection
- handleDragEnd for reorder and persist

### PlayerSidebar Updates (Desktop)
Added drag-and-drop to desktop sidebar:
- SortableSidebarItem component with useSortable
- verticalListSortingStrategy for list layout
- Same sensors and handlers as mobile
- Broadcast card excluded from sorting (always first)

### Order Persistence
`updateParticipantOrder` function in rooms.ts:
- Takes array of participant IDs in desired order
- Updates sort_order column for each participant
- Parallel Promise.all for efficiency
- Error aggregation and reporting

### Database Migration
Created index for efficient ordering:
```sql
CREATE INDEX IF NOT EXISTS idx_participants_room_sort_order
  ON participants(room_id, sort_order);
```

## Requirements Delivered

| ID | Requirement | Status |
|----|-------------|--------|
| DASH-05 | Storyteller can drag-and-drop to reorder player cards | Delivered |
| - | Order persists in database (survives refresh) | Delivered |
| - | Works on mobile (touch) and desktop (mouse) | Delivered |
| - | Keyboard accessible (KeyboardSensor) | Delivered |

## Technical Details

### Sensor Configuration
```typescript
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 }, // Prevents accidental drags
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
)
```

### Optimistic Update Pattern
```typescript
async function handleDragEnd(event: DragEndEvent) {
  const newOrder = arrayMove(playerOrder, oldIndex, newIndex)
  setPlayerOrder(newOrder) // Optimistic
  try {
    await updateParticipantOrder(newOrder)
  } catch (error) {
    setPlayerOrder(playerOrder) // Revert
  }
}
```

### Mobile vs Desktop Strategy
- Mobile: `rectSortingStrategy` (2D grid)
- Desktop: `verticalListSortingStrategy` (1D list)

## Commits

| Hash | Message |
|------|---------|
| fc8fd75 | chore(06-03): install dnd-kit for drag-and-drop reordering |
| e1c0214 | feat(06-03): add drag-and-drop player card reordering |
| f7028de | chore(06-03): add sort_order index for efficient ordering queries |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing TypeScript errors**
- **Found during:** Task 2
- **Issue:** Existing sw.ts had type error with `vibrate` property not in NotificationOptions
- **Fix:** Used type intersection `satisfies NotificationOptions & { vibrate?: number[] }`
- **Files modified:** src/sw.ts
- **Not committed:** Pre-existing issue from 06-04 work, not part of this plan's scope

## Files Changed

```
package.json                                 (modified - added dnd-kit deps)
src/
  components/
    SortablePlayerCard.tsx                   (created - 97 lines)
    StorytellerDashboard.tsx                 (modified - +72/-67 lines)
    desktop/
      PlayerSidebar.tsx                      (modified - +155 lines)
  lib/
    rooms.ts                                 (modified - +29 lines)
supabase/
  migrations/
    006_participant_sort_order_index.sql     (created - 12 lines)
```

## Verification Checklist

- [x] dnd-kit packages installed: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
- [x] TypeScript compilation: `npm run type-check` passes
- [x] SortablePlayerCard.tsx exists and exports SortablePlayerCard
- [x] StorytellerDashboard imports and uses DndContext
- [x] updateParticipantOrder function exists in src/lib/rooms.ts
- [x] Migration file created for sort_order index

## Next Phase Readiness

Ready for 06-04 (Push Notifications) or remaining phase 6 work. Drag-and-drop is independent of notification features.

**No blockers identified.**
