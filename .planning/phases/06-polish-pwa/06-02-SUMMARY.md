---
phase: 06-polish-pwa
plan: 02
subsystem: ui
tags: [desktop, responsive, split-panel, breakpoints]
dependency-graph:
  requires: [06-01]
  provides: [desktop-layout, split-panel-ui, breakpoint-detection]
  affects: []
tech-stack:
  added: []
  patterns: [responsive-breakpoints, split-panel-layout, conditional-rendering]
key-files:
  created:
    - src/hooks/useDesktopLayout.ts
    - src/components/desktop/SplitPanelLayout.tsx
    - src/components/desktop/PlayerSidebar.tsx
    - src/components/desktop/DesktopConversationPanel.tsx
  modified:
    - src/components/StorytellerDashboard.tsx
decisions:
  - id: DEC-0602-01
    title: "1024px desktop breakpoint"
    choice: "Use 1024px as desktop threshold"
    rationale: "Per UX-03 requirement, matches common laptop screen width"
  - id: DEC-0602-02
    title: "Inline conversation panel for desktop"
    choice: "Create DesktopConversationPanel without fixed positioning"
    rationale: "Mobile ConversationView uses fixed positioning for full-screen overlay; desktop needs inline rendering within split-panel"
  - id: DEC-0602-03
    title: "Placeholder when no selection"
    choice: "Show guidance text when no player/broadcast selected"
    rationale: "Better UX than empty panel, guides user to action"
metrics:
  duration: 8min
  completed: 2026-01-20
---

# Phase 6 Plan 02: Desktop Split-Panel Layout Summary

**One-liner:** Desktop breakpoint detection with split-panel Storyteller dashboard showing sidebar and inline conversation.

## What Was Built

### Desktop Breakpoint Hook
Created `useDesktopLayout` hook using Mantine's `useMediaQuery` with 1024px breakpoint. SSR-safe via `getInitialValueInEffect: true` option. Returns `{ isDesktop: boolean }` for conditional layout rendering.

### Split-Panel Components
1. **SplitPanelLayout** - Container component with fixed sidebar (320px default) and flex main content area. Uses CSS Flexbox for proper height management.

2. **PlayerSidebar** - Desktop player list with:
   - Header with "Players" title
   - Broadcast option at top
   - Scrollable player list with unread badges
   - Selected state highlighting (dark-5 background)
   - Dead player styling (opacity, grayscale avatar)
   - Custom status badges
   - Reset Game button at bottom

3. **DesktopConversationPanel** - Inline chat panel (non-fixed positioning) with:
   - Header with recipient name
   - PlayerStatusControls for 1-to-1 chats
   - MessageList with typing indicators
   - MessageInput

### StorytellerDashboard Integration
Updated to conditionally render:
- **Desktop (>1024px):** SplitPanelLayout with PlayerSidebar and DesktopConversationPanel
- **Mobile (<1024px):** Existing card-based grid with full-screen ConversationView overlay

## Requirements Delivered

| ID | Requirement | Status |
|----|-------------|--------|
| UX-03 | Desktop breakpoint (>1024px) shows optimized layout | Delivered |
| DASH-04 | Desktop shows split-panel (player list + chat) | Delivered |

## Technical Details

### Breakpoint Detection Pattern
```typescript
const isDesktop = useMediaQuery(`(min-width: ${em(1024)})`, false, {
  getInitialValueInEffect: true,  // SSR-safe
})
```

### Layout Switching
```typescript
if (isDesktop) {
  return <SplitPanelLayout sidebar={<PlayerSidebar />} main={<ConversationPanel />} />
}
// Mobile: existing card grid + full-screen overlay
```

### Key Differences from Mobile
- Desktop conversation renders inline (no `position: fixed`)
- No back button needed (selection via sidebar)
- Placeholder shown when no conversation selected
- Player list always visible (sidebar)

## Commits

| Hash | Message |
|------|---------|
| 5b7b92d | feat(06-02): create desktop breakpoint hook |
| e29e16a | feat(06-02): create desktop layout components |
| 5b8f0e8 | feat(06-02): integrate desktop layout into StorytellerDashboard |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added DesktopConversationPanel**
- **Found during:** Task 3
- **Issue:** Plan suggested passing prop to ConversationView or creating simpler inline component. ConversationView uses `position: fixed` which breaks split-panel layout.
- **Fix:** Created DesktopConversationPanel that renders inline without fixed positioning, reusing MessageList and MessageInput components.
- **Files created:** src/components/desktop/DesktopConversationPanel.tsx
- **Commit:** 5b8f0e8

## Files Changed

```
src/
  hooks/
    useDesktopLayout.ts          (created - 18 lines)
  components/
    desktop/
      SplitPanelLayout.tsx       (created - 52 lines)
      PlayerSidebar.tsx          (created - 183 lines)
      DesktopConversationPanel.tsx (created - 128 lines)
    StorytellerDashboard.tsx     (modified - +94 lines desktop logic)
```

## Verification Checklist

- [x] TypeScript compilation passes
- [x] useDesktopLayout returns { isDesktop: boolean }
- [x] Desktop components exist in src/components/desktop/
- [x] StorytellerDashboard imports and uses useDesktopLayout
- [x] Conditional rendering based on viewport width

## Next Phase Readiness

Ready for 06-03 (PWA Configuration). Desktop layout is independent of PWA features.

**No blockers identified.**
