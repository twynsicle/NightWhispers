---
phase: 06-polish-pwa
plan: 05
subsystem: animations
tags: [animations, transitions, mantine, css-modules, accessibility, reduced-motion]
dependency-graph:
  requires:
    - 04-02 (MessageList component)
    - 05-01 (PhaseHeader component)
    - 04-02 (StorytellerDashboard component)
  provides:
    - Animated message arrivals with slide-up effect
    - Phase change transition with fade
    - Card hover/active feedback animations
  affects: []
tech-stack:
  added: []
  patterns:
    - Mantine Transition component for enter animations
    - CSS modules for hover state animations
    - prefers-reduced-motion media query for accessibility
    - Initial count tracking for new message detection
key-files:
  created:
    - src/components/AnimatedMessage.tsx
    - src/components/StorytellerDashboard.module.css
  modified:
    - src/components/MessageList.tsx
    - src/components/PhaseHeader.tsx
    - src/components/StorytellerDashboard.tsx
decisions:
  - decision: "Use Mantine Transition for enter animations"
    rationale: "Built-in component, consistent with Mantine ecosystem, handles CSS transitions automatically"
  - decision: "Track initialCount to detect new messages"
    rationale: "Messages at index >= initialCount are new and should animate, existing don't re-animate"
  - decision: "CSS modules for card hover effects"
    rationale: "Pseudo-selectors (:hover, :active) require CSS, not inline styles"
  - decision: "Respect prefers-reduced-motion in all animations"
    rationale: "Accessibility requirement - users with vestibular disorders need reduced motion option"
metrics:
  duration: 7min
  completed: 2026-01-20
---

# Phase 6 Plan 5: UI Animations Summary

Smooth animations for key UI interactions to improve perceived quality and provide feedback.

## One-Liner

Slide-up message animations, phase change transitions, and card hover feedback with reduced-motion support.

## What Was Built

### Task 1: AnimatedMessage Component (5b5c614)
Created `src/components/AnimatedMessage.tsx`:
- Mantine Transition wrapper for message bubbles
- slide-up animation preset with 200ms duration
- Stagger effect via enterDelay (30ms per message, max 150ms)
- isNew prop controls whether animation plays (skip for existing messages)
- prefers-reduced-motion check skips animation for accessibility
- useState/useEffect pattern for mounted state triggering

### Task 2: MessageList Integration (a3f25b3)
Updated `src/components/MessageList.tsx`:
- Added initialCount state tracking (set once when loading completes)
- Messages at index >= initialCount are considered "new"
- Each message wrapped in AnimatedMessage with calculated index offset
- Animation index is relative to initialCount for proper stagger timing
- Existing messages on page load don't animate (isNew = false)

### Task 3: Phase and Card Animations (195f702)
Updated `src/components/PhaseHeader.tsx`:
- Track phase changes with prevPhase ref
- Fade out -> fade in transition on phase change
- animationKey state increments to trigger fresh Transition
- 150ms fade out, 200ms fade in timing
- prefers-reduced-motion sets duration to 0

Created `src/components/StorytellerDashboard.module.css`:
- .hoverCard class with transform transition (0.15s ease)
- hover: translateY(-2px) with shadow-md elevation
- active: translateY(0) press effect
- @media (prefers-reduced-motion: reduce) disables all transforms

Updated `src/components/StorytellerDashboard.tsx`:
- Import CSS module styles
- BroadcastCard uses className={styles.hoverCard}
- PlayerCard uses className={styles.hoverCard} (removed inline cursor: pointer)

## Key Integration Points

1. **Message Animation Flow:**
   - MessageList tracks initialCount on first render
   - New messages (after initial load) have isNew=true
   - AnimatedMessage wraps each message, plays slide-up for new ones
   - Auto-scroll still works via bottomRef.scrollIntoView

2. **Phase Change Animation:**
   - usePhase hook provides phase value
   - PhaseHeader tracks prevPhase ref
   - On change: showContent=false -> 150ms -> animationKey++ -> showContent=true
   - Transition component fades in new phase display

3. **Card Hover Feedback:**
   - CSS module applied to Card className
   - Browser handles :hover/:active pseudo-classes
   - Works on desktop (hover) and mobile (active tap)
   - Reduced motion media query disables for accessibility

## Files Changed

| File | Lines | Change |
|------|-------|--------|
| src/components/AnimatedMessage.tsx | 53 | Created - animation wrapper |
| src/components/MessageList.tsx | 169 | Modified - integrated AnimatedMessage |
| src/components/PhaseHeader.tsx | 98 | Modified - added phase transition |
| src/components/StorytellerDashboard.module.css | 24 | Created - hover styles |
| src/components/StorytellerDashboard.tsx | 267 | Modified - applied hover classes |

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Mantine Transition over custom CSS | Built-in, consistent API, handles timing functions |
| initialCount tracking for new messages | Simple approach, avoids complex timestamp comparisons |
| CSS modules for hover | Pseudo-classes require CSS, not React style props |
| All animations respect reduced-motion | Accessibility standard, helps users with vestibular disorders |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- [x] TypeScript compiles without errors
- [x] AnimatedMessage exports AnimatedMessage (53 lines, exceeds 25 min)
- [x] AnimatedMessage imports Transition from @mantine/core
- [x] MessageList imports AnimatedMessage
- [x] PhaseHeader imports and uses Transition
- [x] StorytellerDashboard imports CSS module
- [x] prefers-reduced-motion checked in AnimatedMessage and PhaseHeader
- [x] CSS module includes @media (prefers-reduced-motion) rule

## Requirement Delivered

**UX-05:** Smooth animations for card expand, new messages, phase advance

## Next Phase Readiness

Plan 06-05 complete. Continue with remaining Phase 6 plans.
