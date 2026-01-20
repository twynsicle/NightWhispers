---
phase: 02-session-a-room-entry
plan: 02
subsystem: ui-pages
tags: [react-router, mantine-forms, avatar-selector, session-setup]

dependency-graph:
  requires: [02-01]
  provides: [page-routing, session-ui, room-entry-ui]
  affects: [03-01]

tech-stack:
  added: []
  patterns: [loader-based-protection, form-validation, localStorage-persistence]

key-files:
  created:
    - src/components/AvatarSelector.tsx
    - src/pages/HomePage.tsx
    - src/pages/SessionSetupPage.tsx
    - src/pages/CreateRoomPage.tsx
    - src/pages/JoinRoomPage.tsx
    - src/pages/RoomPage.tsx
  modified:
    - src/App.tsx
    - src/main.tsx

decisions:
  - id: emoji-avatars
    choice: Use gothic emoji set (🧙‍♂️🧛‍♀️🧟‍♂️ etc.) for avatars
    rationale: Zero asset loading, accessible, mobile-friendly, instant rendering

  - id: loader-based-protection
    choice: React Router loader pattern for protected routes
    rationale: Prevents FOUC, SEO-safe, blocks child loaders, better UX than useEffect checks

  - id: localStorage-for-preferences
    choice: Store displayName and avatar in localStorage before room creation/joining
    rationale: Decouples session setup from room flow, allows profile reuse on reconnection

metrics:
  duration: ~4 minutes
  completed: 2026-01-20
---

# Phase 02 Plan 02: Session Setup UI Summary

**One-liner:** Complete mobile-first page routing with gothic emoji avatars, Mantine form validation, and loader-based route protection.

## What Was Built

### Task 1: Create AvatarSelector component and session setup page
- **AvatarSelector:** Responsive grid (4 cols mobile, 6 desktop) with 12 gothic emoji options
  - Selected state: filled crimson button
  - Unselected state: light variant
  - Accessibility: aria-label and aria-pressed for screen readers
  - Error display below grid
- **SessionSetupPage:** Mantine form with validation
  - Display name: 2-20 character validation using `hasLength`
  - Avatar: required field using `isNotEmpty`
  - Anonymous auth creation on submit (checks for existing session first)
  - Stores preferences in localStorage
  - Navigates based on `?next` query param (create/join)

### Task 2: Create room entry pages (Home, Create, Join)
- **HomePage:** Landing page with create/join choice
  - Gothic branding: "Night Whispers" title with crimson accent
  - Two navigation buttons routing to /setup with ?next param
  - Mobile-first layout with centered content
- **CreateRoomPage:** Automated room creation flow
  - Verifies session and localStorage on mount
  - Calls `createRoom()` with collision retry
  - Displays 4-letter code in large monospace font
  - Auto-redirects to room after 2 seconds
  - Error handling with notification and retry button
- **JoinRoomPage:** Room code entry with validation
  - 4-letter code validation using `matches` with `/^[A-Z0-9]{4}$/` pattern
  - Uppercase transform via CSS (textTransform)
  - Large centered monospace input for mobile
  - Calls `joinRoom()` with upsert for reconnection safety
  - Navigates to room on success, shows error on invalid code

### Task 3: Create protected RoomPage and configure React Router
- **RoomPage:** Protected game interface with loader
  - Loader checks session via `getSession()`
  - Verifies participant membership via database query
  - Redirects to home if unauthorized (no session or not participant)
  - Displays room code, user info, and role badge
  - Placeholder for Phase 3 room interface
- **App.tsx:** React Router 7 configuration
  - Uses `createBrowserRouter` + `RouterProvider` for loader support
  - Routes: /, /setup, /create, /join, /room/:roomId
  - Protected route uses `roomLoader` to prevent FOUC
- **main.tsx:** Added Notifications provider
  - Imported `Notifications` component and styles
  - Wrapped in MantineProvider for error/success notifications

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| 12 gothic emoji avatars | Zero assets, accessible, mobile-friendly | Instant loading, no image requests |
| localStorage for displayName/avatar | Decouples setup from room flow | Can reuse profile on reconnection |
| Loader-based route protection | Prevents FOUC, better UX | Redirect happens before render |
| Auto-redirect after room creation | Reduces friction for Storyteller | Seamless flow from code to room |
| Large monospace input for room code | Mobile-friendly, easy to read | Better UX on small screens |

## Verification Results

| Check | Status |
|-------|--------|
| TypeScript compiles | PASS - npx tsc --noEmit |
| AvatarSelector Grid layout | PASS - 12 emoji, responsive cols |
| SessionSetupPage form validation | PASS - hasLength, isNotEmpty |
| HomePage navigation | PASS - /setup?next=create/join |
| CreateRoomPage auto-creates room | PASS - displays code, redirects |
| JoinRoomPage validates code | PASS - /^[A-Z0-9]{4}$/ pattern |
| RoomPage loader protection | PASS - redirects if unauthorized |
| Router uses createBrowserRouter | PASS - loader support |
| Notifications provider added | PASS - styles imported |

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 40407ec | feat | Create AvatarSelector and SessionSetupPage |
| 0524447 | feat | Create room entry pages |
| c7e0e88 | feat | Configure router and protected RoomPage |

## Next Phase Readiness

**Ready for Plan 03-01:** Room Lobby & Participant Management
- All pages route correctly with session checks
- Room creation and joining flows complete
- Protected room route prevents unauthorized access
- displayName and avatar stored and ready for lobby display

**Ready for Phase 4:** Core Messaging
- RoomPage provides protected container for messaging UI
- Participant data loaded in loader (available via useLoaderData)
- Session verified for Realtime subscriptions

**Dependencies for future plans:**
- Phase 3 will add participant list and room management UI to RoomPage
- Phase 4 will add message components and Realtime subscriptions
- Lobby state management will extend current placeholder UI

## Files Created

```
src/
├── components/
│   └── AvatarSelector.tsx       # 12 emoji grid with selection state
└── pages/
    ├── HomePage.tsx              # Landing page (create/join choice)
    ├── SessionSetupPage.tsx      # Display name + avatar form
    ├── CreateRoomPage.tsx        # Room creation flow
    ├── JoinRoomPage.tsx          # Room code entry
    └── RoomPage.tsx              # Protected game interface
```

## Technical Notes

**Avatar Strategy:**
- Gothic emoji set: 🧙‍♂️ (wizard), 🧛‍♀️ (vampire), 🧟‍♂️ (zombie), 👻 (ghost), 🎭 (masks), 🕵️ (detective), 🦇 (bat), 🌙 (moon), ⚰️ (coffin), 🔮 (crystal ball), 🗡️ (dagger), 🛡️ (shield)
- No image assets = instant rendering on mobile
- Accessible via aria-label for screen readers
- Can be replaced with custom SVG in future if needed

**Route Protection:**
- Loader pattern prevents flash of unauthenticated content (FOUC)
- Session check happens before component renders
- Database query in loader verifies participant membership
- React Router short-circuits child loaders if parent redirects

**localStorage Usage:**
- displayName and avatar stored after session setup
- Retrieved in CreateRoomPage and JoinRoomPage
- Allows profile reuse on reconnection
- iOS WebKit 7-day cap handled by session validation (from Phase 2 Plan 1)

**Form Validation:**
- Mantine `useForm` with built-in validators
- `hasLength({ min: 2, max: 20 })` for display name
- `isNotEmpty()` for avatar selection
- `matches(/^[A-Z0-9]{4}$/)` for room code
- Error display integrated with Mantine inputs
